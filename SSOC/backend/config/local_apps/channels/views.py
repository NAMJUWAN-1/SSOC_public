from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from local_apps.channels.models import Channel
from local_apps.user_info.models import UserInfo


class ChannelListView(APIView):
    """
    채널 목록 조회
    
    Endpoint: GET /api/channels
    Permission: IsAuthenticated
    
    Query Parameters:
        - user_id (optional): 
          - 있으면: 해당 유저가 속한 채널 목록 반환
          - 없으면: 전체 채널 목록 반환
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request: Request) -> Response:
        user_id = request.GET.get("user_id")
        
        # 1. user_id 파라미터가 있는 경우: 특정 유저의 채널 목록 조회
        if user_id:
            try:
                target_user_id = int(user_id)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid user_id format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 권한 확인: 본인만 조회 가능 (관리자 허용 여부는 언급 없으므로 일단 본인만)
            if target_user_id != request.user.user_id and not request.user.is_staff:
                return Response(
                    {"error": "You can only access your own channel list."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # UserInfo를 통해 해당 유저의 채널 조회
            user_channels = UserInfo.objects.filter(
                user_id=target_user_id, 
                status=True
            ).select_related("channel", "channel__board")
            
            channels = [uc.channel for uc in user_channels]
            
        # 2. user_id가 없는 경우: 전체 채널 목록 조회 (관리자 전용)
        else:
            if not request.user.is_staff:
                 return Response(
                     {"error": "Admin permission required to view all channels."},
                     status=status.HTTP_403_FORBIDDEN
                 )
            channels = Channel.objects.select_related("board").all()
        
        # 응답 데이터 구성
        data = []
        for channel in channels:
            data.append({
                "channel_id": channel.channel_id,
                "channel_name": channel.channel_name,
                "mm_channel_id": channel.mm_channel_id,
                "type": channel.mm_channel_type,
                "board": {
                    "board_id": channel.board.board_id,
                    "mm_team_id": channel.board.mm_team_id,
                    "mm_board_id": channel.board.mm_board_id,
                    "board_name": channel.board.board_name,
                }
            })
            
        return Response(data, status=status.HTTP_200_OK)
