from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, name="", nickname="", password=None, **extra_fields):
        if not email:
            raise ValueError("email is required")
        email = self.normalize_email(email)

        user = self.model(email=email, name=name, nickname=nickname, **extra_fields)

        # OAuth-only 환경: 비밀번호 없이도 생성 가능 / set_password는 관리자 계정용
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, name="admin", nickname="admin", password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if not password:
            raise ValueError("superuser password is required")
        return self.create_user(email=email, name=name, nickname=nickname, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.BigAutoField(primary_key=True, db_column="user_id")

    # 이름은 mm 연동 데이터에서 받아 최초 세팅 후 유저 수정 불가
    # - editable=False: admin/form에서 수정 입력란 숨김(하드 강제는 API에서 read-only로 막을 예정)
    name = models.CharField(max_length=50, editable=False)

    nickname = models.CharField(max_length=20)
    email = models.EmailField(max_length=255, unique=True)

    profile_image_url = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # 계정 활성화/비활성화 여부, 관리자 계정 여부
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "nickname"]

    # DB 테이블명 설정
    class Meta:
        db_table = "user"
    # 객체를 User object (1) 대신 email (nickname) 표시하기 위한 편의기능 함수
    def __str__(self):
        return f"{self.email} ({self.nickname})"
    
    # SimpleJWT 호환성: user.id 접근 시 user_id 반환
    @property
    def id(self):
        return self.user_id
