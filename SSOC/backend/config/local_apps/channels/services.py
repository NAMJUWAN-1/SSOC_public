from django.conf import settings
from django.db import transaction

from local_apps.boards.models import Board
from local_apps.channels.models import Channel
from local_apps.user_info.models import UserInfo
from local_apps.users.models import User
from local_apps.oauth_accounts.mm_auth import fetch_user_channels


def sync_user_channels(user: User, mm_token: str, mm_user_id: str) -> None:
    """
    사용자의 Mattermost 채널 정보를 DB와 동기화
    
    Args:
        user: 동기화할 대상 User 객체
        mm_token: MM API 호출을 위한 세션 토큰
        mm_user_id: MM 측 user_id (oauth_account.provider_uid)
        
    Flow:
        1. MM API로 사용자가 속한 채널 목록 조회
        2. 각 채널의 team_id로 Board 조회 또는 생성 (Team = Board)
        3. 각 채널 정보로 Channel 조회 또는 생성
        4. User-Channel 매핑 (UserInfo) 생성 (없는 경우에만)
    """
    try:
        channels_data = fetch_user_channels(mm_token, mm_user_id)
    except Exception as e:
        # 채널 동기화 실패가 로그인 전체 실패로 이어지지 않도록 로그만 남기고 pass
        print(f"Failed to fetch MM channels: {e}")
        return

    # DB 트랜잭션 내에서 처리
    with transaction.atomic():
        for ch_data in channels_data:
            mm_channel_id = ch_data.get("id")
            mm_team_id = ch_data.get("team_id")
            channel_name = ch_data.get("display_name", ch_data.get("name"))
            channel_type = ch_data.get("type", "O") # O:Public, P:Private, D:Direct, G:Group
            
            # Team ID가 없는 경우(Direct Message 등)는 일단 스킵하거나 Default Board 처리
            # 여기서는 Team ID가 있는 경우만 Board로 매핑
            if not mm_team_id:
                continue

            # 1. Board 동기화 (MM Team -> Board)
            # board_name은 중복될 수 있으므로 unique 처리를 위해 mm_team_id랑 같이 고려해야 함
            # 현재 모델은 board_name이 unique이므로, 충돌 방지 로직 필요
            # 우선 간단히 team_id로 조회하고, 없으면 생성 시도
            
            board, created = Board.objects.get_or_create(
                mm_team_id=mm_team_id,
                defaults={
                    "board_name": f"Team {mm_team_id[:8]}" # 임시 이름 (실제 팀 이름 API 필요)
                }
            )
            
            # 2. Channel 동기화
            channel, created = Channel.objects.update_or_create(
                mm_channel_id=mm_channel_id,
                defaults={
                    "board": board,
                    "channel_name": channel_name,
                    "mm_channel_type": channel_type
                }
            )
            
            # 3. UserInfo (매핑) 동기화
            # 이미 존재하는 매핑이면 건너뜀
            UserInfo.objects.get_or_create(
                user=user,
                channel=channel,
                defaults={"status": True}
            )
            
    print(f"Successfully synced {len(channels_data)} channels for user {user.email}")
