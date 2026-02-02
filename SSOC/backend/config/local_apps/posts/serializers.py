from rest_framework import serializers
from local_apps.posts.models import Post


class PostListSerializer(serializers.ModelSerializer):
    """
    공지 목록 조회용 Serializer
    """

    # Django FK는 기본적으로 `<field>_id` 접근자가 존재함 (ex. post.channel_id)
    channel_id = serializers.IntegerField(read_only=True)
    category_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "post_id",      # 공지 ID (PK)
            "channel_id",   # 소속 채널 ID (FK)
            "category_id",  # 카테고리 ID (FK)
            "ai_title",     # AI 생성 제목 (API에서도 동일 필드명 사용)
            "content",      # 정제된 본문(목록에서는 일부만 써도 됨)
            "posted_at",    # 원문 공지 게시 시각
            "start_at",     # 공지 유효 시작(없으면 null)
            "end_at",       # 공지 유효 종료(없으면 null)
        ]


class PostDetailSerializer(serializers.ModelSerializer):
    """공지 상세 조회용 Serializer (팝업/상세)

    - 현재는 List와 거의 동일하지만, 향후 상세 전용 필드가 붙을 수 있어 분리.
    """

    channel_id = serializers.IntegerField(read_only=True)
    category_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "post_id",
            "channel_id",
            "category_id",
            "ai_title",
            "content",
            "posted_at",
            "start_at",
            "end_at",
        ]
