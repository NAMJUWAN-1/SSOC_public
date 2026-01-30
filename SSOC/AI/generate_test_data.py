import pandas as pd
from sqlalchemy import text
from datetime import datetime, timedelta
import sys
import os

# 프로젝트 루트 경로 추가 (database 모듈 로드용)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(CURRENT_DIR)

from database import engine

def create_realistic_test_data():
    """
    제공된 실제 mm_post_id와 channel_id 매핑을 반영하여 
    유효성 검사 및 병합 로직 테스트 데이터를 생성합니다.
    """
    now = datetime.now()
    # 5분 숙성 로직 통과를 위해 15분 전을 기준 시점으로 설정
    base_time = now - timedelta(minutes=15)
    
    test_data = [
        # [그룹 1] 채널 34 / 유효 ID: jusg9tt5u7g5xqbmo4tqtytjia
        # 메시지 1 & 2는 병합되어 하나의 Post가 됩니다.
        {
            "author": "ai_bot",
            "content": "## 오늘의 AI News(12/22) :good_bebe_duck:\n\n여러분, 안녕하세요. 매주 여러분을 찾아가는 오늘의 AI 뉴스를 전달드립니다.\n학습을 진행하며 관심있게 살펴보았던 AI 관련 기술과 뉴스, 영상 등을 채널에 함께 공유도 가능하니 AI News 채널을 활용해주세요! :kitty_tap:",
            "posted_at": base_time,
            "channel_id": 34,
            "mm_id": "jusg9tt5u7g5xqbmo4tqtytjia"
        },
        {
            "author": "ai_bot",
            "content": "| 번호 | 구분 | 기사 제목 |\n| --- | --- | --- |\n| 1 | 시장 동향 | [이미지·영상 생성 AI 경쟁…메타도 가담](https://www.bloter.net/news/articleView.html?idxno=650108) |\n| 2 | 채용 | [대학가 채용시장도 ‘AI 바람’…“활용 역량 우대”](https://news.kbs.co.kr/news/pc/view/view.do?ncd=8439054&ref=A) |",
            "posted_at": base_time + timedelta(seconds=30),
            "channel_id": 34,
            "mm_id": "temp_merge_01" # 첫 번째 ID인 jusg...가 대표로 유효성 검사를 통과함
        },

        # [그룹 2] 채널 34 / 유효 ID: 6nd1z3gm5pr89f4c3eeqzp8pea
        # 메시지 3 & 4는 병합되어 하나의 Post가 됩니다.
        {
            "author": "ai_bot",
            "content": "| 3 | 산업별 적용 | [하나銀, 기업 여신심사에 AI 도입…업무량 30% 감소 전망](https://www.sedaily.com/NewsView/2H1TUD05MF) |\n| 4 | 산업별 적용 | [AX부터 AI팩토리까지…삼성전자, AI·로봇 전략 인재 모은다](https://www.mt.co.kr/industry/2025/12/22/2025122115045015017) |",
            "posted_at": base_time + timedelta(minutes=5),
            "channel_id": 34,
            "mm_id": "6nd1z3gm5pr89f4c3eeqzp8pea"
        },
        {
            "author": "ai_bot",
            "content": "위 소식들은 이번 주 가장 뜨거웠던 AI 관련 이슈들입니다. 추가 링크는 하단 주소를 참고하세요.\nhttps://meeting.ssafy.com/s14public/pl/6nd1z3gm5pr89f4c3eeqzp8pea",
            "posted_at": base_time + timedelta(minutes=5, seconds=45),
            "channel_id": 34,
            "mm_id": "temp_merge_02"
        },

        # [데이터 5] 유효성 검사 탈락용 데이터 (ID가 일치하지 않음)
        {
            "author": "unknown_user",
            "content": "이 메시지는 유효하지 않은 mm_post_id를 가지고 있어 파이프라인에서 제거되어야 합니다.",
            "posted_at": base_time + timedelta(minutes=10),
            "channel_id": 34,
            "mm_id": "invalid_post_id_test_999"
        }
    ]

    print(f"🚀 [Test Data] 실제 ID(채널 34)를 포함하여 {len(test_data)}건의 데이터를 주입합니다...")
    
    try:
        with engine.begin() as conn:
            # 기존 테스트 데이터 정리
            all_ids = [f"'{d['mm_id']}'" for d in test_data]
            conn.execute(text(f"DELETE FROM post_raw WHERE mm_post_id IN ({','.join(all_ids)})"))
            
            # 데이터 삽입
            query = text("""
                INSERT INTO post_raw 
                (author_username, raw_content, posted_at, channel_id, mm_post_id, is_processed, update_at)
                VALUES (:author, :content, :posted_at, :channel_id, :mm_id, false, NOW())
            """)
            
            for data in test_data:
                conn.execute(query, data)
                
        print(f"✅ 데이터 주입 완료 (현재 시각: {now.strftime('%H:%M:%S')})")
        print(f"💡 테스트 확인 포인트:")
        print(f"1. 채널 34의 두 그룹(jusg..., 6nd1...)이 각각 병합되어 총 2개의 Post가 생성되는지 확인")
        print(f"2. 'invalid_post_id_test_999' 데이터가 유효성 검사 단계에서 제거되는지 확인")
        print(f"3. AI가 뉴스 테이블 내용을 바탕으로 제목과 카테고리를 잘 추출하는지 확인")
        
    except Exception as e:
        print(f"❌ 데이터 주입 실패: {e}")

if __name__ == "__main__":
    create_realistic_test_data()