import requests
import os
from dotenv import load_dotenv

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Exists, OuterRef

from local_apps.posts.models import Post
from local_apps.archives.models import Archive


# .env 경로 설정 및 로드
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../../../.env"))
load_dotenv(ENV_PATH)

# GMS 관련 설정
GMS_API_KEY = os.getenv("GMS_API_KEY")
GMS_EMBEDDING_URL = os.getenv("GMS_EMBEDDING_URL")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")


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

    def _get_embedding(self, text_input: str):
        """
        검색어 벡터 엠베딩 로직
        """
        if not GMS_API_KEY or not GMS_EMBEDDING_URL:
            return None
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GMS_API_KEY}"
        }
        payload = {
            "model": EMBEDDING_MODEL,
            "input": text_input.replace("\n", " ")
        }
        try:
            response = requests.post(GMS_EMBEDDING_URL, headers=headers, json=payload, timeout=5)
            if response.status_code == 200:
                return response.json()['data'][0]['embedding']
        except Exception as e:
            print(f"임베딩 생성 실패: {e}")
        return None

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
            "mm_post_id": post.mm_post_id,
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

        # Archive 여부 체크 (현재 유저가 이 Post를 북마크했는지)
        is_archived_subquery = Archive.objects.filter(
            post=OuterRef('pk'), # "바깥쪽 Post의 ID와 같고"
            user=request.user # "현재 유저가 북마크한 Archive 레코드"
        )
        user_posts = user_posts.annotate(
            is_archived=Exists(is_archived_subquery)
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

        # 검색 및 정렬 로직
        keyword = request.GET.get("keyword", "").strip()
        is_vector_search = False

        '''
        # 기존의 키워드 검색 관련 코드 (확인 후 삭제 요망)
        if keyword:
            # === 현재 구현: 텍스트 검색 (임시) ===
            # 제목 또는 내용에서 검색어 포함 여부 확인
            user_posts = user_posts.filter(
                Q(ai_title__icontains=keyword) | Q(content__icontains=keyword)
            )
        # 정렬 (기본: 최신순)
        ordering = request.GET.get("ordering", "-posted_at")
        # 다른 정렬 기준이 입력되면 해당 기준이 허용되는 옵션인지 확인
        if ordering in ["posted_at", "-posted_at", "ai_title", "-ai_title"]:
            user_posts = user_posts.order_by(ordering)
        else:
            user_posts = user_posts.order_by("-posted_at")
        '''
        
        SIMILARITY_THRESHOLD = 0.7 # 유사도 임계값
        if keyword:
            query_vector = self._get_embedding(keyword)
            if query_vector:
                vector_str = str(query_vector)
                user_posts = user_posts.extra(
                    select={'distance': 'post.embedding_vector <=> %s'},
                    select_params=(str(query_vector),),
                    where=['post.embedding_vector <=> %s < %s'],
                    params=(vector_str, SIMILARITY_THRESHOLD),
                    order_by=['distance']
                )
                is_vector_search = True
            else:
                user_posts = user_posts.none()

        if not is_vector_search:
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
                "display_content": post.display_content,
                "content": post.content,
                "posted_at": post.posted_at.isoformat() if post.posted_at else None,
                "is_archived": post.is_archived,  # 북마크 상태
            })

        return Response(data, status=status.HTTP_200_OK)
