from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from local_apps.search_logs.models import SearchLog


class SearchLogView(APIView):
    """
    검색 기록 관리 API
    
    - GET: 최근 검색어 목록 조회
    - POST: 검색어 저장
    - DELETE: 개별/전체 삭제
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        최근 검색어 목록 조회
        
        Query Parameters:
            user_id (required): 사용자 ID (본인만 조회 가능)
            limit (optional): 조회 개수 (기본 5개)
        """
        user_id = request.GET.get('user_id')
        limit = request.GET.get('limit', 5)
        
        # user_id 필수 검증
        if not user_id:
            return Response(
                {"error": "user_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid limit parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user_id = int(user_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid user_id format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 본인만 조회 가능
        if target_user_id != request.user.user_id:
            return Response(
                {"error": "You can only access your own search logs"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 최근 N개 조회
        logs = SearchLog.objects.filter(user_id=target_user_id)[:limit]
        
        data = [
            {
                "search_log_id": log.search_log_id,
                "keyword": log.keyword,
                "created_at": log.created_at.isoformat(),
                "user_id": log.user_id,
            }
            for log in logs
        ]
        
        return Response(data, status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        검색어 저장
        
        Request Body:
            keyword (required): 검색 키워드
        """
        keyword = request.data.get('keyword')
        
        if not keyword:
            return Response(
                {"error": "keyword is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 검색어 저장
        search_log = SearchLog.objects.create(
            user=request.user,
            keyword=keyword
        )
        
        return Response(
            {
                "search_log_id": search_log.search_log_id,
                "keyword": search_log.keyword,
                "created_at": search_log.created_at.isoformat(),
                "user_id": search_log.user_id,
            },
            status=status.HTTP_201_CREATED
        )
    
    def delete(self, request):
        """
        검색 기록 삭제

        - Query에 user_id가 있으면: 전체 삭제
        """
        user_id = request.GET.get('user_id')
        
        if user_id:
            # 전체 삭제
            try:
                target_user_id = int(user_id)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid user_id format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 본인만 삭제 가능
            if target_user_id != request.user.user_id:
                return Response(
                    {"error": "You can only delete your own search logs"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 전체 삭제
            SearchLog.objects.filter(user_id=target_user_id).delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        else:
            return Response(
                {"error": "user_id parameter is required for bulk delete"},
                status=status.HTTP_400_BAD_REQUEST
            )


class SearchLogDetailView(APIView):
    """
    검색 기록 개별 삭제 API
    
    - DELETE: 특정 검색 기록 삭제
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, search_log_id):
        """
        검색 기록 삭제
        
        - URL에 search_log_id가 있으면: 개별 삭제
        """
        try:
            search_log = SearchLog.objects.get(search_log_id=search_log_id)
        except SearchLog.DoesNotExist:
            return Response(
                {"error": "Search log not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 본인 검색 기록만 삭제 가능
        if search_log.user_id != request.user.user_id:
            return Response(
                {"error": "You can only delete your own search log"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        search_log.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
