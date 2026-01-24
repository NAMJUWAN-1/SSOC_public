from django.db import models
from django.conf import settings


class OAuthAccount(models.Model):
    oauth_account_id = models.BigAutoField(primary_key=True, db_column="oauth_account_id")
    # user 테이블의 user_id를 FK로 사용
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="oauth_accounts",
    )

    provider = models.CharField(max_length=20)
    provider_uid = models.CharField(max_length=100)
    extra_data = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = "oauth_account"
        # 두가지 이상의 컬럼의 조합에 unique 설정 적용
        constraints = [
            models.UniqueConstraint(fields=["provider", "provider_uid"], name="uniq_provider_uid")
        ]

    def __str__(self):
        return f"{self.provider}:{self.provider_uid}"
