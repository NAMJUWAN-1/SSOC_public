# 1. Node.js 20 버전 사용 (가볍고 안정적인 Alpine 리눅스 기반)
FROM node:20-alpine

# 2. 컨테이너 내부 작업 디렉토리 설정
WORKDIR /app

# 3. 패키지 파일 복사 (캐싱 효율을 위해 소스 코드보다 먼저 복사)
COPY package.json package-lock.json ./

# 4. 의존성 설치
RUN npm install

# 5. 소스 코드 전체 복사
COPY . .

# 6. Vite 기본 포트 개방
EXPOSE 5173

# 7. 개발 서버 실행
# --host 옵션은 도커 컨테이너 외부(내 컴퓨터)에서 브라우저로 접속하기 위해 필수입니다.
CMD ["npm", "run", "dev", "--", "--host"]