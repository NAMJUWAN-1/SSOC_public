from django.conf import settings
from rest_framework import status
# from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .cookies import REFRESH_COOKIE_NAME, set_refresh_cookie, clear_refresh_cookie

# CBV 기반 뷰
class CookieTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # refresh는 쿠키 기반으로만 처리 / refresh 쿠키 없으면 401
        refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh:
            return Response({"detail": "No refresh cookie."}, status=status.HTTP_401_UNAUTHORIZED)

        # SimpleJWT 로직 재사용 / refresh 검증 후 access(+새 refresh) 발급
        serializer = TokenRefreshSerializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        resp = Response({"access": data["access"]}, status=status.HTTP_200_OK)

        # refresh 회전이 켜져 있으면 새 refresh를 쿠키로 갱신하여 refresh 쿠키 업데이트
        new_refresh = data.get("refresh")
        if new_refresh:
            max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
            set_refresh_cookie(resp, new_refresh, max_age_seconds=max_age)

        return resp


class LogoutView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # 서버에서 refresh 무효화가 필요할 경우 blacklist 후 쿠키 삭제
        refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
        resp = Response(status=status.HTTP_204_NO_CONTENT)

        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                # 만료/이미 무효화 등은 결과적으로 로그아웃과 동일하기 때문에 Exception 무시
                pass

        clear_refresh_cookie(resp)
        return resp

# FBV 기반 뷰
# @api_view(["POST"])
# def refresh_view(request):
#     # refresh는 쿠키 기반으로만 처리 / refresh 쿠키 없으면 401
#     refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
#     if not refresh:
#         return Response({"detail": "No refresh cookie."}, status=status.HTTP_401_UNAUTHORIZED)
#
#     # SimpleJWT 로직 재사용 / refresh 검증 후 access(+새 refresh) 발급
#     serializer = TokenRefreshSerializer(data={"refresh": refresh})
#     serializer.is_valid(raise_exception=True)
#     data = serializer.validated_data
#
#     resp = Response({"access": data["access"]}, status=status.HTTP_200_OK)
#
#     # refresh 회전이 켜져 있으면 새 refresh를 쿠키로 갱신하여 refresh 쿠키 업데이트
#     new_refresh = data.get("refresh")
#     if new_refresh:
#         max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
#         set_refresh_cookie(resp, new_refresh, max_age_seconds=max_age)
#
#     return resp
#
#
# @api_view(["POST"])
# def logout_view(request):
#     # 서버에서 refresh 무효화가 필요할 경우 blacklist 후 쿠키 삭제
#     refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
#     resp = Response(status=status.HTTP_204_NO_CONTENT)
#
#     if refresh:
#         try:
#             token = RefreshToken(refresh)
#             token.blacklist()
#         except Exception:
#             # 만료/이미 무효화 등은 결과적으로 로그아웃과 동일하기 때문에 Exception 무시
#             pass
#
#     clear_refresh_cookie(resp)
#     return resp
