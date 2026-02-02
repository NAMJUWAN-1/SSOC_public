import re
import pandas as pd

def strip_markdown(text):
    """
    [display_content용] 마크다운 양식을 제거하고 순수 텍스트만 추출합니다.
    """
    if not isinstance(text, str): return ""
    
    # 1. 헤더 제거 (# 제목)
    text = re.sub(r'#+\s+', '', text)
    # 2. 볼드/이탤릭 제거 (**강조**, __강조__, *기울임*)
    text = re.sub(r'(\*\*|__|\*|_)', '', text)
    # 3. 링크 제거 ([텍스트](URL) -> 텍스트)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # 4. 인용구 제거 (> 문장)
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    # 5. 코드 블럭 및 인라인 코드 제거 (```, `)
    text = re.sub(r'(`{1,3}).*?\1', '', text, flags=re.DOTALL)
    # 6. 목록 기호 제거 (-, *, 1. 등)
    text = re.sub(r'^\s*([-*]|\d+\.)\s+', '', text, flags=re.MULTILINE)
    
    # 줄바꿈을 공백으로 치환하여 한 줄로 만듦
    text = text.replace('\n', ' ').strip()
    # 연속된 공백 정리
    text = re.sub(r'\s+', ' ', text)
    
    return text

def clean_text_body(text, min_length=30):
    """
    [본문 정제 및 검증 로직]
    1. 멘션 제거 (@all, @name 등 문장 내 모든 멘션)
    2. Mattermost 이모지 제거 (:smile:, :round_pushpin: 등)
    3. 깨진 문자 제거 (?? 등 인코딩 오류 문자)
    4. 날짜 형식 통일 (2026. 1. 1 -> 2026-01-01)
    5. 불필요한 공백 및 과도한 줄바꿈 정리
    6. 글자 수 검증 (기준 미달 시 None 반환)
    """
    if not isinstance(text, str):
        return None

    # 1. 멘션 제거
    text = re.sub(r'@\S+', '', text)

    # 2. Mattermost 이모지 제거
    text = re.sub(r':[a-zA-Z0-9_+\-\\]+:', '', text)

    # 3. 깨진 문자(??) 제거
    text = text.replace('??', '')

    # 4. 날짜/시간 형식 정제
    def date_replacer(match):
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
    
    text = re.sub(r'(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})', date_replacer, text)

    # 5. 공백 및 줄바꿈 정리
    text = re.sub(r' +', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    text = text.strip()

    # 6. 글자 수 필터링 (정제된 본문 기준)
    if len(text) < min_length:
        return None
        
    return text

def filter_and_clean_posts(df_post, min_length=30, display_limit=100):
    """
    [Step 3: 정제 및 프리뷰 생성 메인 함수]
    'content'는 마크다운을 유지하며 정제하고,
    'display_content'는 마크다운을 제거하여 100자 이하로 생성합니다.
    """
    df = df_post.copy()
    
    initial_count = len(df)
    print(f"   [Cleaner] 정제 시작: {initial_count}건")

    # 1. 상세 보기용 본문 정제 (마크다운 유지)
    df['content'] = df['content'].apply(lambda x: clean_text_body(x, min_length))
    
    # 유효하지 않은 데이터(글자 수 미달 등) 제거
    df = df.dropna(subset=['content'])
    
    # 2. 목록용 프리뷰 생성 (마크다운 제거 + 100자 제한)
    def create_display_text(txt):
        # 마크다운 태그 제거
        plain_text = strip_markdown(txt)
        # varchar(100) 제약에 맞춰 "..." 포함 100자 컷
        if len(plain_text) > display_limit:
            return plain_text[:display_limit-3].strip() + "..."
        return plain_text

    df['display_content'] = df['content'].apply(create_display_text)
    
    print(f"   [Cleaner] 완료: {len(df)}건 (삭제됨: {initial_count - len(df)}건)")
    
    return df