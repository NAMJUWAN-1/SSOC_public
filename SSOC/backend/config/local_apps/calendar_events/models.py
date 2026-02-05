from django.db import models
from local_apps.users.models import User

class CalendarEvent(models.Model):
    """
    캘린더 이벤트 테이블 (calendar_event)
    사용자별 일정 관리 (ERD 기준)
    """
    
    calendar_event_id = models.BigAutoField(primary_key=True)
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="calendar_events",
        db_column="user_id"
    )
    
    custom_title = models.CharField(max_length=50, db_column="custom_title")
    custom_content = models.CharField(max_length=2000, null=True, blank=True, db_column="custom_content")
    
    custom_start_at = models.DateTimeField(db_column="custom_start_at")
    custom_end_at = models.DateTimeField(db_column="custom_end_at")
    
    # 원문 이동 링크 (varchar(200))
    mm_link = models.CharField(max_length=200, null=True, blank=True, db_column="mm_link")
    
    # 이벤트 색상 (varchar(10))
    color = models.CharField(max_length=10, null=True, blank=True, db_column="color")

    # 게시판 및 채널 정보 (varchar(100)) - 단순 정보 저장용
    board_name = models.CharField(max_length=100, null=True, blank=True, db_column="board_name")
    channel_name = models.CharField(max_length=100, null=True, blank=True, db_column="channel_name")
    
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")
    
    class Meta:
        db_table = "calendar_event"
        indexes = [
            models.Index(fields=["user"], name="idx_calendar_user"),
            models.Index(fields=["custom_start_at"], name="idx_calendar_start"),
        ]
        ordering = ["custom_start_at"]

    def __str__(self):
        return f"[{self.user.nickname}] {self.custom_title}"
