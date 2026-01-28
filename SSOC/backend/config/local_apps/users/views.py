from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from local_apps.users.models import User
from local_apps.user_info.models import UserInfo


class UserDetailView(APIView):
    """
    사용자 정보 및 채널 목록 조회
    
    Endpoint: GET /api/users?user_id={user_id}
    Permission: IsAuthenticated (JWT Access Token 필요)
    
    Query Parameters:
        - user_id (required): 조회할 사용자 ID.
          본인의 user_id만 조회 가능 (다른 사용자 조회 시 403)
    
    Note:
        - GET /api/users (user_id 없이): 관리자 전용 전체 유저 목록 조회 (추후 구현 예정)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id=None):
        # 1. URL Path 파라미터가 없으면 Query Param에서 확인
        if user_id is None:
             user_id = request.GET.get('user_id')
        
        requested_user_id = user_id
        authenticated_user = request.user
        
        # user_id가 없는 경우: 전체 유저 목록 조회 (추후 구현)
        if requested_user_id is None:
            # 관리자 권한 체크
            if not authenticated_user.is_staff:
                return Response(
                    {"error": "Admin permission required for user list"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 추후 구현 예정
            return Response(
                {"message": "User list endpoint is not implemented yet"},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
        
        # user_id가 있는 경우: 특정 사용자 조회
        # 문자열을 정수로 변환 시도
        try:
            requested_user_id = int(requested_user_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid user_id format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 요청한 user_id가 현재 인증된 사용자와 다르면 403
        if requested_user_id != authenticated_user.user_id:
            return Response(
                {"error": "You can only access your own profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 조회 대상 사용자 (항상 인증된 사용자)
        user = authenticated_user
        
        # 1. 기본 사용자 정보
        user_data = {
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "nickname": user.nickname,
            "profile_image_url": user.profile_image_url,
        }
        
        # 2. 채널 정보 (UserInfo 테이블 조회)
        # 활성화된 채널만 조회
        user_channels = UserInfo.objects.filter(user=user, status=True).select_related('channel', 'channel__board')
        
        channels_data = []
        for uc in user_channels:
            channel = uc.channel
            board = channel.board
            channels_data.append({
                "channel_id": channel.channel_id,
                "channel_name": channel.channel_name,
                "mm_channel_id": channel.mm_channel_id,
                "type": channel.mm_channel_type,
                "board": {
                    "board_id": board.board_id,
                    "mm_team_id": board.mm_team_id,
                    "board_name": board.board_name,
                    "mm_board_id": board.mm_board_id,
                }
            })
            
        user_data["channels"] = channels_data
        
        return Response(user_data, status=status.HTTP_200_OK)

    def patch(self, request, user_id=None):
        # 1. URL Path 파라미터가 없으면 허용하지 않음 (Query Param 지원 X)
        if user_id is None:
             return Response(
                 {"error": "User ID must be provided in the URL path (e.g., /api/users/{id}/)"}, 
                 status=status.HTTP_405_METHOD_NOT_ALLOWED
             )
        authenticated_user = request.user
        
        # 1. 권한 검증
        if not user_id:
             return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user_id = int(user_id)
        except (ValueError, TypeError):
             return Response({"error": "Invalid user_id format"}, status=status.HTTP_400_BAD_REQUEST)

        if target_user_id != authenticated_user.user_id:
             return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
             
        # 2. 데이터 처리
        nickname = request.data.get('nickname')
        profile_image_url = request.data.get('profile_image_url')
        
        user = authenticated_user
        
        # 닉네임 변경 시 중복 체크 (본인 닉네임 포함, 이미 존재하면 무조건 에러)
        if nickname:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(nickname=nickname).exists():
                return Response({"error": "Nickname already exists"}, status=status.HTTP_409_CONFLICT)
            user.nickname = nickname
            
        if profile_image_url is not None:
            user.profile_image_url = profile_image_url
            
        user.save()
        
        return Response({
            "user_id": user.user_id,
            "nickname": user.nickname,
            "profile_image_url": user.profile_image_url
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, user_id=None):
        """
        회원 탈퇴 (Hard Delete)
        
        - 본인만 탈퇴 가능
        - Cascade delete: OAuthAccount, Token, Archive, Calendar, SearchLog, UserInfo
        - 연관된 모든 refresh token을 blacklist 처리
        """
        authenticated_user = request.user
        
        # 1. URL Path 파라미터 검증
        if user_id is None:
            return Response(
                {"error": "User ID must be provided in the URL path (e.g., /api/users/{id}/)"},
                status=status.HTTP_405_METHOD_NOT_ALLOWED
            )
        
        try:
            target_user_id = int(user_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid user_id format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2. 권한 검증 (본인만 삭제 가능)
        if target_user_id != authenticated_user.user_id:
            return Response(
                {"error": "You can only delete your own account"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(user_id=target_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 3. 모든 outstanding refresh token을 blacklist 처리
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        OutstandingToken.objects.filter(user_id=user.user_id).delete()
        
        # 4. User 삭제 (CASCADE로 연관 데이터 자동 삭제)
        # - OAuthAccount, UserInfo, SearchLog, Archive, CalendarEvent 등
        user.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class CheckNicknameView(APIView):
    """
    닉네임 중복 확인
    
    Endpoint: GET /api/users/check-nickname?nickname={nickname}
    Permission: IsAuthenticated
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        nickname = request.GET.get("nickname")
        
        if not nickname:
            return Response(
                {"error": "Nickname is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        is_exist = User.objects.filter(nickname=nickname).exists()
        
        return Response(
            {"available": not is_exist},
            status=status.HTTP_200_OK
        )
