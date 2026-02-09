# 📑 포팅 매뉴얼 - SSOC

이 문서는 **SSOC** 프로젝트의 빌드 및 배포를 위한 상세 가이드를 포함합니다. 모든 소스코드는 GitLab 레포지토리를 기준으로 하며, `exec` 폴더 내의 정보를 바탕으로 환경을 구성합니다.

## 1. 빌드 및 배포 가이드

### 1) 개발 환경 및 도구 버전

**IDE**: Visual Studio Code

**OS**: Ubuntu 20.04 LTS (AWS EC2)

**Language & Runtime**:
* Python: 3.10+
* Node.js: 18.x (LTS)


**Framework**:
* Backend: Django 4.2+
* Frontend: React 18.x


**Web Server & WAS**:
* Nginx: 1.18.0
* Gunicorn (Django WAS)


**Database**: PostgreSQL 15 (with `pgvector` extension)

**Infrastructure**: Docker, Docker Compose

### 2) 빌드 시 사용되는 환경 변수 (.env)

빌드 및 실행 전, 프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 항목들을 설정해야 합니다.

```env
# Database Settings
DB_NAME=b209_service_db
DB_USER=b209_master
DB_PASSWORD=your_secure_password
DB_HOST=ssafy_db
DB_PORT=5432

# Django Settings
DJANGO_SECRET_KEY=your_django_secret_key
DEBUG=False

# Mattermost Integration
MM_BASE_URL=https://meeting.ssafy.com

# AWS EC2
EC2_DOMAIN=i14b209.p.ssafy.io

# GMS KEY
GMS_KEY = your_gms_key
GMS_EMBEDDING_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings
EMBEDDING_MODEL=text-embedding-3-small

```

### 3) 배포 시 특이사항

* **Docker Compose**: 모든 서비스(Django, React, PostgreSQL, Nginx)는 Docker Compose를 통해 컨테이너화되어 관리됩니다.
* **pgvector 설정**: PostgreSQL 컨테이너 실행 후, 벡터 검색 기능을 위해 반드시 `CREATE EXTENSION vector;` 명령어가 실행되어야 합니다. (초기 SQL 스크립트에 포함됨)
* **SSL 적용**: Nginx를 통해 HTTPS 설정을 권장하며, SSAFY에서 제공하는 도메인 및 인증서를 활용합니다.

### 4) DB 접속 정보 및 주요 파일 목록

* **DB 접속 계정**: `b209_service_db` / (비밀번호 별도 관리)
* **ERD 활용 파일**: `/backend/` 기능별 `models.py` (Django ORM을 통한 데이터 모델 정의)
* **주요 설정 파일**:
* `docker-compose.yml`: 전체 컨테이너 오케스트레이션 설정
* `settings.py`: Django 전반의 프로퍼티 정의



---

## 2. 외부 서비스 정보

프로젝트 기능 구현을 위해 사용된 외부 서비스 정보입니다.

* **Mattermost API**:
* 용도: 공지사항 아카이브 및 알림 연동
* 필요 정보: Channel ID, Mattermost URL


* **GMS API (또는 관련 LLM)**:
* 용도: 공지사항 요약 및 벡터 임베딩 생성
* 필요 정보: API Key

---

## 3. DB 덤프 파일 최신본

* **파일명**: `ssoc_dump_20260209.sql`
* **위치**: `/exec/db_dump/ssoc_dump_20260209.sql`
* **복구 방법**:
```bash
docker exec -i ssafy_db psql -U b209_master -d ssocb209_service_db_db < ssoc_dump_20260209.sql
```

---

## 4. 시연 시나리오

| 순서 | 화면/기능 | 실행 내용 (액션) | 비고 |
| --- | --- | --- | --- |
| 1 | **로그인 페이지** | Mattermost 계정 또는 지정된 관리자 계정으로 로그인 |  |
| 2 | **대시보드** | 연동된 Mattermost 채널의 최근 공지사항 목록 확인 | 데이터 동기화 확인 |
| 3 | **공지사항 검색** | 검색창에 키워드 또는 질문 입력 (예: "시험 일정 알려줘") | **pgvector** 기반 유사도 검색 작동 |
| 4 | **상세 보기** | 특정 공지 클릭 시 AI 요약 내용 및 원문 확인 |  |
| 5 | **아카이빙** | 특정 공지 아카이빙 시 마이페이지 내 아카이빙 확인 |  |

## 5. 주기적 작업 설정 (Crontab)
서비스 운영 및 데이터 최신화를 위해 서버 OS(Ubuntu)의 crontab에 아래 작업들이 등록되어야 합니다.

1) 설정 방법
터미널에서 아래 명령어를 입력하여 편집기를 엽니다.

```bash
crontab -e
```
2) 등록할 작업 목록
프로젝트 루트 경로 및 컨테이너 이름을 확인하여 아래 내용을 파일 하단에 추가합니다.


- 매월 1일 00시 00분에 매터모스트 데이터 동기화

```bash
0 0 1 * * cd /home/ubuntu/jenkins-data/workspace/SSOC_pipeline/SSOC/AI/categorizing && ./venv/bin/python main.py >> cron_log.txt 2>&1
```