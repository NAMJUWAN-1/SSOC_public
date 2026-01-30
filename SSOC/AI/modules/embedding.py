import os
import requests
import json
import pandas as pd
from sqlalchemy import text
from dotenv import load_dotenv
import sys


# ==========================================
# 1. 설정
# ==========================================

# 프로젝트 루트 경로 설정 및 DB 엔진 로드
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.append(PROJECT_ROOT)

from database import engine
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

# API 설정
API_KEY = os.getenv("GMS_API_KEY")
API_URL = os.getenv("GMS_EMBEDDING_URL")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# 유사도 거리 임계값 (Cosine Distance)
THRESHOLD_CLASSIFICATION = 0.5  # 카테고리 분류용
THRESHOLD_SEARCH = 0.7          # 검색용


# ==========================================
# 2. 임베딩 및 벡터 서치 
# ==========================================

# 텍스트를 1536차원 벡터로 변환 (GMS API)
def get_embedding(text_input):
    if not text_input or not API_KEY or not API_URL:
        return None

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {
        "model": EMBEDDING_MODEL,
        "input": text_input.replace("\n", " ")
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            return response.json()['data'][0]['embedding']
    except Exception as e:
        print(f"임베딩 생성 실패: {e}")
    return None


# 카테고리 테이블에 벡터가 없는 항목을 찾아 채움 (초기 1회성)
def sync_category_vectors():
    try:
        query = "SELECT category_id, category_name FROM category WHERE embedding_vector IS NULL"
        df = pd.read_sql(query, engine)
        
        if df.empty: return

        print(f"카테고리 벡터 동기화 중 ({len(df)}건)...")
        with engine.begin() as conn:
            for _, row in df.iterrows():
                vector = get_embedding(row['category_name'])
                if vector:
                    conn.execute(text("""
                        UPDATE category SET embedding_vector = :vec WHERE category_id = :id
                    """), {"vec": str(vector), "id": row['category_id']})
    except Exception as e:
        print(f"카테고리 벡터 동기화 에러: {e}")


# [pgvector 활용] DB 내에서 코사인 거리가 가장 가까운 카테고리 검색
def classify_category(content_vector, board_name, channel_name, threshold=THRESHOLD_CLASSIFICATION):
    if content_vector is None: return None, None
    
    sync_category_vectors() 

    try:
        query = text("""
            SELECT 
                cat.category_id, 
                cat.category_name, 
                (cat.embedding_vector <=> :vec) AS distance
            FROM category cat
            JOIN channel c ON cat.channel_id = c.channel_id
            JOIN board b ON c.board_id = b.board_id
            WHERE b.board_name = :bn AND c.channel_name = :cn
              AND cat.embedding_vector IS NOT NULL
            ORDER BY distance ASC
            LIMIT 1
        """)
        
        with engine.connect() as conn:
            res = conn.execute(query, {
                "vec": str(content_vector), 
                "bn": board_name, 
                "cn": channel_name
            }).fetchone()
            
            if res and res.distance <= threshold:
                return res.category_id, res.category_name
                
    except Exception as e:
        print(f"pgvector 검색 실패: {e}")
    
    return None, None