import aiohttp
import asyncio
import os
import concurrent.futures
import requests
from dotenv import load_dotenv

# ==========================================
# 1. 설정 (.env 로드)
# ==========================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR) 
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

MM_API_URL = os.getenv("MM_API_URL", "https://meeting.ssafy.com/api/v4")
MM_USER_ID = os.getenv("MM_USER_ID")
MM_USER_PW = os.getenv("MM_USER_PW")
MM_AUTH_TOKEN = os.getenv("MM_AUTH_TOKEN")

# 토큰 캐시
cached_token = MM_AUTH_TOKEN

# ==========================================
# 2. Mattermost 로그인 (토큰 발급)
# ==========================================
def get_mattermost_token():
    """Mattermost에 직접 로그인하여 세션 토큰을 받아옵니다."""
    global cached_token
    
    # 이미 캐시된 토큰이 있으면 사용
    if cached_token:
        print(f"🔑 [Auth] 캐시된 토큰 사용")
        return cached_token
    
    if not MM_USER_ID or not MM_USER_PW:
        print(f"⚠️ [Auth] MM_USER_ID 또는 MM_USER_PW가 .env에 설정되지 않았습니다!")
        return None
    
    print(f"🔑 [Auth] Mattermost 로그인 시도 중...")
    
    try:
        # Mattermost API에 직접 로그인
        login_url = f"{MM_API_URL}/users/login"
        response = requests.post(
            login_url,
            json={"login_id": MM_USER_ID, "password": MM_USER_PW},
            timeout=10
        )
        
        if response.status_code == 200:
            # 응답 헤더에서 토큰 추출
            token = response.headers.get("Token")
            if token:
                cached_token = token
                print(f"✅ [Auth] Mattermost 로그인 성공! 토큰 발급됨 (길이: {len(token)})")
                return token
            else:
                print(f"⚠️ [Auth] 로그인 성공했으나 토큰이 헤더에 없습니다.")
                print(f"🔍 [Auth] 응답 헤더: {dict(response.headers)}")
                return None
        else:
            print(f"❌ [Auth] 로그인 실패 - 상태 코드: {response.status_code}")
            print(f"🔍 [Auth] 응답: {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"❌ [Auth] 로그인 에러: {e}")
        import traceback
        traceback.print_exc()
        return None

# ==========================================
# 3. 유효성 검사 로직 (비동기)
# ==========================================
async def check_single_msg_by_api(session, mm_board_id, mm_post_id, token):
    """API 엔드포인트로 메시지 존재 여부를 확인합니다."""
    url = f"{MM_API_URL}/posts/{mm_post_id}"
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        async with session.get(url, headers=headers, timeout=5) as resp:
            if resp.status == 200:
                try:
                    data = await resp.json()
                    delete_at = data.get('delete_at', 0)
                    
                    if delete_at != 0:
                        print(f"🗑️ 삭제된 메시지: {mm_post_id}")
                        return mm_post_id, False
                    else:
                        return mm_post_id, True
                except:
                    return mm_post_id, True
            elif resp.status == 404:
                print(f"🗑️ 삭제된 메시지: {mm_post_id}")
                return mm_post_id, False
            elif resp.status == 401:
                # 토큰 만료 시 캐시 초기화
                global cached_token
                cached_token = None
                return mm_post_id, None
            else:
                return mm_post_id, True
    except Exception as e:
        return mm_post_id, True

async def validate_batch_async(post_data_list):
    """
    post_data_list: [{'mm_board_id': 'xxx', 'mm_post_id': 'yyy'}, ...]
    """
    # 토큰 발급
    token = get_mattermost_token()
    if not token:
        print(f"⚠️ 토큰 발급 실패 - 모든 메시지를 유효로 간주")
        return {item['mm_post_id']: True for item in post_data_list}
    
    # API 엔드포인트로 접근
    async with aiohttp.ClientSession() as session:
        tasks = [
            check_single_msg_by_api(session, item['mm_board_id'], item['mm_post_id'], token) 
            for item in post_data_list
        ]
        results = await asyncio.gather(*tasks)
    
    # 401 에러가 있으면 재시도
    retry_needed = any(status is None for _, status in results)
    if retry_needed:
        print(f"🔄 토큰 만료 - 재로그인 후 재시도")
        token = get_mattermost_token()
        if token:
            async with aiohttp.ClientSession() as session:
                retry_tasks = [
                    check_single_msg_by_api(session, item['mm_board_id'], item['mm_post_id'], token)
                    for item in post_data_list
                ]
                results = await asyncio.gather(*retry_tasks)
    
    final_results = {}
    for mm_post_id, status in results:
        final_results[mm_post_id] = True if status is None else status
    return final_results

# ==========================================
# 4. 외부 호출용 함수 (루프 충돌 방지 로직)
# ==========================================
def validate_messages(post_data_list):
    """
    루프가 실행 중인 경우와 아닌 경우를 모두 대응하여 반드시 결과를 반환합니다.
    
    Args:
        post_data_list: [{'mm_board_id': 'xxx', 'mm_post_id': 'yyy'}, ...]
    """
    if not post_data_list: return {}
    
    try:
        loop = None
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        # 루프가 이미 실행 중인 경우
        if loop.is_running():
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, validate_batch_async(post_data_list))
                result = future.result()
                return result
        else:
            result = loop.run_until_complete(validate_batch_async(post_data_list))
            return result
            
    except Exception as e:
        print(f"❌ 검증 오류: {e}")
        # 오류 시 모든 데이터를 일단 살려둠 (유실 방지용)
        return {item['mm_post_id']: True for item in post_data_list}