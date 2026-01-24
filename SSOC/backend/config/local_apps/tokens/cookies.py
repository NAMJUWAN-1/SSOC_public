from django.conf import settings

REFRESH_COOKIE_NAME = "refresh_token"


def set_refresh_cookie(response, refresh_token: str, max_age_seconds: int):
    # HttpOnly 쿠키에 refresh 저장 -> JS 접근 차단으로 탈취 위험 완화
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=max_age_seconds,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/api/auth/",
    )


def clear_refresh_cookie(response):
    # 로그아웃/실패 시 잔여 쿠키 제거
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/auth/",
    )
