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
당신은 비정형 텍스트에서 **핵심 일정(Main Event)**과 **제목(Title)**을 추출하는 전문 AI 비서입니다.
제공된 [선택 가능 카테고리] 중에서 하나를 반드시 선택해야 하며, 국제 표준(RFC 5545, TimeML)과 아래의 상세 처리 규칙을 엄격히 준수하여 JSON으로 응답하세요.

# Context (Input Variables)
* **게시글 생성일자(posted_at):** {posted_at}
* **작성일 요일:** {day_of_week}

# Extraction Rules (반드시 준수)

## 1. 제목 생성 (AI Title Generation)
* 공지사항의 내용을 대표하는 간결한 제목을 생성하세요. (20자 이내 권장)
* 원문에 `[공지]`, `###` 등 명시적인 제목 형식이 있다면 우선적으로 사용하세요.
* 명시적 제목이 없다면, **'메인 이벤트(Main Event)'**의 내용을 요약하여 제목으로 만드세요.

## 2. 날짜 정보 처리 (Date Parsing) - 기준: 게시글 생성일자
* **기준:** 모든 날짜는 **게시글 생성일자**를 기준으로 계산합니다.
* **상대적 날짜:** '오늘', '내일', '금일' 등은 반드시 **게시글 생성일자**를 기준으로 절대 날짜(YYYY-MM-DD)로 변환하세요. (TimeML)
* **연도 누락:** 연도가 명시되지 않은 날짜는 **게시글 생성 연도(Creation Year Anchoring)**를 그대로 적용하세요. 미래로 예측하지 마세요. (TimeML)
* **주차(Week) 및 기간 표현:**
  - 제목이나 본문에 '10월 4주차', '이번 주' 등의 표현이 있다면, 본문에 나오는 여러 마감일(예: 10/27, 11/02 등)에 휘둘리지 마세요.
  - 무조건 **게시글 생성일자가 포함된 주(Week)의 월요일(Start)부터 일요일(End)까지**를 일정으로 설정하세요.
  - 시간 정보는 무시하고 `00:00:00`으로 설정하세요. (RFC 5545)
* **모호한 표현:** '1월 초', '조만간' 등 명확한 날짜 값(VALUE)을 생성할 수 없는 표현은 **추출에서 제외(Drop)**하세요. (TimeML Threshold)

## 3. 시간 정보 처리 (Time Parsing) - 기준: 보수적 접근
* **시간 정보 없음:** 날짜만 있고 시간이 없거나 '주차/기간 일정'인 경우 `00:00:00`으로 설정하세요. (RFC 5545 All Day)
* **단일 시간 (시작점):** 시작 시간만 명시된 경우(예: 14시 시작), 종료 시간은 **시작 시간 + 1시간**으로 설정하세요. (RFC 5545 Duration)
* **단일 시간 (종료점):** 종료 시간(마감, ~까지)만 명시된 경우, 시작 시간은 **게시글 생성일자(posted_at)**로 설정하세요. (TimeML Anchoring)
* **준비 vs 시작:** '10분 전 접속', '2시 시작'과 같이 준비 시간과 본식이 섞여 있다면, '접속/대기' 시간은 무시하고 **'본 행사 시작'** 시간을 선택하세요. (TimeML Event Centric)

## 4. 충돌 해결 (Conflict Resolution)
* **복수의 날짜/시간 존재 시:**
  1. **1순위 (AI 판단):** 문맥상 가장 중요한 **'본 행사(Main Event)'** 날짜/시간을 우선 추출하세요. (단순 마감일보다 행사일 우선)
  2. **2순위 (시계열):** 중요도가 비슷하여 판단하기 어렵다면 **시간상 가장 먼저 시작하는(Earliest Start)** 일정을 선택하세요. (UX Heuristics)

# Output Format (JSON)
응답은 오직 아래 JSON 형식으로만 반환하세요.
{{
"ai_title": "공지 제목",
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