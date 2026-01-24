from django.urls import path
from .views import MattermostLoginView

urlpatterns = [
    path("login/", MattermostLoginView.as_view(), name="mattermost_login"),
]
