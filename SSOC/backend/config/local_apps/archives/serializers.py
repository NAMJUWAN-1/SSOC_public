from rest_framework import serializers
from .models import Archive
from local_apps.posts.models import Post

class ArchivePostSerializer(serializers.ModelSerializer):
    """
    아카이브 목록 조회 시 보여줄 간단한 공지 정보
    """
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    board_name = serializers.CharField(source='channel.board.board_name', read_only=True)
    channel_name = serializers.CharField(source='channel.channel_name', read_only=True)
    channel_id = serializers.IntegerField(source='channel.channel_id', read_only=True)

    class Meta:
        model = Post
        fields = [
            'post_id', 
            'category_name', 
            'board_name', 
            'channel_id', 
            'channel_name', 
            'ai_title', 
            'display_content',
            'posted_at'
        ]

class ArchiveSerializer(serializers.ModelSerializer):
    post = ArchivePostSerializer(read_only=True)
    
    class Meta:
        model = Archive
        fields = ['archive_id', 'user', 'post', 'created_at']

class ArchiveRankingSerializer(ArchivePostSerializer):
    """
    랭킹 조회용 시리얼라이저 (스크랩 수 포함)
    """
    scrap_count = serializers.IntegerField(read_only=True)

    class Meta(ArchivePostSerializer.Meta):
        fields = ArchivePostSerializer.Meta.fields + ['scrap_count']
