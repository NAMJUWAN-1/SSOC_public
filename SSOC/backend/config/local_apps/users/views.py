from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from local_apps.user_info.models import UserInfo


class UserDetailView(APIView):
    """
    현재 로그인한 사용자 정보 및 채널 목록 조회
    
    Endpoint: GET /api/user/me/
    Permission: IsAuthenticated (JWT Access Token 필요)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
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
                    "board_name": board.board_name,
                    "mm_team_id": board.mm_team_id,
                }
            })
            
        user_data["channels"] = channels_data
        
        return Response(user_data, status=status.HTTP_200_OK)
