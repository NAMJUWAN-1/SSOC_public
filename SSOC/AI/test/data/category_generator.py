"""
채널별 카테고리 생성 전용 시스템
- 메시지 분류 없이 카테고리 생성만 수행
- 생성된 카테고리를 CSV로 저장
"""

import os
import json
import time
import pandas as pd
import requests
from typing import List, Dict, Tuple
from datetime import datetime
from dotenv import load_dotenv


class CategoryGenerator:
    """채널별 카테고리 생성 전용 클래스"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = f"https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        self.channel_categories = {}  # 채널별 생성된 카테고리 저장
        
    def create_categorization_prompt(self, messages: List[str], channel_name: str, message_count: int) -> str:
        """카테고리 생성을 위한 프롬프트 작성"""
        
        # 메시지 샘플링
        if len(messages) > 100:
            step = len(messages) // 100
            sample_messages = [messages[i] for i in range(0, len(messages), step)][:100]
        else:
            sample_messages = messages
        
        # 메시지 텍스트 준비
        messages_text = "\n".join([f"- {msg[:300]}" for msg in sample_messages if msg and len(str(msg).strip()) > 0])
        
        prompt = f"""You are an expert data analyst specializing in message categorization for Korean community data.

TASK: Analyze the following messages from the channel "{channel_name}" and create meaningful categories.

CHANNEL INFO:
- Channel Name: {channel_name}
- Total Messages: {message_count}
- Sample Messages Analyzed: {len(sample_messages)}

REQUIREMENTS:
1. Generate 1-3 topic-based categories that best represent the content
   - If the channel has diverse topics, create up to 3 categories
   - If the channel has limited or similar topics, 1-2 categories are sufficient
   - Quality over quantity: Only create categories that are truly meaningful
2. ALWAYS include "기타" (Miscellaneous) as the final category (regardless of how many topic categories you create)
3. Category names MUST be in Korean
4. Categories should be:
   - Specific and meaningful
   - Mutually exclusive (no overlap)
   - Representative of the main themes in the messages
   - Practical for classification
5. Consider the context: This is a SSAFY (Samsung SW Academy) community

SAMPLE MESSAGES:
{messages_text}

OUTPUT FORMAT (JSON):
{{
    "categories": [
        {{
            "id": 1,
            "name": "카테고리명1",
            "description": "이 카테고리에 속하는 메시지의 특징 (한국어)",
            "keywords": ["키워드1", "키워드2", "키워드3"]
        }},
        {{
            "id": 2,
            "name": "카테고리명2",
            "description": "이 카테고리에 속하는 메시지의 특징 (한국어)",
            "keywords": ["키워드1", "키워드2", "키워드3"]
        }},
        ... (create 1-3 topic categories as needed)
        {{
            "id": N,
            "name": "기타",
            "description": "위 카테고리에 속하지 않는 모든 메시지",
            "keywords": ["기타", "분류안됨"]
        }}
    ],
    "channel_analysis": {{
        "main_topics": ["주요 주제1", "주요 주제2", "주요 주제3"],
        "content_type": "채널의 주요 콘텐츠 유형 (예: 공지, 소통, 정보공유 등)",
        "summary": "채널 전체 내용에 대한 간단한 요약 (1-2문장, 한국어)"
    }}
}}

IMPORTANT: Respond ONLY with valid JSON. No additional text or markdown."""
        
        return prompt
    
    def call_gemini_api(self, prompt: str, temperature: float = 0.2, max_retries: int = 3) -> Tuple[Dict, float]:
        """Gemini API 호출 및 성능 측정"""
        
        for attempt in range(max_retries):
            start_time = time.time()
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": temperature,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                    "responseMimeType": "application/json"
                }
            }
            
            headers = {
                "Content-Type": "application/json"
            }
            
            try:
                response = requests.post(self.url, headers=headers, json=payload)
                response.raise_for_status()
                
                latency = time.time() - start_time
                
                result = response.json()
                content = result['candidates'][0]['content']['parts'][0]['text']
                
                # JSON 파싱
                parsed_content = json.loads(content)
                
                return parsed_content, latency
                
            except requests.exceptions.RequestException as e:
                if hasattr(e, 'response') and e.response is not None and e.response.status_code == 429:
                    # Rate Limit 에러 - 재시도
                    wait_time = (2 ** attempt) * 2  # 2초, 4초, 8초
                    print(f"⚠️  Rate Limit 도달. {wait_time}초 대기 후 재시도 ({attempt+1}/{max_retries})...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ API 요청 오류: {str(e)}")
                    if hasattr(e, 'response') and e.response is not None:
                        print(f"   상태 코드: {e.response.status_code}")
                        print(f"   응답: {e.response.text[:200]}")
                    return None, time.time() - start_time
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON 파싱 오류: {str(e)}")
                print(f"   응답 내용: {content[:200] if 'content' in locals() else 'N/A'}")
                return None, time.time() - start_time
                
            except Exception as e:
                print(f"❌ 예상치 못한 오류: {str(e)}")
                return None, time.time() - start_time
        
        print(f"❌ {max_retries}번 재시도 후에도 실패했습니다.")
        return None, time.time() - start_time
    
    def generate_categories_for_channel(self, df_channel: pd.DataFrame, channel_name: str, board_name: str = None) -> List[Dict]:
        """채널별 카테고리 생성"""
        
        print(f"\n{'='*80}")
        print(f"📊 채널 분석 중: {channel_name}")
        if board_name:
            print(f"   보드: {board_name}")
        print(f"{'='*80}")
        
        # content 컬럼에서 메시지 추출
        messages = df_channel['content'].dropna().astype(str).tolist()
        
        # 빈 메시지 필터링
        messages = [msg for msg in messages if msg and len(msg.strip()) > 0]
        
        if not messages:
            print(f"⚠️  유효한 메시지가 없습니다.")
            return []
        
        print(f"📝 총 메시지 수: {len(messages)}")
        
        # 프롬프트 생성
        prompt = self.create_categorization_prompt(messages, channel_name, len(messages))
        
        # API 호출
        print(f"🔄 Gemini API 호출 중... (카테고리 생성)")
        result, latency = self.call_gemini_api(prompt, temperature=0.2)
        
        if result is None:
            print(f"❌ 카테고리 생성 실패")
            return []
        
        categories = result.get('categories', [])
        channel_analysis = result.get('channel_analysis', {})
        
        # 채널별 카테고리 저장 (board_name 포함)
        self.channel_categories[channel_name] = {
            'board_name': board_name,
            'categories': categories,
            'analysis': channel_analysis,
            'message_count': len(messages),
            'latency': round(latency, 3)
        }
        
        # 결과 출력
        print(f"\n✅ 카테고리 생성 완료!")
        print(f"⏱️  처리 시간: {latency:.3f}초")
        print(f"\n📁 생성된 카테고리 ({len(categories)}개):")
        for cat in categories:
            print(f"   {cat['id']}. {cat['name']}")
            print(f"      └─ {cat['description']}")
            print(f"      └─ 키워드: {', '.join(cat.get('keywords', []))}")
        
        print(f"\n💡 채널 분석:")
        print(f"   • 주요 주제: {', '.join(channel_analysis.get('main_topics', ['N/A']))}")
        print(f"   • 콘텐츠 유형: {channel_analysis.get('content_type', 'N/A')}")
        print(f"   • 요약: {channel_analysis.get('summary', 'N/A')}")
        
        # API Rate Limit 방지를 위한 대기
        time.sleep(5)
        
        return categories
    
    def generate_all_categories(self, input_csv: str, output_csv: str, output_json: str = None):
        """전체 채널의 카테고리 생성
        
        Args:
            input_csv: 입력 CSV 파일 경로
            output_csv: 카테고리 목록 CSV 출력 경로
            output_json: 상세 정보 JSON 출력 경로 (선택)
        """
        
        print("\n" + "="*80)
        print("🚀 채널별 카테고리 생성 시스템 시작")
        print("="*80)
        
        overall_start = time.time()
        
        # 데이터 로드
        print(f"\n📂 데이터 로딩: {input_csv}")
        df = pd.read_csv(input_csv)
        
        print(f"✅ 총 {len(df)}개 레코드 로드됨")
        
        # channel_name으로 그룹화
        if 'channel_name' not in df.columns:
            print("❌ 'channel_name' 컬럼이 없습니다!")
            return None
        
        channels = df['channel_name'].unique()
        channels = [ch for ch in channels if pd.notna(ch)]  # NaN 제거
        
        print(f"\n📡 발견된 채널: {len(channels)}개")
        for i, ch in enumerate(channels, 1):
            count = len(df[df['channel_name'] == ch])
            print(f"   {i}. {ch}: {count}개 메시지")
        
        # 각 채널별 카테고리 생성
        for channel_idx, channel in enumerate(channels, 1):
            print(f"\n\n{'#'*80}")
            print(f"# 채널 {channel_idx}/{len(channels)}: {channel}")
            print(f"{'#'*80}")
            
            df_channel = df[df['channel_name'] == channel].copy()
            
            # board_name 추출 (첫 번째 행의 board_name 사용)
            board_name = None
            if 'board_name' in df_channel.columns:
                board_name = df_channel['board_name'].dropna().iloc[0] if len(df_channel['board_name'].dropna()) > 0 else None
            
            # 카테고리 생성
            categories = self.generate_categories_for_channel(df_channel, str(channel), board_name)
            
            if not categories:
                print(f"⚠️  카테고리 생성 실패")
        
        # CSV 형태로 변환 및 저장
        self.save_categories_to_csv(output_csv)
        
        # JSON 저장 (옵션)
        if output_json:
            self.save_categories_to_json(output_json)
        
        overall_time = time.time() - overall_start
        
        print(f"\n{'='*80}")
        print(f"✅ 전체 프로세스 완료!")
        print(f"{'='*80}")
        print(f"⏱️  총 소요 시간: {overall_time:.1f}초 ({overall_time/60:.1f}분)")
        print(f"📊 처리된 채널: {len(channels)}개")
        
        return self.channel_categories
    
    def save_categories_to_csv(self, output_csv: str):
        """생성된 카테고리를 CSV로 저장"""
        
        # CSV용 데이터 준비 (board_name, channel_name, category_id, category_name)
        rows = []
        
        for channel_name, data in self.channel_categories.items():
            board_name = data.get('board_name', '')
            categories = data['categories']
            
            for cat in categories:
                row = {
                    'board_name': board_name,
                    'channel_name': channel_name,
                    'category_id': cat['id'],
                    'category_name': cat['name']
                }
                rows.append(row)
        
        # DataFrame 생성 및 저장
        df_categories = pd.DataFrame(rows)
        df_categories.to_csv(output_csv, index=False, encoding='utf-8-sig')
        
        print(f"\n💾 카테고리 CSV 저장 완료: {output_csv}")
        print(f"   • 총 {len(rows)}개 카테고리 (기타 포함)")
        
        # 요약 출력
        print(f"\n📋 채널별 카테고리 요약:")
        for channel_name, data in self.channel_categories.items():
            categories = data['categories']
            print(f"\n   [{channel_name}] - {len(categories)}개 카테고리")
            for cat in categories:
                print(f"      • {cat['name']}")
    
    def save_categories_to_json(self, output_json: str):
        """상세 정보를 JSON으로 저장"""
        
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(self.channel_categories, f, ensure_ascii=False, indent=2)
        
        print(f"💾 카테고리 JSON 저장 완료: {output_json}")


def main():
    """메인 실행 함수"""
    
    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║            채널별 카테고리 생성 시스템                                          ║
║            Powered by Gemini 2.0 Flash                                     ║
╚════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # 환경 변수 로드
    load_dotenv()
    API_KEY = os.getenv("GMS_KEY")
    
    if not API_KEY:
        print("❌ GMS_KEY 환경 변수가 설정되지 않았습니다!")
        print("💡 .env 파일을 생성하고 다음 내용을 추가하세요:")
        print("   GMS_KEY=your_api_key_here")
        return
    
    # 카테고리 생성기 초기화
    generator = CategoryGenerator(API_KEY)
    
    # 입력/출력 파일 경로
    input_csv = 'result/preprocessing_300.csv'
    output_csv = 'result/categories_list.csv'
    output_json = 'result/categories_detail.json'
    
    # 카테고리 생성 실행
    try:
        result = generator.generate_all_categories(
            input_csv=input_csv,
            output_csv=output_csv,
            output_json=output_json  # JSON 불필요시 None으로 설정
        )
        
        if result:
            print("\n🎉 성공적으로 완료되었습니다!")
            print(f"\n📁 생성된 파일:")
            print(f"   1. {output_csv} - 카테고리 목록 CSV")
            print(f"   2. {output_json} - 상세 정보 JSON")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()