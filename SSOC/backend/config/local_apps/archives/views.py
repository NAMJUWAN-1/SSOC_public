from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import Archive
from .serializers import ArchiveSerializer, ArchiveRankingSerializer
from local_apps.posts.models import Post
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class ArchiveRankingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """
        실시간 아카이빙 랭킹 조회
        GET /api/archives/ranking/
        
        Logic:
        - 최근 7일(Moving Window) 동안 생성된 아카이브 집계
        - 아카이브 수(scrap_count) 기준 내림차순 정렬
        - 상위 10개 반환
        """
        now = timezone.now()
        start_date = now - timedelta(days=7)

        # Post를 기준으로 Archive 수 카운트 (최근 7일 데이터만)
        # filter(archives__created_at__gte=start_date) : 역참조 이용
        # 스크랩수가 같은 경우 posted_at 기준 내림차순 정렬
        top_posts = Post.objects.filter(
            archives__created_at__gte=start_date
        ).annotate(
            scrap_count=Count('archives')
        ).order_by('-scrap_count', '-posted_at')[:10]

        # 데이터가 없을 경우 처리 (빈 리스트 반환)
        if not top_posts:
            return Response([], status=status.HTTP_200_OK)

        serializer = ArchiveRankingSerializer(top_posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ArchiveView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """
        아카이브 목록 조회
        GET /api/archives/?user_id={user_id}
        """
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {"error": "user_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 최신순 정렬 (created_at 내림차순)
        archives = Archive.objects.filter(user_id=user_id).select_related(
            'post', 
            'post__category', 
            'post__channel', 
            'post__channel__board'
        ).order_by('-created_at')
        
        serializer = ArchiveSerializer(archives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        """
        아카이브 토글 (생성/삭제)
        POST /api/archives/
        Body: {"user_id": 1, "post_id": 5}
        """
        user_id = request.data.get('user_id')
        post_id = request.data.get('post_id')

        if not user_id or not post_id:
            return Response(
                {"error": "user_id and post_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 본인 확인 (선택 사항이지만 권장)
        # if str(request.user.pk) != str(user_id):
        #     return Response({"error": "No permission"}, status=status.HTTP_403_FORBIDDEN)

        try:
            # 존재 여부 확인
            archive = Archive.objects.filter(user_id=user_id, post_id=post_id).first()
            
            if archive:
                # 이미 존재하면 삭제 (Toggle Off)
                archive.delete()
                return Response(
                    {"message": "Archive removed", "is_archived": False}, 
                    status=status.HTTP_200_OK
                )
            else:
                # 없으면 생성 (Toggle On)
                # post 객체 존재 확인
                post = get_object_or_404(Post, pk=post_id)
                Archive.objects.create(user_id=user_id, post=post)
                return Response(
                    {"message": "Archive created", "is_archived": True}, 
                    status=status.HTTP_201_CREATED
                )
                
        except IntegrityError:
            return Response(
                {"error": "Database error"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ArchiveDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, archive_id: int) -> Response:
        """
        아카이브 직접 삭제
        DELETE /api/archives/{archive_id}/
        """
        archive = get_object_or_404(Archive, pk=archive_id)
        
        # 권한 확인: 본인의 아카이브만 삭제 가능하도록 할 수 있음
        # if archive.user != request.user: ...

        archive.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ArchiveCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """
        아카이브 개수 조회
        GET /api/archives/count/?user_id={user_id}
        """
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {"error": "user_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        count = Archive.objects.filter(user_id=user_id).count()
        return Response({"count": count}, status=status.HTTP_200_OK)
