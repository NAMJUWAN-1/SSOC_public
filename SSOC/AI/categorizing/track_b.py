"""
Track B: 고도화 로직
조건: 카테고리 여러 개 존재 + 기타 비율 >= 20%
처리: 기타 게시글만 샘플링 → 신규 주제 발굴 → 유효성 검증 → 부분 분류
"""
import json
import time
import logging
import requests
import os
from typing import Dict, List
from db_handler import DBHandler
from dotenv import load_dotenv

# API 설정
load_dotenv()
API_KEY = os.getenv("GMS_KEY")
API_URL = os.getenv("GMS_EMBEDDING_URL")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

def get_embedding(text_input: str) -> List[float]:
    """텍스트를 1536차원 벡터로 변환 (GMS API)"""
    if not text_input:
        logging.error("[EMBEDDING_ERROR] text_input이 비어있음")
        return None
    
    if not API_KEY:
        logging.error("[EMBEDDING_ERROR] GMS_API_KEY 환경 변수 없음")
        return None
    
    if not API_URL:
        logging.error("[EMBEDDING_ERROR] GMS_EMBEDDING_URL 환경 변수 없음")
        return None
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {
        "model": EMBEDDING_MODEL,
        "input": text_input.replace("\n", " ")
    }
    
    try:
        logging.info(f"[EMBEDDING] API 호출 중... (텍스트 길이: {len(text_input)}자)")
        response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        
        logging.info(f"[EMBEDDING] 응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            embedding = result['data'][0]['embedding']
            logging.info(f"[EMBEDDING_SUCCESS] 벡터 생성 성공 (차원: {len(embedding)})")
            return embedding
        else:
            logging.error(f"[EMBEDDING_ERROR] API 오류 - 상태코드: {response.status_code}, 응답: {response.text[:200]}")
            return None
            
    except Exception as e:
        logging.error(f"[EMBEDDING_ERROR] 예외 발생: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return None

class TrackBProcessor:
    """Track B: 고도화 로직 프로세서"""
    
    def __init__(self, api_key: str, db: DBHandler):
        self.api_key = api_key
        self.db = db
        self.url = f"https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    def execute(self, channel_id: int) -> Dict:
        """Track B 실행: 기타 데이터만 클러스터링 및 검증"""
        
        # 1. '기타' 카테고리 게시글만 샘플링
        etc_posts = self._sample_etc_posts(channel_id)
        
        if not etc_posts:
            return {'status': 'skip', 'reason': 'No etc posts'}
        
        # 2. Gemini API 호출: 신규 주제 발굴
        new_topics = self._discover_new_topics(etc_posts)
        
        if not new_topics:
            return {'status': 'failed', 'reason': 'Topic discovery failed'}
        
        # 3. 유효성 필터링 (5% 이상 데이터 보유한 주제만)
        total_etc_count = len(etc_posts)
        valid_topics = self._filter_valid_topics(new_topics, etc_posts, total_etc_count)
        
        if not valid_topics:
            logging.info(f"[SKIP] Track B: 채널 {channel_id} (유효 주제 없음)")
            return {'status': 'skip', 'reason': 'No valid topics'}
        
        # 4. DB Transaction: 검증 통과한 카테고리만 저장 + 부분 분류
        try:
            # 4-1. 신규 카테고리 INSERT
            new_category_ids = []
            for topic in valid_topics:
                cat_id = self._insert_category(
                    channel_id, 
                    topic['name'],
                    description=topic.get('description'),
                    keywords=topic.get('keywords', [])
                )
                new_category_ids.append({
                    'id': cat_id, 
                    'name': topic['name'], 
                    'keywords': topic.get('keywords', [])
                })
            
            # 4-2. 해당 주제 게시글만 ID 변경 (부분 UPDATE)
            classified_count = self._classify_etc_posts(etc_posts, new_category_ids)
            
            logging.info(f"[SUCCESS] Track B 완료: 채널 {channel_id}, 신규 카테고리 {len(new_category_ids)}개, 분류 {classified_count}건")
            
            return {
                'status': 'success',
                'track': 'B',
                'new_categories': len(new_category_ids),
                'classified_posts': classified_count,
            }
            
        except Exception as e:
            logging.error(f"[ERROR] Track B DB 처리 실패: {str(e)}")
            return {'status': 'failed', 'reason': str(e)}
    
    def _sample_etc_posts(self, channel_id: int, limit: int = 100) -> List[Dict]:
        """'기타' 카테고리 게시글만 샘플링"""
        query = """
            SELECT p.post_id, p.content 
            FROM post p
            JOIN category c ON p.category_id = c.category_id
            WHERE p.channel_id = %s 
              AND c.category_name = '기타'
            ORDER BY p.posted_at DESC
            LIMIT %s
        """
        return self.db.execute_query(query, (channel_id, limit))
    
    def _discover_new_topics(self, posts: List[Dict]) -> List[Dict]:
        """Gemini API 호출: 기타 데이터에서 신규 주제 발굴"""
        
        messages_text = "\n".join([f"- {p['content'][:300]}" for p in posts if p['content']])
        
        prompt = f"""You are an expert data analyst specializing in Korean community clustering.

TASK: Analyze '기타' (miscellaneous) messages and discover 1-3 NEW meaningful topics.

MESSAGES (from '기타' category):
{messages_text}

REQUIREMENTS:
1. Identify 1-3 NEW topic clusters (NOT general categories)
2. Topics should represent at least 5% of the data
3. Topic names MUST be in Korean
4. Include specific keywords

OUTPUT (JSON ONLY):
{{
  "topics": [
    {{"id": 1, "name": "새로운주제1", "keywords": ["키워드1", "키워드2"]}},
    {{"id": 2, "name": "새로운주제2", "keywords": ["키워드1", "키워드2"]}}
  ]
}}"""
        
        # API 호출 (Retry 적용)
        for attempt in range(3):
            try:
                response = requests.post(
                    self.url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 2048,
                            "responseMimeType": "application/json"
                        }
                    },
                    timeout=30,
                )
                response.raise_for_status()
                
                content = response.json()['candidates'][0]['content']['parts'][0]['text']
                result = json.loads(content)
                
                return result.get('topics', [])
                
            except requests.exceptions.RequestException as e:
                if hasattr(e, 'response') and e.response and e.response.status_code == 429:
                    wait_time = (2 ** attempt) * 5
                    logging.warning(f"[RATE_LIMIT] {wait_time}초 대기 중...")
                    time.sleep(wait_time)
                else:
                    logging.error(f"[API_ERROR] {str(e)}")
                    return None
            except json.JSONDecodeError as e:
                logging.error(f"[JSON_ERROR] {str(e)}")
                return None
        
        return None
    
    def _filter_valid_topics(self, topics: List[Dict], posts: List[Dict], total_count: int) -> List[Dict]:
        """유효성 검증: 5% 이상 데이터 보유한 주제만 필터링"""
        
        valid_topics = []
        
        for topic in topics:
            # 키워드 매칭으로 해당 주제 데이터 개수 계산
            matched_count = sum(
                1 for post in posts 
                if any(keyword in (post['content'] or '') for keyword in topic['keywords'])
            )
            
            # 비율 계산
            ratio = matched_count / total_count if total_count > 0 else 0
            
            # 5% 이상이면 유효
            if ratio >= 0.05:
                valid_topics.append(topic)
                logging.info(f"[VALID] 유효 주제: {topic['name']} ({matched_count}/{total_count} = {ratio:.1%})")
            else:
                logging.info(f"[DROP] {topic['name']} ({matched_count}/{total_count} = {ratio:.1%})")
        
        return valid_topics
    
    def _insert_category(self, channel_id: int, category_name: str, description: str = None, keywords: List[str] = None) -> int:
        """카테고리 중복 체크 후 INSERT (임베딩 벡터 포함)"""
        # 중복 체크
        check_query = "SELECT category_id FROM category WHERE channel_id = %s AND category_name = %s"
        existing = self.db.execute_query(check_query, (channel_id, category_name))
        
        if existing:
            logging.info(f"[DUPLICATE] 카테고리 '{category_name}' 이미 존재, 재사용")
            return existing[0]['category_id']
        
        # 임베딩 벡터 생성 (카테고리명 + 설명 + 키워드)
        text_parts = [category_name]
        if description:
            text_parts.append(description)
        if keywords:
            text_parts.append(" ".join(keywords))
        
        text = " ".join(text_parts)
        embedding_vector = get_embedding(text)
        
        # INSERT
        if embedding_vector:
            insert_query = """
                INSERT INTO category (channel_id, category_name, embedding_vector) 
                VALUES (%s, %s, %s::vector) 
                RETURNING category_id
            """
            category_id = self.db.execute_insert(insert_query, (channel_id, category_name, str(embedding_vector)))
            logging.info(f"[SUCCESS] 카테고리 '{category_name}' 생성 (임베딩 포함)")
        else:
            # 임베딩 생성 실패 시 NULL로 저장
            logging.warning(f"[WARNING] 카테고리 '{category_name}' 임베딩 생성 실패, NULL로 저장")
            insert_query = """
                INSERT INTO category (channel_id, category_name) 
                VALUES (%s, %s) 
                RETURNING category_id
            """
            category_id = self.db.execute_insert(insert_query, (channel_id, category_name))
        
        return category_id
    
    def _classify_etc_posts(self, etc_posts: List[Dict], categories: List[Dict]) -> int:
        """기타 게시글만 신규 카테고리로 분류 (임베딩 벡터 기반 코사인 유사도)"""
        
        # embedding_vector가 있는 게시글만 필터링
        post_ids = [p['post_id'] for p in etc_posts]
        if not post_ids:
            return 0
        
        query = """
            SELECT post_id, content, embedding_vector 
            FROM post 
            WHERE post_id = ANY(%s) AND embedding_vector IS NOT NULL
        """
        posts_with_embedding = self.db.execute_query(query, (post_ids,))
        
        if not posts_with_embedding:
            logging.warning(f"[WARNING] 임베딩 벡터가 있는 기타 게시글 없음")
            return 0
        
        # 각 카테고리의 임베딩 벡터를 category 테이블에서 직접 조회
        category_vectors = {}
        for cat in categories:
            vector_query = """
                SELECT embedding_vector 
                FROM category 
                WHERE category_id = %s AND embedding_vector IS NOT NULL
            """
            result = self.db.execute_query(vector_query, (cat['id'],))
            
            if result and result[0]['embedding_vector']:
                category_vectors[cat['id']] = result[0]['embedding_vector']
            else:
                logging.warning(f"[WARNING] 카테고리 '{cat['name']}' (ID: {cat['id']}) 임베딩 벡터 없음")
        
        if not category_vectors:
            logging.error(f"[ERROR] 사용 가능한 카테고리 임베딩 벡터 없음, 분류 중단")
            return 0
        
        # 코사인 유사도 기반 분류
        update_params = []
        for post in posts_with_embedding:
            if not post['embedding_vector']:
                continue
            
            max_similarity = -1
            matched_category_id = None
            
            # 각 카테고리와의 코사인 유사도 계산
            for cat_id, cat_vector in category_vectors.items():
                similarity_query = """
                    SELECT 1 - (%s::vector <=> %s::vector) as similarity
                """
                result = self.db.execute_query(
                    similarity_query,
                    (str(post['embedding_vector']), str(cat_vector))
                )
                similarity = result[0]['similarity']
                
                if similarity > max_similarity:
                    max_similarity = similarity
                    matched_category_id = cat_id
            
            # 임계값 이상인 경우만 분류 (0.5 이상)
            if max_similarity >= 0.3 and matched_category_id:
                update_params.append((matched_category_id, post['post_id']))
        
        # 배치 UPDATE (매칭된 게시글만)
        if update_params:
            update_query = "UPDATE post SET category_id = %s WHERE post_id = %s"
            self.db.execute_batch_update(update_query, update_params)
            logging.info(f"[SUCCESS] {len(update_params)}개 기타 게시글 재분류 완료 (임베딩 기반, 임계값=0.4)")
        
        return len(update_params)