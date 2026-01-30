import os
import sys
import urllib.parse
from sqlalchemy import create_engine
from dotenv import load_dotenv

# [설정] 프로젝트 루트의 .env 로드
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(CURRENT_DIR, ".env"))

# 환경변수 가져오기
DB_USER = os.getenv("DB_USER")
DB_PW = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# 비밀번호에 포함된 특수 문자(@ 등) 처리를 위한 URL 인코딩
# 인코딩하지 않을 경우 DB 접속 URL 해석 오류가 발생할 수 있음
safe_password = urllib.parse.quote_plus(DB_PW) if DB_PW else ""

# PostgreSQL 연결을 위한 DB_URL 생성
DB_URL = f"postgresql+psycopg2://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_db_engine():
    """SQLAlchemy 엔진 생성 (커넥션 풀 설정 포함)"""
    return create_engine(
        DB_URL, 
        pool_size=10, 
        max_overflow=20, 
        pool_pre_ping=True
    )

# 전역 엔진 객체 (애플리케이션 전역에서 재사용)
engine = get_db_engine()