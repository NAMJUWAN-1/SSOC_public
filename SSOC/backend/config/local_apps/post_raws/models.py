from django.db import models
from local_apps.channels.models import Channel


class PostRaw(models.Model):
    """
    공지 원문 테이블 (post_raw)
    - 웹훅 등으로 수신한 원문 데이터를 적재(저장)하는 용도
    """

    # ERD: post_raw_id (PK, bigint)
    post_raw_id = models.BigAutoField(primary_key=True)

    # ERD: channel_id (FK2, bigint) -> channel.channel_id
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="post_raws",
        db_column="channel_id",
    )

    # ERD: author_username (varchar(100))
    author_username = models.CharField(max_length=100)

    # ERD: mm_post_id (varchar(100))
    mm_post_id = models.CharField(max_length=100, db_index=True)

    # ERD: raw_content (text)
    raw_content = models.TextField()

    # ERD: posted_at (timestamp)
    posted_at = models.DateTimeField()

    # ERD: update_at (timestamp)
    update_at = models.DateTimeField()

    class Meta:
        db_table = "post_raw"
        verbose_name = "Post Raw"
        verbose_name_plural = "Post Raws"
        indexes = [
            models.Index(fields=["channel"], name="idx_post_raw_channel"),
            models.Index(fields=["mm_post_id"], name="idx_post_raw_mm_post_id"),
        ]

    def __str__(self) -> str:
        return f"PostRaw({self.post_raw_id}) mm_post_id={self.mm_post_id}"
