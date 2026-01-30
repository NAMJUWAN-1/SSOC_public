import os
import sys
from datetime import datetime, timedelta
import pandas as pd

from message_cleaner import filter_and_clean_posts


# ==========================================
# 1. 설정
# ==========================================

# 기존 데이터 파일 경로
INPUT_FILE_PATH = r"C:\Users\SSAFY\Desktop\SSOC\SSOC\AI\data\raw\raw_data_300.csv"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "result")


def convert_excel_date(serial):
    """엑셀 숫자형 날짜 변환 (기존 로직 동일)"""
    try:
        serial_float = float(serial)
        base_date = datetime(1899, 12, 30)
        return base_date + timedelta(days=serial_float)
    except (ValueError, TypeError):
        return pd.to_datetime(serial, errors='coerce')


def load_existing_data(filepath):
    # 1. CSV 읽기
    try:
        df = pd.read_csv(INPUT_FILE_PATH, encoding='utf-8-sig')
    except UnicodeDecodeError:
        df = pd.read_csv(filepath, encoding='cp949')

    # 2. 컬럼명 변경 (raw_content -> content)
    # 정제 모듈(message_cleaner.py)은 'content' 컬럼을 대상으로 동작하기 때문입니다.
    if 'raw_content' in df.columns:
        df.rename(columns={'raw_content': 'content'}, inplace=True)

    # 3. 날짜 변환
    print("날짜 포맷 변환 중...")
    if 'posted_at' in df.columns:
        df['posted_at'] = df['posted_at'].apply(convert_excel_date)
        df['posted_at'] = pd.to_datetime(df['posted_at'], errors='coerce')
        df.dropna(subset=['posted_at'], inplace=True)

    return df

# ==========================================
# 2. 실행 로직
# ==========================================

def run_cleaner_only():
    # 1. 데이터 로드
    df = load_existing_data(INPUT_FILE_PATH)
    print(f"   - 로드된 데이터: {len(df)}건")

    # 2. [수정] 병합 건너뛰기 & ID 생성
    print("\n>>> [1단계] 병합 생략 (임시 ID 생성)")
    # 1부터 시작하는 순차 번호 부여 (Auto Increment 시뮬레이션)
    df['temp_group_id'] = range(1, len(df) + 1)
    
    # DB 스키마에 맞춘 빈 컬럼 생성 (병합 로직에서 해주던 작업을 여기서 수행)
    df['category_id'] = None
    df['ai_title'] = None
    df['start_at'] = None
    df['end_at'] = None

    # 3. 정제 (Clean)
    print("\n>>> [2단계] 텍스트 정제 및 필터링 (Clean) 시작")
    df_cleaned = filter_and_clean_posts(df, min_length=30)

    # 4. 결과 저장
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    target_cols = [
        'temp_group_id', 'category_id', 'ai_title', 'content', 
        'posted_at', 'start_at', 'end_at', 
        'channel_id', 'author_username', 'mm_post_id', 
        'board_name', 'channel_name'
    ]
    
    save_cols = [c for c in target_cols if c in df_cleaned.columns]

    output_path = os.path.join(OUTPUT_DIR, "preprocessing_300.csv")
    df_cleaned[save_cols].to_csv(output_path, index=False, encoding='utf-8-sig')

    print(f"\n💾 완료! 정제된 데이터 저장됨: {output_path}")
    print(f"   - 최종 건수: {len(df_cleaned)}건")


if __name__ == "__main__":
    run_cleaner_only()