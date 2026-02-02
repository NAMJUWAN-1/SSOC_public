from django.db import models
from django.conf import settings  # for AUTH_USER_MODEL
from local_apps.posts.models import Post

class Archive(models.Model):
    """
    공지사항 아카이브(북마크/스크랩) 모델
    """
    archive_id = models.BigAutoField(primary_key=True, help_text="아카이브 고유 ID")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="archives",
        help_text="사용자 ID"
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="archives",
        help_text="공지 ID"
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="생성일자")

    class Meta:
        db_table = "archive"
        verbose_name = "아카이브"
        verbose_name_plural = "아카이브 목록"
        # 한 유저가 같은 포스트를 중복 아카이브 할 수 없도록 제약조건 추가
        constraints = [
            models.UniqueConstraint(
                fields=["user", "post"],
                name="unique_user_archive_post"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.post}"
