"""
Mattermost REST API 로그인 헬퍼 함수 모음

공식 API 문서 기준:
- Login: POST /api/v4/users/login
- User Info: GET /api/v4/users/me
"""

from typing import Dict, Any

import requests
from django.conf import settings


def login_to_mattermost(login_id: str, password: str) -> tuple[str, Dict[str, Any]]:
    """
    Mattermost 로그인 API로 세션 토큰 및 사용자 정보 발급
    
    Args:
        login_id: Mattermost 로그인 ID (username 또는 email)
        password: Mattermost 비밀번호
    
    Returns:
        tuple[str, Dict]: (MM 세션 토큰, 사용자 정보 dict)
        - mm_token: 응답 헤더의 Token 값
        - userinfo: 응답 body의 사용자 정보 (id, email, username, first_name, last_name 등)
    
    Raises:
        requests.HTTPError: 로그인 실패 시 (401: 인증 실패, 403: 계정 비활성화 등)
        ValueError: Token 헤더가 응답에 없는 경우
    
    Note:
        - MM API v4 login 엔드포인트 사용
        - 응답 헤더에 'Token' (세션 토큰), body에 사용자 정보 포함
        - body를 재사용하므로 /api/v4/users/me 호출 불필요 (효율성 개선)
    """
    url = f"{settings.MATTERMOST_BASE_URL}/api/v4/users/login"
    payload = {
        "login_id": login_id,
        "password": password,
    }
    
    response = requests.post(url, json=payload, timeout=10)
    response.raise_for_status()  # 4xx/5xx 발생 시 HTTPError
    
    # MM 세션 토큰은 응답 헤더 'Token'에 포함됨
    mm_token = response.headers.get("Token")
    if not mm_token:
        raise ValueError("Mattermost Token header not found in response")
    
    # 응답 body에 이미 사용자 정보 포함 (중복 API 호출 방지)
    userinfo = response.json()
    
    return mm_token, userinfo


def fetch_mm_userinfo(mm_token: str) -> Dict[str, Any]:
    """
    Mattermost 세션 토큰으로 사용자 정보 조회
    
    Args:
        mm_token: MM 로그인으로 발급받은 세션 토큰
    
    Returns:
        MM 사용자 정보 dict (id, email, username, first_name, last_name, nickname 등)
    
    Raises:
        requests.HTTPError: userinfo 조회 실패 시 (401: 토큰 만료/무효 등)
    
    Note:
        - MM userinfo endpoint: /api/v4/users/me
        - Authorization: Bearer {mm_token} 헤더 필수
    """
    url = f"{settings.MATTERMOST_BASE_URL}/api/v4/users/me"
    headers = {
        "Authorization": f"Bearer {mm_token}",
    }
    
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_user_channels(mm_token: str, user_id: str) -> list[Dict[str, Any]]:
    """
    Mattermost 사용자 ID로 사용자가 속한 채널 목록 조회
    
    Args:
        mm_token: MM 세션 토큰
        user_id: MM user_id (oauth_account.provider_uid)
    
    Returns:
        채널 목록 리스트 (id, team_id, display_name, name, type 등 포함)
    """
    url = f"{settings.MATTERMOST_BASE_URL}/api/v4/users/{user_id}/channels"
    headers = {
        "Authorization": f"Bearer {mm_token}",
    }
    
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_team(mm_token: str, team_id: str) -> Dict[str, Any]:
    """
    Mattermost Team ID로 팀 상세 정보 조회
    
    Args:
        mm_token: MM 세션 토큰
        team_id: MM Team ID
    
    Returns:
        팀 정보 dict (id, display_name, name, description 등)
    """
    url = f"{settings.MATTERMOST_BASE_URL}/api/v4/teams/{team_id}"
    headers = {
        "Authorization": f"Bearer {mm_token}",
    }
    
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()
