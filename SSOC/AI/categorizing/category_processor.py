"""
카테고리 최적화 프로세서
채널별 상태 진단 및 Track A/B 분기 처리
"""
import os
import logging
from typing import List, Dict
from dotenv import load_dotenv
from db_handler import DBHandler
from track_a import TrackAProcessor
from track_b import TrackBProcessor

load_dotenv()

class CategoryProcessor:
    """카테고리 최적화 메인 프로세서"""
    
    def __init__(self):
        self.db = DBHandler()
        self.api_key = os.getenv("GMS_KEY")
        
    def get_all_channel_ids(self) -> List[int]:
        """모든 채널 ID 조회"""
        query = "SELECT channel_id FROM channel"
        results = self.db.execute_query(query)
        return [row['channel_id'] for row in results]
    
    def process_channel(self, channel_id: int) -> Dict:
        """채널 상태 진단 후 Track A/B 분기 실행"""
        
        # 1단계: 채널 상태 진단
        channel_status = self._diagnose_channel(channel_id)
        
        if channel_status is None:
            logging.info(f"[SKIP] 채널 {channel_id} - 카테고리 없음")
            return {'status': 'skip', 'reason': 'No data'}
        
        logging.info(f"[DEBUG] 채널 {channel_id} 상태 - is_initial={channel_status['is_initial']}, post_count={channel_status['post_count']}, etc_ratio={channel_status['etc_ratio']:.2%}")
        
        # 2단계: 로직 분기
        # Track A: 초기화 로직 (카테고리가 '기타' 1개뿐 + 게시글 50개 이상)
        if channel_status['is_initial'] and channel_status['post_count'] >= 50:
            logging.info(f"[TRACK_A] 진입: 채널 {channel_id} (is_initial={channel_status['is_initial']}, post_count={channel_status['post_count']})")
            processor = TrackAProcessor(self.api_key, self.db)
            return processor.execute(channel_id)
        
        # Track B: 고도화 로직 (카테고리 여러 개 + 기타 비율 >= 20%)
        elif not channel_status['is_initial'] and channel_status['etc_ratio'] >= 0.20:
            logging.info(f"[TRACK_B] 진입: 채널 {channel_id} (etc_ratio={channel_status['etc_ratio']:.2%})")
            processor = TrackBProcessor(self.api_key, self.db)
            return processor.execute(channel_id)
        
        # Skip: 조건 미충족
        else:
            logging.info(f"[SKIP] 채널 {channel_id} - 조건 미충족")
            logging.info(f"  Track A: is_initial={channel_status['is_initial']}, post_count={channel_status['post_count']} (50개 이상 필요)")
            logging.info(f"  Track B: is_initial={channel_status['is_initial']} (여러 카테고리 필요), etc_ratio={channel_status['etc_ratio']:.2%} (20% 이상 필요)")
            return {'status': 'skip', 'reason': 'Conditions not met'}
    
    def _diagnose_channel(self, channel_id: int) -> Dict:
        """채널 상태 진단 (카테고리 구성 및 게시글 수 조회)"""
        
        # 카테고리 조회
        category_query = """
            SELECT category_id, category_name 
            FROM category 
            WHERE channel_id = %s
        """
        categories = self.db.execute_query(category_query, (channel_id,))
        
        logging.info(f"[DEBUG] 채널 {channel_id} - 카테고리 조회 결과: {categories}")
        
        if not categories:
            logging.info(f"[DEBUG] 채널 {channel_id} - 카테고리 없음")
            return None
        
        # 게시글 수 조회
        post_count_query = """
            SELECT COUNT(*) as total_count
            FROM post 
            WHERE channel_id = %s
        """
        total_posts = self.db.execute_query(post_count_query, (channel_id,))[0]['total_count']
        
        logging.info(f"[DEBUG] 채널 {channel_id} - 총 게시글 수: {total_posts}")
        
        # '기타' 카테고리 게시글 수 조회
        etc_category = next((c for c in categories if c['category_name'] == '기타'), None)
        etc_count = 0
        
        if etc_category:
            etc_query = """
                SELECT COUNT(*) as etc_count
                FROM post 
                WHERE category_id = %s
            """
            etc_count = self.db.execute_query(etc_query, (etc_category['category_id'],))[0]['etc_count']
            logging.info(f"[DEBUG] 채널 {channel_id} - 기타 카테고리 게시글 수: {etc_count}")
        else:
            logging.info(f"[DEBUG] 채널 {channel_id} - 기타 카테고리 없음")
        
        # 상태 반환
        is_initial = len(categories) == 1 and categories[0]['category_name'] == '기타'
        etc_ratio = etc_count / total_posts if total_posts > 0 else 0
        
        logging.info(f"[DEBUG] 채널 {channel_id} - is_initial: {is_initial}, post_count: {total_posts}, etc_ratio: {etc_ratio:.2%}")
        
        return {
            'is_initial': is_initial,
            'post_count': total_posts,
            'etc_count': etc_count,
            'etc_ratio': etc_ratio,
            'categories': categories,
        }