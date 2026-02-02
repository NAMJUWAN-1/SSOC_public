from django.urls import path

from local_apps.posts.views import PostListAPIView, PostDetailAPIView

urlpatterns = [
    # GET /api/posts/?channel_id=1,2&category_id=3&page=1
    path("", PostListAPIView.as_view(), name="post-list"),
    # GET /api/posts/{post_id}/
    path("<int:post_id>/", PostDetailAPIView.as_view(), name="post-detail"),
]
