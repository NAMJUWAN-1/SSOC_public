# [Step 1: 병합] 
# post_raw 데이터를 입력받아 채널/작성자/시간(2분) 기준으로 메시지를 병합함

import pandas as pd
from datetime import timedelta


def merge_messages(df):
    # 원본 데이터 보존을 위해 복사
    df = df.copy()
    
    # 1. 정렬 (채널 -> 작성자 -> 시간 순)
    df = df.sort_values(by=['channel_id', 'author_username', 'posted_at']).reset_index(drop=True)
    
    # 2. 그룹핑 조건 계산
    # 같은 채널, 같은 작성자 내에서 이전 메시지와의 시간 차이 계산
    df['time_diff'] = df.groupby(['channel_id', 'author_username'])['posted_at'].diff()
    
    # 새 그룹 시작 조건: 시간 차이가 2분을 넘거나, 첫 메시지라 시간 차이가 없을 때(NaT)
    cond_new_group = (df['time_diff'] > timedelta(minutes=2)) | (df['time_diff'].isna())
    
    # 3. 그룹 ID 부여 (누적 합으로 고유 번호 생성)
    # 이 ID가 곧 나중에 FK로 사용될 식별자입니다.
    df['temp_group_id_fk'] = cond_new_group.cumsum()
    
    # 4. 그룹별 데이터 집계
    # 'first'는 그룹 내 첫 번째 값을 의미
    df_post = df.groupby('temp_group_id_fk', as_index=False).agg(
        temp_group_id=('temp_group_id_fk', 'first'),       # 그룹 ID (-> 추후 post_id)
        channel_id=('channel_id', 'first'),                 # 채널 ID
        content=('raw_content', lambda x: "\n".join(x.astype(str))), # [1차 병합] 정제 전 텍스트
        posted_at=('posted_at', 'first'),                   # 게시글 생성일 (첫 메시지 기준)
        mm_post_id=('mm_post_id', 'first'),                 # 링크 생성을 위한 메시지 ID
        author_username=('author_username', 'first'),        # 작성자
        board_name=('board_name', 'first'),
        channel_name=('channel_name', 'first')
    )
    
    # 5. 스키마 맞추기 (빈 컬럼 생성)
    df_post['category_id'] = None
    df_post['ai_title'] = None
    df_post['start_at'] = None
    df_post['end_at'] = None

    # 6. 컬럼 순서 정리 (ERD post 테이블 순서 반영)
    cols = ['temp_group_id', 'category_id', 'channel_id', 'ai_title', 'content', 
            'posted_at', 'start_at', 'end_at', 'author_username', 'mm_post_id', 'board_name', 'channel_name']
    df_post = df_post[cols]

    return df_post, df


# df_post에 author_username 컬럼이 있는 이유
# : 지금은 아니지만, 나중에 "관리자(admin)가 쓴 글만 공지로 인정한다" 같은 필터링 로직이 추가될 수도 있습니다.