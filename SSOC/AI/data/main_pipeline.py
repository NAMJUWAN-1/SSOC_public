import os
import sys
from datetime import datetime, timedelta
import pandas as pd

from message_merger import merge_messages
from message_cleaner import filter_and_clean_posts


# ==========================================
# 1. 설정
# ==========================================

# 기존 데이터 파일 경로
INPUT_FILE_PATH = r"C:\Users\SSAFY\Desktop\SSOC\SSOC\AI\data\raw\raw_data_8.csv"
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
    # CSV 읽기
    try:
        df = pd.read_csv(INPUT_FILE_PATH, encoding='utf-8-sig')
    except UnicodeDecodeError:
        df = pd.read_csv(filepath, encoding='cp949')

    # 필수 컬럼 체크
    required_cols = ['channel_id', 'author_username', 'posted_at', 'raw_content']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    # 날짜 변환
    print("날짜 포맷 변환 중...")
    if 'posted_at' in df.columns:
        df['posted_at'] = df['posted_at'].apply(convert_excel_date)
        df['posted_at'] = pd.to_datetime(df['posted_at'], errors='coerce')
        df.dropna(subset=['posted_at'], inplace=True)

    return df


# ==========================================
# 2. 파이프라인 실행 로직
# ==========================================

def run_pipeline():
    # 1. 데이터 로드
    df_raw = load_existing_data(INPUT_FILE_PATH)
    print(f"\n>>> [1단계] 메시지 병합 (Merge) 시작 | 원본: {len(df_raw)}건")
    
    # 병합 실행
    # df_raw_updated(두 번째 리턴값)는 저장하지 않을 것이므로 변수명 생략(_)
    df_merged, _ = merge_messages(df_raw)
    print(f"   - 병합 결과: {len(df_merged)}개의 Post 그룹 생성됨")
    print("\n>>> [2단계] 메시지 정제 및 필터링 (Clean) 시작")
    print("   - 기준: 30자 이상, 멘션/이모지 제거")
    
    # 정제 실행
    df_final = filter_and_clean_posts(df_merged, min_length=30)


    # ==========================================
    # 3. 결과 저장
    # ==========================================
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    post_output_path = os.path.join(OUTPUT_DIR, "preprocessing_8.csv")
    df_final.to_csv(post_output_path, index=False, encoding='utf-8-sig')
    
    print(f"\n 처리가 완료되었습니다.")
    print(f"   - 최종 공지 데이터: {post_output_path} ({len(df_final)}건)")

if __name__ == "__main__":
    run_pipeline()