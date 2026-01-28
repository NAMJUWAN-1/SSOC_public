from django.db import models
from local_apps.users.models import User


class SearchLog(models.Model):
    """
    사용자 검색 기록
    
    사용자의 검색 키워드 및 필터 정보를 저장하여
    최근 검색어 기능을 제공합니다.
    """
    search_log_id = models.BigAutoField(primary_key=True, db_column="search_log_id")
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="search_logs"
    )
    keyword = models.CharField(max_length=255, db_column="keyword")
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    
    class Meta:
        db_table = "search_log"
        ordering = ["-created_at"]  # 최신 검색어 우선
    
    def __str__(self):
        return f"{self.user.email} - {self.keyword} ({self.created_at})"
