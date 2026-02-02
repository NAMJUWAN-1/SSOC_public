import pandas as pd
from datetime import timedelta

def merge_messages(df):
    """
    [Step 2: 병합 로직]
    - 동일 채널, 동일 작성자가 2분 이내에 보낸 메시지들을 하나로 병합합니다.
    - 데이터 타입 강제 변환 및 문자열 정제를 통해 병합 누락을 방지합니다.
    - 그룹에 포함된 모든 원본 ID(post_raw_id)를 리스트로 수집하여 정확한 상태 업데이트를 보장합니다.
    """
    if df.empty:
        return df

    # 0. 데이터 전처리 및 클리닝 (병합 성공률 향상)
    df = df.copy()
    
    # 시간 데이터를 확실하게 datetime 객체로 변환 (연산 오류 방지)
    df['posted_at'] = pd.to_datetime(df['posted_at'])
    
    # 작성자 이름이나 ID에 공백이 섞여 병합이 안 되는 경우 방지
    if 'author_username' in df.columns:
        df['author_username'] = df['author_username'].astype(str).str.strip()
    if 'channel_id' in df.columns:
        df['channel_id'] = df['channel_id'].astype(str).str.strip()

    # 1. 정렬 (병합의 핵심 전제 조건)
    # 채널 -> 작성자 -> 시간 순서대로 정렬해야 연속된 메시지 판단이 가능함
    df = df.sort_values(by=['channel_id', 'author_username', 'posted_at']).reset_index(drop=True)
    
    # 2. 그룹 식별 (Time Difference 기반)
    # 동일 키(채널, 작성자) 내에서 '직전 메시지'와의 시간 차이 계산
    group_key = ['channel_id', 'author_username']
    time_diff = df.groupby(group_key)['posted_at'].diff()
    
    # 새 그룹 시작 조건 정의:
    # 1) 시간 차이가 2분을 넘거나 (> 2min)
    # 2) 해당 사용자의 첫 메시지라 시간 차이가 없을 때 (NaT)
    cond_new_group = (time_diff > timedelta(minutes=2)) | (time_diff.isna())
    
    # 3. 그룹 ID 부여
    # cumsum()을 통해 조건이 True일 때마다 그룹 번호를 1씩 증가시킴
    df['temp_group_id_fk'] = cond_new_group.cumsum()
    
    # 4. 그룹별 데이터 집계 (Aggregation)
    # x.tolist()를 사용하여 numpy 타입을 순수 파이썬 타입으로 변환 (DB 호환성)
    df_post = df.groupby('temp_group_id_fk', as_index=False).agg(
        # [핵심] 이 그룹에 포함된 모든 원본 post_raw_id 리스트 (중복 업데이트 방지용)
        raw_id_list=('post_raw_id', lambda x: x.tolist()),
        
        channel_id=('channel_id', 'first'),
        # 메시지 사이를 줄바꿈(\n)으로 연결하여 하나의 본문 생성
        content=('raw_content', lambda x: "\n".join(x.astype(str))),
        posted_at=('posted_at', 'first'),      # 공지 시작 시간 (그룹 내 첫 메시지)
        last_posted_at=('posted_at', 'last'), # 안전선 필터링 기준 시간 (그룹 내 마지막 메시지)
        
        # 메타데이터 보존
        mm_post_id=('mm_post_id', 'first'),
        author_username=('author_username', 'first'),
        board_name=('board_name', 'first'),
        channel_name=('channel_name', 'first')
    )
    
    # 5. 서비스 테이블(post) 스키마용 빈 컬럼 초기화
    # 이후 cleaner 및 ai_extractor 단계에서 채워질 데이터입니다.
    df_post['display_content'] = None
    df_post['category_id'] = None
    df_post['ai_title'] = None
    df_post['start_at'] = None 
    df_post['end_at'] = None           
    df_post['embedding_vector'] = None

    # 6. 컬럼 순서 정리 및 최종 반환
    cols = [
        'category_id', 'channel_id', 'ai_title', 'content', 
        'posted_at', 'start_at', 'end_at', 'embedding_vector', 'display_content',
        'author_username', 'mm_post_id', 'board_name', 'channel_name',
        'raw_id_list', 'last_posted_at'
    ]
    
    # 데이터프레임에 존재하는 컬럼만 선택하여 반환
    existing_cols = [c for c in cols if c in df_post.columns]
    
    return df_post[existing_cols]