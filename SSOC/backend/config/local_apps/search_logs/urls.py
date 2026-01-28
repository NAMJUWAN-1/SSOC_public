from django.urls import path
from .views import SearchLogView, SearchLogDetailView

urlpatterns = [
    path('', SearchLogView.as_view(), name='search_log_list'),  # GET, POST, DELETE (전체)
    path('<int:search_log_id>/', SearchLogDetailView.as_view(), name='search_log_detail'),  # DELETE (개별)
]
