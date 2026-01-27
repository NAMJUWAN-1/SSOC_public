from django.db import models
from local_apps.boards.models import Board


class Channel(models.Model):
    """
    Mattermost Channel과 매핑되는 채널 모델
    
    Mattermost Channel → Channel
    - board_id (FK): 채널이 속한 보드 (MM Team)
    - mm_channel_id: MM channel_id 저장
    """
    channel_id = models.BigAutoField(primary_key=True, db_column="channel_id")
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name="channels",
        db_column="board_id",
    )
    # channel_name은 팀마다 중복될 수 있으므로 unique=True 제거
    channel_name = models.CharField(max_length=100, db_column="channel_name")
    
    # Mattermost Channel ID 저장 (MM과의 동기화용)
    mm_channel_id = models.CharField(max_length=26, unique=True, db_column="mm_channel_id")
    
    # MM channel type: O(Public), P(Private), D(Direct), G(Group)
    mm_channel_type = models.CharField(max_length=1, default='O', db_column="mm_channel_type")
    
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")
    
    class Meta:
        db_table = "channel"
    
    def __str__(self):
        return f"{self.board.board_name} - {self.channel_name}"
