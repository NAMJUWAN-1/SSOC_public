import pandas as pd
from sqlalchemy import text
from datetime import datetime, timedelta
import time
import sys
import os

# 프로젝트 루트 경로 추가 (database.py 및 모듈 로드용)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(CURRENT_DIR)

# 모듈 Import
from modules.mm_validator import validate_messages
from modules.message_merger import merge_messages
from modules.message_cleaner import filter_and_clean_posts
# 사용자 파일명 환경 준수 (embedding)
from modules.embedding import get_embedding, classify_category
from modules.ai_extractor import call_ai_api
from database import engine

# ==========================================
# 1. 파이프라인 설정
# ==========================================
BATCH_INTERVAL_SECONDS = 120 
AGING_MINUTES = 5            # 원본 메시지가 올라온 후 최소 5분 대기
SAFETY_MARGIN_MINUTES = 2    # 마지막 메시지 이후 최소 2분간 정적이어야 확정

# 메모리 캐시: 채널별 '기타' 카테고리 ID 저장
OTHERS_CAT_CACHE = {}

def load_raw_data():
    """DB 서버 시간을 기준으로 5분 숙성된 미처리 데이터 로드"""
    query = f"""
    SELECT r.*, c.channel_name, b.board_name 
    FROM post_raw r
    JOIN channel c ON r.channel_id = c.channel_id
    JOIN board b ON c.board_id = b.board_id
    WHERE r.posted_at <= (CURRENT_TIMESTAMP - INTERVAL '{AGING_MINUTES} minutes')
      AND r.is_processed = false
    ORDER BY r.channel_id, r.author_username, r.posted_at
    """
    return pd.read_sql(query, engine)

def update_raw_status_by_ids(conn, raw_ids):
    """[ID 기반 마킹] 리스트에 포함된 post_raw_id들을 처리 완료(true)로 일괄 변경"""
    if not raw_ids: return 0
    res = conn.execute(
        text("UPDATE post_raw SET is_processed = true WHERE post_raw_id = ANY(:ids)"),
        {"ids": raw_ids}
    )
    return res.rowcount

def save_to_db(df_final, df_all_attempted):
    """
    [핵심 수정]
    - mm_post_id: post 테이블에 저장 (신규 컬럼)
    - raw_id_list: post_raw 테이블 마킹용으로만 사용 (저장 안 함)
    """
    if df_all_attempted.empty: return
    
    # 1. 원본 마킹을 위해 모든 그룹의 ID 리스트를 하나로 합침
    all_target_ids = []
    for ids in df_all_attempted['raw_id_list']:
        if isinstance(ids, list):
            all_target_ids.extend(ids)
    
    # 2. 실제 DB(post)에 저장할 컬럼 구성 (raw_id_list는 제외됨)
    save_cols = [
        'category_id', 'channel_id', 'mm_post_id', 'ai_title', 'content', 
        'posted_at', 'start_at', 'end_at', 'embedding_vector', 'display_content'
    ]
    
    try:
        with engine.begin() as conn:
            # 3. post 테이블 저장 (mm_post_id 포함)
            if not df_final.empty:
                valid_save_cols = [c for c in save_cols if c in df_final.columns]
                df_final[valid_save_cols].to_sql(name='post', con=conn, if_exists='append', index=False)
            
            # 4. 원본 테이블 마킹 (raw_id_list 사용)
            total_updated = update_raw_status_by_ids(conn, all_target_ids)
            print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] 신규 저장: {len(df_final)}건 / 원본 마킹: {total_updated}행 완료")
    except Exception as e:
        print(f"❌ DB 작업 실패: {e}")

def get_channel_message_count(channel_id):
    try:
        with engine.connect() as conn:
            query = text("SELECT COUNT(*) FROM post WHERE channel_id = :cid")
            result = conn.execute(query, {"cid": int(channel_id)}).fetchone()
            return result[0] if result else 0
    except: return 0

def get_or_create_others_category_id(channel_id):
    if channel_id in OTHERS_CAT_CACHE: return OTHERS_CAT_CACHE[channel_id]
    try:
        with engine.begin() as conn:
            query = text("SELECT category_id FROM category WHERE channel_id = :cid AND category_name = '기타' LIMIT 1")
            result = conn.execute(query, {"cid": int(channel_id)}).fetchone()
            if result:
                OTHERS_CAT_CACHE[channel_id] = result[0]
                return result[0]
            insert_query = text("INSERT INTO category (channel_id, category_name) VALUES (:cid, '기타') RETURNING category_id")
            new_id = conn.execute(insert_query, {"cid": int(channel_id)}).fetchone()[0]
            OTHERS_CAT_CACHE[channel_id] = new_id
            return new_id
    except: return None

def run_pipeline():
    """데이터 처리 파이프라인 메인 루프"""
    try:
        # Step 1: 데이터 로드
        df_raw = load_raw_data()
        if df_raw.empty:
            print(f"💤 [{datetime.now().strftime('%H:%M:%S')}] 처리할 데이터가 없습니다.")
            return

        # Step 2: 유효성 검사를 병합 전에 수행
        unique_ids = df_raw['mm_post_id'].unique().tolist()
        v_map = validate_messages(unique_ids)
        df_raw['is_valid'] = df_raw['mm_post_id'].map(v_map)

        # 2-1. 삭제된 메시지 필터링 및 즉시 마킹
        df_invalid = df_raw[df_raw['is_valid'] == False].copy()
        if not df_invalid.empty:
            with engine.begin() as conn:
                update_raw_status_by_ids(conn, df_invalid['post_raw_id'].tolist())
            print(f"🗑️ [{datetime.now().strftime('%H:%M:%S')}] 삭제된 원본 메시지 {len(df_invalid)}건 제외")

        df_valid_raw = df_raw[df_raw['is_valid'] == True].copy()
        if df_valid_raw.empty: return

        # Step 3: 메시지 병합 (mm_post_id, raw_id_list 확보됨)
        df_merged = merge_messages(df_valid_raw)
        
        # Step 4: 안전거리 필터링 (Wait 로직)
        with engine.connect() as conn:
            db_now = conn.execute(text("SELECT CURRENT_TIMESTAMP")).fetchone()[0]
        db_now_naive = db_now.replace(tzinfo=None)
        safe_line = db_now_naive - timedelta(minutes=AGING_MINUTES + SAFETY_MARGIN_MINUTES)
        
        df_merged['temp_compare_at'] = pd.to_datetime(df_merged['last_posted_at']).dt.tz_localize(None)
        df_safe = df_merged[df_merged['temp_compare_at'] <= safe_line].copy()
        
        if df_safe.empty: return

        print(f"🚀 분석 시작: {len(df_safe)}건의 그룹 확정")

        # Step 5: 텍스트 정제 및 프리뷰 생성
        df_cleaned = filter_and_clean_posts(df_safe, min_length=30, display_limit=100)

        # Step 6: AI 및 임베딩
        final_results = []
        for _, row in df_cleaned.iterrows():
            try:
                vector = get_embedding(row['content'])
                row['embedding_vector'] = str(vector) if vector else None 
                
                msg_count = get_channel_message_count(row['channel_id'])
                cat_id, _ = classify_category(vector, row['board_name'], row['channel_name']) if msg_count > 50 else (None, None)
                
                if cat_id is None:
                    cat_id = get_or_create_others_category_id(row['channel_id'])
                
                if cat_id:
                    row['category_id'] = cat_id
                    ai_res = call_ai_api(row)
                    if ai_res:
                        row['ai_title'] = ai_res.get('ai_title')
                        row['start_at'] = ai_res.get('start_at')
                        row['end_at'] = ai_res.get('end_at')
                        final_results.append(row)
            except Exception as e:
                print(f"⚠️ 개별 데이터 처리 에러: {e}")

        # Step 7: 최종 저장 (mm_post_id 저장 & raw_id_list 마킹)
        save_to_db(pd.DataFrame(final_results), df_safe)

    except Exception as e:
        print(f"🔥 파이프라인 전체 에러: {e}")

if __name__ == "__main__":
    print(f"📢 SSOC AI 파이프라인 가동 (2분 주기)")
    while True:
        try:
            run_pipeline()
        except KeyboardInterrupt:
            print("\n👋 서비스를 종료합니다.")
            break
        except Exception as e:
            print(f"🔥 시스템 치명적 에러: {e}")
        
        print(f"😴 {BATCH_INTERVAL_SECONDS}초 대기 후 다음 배치를 실행합니다...")
        time.sleep(BATCH_INTERVAL_SECONDS)