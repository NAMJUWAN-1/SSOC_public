from django.urls import path

from local_apps.posts.views import PostAPIView

urlpatterns = [
    # GET /api/posts/?post_id=1 OR /api/posts/?channel_id=1 ...
    path("", PostAPIView.as_view(), name="posts"),
]
