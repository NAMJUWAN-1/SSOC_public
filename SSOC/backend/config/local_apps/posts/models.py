from django.db import models
from pgvector.django import VectorField
from local_apps.channels.models import Channel
from local_apps.categories.models import Category


class Post(models.Model):
    """
    정제된 공지 테이블 (post)
    """

    post_id = models.BigAutoField(primary_key=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="posts",
        db_column="category_id",
    )

    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="posts",
        db_column="channel_id",
    )

    # ERD: ai_title (varchar(200))
    ai_title = models.CharField(max_length=200)

    # ERD: content (text)
    content = models.TextField()

    # ERD: posted_at (timestamp)
    posted_at = models.DateTimeField()

    # ERD: start_at, end_at (timestamp, nullable)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)

    # ERD: embedding_vector (VECTOR(1536))
    # OpenAI text-embedding-ada-002 또는 text-embedding-3-small 호환
    embedding_vector = VectorField(
        dimensions=1536,
        null=True,
        blank=True,
        help_text="벡터 임베딩 (의미 기반 검색용, 1536차원)"
    )

    # ERD: display_content (varchar(100))
    display_content = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "post"
        indexes = [
            models.Index(fields=["channel"], name="idx_post_channel"),
            models.Index(fields=["category"], name="idx_post_category"),
            models.Index(fields=["posted_at"], name="idx_post_posted_at"),
        ]

    def __str__(self) -> str:
        return f"Post({self.post_id}) {self.ai_title}"
