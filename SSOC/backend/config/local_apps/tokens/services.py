from rest_framework_simplejwt.tokens import RefreshToken


def issue_token_pair_for_user(user) -> dict:
    # OAuth 로그인 성공 후 유저 기준 토큰 발급 -> refresh/access 문자열 생성
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}
