import pandas as pd
import requests
import json
import re
import os
import sys
import time
from datetime import datetime

# ==========================================
# 1. 설정 (Configuration)
# ==========================================

# [경로 설정]
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

INPUT_FILE_PATH = os.path.join(DATA_DIR, "result", "preprocessing_300.csv")
CATEGORY_FILE_PATH = os.path.join(DATA_DIR, "result", "categories_list.csv")
BASE_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "output_by_model")

# [중요] 타겟 모델명
TARGET_MODEL = "gpt-4o-mini" 

# [추가] API 호출 간 휴식 시간 (초 단위)
# 0.5초 ~ 1초 정도면 충분히 안전합니다.
DELAY_SECONDS = 0.5 

# GMS API 설정
API_KEY = "S14P12B209-561340c9-4190-444a-8864-c137d6a9e518" 
API_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"

# ==========================================
# 2. 카테고리 로더
# ==========================================
def load_categories():
    if not os.path.exists(CATEGORY_FILE_PATH):
        print(f"❌ 카테고리 파일을 찾을 수 없습니다: {CATEGORY_FILE_PATH}")
        return {}

    try:
        df = pd.read_csv(CATEGORY_FILE_PATH, encoding='utf-8-sig')
    except UnicodeDecodeError:
        df = pd.read_csv(CATEGORY_FILE_PATH, encoding='cp949')

    category_map = {}
    
    required = {'board_name', 'channel_name', 'category_id', 'category_name'}
    if not required.issubset(df.columns):
        print(f"❌ 카테고리 파일 컬럼 오류. 필요 컬럼: {required}")
        return {}

    grouped = df.groupby(['board_name', 'channel_name'])
    for (board, channel), group in grouped:
        cat_str = "\n".join([f"- ID {row['category_id']}: {row['category_name']}" for _, row in group.iterrows()])
        category_map[(board, channel)] = cat_str
    
    print(f"✅ 카테고리 맵 로드 완료 ({len(category_map)}개 채널)")
    return category_map

CATEGORY_MAP = load_categories()

# ==========================================
# 3. 유틸리티 및 API 호출
# ==========================================

def get_day_of_week(date_val):
    try:
        dt = pd.to_datetime(date_val)
        days = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
        return days[dt.dayofweek]
    except:
        return "알 수 없음"

def clean_json_string(content):
    content = re.sub(r'```json\s*', '', content)
    content = re.sub(r'```', '', content)
    return content.strip()

def call_ai_api(row):
    content = row['content']
    posted_at = row['posted_at']
    board_name = row.get('board_name')
    channel_name = row.get('channel_name')

    day_of_week = get_day_of_week(posted_at)
    category_list_str = CATEGORY_MAP.get((board_name, channel_name), "선택 가능한 카테고리 정보가 없습니다.")

    system_prompt_template = """# Role
당신은 비정형 텍스트에서 **카테고리 분류**, **핵심 일정**, **제목**을 추출하는 전문 AI 비서입니다.
제공된 [선택 가능 카테고리] 중에서 하나를 반드시 선택해야 하며, 국제 표준(RFC 5545, TimeML)과 아래의 상세 처리 규칙을 엄격히 준수하여 JSON으로 응답하세요.

# Context (Input Variables)
* **게시글 생성일자(posted_at):** ${POSTED_AT}
* **작성일 요일:** ${DAY_OF_WEEK}
* **선택 가능 카테고리:**
  ${CATEGORY_LIST}

# Extraction Rules (반드시 준수)

## 1. 카테고리 분류 (Classification)
* 본문의 내용을 분석하여 위 **[선택 가능 카테고리]** 중 가장 적절한 항목의 **ID(숫자)**를 선택하세요.
* 만약 해당하는 카테고리가 명확하지 않다면 '기타'에 해당하는 ID를 선택하세요.

## 2. 제목 생성 (AI Title Generation)
* 공지사항의 내용을 대표하는 간결한 제목을 생성하세요. (20자 이내 권장)
* 원문에 `[공지]`, `###` 등 명시적인 제목 형식이 있다면 우선적으로 사용하세요.
* 명시적 제목이 없다면, **'메인 이벤트(Main Event)'**의 내용을 요약하여 제목으로 만드세요.

## 3. 날짜 정보 처리 (Date Parsing) - 기준: 게시글 생성일자
* **기준:** 모든 날짜는 **게시글 생성일자**를 기준으로 계산합니다.
* **상대적 날짜:** '오늘', '내일', '금일' 등은 반드시 **게시글 생성일자**를 기준으로 절대 날짜(YYYY-MM-DD)로 변환하세요. (TimeML)
* **연도 누락:** 연도가 명시되지 않은 날짜는 **게시글 생성 연도(Creation Year Anchoring)**를 그대로 적용하세요. 미래로 예측하지 마세요. (TimeML)
* **주차(Week) 및 기간 표현:**
  - 제목이나 본문에 '10월 4주차', '이번 주' 등의 표현이 있다면, 본문에 나오는 여러 마감일(예: 10/27, 11/02 등)에 휘둘리지 마세요.
  - 무조건 **게시글 생성일자가 포함된 주(Week)의 월요일(Start)부터 일요일(End)까지**를 일정으로 설정하세요.
  - 시간 정보는 무시하고 `00:00:00`으로 설정하세요. (RFC 5545)
* **모호한 표현:** '1월 초', '조만간' 등 명확한 날짜 값(VALUE)을 생성할 수 없는 표현은 **추출에서 제외(Drop)**하세요. (TimeML Threshold)

## 4. 시간 정보 처리 (Time Parsing) - 기준: 보수적 접근
* **시간 정보 없음:** 날짜만 있고 시간이 없거나 '주차/기간 일정'인 경우 `00:00:00`으로 설정하세요. (RFC 5545 All Day)
* **단일 시간 (시작점):** 시작 시간만 명시된 경우(예: 14시 시작), 종료 시간은 **시작 시간 + 1시간**으로 설정하세요. (RFC 5545 Duration)
* **단일 시간 (종료점):** 종료 시간(마감, ~까지)만 명시된 경우, 시작 시간은 **게시글 생성일자(posted_at)**로 설정하세요. (TimeML Anchoring)
* **준비 vs 시작:** '10분 전 접속', '2시 시작'과 같이 준비 시간과 본식이 섞여 있다면, '접속/대기' 시간은 무시하고 **'본 행사 시작'** 시간을 선택하세요. (TimeML Event Centric)

## 5. 충돌 해결 (Conflict Resolution)
* **복수의 날짜/시간 존재 시:**
  1. **1순위 (AI 판단):** 문맥상 가장 중요한 **'본 행사(Main Event)'** 날짜/시간을 우선 추출하세요. (단순 마감일보다 행사일 우선)
  2. **2순위 (시계열):** 중요도가 비슷하여 판단하기 어렵다면 **시간상 가장 먼저 시작하는(Earliest Start)** 일정을 선택하세요. (UX Heuristics)

# Output Format (JSON)
응답은 오직 아래 JSON 형식으로만 반환하세요.
{
"category_id": 1,
"ai_title": "공지 제목",
"start_at": "YYYY-MM-DD HH:MM:SS",
"end_at": "YYYY-MM-DD HH:MM:SS"
}"""

    system_prompt = system_prompt_template.replace("${POSTED_AT}", str(posted_at))
    system_prompt = system_prompt.replace("${DAY_OF_WEEK}", day_of_week)
    system_prompt = system_prompt.replace("${CATEGORY_LIST}", category_list_str)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    payload = {
        "model": TARGET_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"내용: {content}"}
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        ai_raw_content = result['choices'][0]['message']['content']
        return json.loads(clean_json_string(ai_raw_content))

    except Exception as e:
        print(f"   [Error] AI 호출 실패: {e}")
        return None

# ==========================================
# 4. 메인 실행 로직
# ==========================================

def run_extractor():
    print(f"📂 입력 파일 로드: {INPUT_FILE_PATH}")
    
    if not os.path.exists(INPUT_FILE_PATH):
        print(f"❌ 입력 파일을 찾을 수 없습니다: {INPUT_FILE_PATH}")
        return

    try:
        df = pd.read_csv(INPUT_FILE_PATH, encoding='utf-8-sig')
    except UnicodeDecodeError:
        print("ℹ️ utf-8 실패, cp949로 재시도")
        df = pd.read_csv(INPUT_FILE_PATH, encoding='cp949')

    required_cols = ['content', 'posted_at', 'board_name', 'channel_name']
    if not all(col in df.columns for col in required_cols):
        print(f"❌ 필수 컬럼({required_cols})이 누락되었습니다.")
        return

    print(f"   - 데이터 개수: {len(df)}건")
    print(f"   - 타겟 모델: {TARGET_MODEL}")
    
    results = []
    start_time = time.time()
    total = len(df)

    print(f"\n🚀 AI 분석 시작 (예상 소요시간: 약 {total * (1 + DELAY_SECONDS) / 60:.1f}분)")
    
    for idx, row in df.iterrows():
        # [수정] 진행률 로그 (10개 단위) 및 경과 시간 표시
        if (idx + 1) % 10 == 0:
            elapsed_now = time.time() - start_time
            print(f"   Processing... {idx + 1}/{total} ({(idx + 1)/total*100:.1f}%) - 경과시간: {elapsed_now:.1f}초")

        ai_result = call_ai_api(row)
        
        if ai_result:
            results.append({
                'category_id': ai_result.get('category_id'),
                'ai_title': ai_result.get('ai_title'),
                'start_at': ai_result.get('start_at'),
                'end_at': ai_result.get('end_at')
            })
        else:
            results.append({
                'category_id': None,
                'ai_title': None,
                'start_at': None,
                'end_at': None
            })
        
        # [추가] API 부하 방지를 위한 휴식 (Throttle)
        time.sleep(DELAY_SECONDS)

    df_results = pd.DataFrame(results)
    
    cols_to_drop = [c for c in df_results.columns if c in df.columns]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)

    df_final = pd.concat([df, df_results], axis=1)

    os.makedirs(BASE_OUTPUT_DIR, exist_ok=True)
    final_output_path = os.path.join(BASE_OUTPUT_DIR, f"{TARGET_MODEL}.csv")
    
    df_final.to_csv(final_output_path, index=False, encoding='utf-8-sig')
    
    end_time = time.time()
    elapsed = end_time - start_time
    
    print(f"\n💾 완료! 파일 저장됨: {final_output_path}")
    print(f"⏱️ 총 소요 시간: {elapsed:.2f}초 ({elapsed/60:.2f}분)")
    
    if not df_final.empty:
        print("\n[샘플 결과]")
        print(df_final[['board_name', 'channel_name', 'category_id', 'ai_title']].head(3))

if __name__ == "__main__":
    run_extractor()