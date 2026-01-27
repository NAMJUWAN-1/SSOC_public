from django.db import models
from local_apps.users.models import User
from local_apps.channels.models import Channel


class UserInfo(models.Model):
    """
    사용자-채널 매핑 테이블 (user_info)
    
    User와 Channel의 다대다 관계를 나타냄
    - user_id (FK): 사용자
    - channel_id (FK): 채널
    - status: 채널 활성화 여부
    """
    user_channel_id = models.BigAutoField(primary_key=True, db_column="user_channel_id")
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_channels",
        db_column="user_id",
    )
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="channel_users",
        db_column="channel_id",
    )
    status = models.BooleanField(default=True, db_column="status")
    
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")
    
    class Meta:
        db_table = "user_info"
        # 사용자-채널 조합은 unique
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'channel'],
                name='unique_user_channel'
            )
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.channel.channel_name}"
