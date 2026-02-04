"""
Track A: 초기화 로직
조건: 카테고리가 '기타' 1개뿐 + 게시글 50개 이상
처리: 전체 게시글 샘플링 → 카테고리 생성 → 전체 분류
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

class TrackAProcessor:
    """Track A: 초기화 로직 프로세서"""
    
    def __init__(self, api_key: str, db: DBHandler):
        self.api_key = api_key
        self.db = db
        self.url = f"https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    def execute(self, channel_id: int) -> Dict:
        """Track A 실행: 전체 카테고리 생성 및 일괄 분류"""
        
        # 1. 게시글 샘플링
        posts = self._sample_posts(channel_id)
        
        if not posts:
            return {'status': 'skip', 'reason': 'No posts'}
        
        total_post_count = len(posts)
        
        # 2. Gemini API 호출: 카테고리 생성
        categories = self._generate_categories(posts)
        
        if not categories:
            return {'status': 'failed', 'reason': 'Category generation failed'}
        
        # 3. DB Transaction: 카테고리 저장 + 게시글 분류
        try:
            # 3-1. 기존 '기타' 카테고리 ID 조회
            etc_id = self._get_etc_category_id(channel_id)
            
            # 3-2. 신규 카테고리 INSERT (기타 제외)
            new_category_ids = []
            for cat in categories:
                if cat['name'] != '기타':
                    # 카테고리 저장 (임베딩 포함)
                    cat_id = self._insert_category(
                        channel_id, 
                        cat['name'],
                        description=cat.get('description'),
                        keywords=cat.get('keywords', [])
                    )
                    new_category_ids.append({
                        'id': cat_id, 
                        'name': cat['name'], 
                        'keywords': cat.get('keywords', [])
                    })
            
            # 3-3. 전체 게시글을 신규 카테고리로 일괄 분류
            classification_result = self._classify_all_posts(channel_id, new_category_ids, etc_id)
            
            # 3-4. 카테고리 유효성 검증 및 정리
            valid_categories = self._validate_and_cleanup_categories(
                channel_id, 
                new_category_ids, 
                etc_id, 
                total_post_count
            )
            
            logging.info(f"[SUCCESS] Track A 완료: 채널 {channel_id}, 유효 카테고리 {len(valid_categories)}개 (총 {len(new_category_ids)}개 생성)")
            
            return {
                'status': 'success',
                'track': 'A',
                'new_categories': len(valid_categories),
                'classified_posts': classification_result,
            }
            
        except Exception as e:
            logging.error(f"[ERROR] Track A DB 처리 실패: {str(e)}")
            import traceback
            logging.error(traceback.format_exc())
            return {'status': 'failed', 'reason': str(e)}
    
    def _sample_posts(self, channel_id: int, limit: int = 100) -> List[Dict]:
        """게시글 샘플링 (최근 100개 또는 전체)"""
        query = """
            SELECT post_id, content 
            FROM post 
            WHERE channel_id = %s 
            ORDER BY posted_at DESC 
            LIMIT %s
        """
        return self.db.execute_query(query, (channel_id, limit))
    
    def _generate_categories(self, posts: List[Dict]) -> List[Dict]:
        """Gemini API 호출: 카테고리 생성"""
        
        # 프롬프트 생성
        messages_text = "\n".join([f"- {p['content'][:300]}" for p in posts if p['content']])
        
        prompt = f"""You are an expert data analyst specializing in Korean community message categorization for SSAFY.

TASK: Analyze messages and create 1-3 meaningful categories + '기타'.

MESSAGES:
{messages_text}

REQUIREMENTS:
1. Generate 1-3 topic-based categories (create fewer if topics are limited)
2. ALWAYS include "기타" as the final category
3. Category names MUST be in Korean
4. Include keywords for each category
5. Quality over quantity: only create truly meaningful categories

OUTPUT (JSON ONLY):
{{
  "categories": [
    {{"id": 1, "name": "카테고리명1", "keywords": ["키워드1", "키워드2"]}},
    {{"id": N, "name": "기타", "keywords": ["기타"]}}
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
                            "temperature": 0.2,
                            "maxOutputTokens": 2048,
                            "responseMimeType": "application/json"
                        }
                    },
                    timeout=30,
                )
                response.raise_for_status()
                
                content = response.json()['candidates'][0]['content']['parts'][0]['text']
                result = json.loads(content)
                
                return result.get('categories', [])
                
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
    
    def _get_etc_category_id(self, channel_id: int) -> int:
        """기존 '기타' 카테고리 ID 조회"""
        query = "SELECT category_id FROM category WHERE channel_id = %s AND category_name = '기타'"
        result = self.db.execute_query(query, (channel_id,))
        return result[0]['category_id'] if result else None
    
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
    
    def _classify_all_posts(self, channel_id: int, categories: List[Dict], etc_id: int):
        """전체 게시글을 신규 카테고리로 분류 (임베딩 벡터 기반 코사인 유사도)"""
        
        # 전체 게시글 조회 (embedding_vector 포함)
        query = """
            SELECT post_id, content, embedding_vector 
            FROM post 
            WHERE channel_id = %s AND embedding_vector IS NOT NULL
        """
        posts = self.db.execute_query(query, (channel_id,))
        
        if not posts:
            logging.warning(f"[WARNING] 채널 {channel_id} - 임베딩 벡터가 있는 게시글 없음")
            return
        
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
            logging.error(f"[ERROR] 채널 {channel_id} - 사용 가능한 카테고리 임베딩 벡터 없음, 분류 중단")
            return
        
        # 코사인 유사도 기반 분류
        update_params = []
        for post in posts:
            if not post['embedding_vector']:
                continue
            
            max_similarity = -1
            matched_category_id = etc_id  # 기본값: 기타
            
            # 각 카테고리와의 코사인 유사도 계산
            for cat_id, cat_vector in category_vectors.items():
                # pgvector 코사인 유사도: 1 - (vector <=> vector)
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
            
            # 임계값 이상인 경우만 분류 (0.3 이상), 아니면 기타로
            if max_similarity >= 0.3:
                update_params.append((matched_category_id, post['post_id']))
            else:
                update_params.append((etc_id, post['post_id']))
        
        # 배치 UPDATE
        if update_params:
            update_query = "UPDATE post SET category_id = %s WHERE post_id = %s"
            self.db.execute_batch_update(update_query, update_params)
            logging.info(f"[SUCCESS] 채널 {channel_id} - {len(update_params)}개 게시글 분류 완료 (임베딩 기반, 임계값=0.3)")
        
        return len(update_params)
    
    def _validate_and_cleanup_categories(self, channel_id: int, categories: List[Dict], etc_id: int, total_post_count: int) -> List[Dict]:
        """
        카테고리 유효성 검증 및 정리
        - 게시글이 없는 카테고리 삭제
        - 5% 미만의 게시글을 가진 카테고리는 해당 게시글을 '기타'로 이동 후 삭제
        """
        valid_categories = []
        min_post_threshold = max(1, int(total_post_count * 0.05))  # 최소 5% 또는 1개
        
        for cat in categories:
            # 해당 카테고리의 게시글 수 조회
            count_query = """
                SELECT COUNT(*) as count
                FROM post
                WHERE category_id = %s
            """
            result = self.db.execute_query(count_query, (cat['id'],))
            post_count = result[0]['count']
            
            if post_count == 0:
                # 게시글이 0개인 카테고리 삭제
                logging.warning(f"[CLEANUP] 카테고리 '{cat['name']}' (ID: {cat['id']}) 게시글 0개, 삭제")
                delete_query = "DELETE FROM category WHERE category_id = %s"
                self.db.execute_update(delete_query, (cat['id'],))
                
            elif post_count < min_post_threshold:
                # 5% 미만인 카테고리는 게시글을 '기타'로 이동 후 삭제
                logging.warning(f"[CLEANUP] 카테고리 '{cat['name']}' (ID: {cat['id']}) 게시글 {post_count}개 ({post_count/total_post_count*100:.1f}%), 기타로 이동 후 삭제")
                
                # 게시글을 '기타'로 이동
                update_query = "UPDATE post SET category_id = %s WHERE category_id = %s"
                self.db.execute_update(update_query, (etc_id, cat['id']))
                
                # 카테고리 삭제
                delete_query = "DELETE FROM category WHERE category_id = %s"
                self.db.execute_update(delete_query, (cat['id'],))
                
            else:
                # 유효한 카테고리
                logging.info(f"[VALID] 카테고리 '{cat['name']}' (ID: {cat['id']}) 게시글 {post_count}개 ({post_count/total_post_count*100:.1f}%)")
                valid_categories.append(cat)
        
        return valid_categories