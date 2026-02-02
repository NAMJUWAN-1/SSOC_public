from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from .models import CalendarEvent

class CalendarEventListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        event_id = request.GET.get("event_id")

        # 1. 상세 조회 (Query Param event_id 존재 시)
        if event_id:
            try:
                target_id = int(event_id)
            except (ValueError, TypeError):
                return Response({"error": "Invalid event_id format"}, status=status.HTTP_400_BAD_REQUEST)
                
            event = get_object_or_404(CalendarEvent, calendar_event_id=target_id, user=user)
            return Response({
                "calendar_event_id": event.calendar_event_id,
                "custom_title": event.custom_title,
                "custom_content": event.custom_content,
                "custom_start_at": event.custom_start_at.isoformat() if event.custom_start_at else None,
                "custom_end_at": event.custom_end_at.isoformat() if event.custom_end_at else None,
                "mm_link": event.mm_link,
                "color": event.color,
                "board_name": event.board_name,
                "channel_name": event.channel_name,
                "created_at": event.created_at.isoformat() if event.created_at else None,
                "updated_at": event.updated_at.isoformat() if event.updated_at else None,
            }, status=status.HTTP_200_OK)

        # 2. 목록 조회
        events = CalendarEvent.objects.filter(user=user)

        # 기간 필터링
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        if start_date:
            # 조회 시작알보다 늦게 끝나는 이벤트만 포함 (이미 끝난 과거 이벤트 제외)
            events = events.filter(custom_end_at__gte=start_date)
        if end_date:
            # 조회 종료일보다 일찍 시작하는 이벤트만 포함 (아직 시작 안 한 미래 이벤트 제외)
            # __date: 시간 무시하고 날짜만 비교 (마지막 날에 걸친 이벤트 포함을 위해)
            events = events.filter(custom_start_at__date__lte=end_date)

        data = []
        for event in events:
            data.append({
                "calendar_event_id": event.calendar_event_id,
                "custom_title": event.custom_title,
                "custom_content": event.custom_content,
                "custom_start_at": event.custom_start_at.isoformat() if event.custom_start_at else None,
                "custom_end_at": event.custom_end_at.isoformat() if event.custom_end_at else None,
                "mm_link": event.mm_link,
                "color": event.color,
                "board_name": event.board_name,
                "channel_name": event.channel_name,
                "created_at": event.created_at.isoformat() if event.created_at else None,
                "updated_at": event.updated_at.isoformat() if event.updated_at else None,
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        
        # 필수 필드 체크 및 데이터 추출
        custom_title = data.get("custom_title")
        custom_start_at = data.get("custom_start_at")
        custom_end_at = data.get("custom_end_at")
        
        if not all([custom_title, custom_start_at, custom_end_at]):
            return Response({"error": "custom_title, custom_start_at, custom_end_at are required"}, status=status.HTTP_400_BAD_REQUEST)

        # 날짜 파싱 및 유효성 검사
        start_at = parse_datetime(custom_start_at)
        end_at = parse_datetime(custom_end_at)
        
        if not start_at or not end_at:
            return Response({"error": "Invalid datetime format"}, status=status.HTTP_400_BAD_REQUEST)
            
        if end_at < start_at:
            return Response({"error": "종료 일시는 시작 일시보다 빠를 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        # 저장
        event = CalendarEvent.objects.create(
            user=request.user,
            custom_title=custom_title,
            custom_content=data.get("custom_content"),
            custom_start_at=start_at,
            custom_end_at=end_at,
            mm_link=data.get("mm_link"),
            color=data.get("color"),
            board_name=data.get("board_name"),
            channel_name=data.get("channel_name")
        )
        
        return Response({
            "calendar_event_id": event.calendar_event_id,
            "custom_title": event.custom_title,
            "custom_content": event.custom_content,
            "custom_start_at": event.custom_start_at.isoformat() if event.custom_start_at else None,
            "custom_end_at": event.custom_end_at.isoformat() if event.custom_end_at else None,
            "mm_link": event.mm_link,
            "color": event.color,
            "board_name": event.board_name,
            "channel_name": event.channel_name,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "updated_at": event.updated_at.isoformat() if event.updated_at else None,
        }, status=status.HTTP_201_CREATED)

class CalendarEventDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, event_id, user):
        return get_object_or_404(CalendarEvent, calendar_event_id=event_id, user=user)

    def patch(self, request, event_id):
        event = self._get_object(event_id, request.user)
        data = request.data
        
        # 필드 업데이트
        if "custom_title" in data:
            event.custom_title = data["custom_title"]
        if "custom_content" in data:
            event.custom_content = data["custom_content"]
        if "mm_link" in data:
            event.mm_link = data["mm_link"]
        if "color" in data:
            event.color = data["color"]
        if "board_name" in data:
            event.board_name = data["board_name"]
        if "channel_name" in data:
            event.channel_name = data["channel_name"]
            
        # 날짜 업데이트 및 유효성 검사
        new_start = data.get("custom_start_at")
        new_end = data.get("custom_end_at")
        
        curr_start = parse_datetime(new_start) if new_start else event.custom_start_at
        curr_end = parse_datetime(new_end) if new_end else event.custom_end_at
        
        if new_start:
            event.custom_start_at = curr_start
        if new_end:
            event.custom_end_at = curr_end
            
        if curr_start and curr_end and curr_end < curr_start:
            return Response({"error": "종료 일시는 시작 일시보다 빠를 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        event.save()
        return Response({
            "calendar_event_id": event.calendar_event_id,
            "custom_title": event.custom_title,
            "custom_content": event.custom_content,
            "custom_start_at": event.custom_start_at.isoformat() if event.custom_start_at else None,
            "custom_end_at": event.custom_end_at.isoformat() if event.custom_end_at else None,
            "mm_link": event.mm_link,
            "color": event.color,
            "board_name": event.board_name,
            "channel_name": event.channel_name,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "updated_at": event.updated_at.isoformat() if event.updated_at else None,
        }, status=status.HTTP_200_OK)

    def delete(self, request, event_id):
        event = self._get_object(event_id, request.user)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
