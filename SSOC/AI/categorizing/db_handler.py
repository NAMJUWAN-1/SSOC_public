"""
데이터베이스 핸들러
PostgreSQL 연결 및 쿼리 실행 관리
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class DBHandler:
    """PostgreSQL 데이터베이스 핸들러"""
    
    def __init__(self):
        self.config = {
            'host': os.getenv('DB_HOST'),
            'port': os.getenv('DB_PORT', 5432),
            'database': os.getenv('DB_NAME'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
        }
    
    @contextmanager
    def get_connection(self):
        """DB 커넥션 컨텍스트 매니저 (자동 커밋/롤백)"""
        conn = psycopg2.connect(**self.config)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """SELECT 쿼리 실행"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
    
    def execute_insert(self, query: str, params: tuple) -> int:
        """INSERT 쿼리 실행 (생성된 ID 반환)"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()[0]
    
    def execute_update(self, query: str, params: tuple) -> int:
        """UPDATE 쿼리 실행 (영향받은 행 수 반환)"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.rowcount
    
    def execute_batch_update(self, query: str, params_list: List[tuple]) -> int:
        """배치 UPDATE 실행"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.executemany(query, params_list)
                return cursor.rowcount
