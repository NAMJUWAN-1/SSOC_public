from django.urls import path
from .views import CookieTokenRefreshView, LogoutView

urlpatterns = [
    path("refresh/", CookieTokenRefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
]
