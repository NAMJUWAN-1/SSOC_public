import aiohttp
import asyncio
import requests
import os
from dotenv import load_dotenv

# ==========================================
# 1. 설정 (.env 로드)
# ==========================================

# 현재 파일(modules/mm_validator.py)의 부모 폴더(SSOC_AI)를 찾아 .env 로드
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR) # modules/ 상위 폴더
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
else:
    # 파일 경로를 못 찾으면 기본 로드 시도
    load_dotenv()

# 환경변수에서 값 가져오기
MM_API_URL = os.getenv("MM_API_URL")
MM_LOGIN_URL = os.getenv("MM_LOGIN_URL")
MM_USER_ID = os.getenv("MM_USER_ID")
MM_USER_PW = os.getenv("MM_USER_PW")
MM_AUTH_TOKEN = os.getenv("MM_AUTH_TOKEN") # 봇 토큰 (없으면 None)

# 토큰 캐싱용 전역 변수 (우선순위: .env 토큰 -> 없으면 로그인해서 획득)
cached_token = MM_AUTH_TOKEN

# ==========================================
# 2. 토큰 발급 로직 (로그인)
# ==========================================
def get_auth_token():
    """
    내 백엔드에 로그인하여 MM 접근용 토큰을 받아옵니다.
    """
    global cached_token
    
    # 이미 캐싱된 토큰이 있으면 반환
    if cached_token:
        return cached_token

    # 로그인 정보가 없으면 불가
    if not MM_LOGIN_URL or not MM_USER_ID or not MM_USER_PW:
        return None

    try:
        response = requests.post(
            MM_LOGIN_URL, 
            json={"login_id": MM_USER_ID, "password": MM_USER_PW},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            # 응답 구조에 따라 수정 (token 또는 access_token)
            token = data.get("access_token") or data.get("token")
            
            if token:
                # print("🔑 토큰 발급 성공")
                cached_token = token
                return token
        
        # print(f"❌ 토큰 발급 실패: {response.status_code}")
        return None
    except Exception as e:
        print(f"❌ 로그인 서버 에러: {e}")
        return None

# ==========================================
# 3. 유효성 검사 로직 (비동기)
# ==========================================
async def check_single_msg(session, mm_post_id, token):
    """
    API를 찔러서 404가 뜨는지 확인합니다.
    """
    url = f"{MM_API_URL}/posts/{mm_post_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with session.get(url, headers=headers, timeout=5) as resp:
            # [판별 핵심 로직]
            if resp.status == 200:
                return mm_post_id, True  # 살아있음
            elif resp.status == 404:
                return mm_post_id, False # 삭제됨 (Link Invalid)
            elif resp.status == 401:
                return mm_post_id, None  # 토큰 만료 (재시도 필요)
            else:
                return mm_post_id, True  # 기타 에러는 생존 처리
    except:
        return mm_post_id, True

async def validate_batch_async(mm_post_ids):
    # 1. 토큰 가져오기
    token = get_auth_token()
    
    # 토큰이 없으면 검사 불가 -> 모두 True 처리 (안전장치)
    if not token:
        return {mid: True for mid in mm_post_ids}

    # 2. 비동기 병렬 요청
    async with aiohttp.ClientSession() as session:
        tasks = [check_single_msg(session, mid, token) for mid in mm_post_ids]
        results = await asyncio.gather(*tasks)
    
    # 결과 처리 (None인 경우 True로 간주)
    final_results = {}
    for mid, status in results:
        final_results[mid] = True if status is None else status

    return final_results

# ==========================================
# 4. 외부 호출용 함수
# ==========================================
def validate_messages(mm_post_ids):
    """
    [Input]  ['id1', 'id2', ...]
    [Output] {'id1': True, 'id2': False}
    """
    if not mm_post_ids: return {}
    
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            return {mid: True for mid in mm_post_ids}
        else:
            return loop.run_until_complete(validate_batch_async(mm_post_ids))
    except:
        return {mid: True for mid in mm_post_ids}