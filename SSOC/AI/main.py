import json
import os
import psycopg2
from fastapi import FastAPI, Request
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# 한국 시간(KST) 설정
KST = timezone(timedelta(hours=9))

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT")
    )

@app.post("/webhook")
async def handle_mattermost_webhook(request: Request):
    # 1. 인코딩 에러 방지 처리
    body = await request.body()
    try:
        decoded_body = body.decode('utf-8')
    except UnicodeDecodeError:
        decoded_body = body.decode('cp949')
    payload = json.loads(decoded_body)

    # 2. Mattermost 데이터 추출
    mm_channel_id = payload.get("channel_id") # MM의 문자열 ID (예: '7p89...')
    author_username = payload.get("user_name")
    mm_post_id = payload.get("post_id")
    raw_content = payload.get("text")
    
    # 3. 날짜 변환 및 타임존 적용
    raw_ts = payload.get("timestamp") or payload.get("create_at") or 0
    ts = raw_ts / 1000.0 if raw_ts > 10**12 else float(raw_ts)
    posted_at = datetime.fromtimestamp(ts, tz=KST)

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # [핵심] 4. channel 테이블에서 매핑되는 PK(bigint) 조회
        cur.execute(
            "SELECT channel_id FROM channel WHERE mm_channel_id = %s",
            (mm_channel_id,)
        )
        result = cur.fetchone()

        if not result:
            print(f"Error: Channel {mm_channel_id} not found in DB.")
            return {"status": "error", "message": "Channel mapping failed"}

        internal_channel_id = result[0] # 우리 DB의 bigint PK

        # 5. post_raw 테이블에 최종 저장
        insert_query = """
            INSERT INTO post_raw (channel_id, author_username, mm_post_id, raw_content, posted_at, update_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cur.execute(insert_query, (
            internal_channel_id,
            author_username,
            mm_post_id,
            raw_content,
            posted_at,
            posted_at
        ))

        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "internal_id": internal_channel_id}

    except Exception as e:
        print(f"DB Error: {e}")
        return {"status": "error", "message": str(e)}
