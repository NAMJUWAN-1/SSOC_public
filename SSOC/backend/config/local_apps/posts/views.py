from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter

from local_apps.posts.models import Post
from local_apps.posts.serializers import PostListSerializer, PostDetailSerializer


class PostListAPIView(generics.ListAPIView):
    """공지 목록 조회 API (메인페이지 연동용)
    """

    permission_classes = [IsAuthenticated]  # 메인페이지가 로그인 전용이면 유지. 공개면 AllowAny로 변경.
    serializer_class = PostListSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ["posted_at"]
    ordering = ["-posted_at"]

    def get_queryset(self):
        qs = Post.objects.all().select_related("channel", "category")

        # ex) ?channel_id=3  또는 ?channel_id=3,4,10
        channel_ids = self.request.query_params.get("channel_id")
        if channel_ids:
            ids = [int(x) for x in channel_ids.split(",") if x.strip().isdigit()]
            if ids:
                qs = qs.filter(channel_id__in=ids)

        # ex) ?category_id=2
        category_id = self.request.query_params.get("category_id")
        if category_id and category_id.isdigit():
            qs = qs.filter(category_id=int(category_id))

        return qs


class PostDetailAPIView(generics.RetrieveAPIView):
    """공지 상세 조회 API"""

    permission_classes = [IsAuthenticated]
    serializer_class = PostDetailSerializer
    lookup_field = "post_id"

    def get_queryset(self):
        # 상세도 동일하게 FK join (N+1 방지)
        return Post.objects.all().select_related("channel", "category")
