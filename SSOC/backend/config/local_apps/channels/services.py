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

    # 최적화: 1단계 - unique team_id 수집
    unique_team_ids = set()
    for ch_data in channels_data:
        mm_team_id = ch_data.get("team_id")
        if mm_team_id:
            unique_team_ids.add(mm_team_id)
    
    # 최적화: 2단계 - DB에서 이미 mm_board_id가 채워진 Board 조회
    existing_boards = Board.objects.filter(
        mm_team_id__in=unique_team_ids,
        mm_board_id__isnull=False  # 이미 정보가 있는 것만
    ).values_list('mm_team_id', flat=True)
    
    # 최적화: 3단계 - 아직 정보가 없는 team만 API 호출 (캐싱)
    from local_apps.oauth_accounts.mm_auth import fetch_team
    team_info_cache = {}
    
    for team_id in unique_team_ids:
        if team_id not in existing_boards:
            try:
                team_info = fetch_team(mm_token, team_id)
                team_info_cache[team_id] = {
                    "mm_board_id": team_info.get("name"),
                    "board_name": team_info.get("display_name")
                }
            except Exception as e:
                print(f"Failed to fetch team {team_id}: {e}")
                team_info_cache[team_id] = {
                    "mm_board_id": f"team-{team_id[:8]}",
                    "board_name": f"Team {team_id[:8]}"
                }

    # DB 트랜잭션 내에서 처리
    with transaction.atomic():
        for ch_data in channels_data:
            mm_channel_id = ch_data.get("id")
            mm_team_id = ch_data.get("team_id")
            channel_name = ch_data.get("display_name", ch_data.get("name"))
            channel_type = ch_data.get("type", "O")
            
            # Team ID가 없는 경우 스킵
            if not mm_team_id:
                continue

            # 1. Board 동기화 (캐시된 정보 또는 DB 기존값 사용)
            if mm_team_id in team_info_cache:
                # 새로 가져온 정보로 업데이트
                board, created = Board.objects.update_or_create(
                    mm_team_id=mm_team_id,
                    defaults=team_info_cache[mm_team_id]
                )
            else:
                # 이미 DB에 정보가 있으므로 조회만
                board, created = Board.objects.get_or_create(
                    mm_team_id=mm_team_id,
                    defaults={
                        "board_name": f"Team {mm_team_id[:8]}",
                        "mm_board_id": f"team-{mm_team_id[:8]}"
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
            UserInfo.objects.get_or_create(
                user=user,
                channel=channel,
                defaults={"status": True}
            )
            
    print(f"Successfully synced {len(channels_data)} channels for user {user.email}")
