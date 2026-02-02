from django.db import models
from local_apps.channels.models import Channel
from pgvector.django import VectorField


class Category(models.Model):
    """
    카테고리 테이블 (category)
    """

    category_id = models.BigAutoField(primary_key=True)

    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="categories",
        db_column="channel_id",
    )

    category_name = models.CharField(max_length=50, db_column="category_name")

    # 임베딩 벡터 (Vector, nullable, 1536 dimensions)
    embedding_vector = VectorField(dimensions=1536, null=True, blank=True, db_column="embedding_vector")

    class Meta:
        db_table = "category"
        # 채널 내에서 카테고리명 중복 방지
        constraints = [
            models.UniqueConstraint(
                fields=["channel", "category_name"],
                name="uniq_category_channel_name",
            )
        ]
        indexes = [
            models.Index(fields=["channel"], name="idx_category_channel"),
            models.Index(fields=["category_name"], name="idx_category_name"),
        ]

    def __str__(self) -> str:
        return f"{self.channel_id}:{self.category_name}"

