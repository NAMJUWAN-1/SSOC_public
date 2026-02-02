from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from local_apps.posts.models import Post


class PostAPIView(APIView):
    """
    공지 조회 API (단일 진입점)

    Endpoint: GET /api/posts/
    Permission: IsAuthenticated

    분기 방식:
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
        
        검색 구조:
        1. 초기 렌더링: 유저가 속한 채널의 post만 응답
        2. 필터링: board_id → channel_id → category_id 순으로 좁혀감
        3. 검색어: 현재까지 필터링된 post 중에서 검색어 유사도 체크
        
        Optional Query Params: board_id, channel_id, category_id, keyword, ordering
        """
        # 기본 쿼리셋: 현재 유저가 속한 채널의 post만 조회 (N+1 방지)
        user = request.user
        user_channel_ids = user.user_channels.filter(status=True).values_list('channel_id', flat=True)
        
        user_posts = Post.objects.filter(
            channel_id__in=user_channel_ids
        ).select_related(
            "channel",
            "channel__board",
            "category"
        )

        # 필터 1: board_id
        board_id = request.GET.get("board_id")
        if board_id:
            try:
                user_posts = user_posts.filter(channel__board_id=int(board_id))
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid board_id format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 필터 2: channel_id (콤마로 구분된 복수 ID 지원)
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

        # 필터 3: category_id (콤마로 구분된 복수 ID 지원)
        category_ids = request.GET.get("category_id")
        if category_ids:
            try:
                ids = [int(x) for x in category_ids.split(",") if x.strip().isdigit()]
                if ids:
                    user_posts = user_posts.filter(category_id__in=ids)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid category_id format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 검색: keyword 파라미터 (검색어)
        keyword = request.GET.get("keyword", "").strip()
        if keyword:
            # === 현재 구현: 텍스트 검색 (임시) ===
            # 제목 또는 내용에서 검색어 포함 여부 확인
            user_posts = user_posts.filter(
                Q(ai_title__icontains=keyword) | Q(content__icontains=keyword)
            )
            
            # === 임베딩 벡터 기반 검색 구현 이후 전환예정 ===
            # TODO: AI 팀 작업 - 벡터 검색 로직 구현
            # ===========================================

        # 정렬 (기본: 최신순)
        ordering = request.GET.get("ordering", "-posted_at")
        # 다른 정렬 기준이 입력되면 해당 기준이 허용되는 옵션인지 확인
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
