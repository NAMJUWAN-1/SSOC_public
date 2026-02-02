from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from local_apps.posts.models import Post


class PostAPIView(APIView):
    """
    공지 조회 API (단일 진입점)

    Endpoint: GET /api/posts/
    Permission: IsAuthenticated

    Branch Logic:
    1. if 'post_id' in query_params -> 상세 조회 (Detail)
    2. else -> 목록 조회 (List) with filters (channel_id, category_id, etc.)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        # 분기 처리: post_id가 있으면 상세 조회, 없으면 목록 조회
        if request.query_params.get("post_id"):
            return self._get_detail(request)
        return self._get_list(request)

    def _get_detail(self, request: Request) -> Response:
        """
        공지 상세 조회 로직
        Required Query Param: post_id
        """
        post_id = request.query_params.get("post_id")
        
        # post_id 유효성 검사
        if not post_id or not str(post_id).isdigit():
             return Response(
                {"error": "Invalid post_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            post = Post.objects.select_related(
                "channel",
                "channel__board",
                "category"
            ).get(post_id=int(post_id))
        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        data = {
            "post_id": post.post_id,
            "board_name": post.channel.board.board_name,
            "channel_name": post.channel.channel_name,
            "category_name": post.category.category_name,
            "start_at": post.start_at.isoformat() if post.start_at else None,
            "end_at": post.end_at.isoformat() if post.end_at else None,
            "ai_title": post.ai_title,
            "content": post.content,
            "mm_board_id": post.channel.board.mm_board_id,
        }
        return Response(data, status=status.HTTP_200_OK)

    def _get_list(self, request: Request) -> Response:
        """
        공지 목록 조회 로직
        Optional Query Params: channel_id, category_id, ordering...
        """
        # 기본 쿼리셋 (N+1 방지를 위한 select_related)
        user_posts = Post.objects.select_related(
            "channel",
            "channel__board",
            "category"
        ).all()

        # 필터 1: channel_id (콤마로 구분된 복수 ID 지원)
        channel_ids = request.GET.get("channel_id")
        if channel_ids:
            try:
                ids = [int(x) for x in channel_ids.split(",") if x.strip().isdigit()]
                if ids:
                    user_posts = user_posts.filter(channel_id__in=ids)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid channel_id format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 필터 2: category_id
        category_id = request.GET.get("category_id")
        if category_id:
            try:
                user_posts = user_posts.filter(category_id=int(category_id))
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid category_id format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 정렬 (기본: 최신순)
        ordering = request.GET.get("ordering", "-posted_at")
        if ordering in ["posted_at", "-posted_at", "ai_title", "-ai_title"]:
            user_posts = user_posts.order_by(ordering)
        else:
            user_posts = user_posts.order_by("-posted_at")

        # 응답 데이터 구성
        data = []
        for post in user_posts:  # type: Post
            data.append({
                "post_id": post.post_id,
                "category_id": post.category_id,
                "category_name": post.category.category_name,
                "board_id": post.channel.board_id,
                "board_name": post.channel.board.board_name,
                "channel_id": post.channel_id,
                "channel_name": post.channel.channel_name,
                "ai_title": post.ai_title,
                "content": post.content,
                "posted_at": post.posted_at.isoformat() if post.posted_at else None,
            })

        return Response(data, status=status.HTTP_200_OK)
