import re
import pandas as pd

def clean_text_body(text, min_length=30):
    """
    [본문 정제 및 검증 로직]
    1. 멘션 제거 (@all, @name 등 문장 내 모든 멘션)
    2. 이모지 제거 (:smile:, :round_pushpin: 등)
    3. 날짜 형식 통일 (2026. 1. 1 -> 2026-01-01)
    4. 불필요한 공백 및 과도한 줄바꿈 정리
    5. 글자 수 검증 (기준 미달 시 None 반환)
    """
    if not isinstance(text, str):
        return None

    # 1. 멘션 제거
    # 문장 맨 앞뿐만 아니라 중간에 있는 멘션도 제거 (@아이디)
    text = re.sub(r'@\S+', '', text)

    # 2. Mattermost 이모지 제거
    # :콜론:으로 감싸진 영문/숫자/_ 패턴 제거
    text = re.sub(r':[a-zA-Z0-9_+\-\\]+:', '', text)

    # 3. 날짜/시간 형식 정제
    # "2026. 1. 1" 또는 "2026.01.01" -> "2026-01-01"
    def date_replacer(match):
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
    
    # 정규식 설명: 숫자4자리 + 점 + (공백) + 숫자1~2자리 + 점 + (공백) + 숫자1~2자리
    text = re.sub(r'(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})', date_replacer, text)

    # 4. 공백 및 줄바꿈 정리
    # 연속된 공백 -> 한 칸 공백
    text = re.sub(r' +', ' ', text)
    # 3개 이상의 연속 줄바꿈 -> 2개 (문단 구분용)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    text = text.strip()

    # 5. 글자 수 필터링 (통합)
    # 정제가 끝난 최종 텍스트의 길이가 기준보다 짧으면 None 반환 -> 후속 단계에서 제거됨
    if len(text) < min_length:
        return None
        
    return text

def filter_and_clean_posts(df_post, min_length=30):
    """
    [Step 2: 정제 및 필터링 메인 함수]
    병합된 Post 데이터를 받아 내용을 정제하고(Step 1~5),
    유효하지 않은(None) 데이터를 제거하여 반환합니다.
    """
    # 원본 데이터 보호를 위해 복사
    df = df_post.copy()
    
    initial_count = len(df)
    print(f"   [Cleaner] 정제 전 데이터: {initial_count}건")

    # 1~5. 텍스트 정제 및 필터링 일괄 적용
    # clean_text_body 함수에서 기준 미달 시 None을 반환하므로,
    # 별도의 길이 계산이나 필터링 로직 없이 apply -> dropna로 한 번에 처리가 가능합니다.
    df['content'] = df['content'].apply(lambda x: clean_text_body(x, min_length))
    
    # 유효하지 않은 데이터(None = 글자 수 미달) 제거
    df_filtered = df.dropna(subset=['content'])
    
    # 로그 출력
    filtered_count = initial_count - len(df_filtered)
    print(f"   [Cleaner] 정제 후 데이터: {len(df_filtered)}건 (삭제됨: {filtered_count}건 / 기준: {min_length}자)")
    
    return df_filtered