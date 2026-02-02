from django.urls import path
from .views import ArchiveView, ArchiveDetailView, ArchiveCountView

urlpatterns = [
    # GET /api/archives/?user_id=1 (목록 조회)
    # POST /api/archives/ (아카이브 토글)
    path("", ArchiveView.as_view(), name="archive-list-create"),
    
    # DELETE /api/archives/<int:archive_id>/ (아카이브 삭제)
    path("<int:archive_id>/", ArchiveDetailView.as_view(), name="archive-delete"),
    
    # GET /api/archives/count/?user_id=1 (개수 조회)
    path("count/", ArchiveCountView.as_view(), name="archive-count"),
]
