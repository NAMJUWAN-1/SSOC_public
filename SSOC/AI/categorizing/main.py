"""
월간 카테고리 자동 최적화 메인 실행 스크립트
Airflow 없이 직접 실행 가능
"""
import os
import logging
from datetime import datetime
from category_processor import CategoryProcessor

# logs 폴더 생성
LOG_DIR = 'logs'
os.makedirs(LOG_DIR, exist_ok=True)

# 로깅 설정
log_filename = os.path.join(LOG_DIR, f'category_optimization_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logging.info(f"[LOG] 로그 파일: {log_filename}")

def main():
    """메인 실행 함수"""
    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║                  월간 카테고리 자동 최적화 시스템                           ║
║                     Powered by Gemini 2.0 Flash                           ║
╚════════════════════════════════════════════════════════════════════════════╝
    """)
    
    start_time = datetime.now()
    logging.info(f"[START] 카테고리 최적화 시작: {start_time}")
    
    try:
        # 프로세서 초기화
        processor = CategoryProcessor()
        
        # 1. 모든 채널 ID 조회
        logging.info("[FETCH] 채널 목록 조회 중...")
        channel_ids = processor.get_all_channel_ids()
        logging.info(f"[SUCCESS] 총 {len(channel_ids)}개 채널 발견")
        
        # 결과 집계용
        results = {
            'total': len(channel_ids),
            'success': 0,
            'failed': 0,
            'skipped': 0,
            'track_a': 0,
            'track_b': 0,
            'new_categories': 0,
        }
        
        # 2. 각 채널 처리
        for idx, channel_id in enumerate(channel_ids, 1):
            logging.info(f"\n{'='*80}")
            logging.info(f"채널 처리 중 [{idx}/{len(channel_ids)}]: channel_id={channel_id}")
            logging.info(f"{'='*80}")
            
            try:
                result = processor.process_channel(channel_id)
                
                # 결과 집계
                status = result.get('status')
                if status == 'success':
                    results['success'] += 1
                    results['new_categories'] += result.get('new_categories', 0)
                    if result.get('track') == 'A':
                        results['track_a'] += 1
                    elif result.get('track') == 'B':
                        results['track_b'] += 1
                elif status == 'skip':
                    results['skipped'] += 1
                else:
                    results['failed'] += 1
                
                logging.info(f"[SUCCESS] 채널 {channel_id} 처리 완료: {result}")
                
            except Exception as e:
                results['failed'] += 1
                logging.error(f"[ERROR] 채널 {channel_id} 처리 실패: {str(e)}")
        
        # 3. 최종 결과 출력
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"\n{'='*80}")
        print("[SUMMARY] 최종 결과 요약")
        print(f"{'='*80}")
        print(f"[TIME] 소요 시간: {duration:.1f}초 ({duration/60:.1f}분)")
        print(f"[TOTAL] 총 채널: {results['total']}개")
        print(f"[SUCCESS] 성공: {results['success']}개")
        print(f"[SKIP] 스킵: {results['skipped']}개")
        print(f"[FAIL] 실패: {results['failed']}개")
        print(f"\n[TRACK_A] 초기화: {results['track_a']}개")
        print(f"[TRACK_B] 고도화: {results['track_b']}개")
        print(f"[CATEGORIES] 생성된 카테고리: {results['new_categories']}개")
        print(f"{'='*80}\n")
        
        logging.info(f"[COMPLETE] 카테고리 최적화 완료: {end_time}")
        
    except Exception as e:
        logging.error(f"[FATAL] 전체 프로세스 실패: {str(e)}")
        
    except Exception as e:
        logging.error(f"❌ 전체 프로세스 실패: {str(e)}")
        raise

if __name__ == "__main__":
    main()