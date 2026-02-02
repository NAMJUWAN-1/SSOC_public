from django.urls import path
from .views import ArchiveView, ArchiveDetailView, ArchiveCountView, ArchiveRankingView

urlpatterns = [
    # GET /api/archives/ranking/ (실시간 랭킹) -> 순서 중요! user_id 파라미터 쓰는 것보다 위에 두거나 명확히 분리
    path("ranking/", ArchiveRankingView.as_view(), name="archive-ranking"),

    # GET /api/archives/?user_id=1 (목록 조회)
    # POST /api/archives/ (아카이브 토글)
    path("", ArchiveView.as_view(), name="archive-list-create"),
    
    # DELETE /api/archives/<int:archive_id>/ (아카이브 삭제)
    path("<int:archive_id>/", ArchiveDetailView.as_view(), name="archive-delete"),
    
    # GET /api/archives/count/?user_id=1 (개수 조회)
    path("count/", ArchiveCountView.as_view(), name="archive-count"),
]
