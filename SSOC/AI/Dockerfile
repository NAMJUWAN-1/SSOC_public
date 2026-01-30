# 1. Python 3.11 Slim 버전 사용
FROM python:3.11-slim

# 2. 시스템 필수 패키지 설치 (psycopg2 및 pgvector 빌드용)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 의존성 설치 (서버 관련 라이브러리 제외됨)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 소스 코드 복사
COPY . .

# 6. 파이프라인 무한 루프 실행
# stdout 버퍼링을 해제하여 로그를 즉시 확인할 수 있도록 설정
ENV PYTHONUNBUFFERED=1

CMD ["python", "db_pipeline.py"]