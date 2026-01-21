# 1. Python 3.10 사용
FROM python:3.10-slim

# 2. PostgreSQL 클라이언트 및 빌드 툴 설치 (psycopg2 패키지 설치용)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 소스 코드 복사
COPY . .

# 6. Django 포트 개방
EXPOSE 8000

# 7. 서버 실행 (개발용 runserver, 외부 접속 허용)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]