import requests
import json
import re
import os
import pandas as pd
from dotenv import load_dotenv
import sys


# ==========================================
# 1. 설정 (.env 로드)
# ==========================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.append(PROJECT_ROOT)

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

API_KEY = os.getenv("GMS_API_KEY")
API_URL = os.getenv("GMS_API_URL")
TARGET_MODEL = os.getenv("GMS_MODEL", "gpt-4o-mini")


# ==========================================
# 2. 유틸리티
# ==========================================

def clean_json_string(content):
    """마크다운 코드 블록 제거"""
    content = re.sub(r'```json\s*', '', content)
    content = re.sub(r'```', '', content)
    return content.strip()

def get_day_of_week(date_val):
    try:
        dt = pd.to_datetime(date_val)
        days = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
        return days[dt.dayofweek]
    except:
        return "알 수 없음"


# ==========================================
# 3. [AI 호출 함수] 임베딩 단계에서 판별된 카테고리 정보와 본문을 AI에게 전달
# ==========================================

def call_ai_api(row):

    content = row.get('content')
    posted_at = row.get('posted_at')

    # 요일 계산
    day_of_week = get_day_of_week(posted_at)

    # 프롬프트
    system_prompt = f"""# Role
당신은 비정형 텍스트(공지사항, 메시지)에서 **핵심 일정(Main Event)**과 **제목(Title)**을 추출하여 구조화된 데이터로 변환하는 전문 AI 비서입니다.
국제 표준(RFC 5545, TimeML)과 아래의 **[상세 처리 규칙]**을 엄격히 준수하여 오직 JSON으로만 응답하세요.

# Context (Input Variables)
* **게시글 생성일자(posted_at):** {posted_at}
* **작성일 요일:** {day_of_week}

# Extraction & Normalization Rules (반드시 준수)

🚨 1. 일정 정보 부재 시 처리 (최우선 순위 - 별표 5개)
본문에 구체적인 날짜, 요일, 상대적 표현(오늘/어제 등), 시각 정보가 하나도 없는 경우:
* 절대로 시간 계산이나 타임존 변환을 시도하지 마세요.
* 반드시 start_at과 end_at 필드에 위에서 제공된 {posted_at} 문자열을 토씨 하나 틀리지 않고 그대로 복사해서 넣으세요.
* 예시: {posted_at}이 "2026-02-05 14:45:34"라면, 결과값은 반드시 "start_at": "2026-02-05 14:45:34", "end_at": "2026-02-05 14:45:34"가 되어야 합니다.

## 2. 제목 생성 (AI Title Generation)
* 공지사항의 핵심 내용을 20자 이내로 요약하여 간결한 제목을 생성하세요.
* 원문에 `[공지]`, `###` 등 명시적인 제목 형식이 있다면 이를 우선적으로 정제하여 사용하세요.
* 명시적 제목이 없다면 본문의 **'메인 이벤트(Main Event)'** 내용을 요약하여 생성하세요.

## 3. 날짜 정보 처리 (Date Parsing)
* **기준:** 모든 날짜 계산의 기준점은 **게시글 생성일자({posted_at})**입니다.
* **상대적 표현:** '오늘', '내일', '금일', '어제' 등은 반드시 `{posted_at}`을 기준으로 계산된 절대 날짜(YYYY-MM-DD)로 변환하세요.
* **연도 누락:** 연도가 없는 날짜(예: 12월 25일)는 게시글 작성 연도를 그대로 적용하세요. 미래의 연도로 추측하지 마세요.
* **단일 날짜(시각 미지정):** 특정 날짜(혹은 오늘/어제 등)만 언급되고 구체적인 시각 정보가 없다면, 해당 날짜의 **00:00:00부터 23:59:59까지**를 범위로 설정(종일 일정)하세요.
* **주차(Week) 및 기간:** 'n월 m주차', '이번 주' 등 기간형 표현은 해당 주의 **월요일 00:00:00부터 일요일 23:59:59까지**를 범위로 설정하세요.

## 4. 시간 정보 처리 및 정규화 (Time Parsing & Normalization)
* **연속/복수 일정 통합:** 한 게시글 내에 여러 세부 일정(예: 09:00~10:00, 14:00~16:00)이 나열된 경우, 이를 개별로 보지 말고 **전체 일정을 아우르는 가장 빠른 시작 시간부터 가장 늦은 종료 시간까지**를 단일 범위로 추출하세요.
* **24시 및 자정 처리:** 마감 기한이 '24시' 또는 '자정'으로 명시된 경우, 시스템 오류 방지 및 날짜 정합성을 위해 반드시 해당 날짜의 **23:59:59**로 변환하세요. (예: 1/9 24시 -> 2026-01-09 23:59:59)
* **단일 시점 (시작만 존재):** 시작 시간만 있다면 종료 시간은 **시작 시간 + 1시간**으로 설정하세요.
* **단일 시점 (종료만 존재):** 종료 시간(마감)만 있다면 시작 시간은 **게시글 생성일자({posted_at})**로 설정하세요.
* **이벤트 중심 추출:** '10분 전 접속' 등의 준비 시간은 무시하고, 실제 행사가 시작되는 **'본 행사 시간'**을 선택하세요.

## 5. 충돌 해결 (Conflict Resolution)
* **복수 일정 존재 시:** 문맥상 가장 비중이 큰 **'본 행사(Main Event)'**를 우선 추출하세요. 단순 마감 기한보다 행사 일시가 우선입니다.
* **판단 불가 시:** 중요도가 비슷하다면 시간상 가장 먼저 시작하는(Earliest Start) 일정을 선택하세요.

# Output Format (JSON)
응답은 반드시 아래 형식을 갖춘 순수 JSON 객체여야 합니다. (Markdown 블록 없이 출력 권장)
{{
"ai_title": "공지 제목 요약",
"start_at": "YYYY-MM-DD HH:MM:SS",
"end_at": "YYYY-MM-DD HH:MM:SS"
}}"""

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
        response = requests.post(API_URL, headers=headers, json=payload, timeout=20)
        
        if response.status_code == 200:
            result = response.json()
            ai_raw_content = result['choices'][0]['message']['content']
            return json.loads(clean_json_string(ai_raw_content))
            
    except Exception as e:
        print(f"   [Error] AI 호출 실패: {e}")
        
    return None