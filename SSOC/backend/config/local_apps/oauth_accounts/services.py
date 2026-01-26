# backend/config/apps/oauth_accounts/services.py

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

from django.db import IntegrityError, transaction
from django.http import HttpResponse

from local_apps.users.models import User
from local_apps.oauth_accounts.models import OAuthAccount
from local_apps.tokens.services import issue_token_pair_for_user
from local_apps.tokens.cookies import set_refresh_cookie


PROVIDER_MATTERMOST = "mattermost"


@dataclass
class MattermostUserinfo:
    id: str
    email: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    nickname: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MattermostUserinfo":
        mm_id = data.get("id")
        email = data.get("email")
        if not mm_id or not email:
            raise ValueError("Mattermost userinfo must include 'id' and 'email'.")
        return cls(
            id=str(mm_id),
            email=str(email),
            username=data.get("username"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            nickname=data.get("nickname"),
        )


def _derive_name_nickname(mm: MattermostUserinfo) -> Tuple[str, str]:
    # first,last로 나눠져있으면 합쳐서 이름으로
    full = " ".join([p for p in [mm.first_name, mm.last_name] if p]).strip()
    # 이름설정, 이름이 없으면 email의 앞부분
    name = full or (mm.username or mm.email.split("@")[0])
    # 닉네임 설정 : 자동설정이지만 추후 사용자가 입력한 값 들어오게 수정
    nickname = (mm.nickname or mm.username or name).strip()
    return name, nickname


@transaction.atomic
def get_or_create_user_from_mm(userinfo: Dict[str, Any]) -> User:
    """
    정책(확정): 동일 email의 기존 User가 존재하면, 그 User에 mattermost oauth_account를 자동 연결한다.
    우선순위:
      1) oauth_account(provider, provider_uid)로 user 찾기
      2) 없으면 email로 user 찾기 → 없으면 생성
      3) oauth_account 생성(동시성 대비 IntegrityError 처리)
    """
    mm = MattermostUserinfo.from_dict(userinfo)
    provider_uid = mm.id
    name, nickname = _derive_name_nickname(mm)

    # 1) oauth_account로 먼저 찾기
    oauth = (
        OAuthAccount.objects.select_related("user")
        .filter(provider=PROVIDER_MATTERMOST, provider_uid=provider_uid)
        .first()
    )
    if oauth:
        user = oauth.user

        # name은 "유저 직접 수정 불가" 전제이므로, 시스템 최초 반영만 보수적으로 처리(빈 값일 때만 채움)
        update_fields = []
        if not user.name:
            user.name = name
            update_fields.append("name")
        if not user.nickname:
            user.nickname = nickname
            update_fields.append("nickname")
        if not user.email:
            user.email = mm.email
            update_fields.append("email")

        if update_fields:
            user.save(update_fields=update_fields)

        oauth.extra_data = userinfo
        oauth.save(update_fields=["extra_data"])
        return user

    # 2) oauth_account가 없으면 email로 user 조회(자동 연결 정책)
    user = User.objects.filter(email=mm.email).first()
    if not user:
        user = User.objects.create(
            email=mm.email,
            name=name,
            nickname=nickname,
            profile_image_url=None,
        )
    else:
        # 기존 user가 있어도 name/nickname이 비어있으면 채움(기존값이 있으면 유지)
        update_fields = []
        if not user.name:
            user.name = name
            update_fields.append("name")
        if not user.nickname:
            user.nickname = nickname
            update_fields.append("nickname")
        if update_fields:
            user.save(update_fields=update_fields)

    # 3) oauth_account 생성 (unique(provider, provider_uid) 동시성 대비)
    try:
        OAuthAccount.objects.create(
            user=user,
            provider=PROVIDER_MATTERMOST,
            provider_uid=provider_uid,
            extra_data=userinfo,
        )
    except IntegrityError:
        oauth = OAuthAccount.objects.select_related("user").get(
            provider=PROVIDER_MATTERMOST, provider_uid=provider_uid
        )
        user = oauth.user

    return user


def issue_refresh_cookie_and_store_in_db(*, user: User, response: HttpResponse) -> Dict[str, str]:
    """
    - 이미 존재하는 issue_token_pair_for_user(user) 사용
    - refresh는 쿠키(HttpOnly)로 세팅
    - 서버 저장/무효화 운영은 SimpleJWT blacklist(outstanding/blacklist) 기반으로 충족됨
    """
    from django.conf import settings
    
    pair = issue_token_pair_for_user(user)  # {"refresh": "...", "access": "..."}
    max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    set_refresh_cookie(response, pair["refresh"], max_age_seconds=max_age)
    return pair
