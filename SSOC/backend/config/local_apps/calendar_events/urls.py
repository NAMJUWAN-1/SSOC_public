from django.urls import path
from .views import CalendarEventListCreateAPIView, CalendarEventDetailAPIView

urlpatterns = [
    # 목록 조회, 상세 조회(query param), 생성
    path("", CalendarEventListCreateAPIView.as_view(), name="calendar-event-list"),
    
    # 수정, 삭제 (path param)
    path("<int:event_id>/", CalendarEventDetailAPIView.as_view(), name="calendar-event-detail"),
]
