from django.urls import path
from .views import (
    UserDetailView, 
    CheckNicknameView, 
)

urlpatterns = [
    path("", UserDetailView.as_view(), name="user_detail"),
    path("<int:user_id>/", UserDetailView.as_view(), name="user_detail_update"),
    path("check-nickname/", CheckNicknameView.as_view(), name="check_nickname"),
]
