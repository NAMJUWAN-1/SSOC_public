"""
Mattermost REST API 로그인 뷰

Endpoints:
- POST /api/auth/mm/login/ : MM 로그인 (login_id/password → JWT 발급)
"""

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .mm_auth import login_to_mattermost, fetch_mm_userinfo
from .services import (
    get_or_create_user_from_mm,
    issue_refresh_cookie_and_store_in_db,
)


from local_apps.channels.services import sync_user_channels


class MattermostLoginView(APIView):
    """
    Mattermost 로그인 엔드포인트 (REST API 기반)
    
    Request:
        POST /api/auth/mm/login/
        {
            "login_id": "username 또는 email",
            "password": "비밀번호"
        }
    
    Response (성공):
        200 OK
        {
            "access": "eyJ..."
        }
        Set-Cookie: refresh_token=...; HttpOnly; Path=/api/auth/
    
    Response (실패):
        400 Bad Request - login_id/password 누락
        401 Unauthorized - MM 로그인 실패 (인증 오류)
        500 Internal Server Error - 서버 에러
    
    Flow:
        1. MM 로그인 API 호출 (login_id/password)
        2. MM 세션 토큰으로 userinfo 조회
        3. User/OAuthAccount 생성 또는 연결 (기존 로직 재사용)
        4. 채널 정보 동기화 (Board/Channel/UserInfo)
        5. JWT access/refresh 발급 (refresh는 HttpOnly 쿠키)
    """
    authentication_classes = []  # 인증 불필요 (로그인 엔드포인트)
    permission_classes = []

    def post(self, request: Request) -> Response:
        # 1) Request body에서 login_id/password 추출
        login_id = request.data.get("login_id")
        password = request.data.get("password")

        if not login_id or not password:
            return Response(
                {"detail": "login_id and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 2) MM 로그인 API 호출 → 세션 토큰 + 사용자 정보 발급 (효율성 개선)
            mm_token, userinfo = login_to_mattermost(login_id, password)

            # 3) User/OAuthAccount 생성 또는 기존 연결 (기존 서비스 로직 재사용)
            user = get_or_create_user_from_mm(userinfo)
            
            # 4) 채널 정보 동기화 (비동기로 처리하면 좋지만, 일단 동기로 처리)
            # mm_user_id는 oauth_account에서 가져오거나 userinfo["id"] 사용
            mm_user_id = userinfo.get("id")
            if mm_user_id:
                sync_user_channels(user, mm_token, mm_user_id)

            # 5) JWT access/refresh 발급 (refresh는 HttpOnly 쿠키로 세팅)
            response = Response(status=status.HTTP_200_OK)
            tokens = issue_refresh_cookie_and_store_in_db(user=user, response=response)

            # 6) access 토큰은 JSON 응답으로 전달 (프론트에서 메모리 저장)
            response.data = {"access": tokens["access"]}
            return response

        except Exception as e:
            # MM 로그인 실패 (401), userinfo 조회 실패 등
            # 실제 운영에서는 에러 타입별로 분기 처리 권장
            error_message = str(e)
            
            # requests.HTTPError인 경우 상태 코드 추출
            if hasattr(e, 'response') and hasattr(e.response, 'status_code'):
                status_code = e.response.status_code
                if status_code == 401:
                    return Response(
                        {"detail": "Mattermost login failed: Invalid credentials"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
            
            return Response(
                {"detail": f"Login failed: {error_message}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
