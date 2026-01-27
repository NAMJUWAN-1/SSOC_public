from django.db import models


class Board(models.Model):
    """
    Mattermost Team과 매핑되는 보드 모델
    
    Mattermost Team(팀) → Board (보드)
    - team_id를 저장하여 MM Team과 1:1 매핑
    """
    board_id = models.BigAutoField(primary_key=True, db_column="board_id")
    # 팀 이름(Display Name) 저장
    board_name = models.CharField(max_length=100, db_column="board_name")
    
    # Mattermost Team ID (GUID) 저장 (MM과의 동기화용 Primary Key 역할)
    mm_team_id = models.CharField(max_length=26, unique=True, null=True, blank=True, db_column="mm_team_id")

    # Mattermost Team Name (slug) 저장 (예: s14p01b01)
    mm_board_id = models.CharField(max_length=100, null=True, blank=True, db_column="mm_board_id")
    
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")
    
    class Meta:
        db_table = "board"
    
    def __str__(self):
        return self.board_name
