from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import Archive
from .serializers import ArchiveSerializer
from local_apps.posts.models import Post
from django.contrib.auth import get_user_model

User = get_user_model()

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
