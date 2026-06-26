# 💬SSOC
#### "흩어진 공지에서 내 일정만 쏙!"
![썸네일](./SSOC/docs/assets/프로젝트소개.png)
<div align="center">
<video src="./SSOC/docs/assets/프로젝트_영상자료.mp4" width="100%" autoplay loop muted playsinline controls></video></div>

## 1️⃣ 프로젝트 소개
**SSOC**은 쏟아지는 Mattermsot 공지에서 내 검색 의도에 맞게 정보를 **쏙** 찾아내고, 중요한 일정을 캘린더에 **쏙** 담으며, 잊기 쉬운 공지는 나만의 보관함에 **쏙** 넣어 관리할 수 있도록 하는 서비스입니다.


## 2️⃣ 프로젝트 기간
2026.01.06 ~ 2026.02.09 (5주)


## 3️⃣ 주요 기능
#### ① 검색 & 필터
- 키워드 기반 검색과 의미 기반 유사도 검색을 모두 지원함으로써 Mattermost의 검색 기능보다 빠르고 정확한 검색을 지원함
- 보드, 채널, 카테고리별 필터를 걸어 정보를 정확하게 골라냄

#### ② 캘린더
- AI가 본문 내 날짜와 시간 정보를 분석해 자동으로 일정을 추출함
- 일정을 캘린더로 표현하며 하루 일정을 한눈에 파악함

#### ③ 아카이빙
- 휘발되기 쉬운 실시간 메시지 중 중요한 내용만 선택하여 아카이브에 넣어 영구적으로 보관함


## 4️⃣ 기술 스택

### **Backend**
<img src="https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white"> <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=Flask&logoColor=white"> <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white"> <img src="https://img.shields.io/badge/Mattermost%20API-0058CC?style=for-the-badge&logo=mattermost&logoColor=white"> <img src="https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white">

### **Frontend**
<img src="https://img.shields.io/badge/Vite_5.3.1-646CFF?style=for-the-badge&logo=Vite&logoColor=white"> <img src="https://img.shields.io/badge/React_18.3.1-61DAFB?style=for-the-badge&logo=React&logoColor=white"> <img src="https://img.shields.io/badge/axios-5A29E4?style=for-the-badge&logo=styledcomponents&logoColor=white"> <img src="https://img.shields.io/badge/Node.js_20.15.0-339933?style=for-the-badge&logo=Node.js&logoColor=white">

### **Infra**
<img src="https://img.shields.io/badge/gitlab%20ci/cd-%23181717.svg?style=for-the-badge&logo=gitlab&logoColor=white"> <img src="https://img.shields.io/badge/AWS%20EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"> <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=Jenkins&logoColor=white"> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=white"> <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=NGINX&logoColor=white"> 

### **Communication**

<img src="https://img.shields.io/badge/Git(Gitlab)-FCA121?style=for-the-badge&logo=Gitlab&logoColor=white"> <img src="https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=Jira&logoColor=white"> <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=Notion&logoColor=white"> <img src="https://img.shields.io/badge/Mattermost-0058CC?style=for-the-badge&logo=Mattermost&logoColor=white"> <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=Figma&logoColor=white">

## 5️⃣ 프로젝트 폴더 구조
### Back-end
<details>
  <summary>펼쳐보기</summary>
  
  ```plantext
SSOC
  ├───config
      ├───.idea
      ├───config
      └───local_apps
          ├───archives
          ├───boards
          ├───calendar_events    
          ├───categories        
          ├───channels          
          ├───oauth_accounts          
          ├───post_raws
          ├───posts    
          ├───search_logs    
          ├───tokens    
          ├───user_info
          └───utils
  ```
</details>

### Front-end
<details>
<summary>펼쳐보기</summary>

```plantext
SSOC
  ├───node_modules
  ├───public
  │   ├───avatars
  │   └───fonts
  └───src
      ├───api
      ├───assets
      ├───components
      │   ├───calendar
      │   ├───common
      │   ├───filter
      │   ├───layout
      │   ├───modals
      │   ├───navigation
      │   ├───posts
      │   ├───search
      │   └───ui
      ├───data
      ├───layouts
      ├───pages
      ├───state
      ├───styles
      └───utils
```
</details>

### Data
<details>
<summary>펼쳐보기</summary>

```plantext
AI/
│
├── categorizing/ # 데이터 카테고리 생성
│   ├── logs/
│   ├── .env
│   ├── category_processor.py
│   ├── db_handler.py
│   ├── main.py   # 메인 파일
│   ├── track_a.py
│   └── track_b.py
├── modules/     # raw data 정제 모듈 
│   ├── ai_extractor.py
│   ├── embedding.py
│   ├── message_cleaner.py
│   ├── message_merger.py
│   └── mm_validator.py
├── database.py
├── db_pipeline.py   # 모듈 실행 파일
├── Dockerfile
├── main.py          # mattermost webhook 연결 파일
└── requirements.txt
```
</details>

## 6️⃣ Git 협업 전략

- [Branch 전략](https://www.notion.so/Branch-2e00f2fa8a2080e6afd4f14528bbffc8?source=copy_link)
- [커밋 메시지 전략](https://www.notion.so/2e00f2fa8a208065b0b6da6960d3d10e?source=copy_link)
- [Pull Request 전략](https://www.notion.so/Pull-Request-2e00f2fa8a2080d6bf26ff0c2c11c43f?source=copy_link)

## 7️⃣ 개발 문서
- [개발 문서](https://www.notion.so/3030f2fa8a20809b9fbbe0a13accd8fa?source=copy_link)

## 8️⃣ 프로젝트 산출물

- [기능명세서](./SSOC/docs/기능명세서.md)
- [와이어프레임](./SSOC/docs/와이어프레임.md)
- [API명세서](./SSOC/docs/API명세서.md)
- [ERD](./SSOC/docs/ERD.md)
- [아키텍처](./SSOC/docs/아키텍처.md)

## 9️⃣ 프로젝트 결과물

- [포팅메뉴얼](./SSOC/exec/README.md)
- [중간발표자료](./SSOC/docs/프로젝트_중간발표_PPT.pptx)
- [최종발표자료](./SSOC/docs/프로젝트_최종발표_PPT.pptx)

# SSOC

- 문제 정의
  1. 정보의 휘발성과 매몰
  2. 비효율적인 검색과 파편화된 채널
  3. 플랫폼 간의 단절과 수동 프로세스
- 프로젝트 목표
  1. 정보의 아카이빙과 구조화
  2. 추천 중심의 캘린더 인터페이스 구현
  3. 원문 연동을 통한 맥락 연결

# Git 협업 전략

- [Branch 전략](https://www.notion.so/Branch-2e00f2fa8a2080e6afd4f14528bbffc8?source=copy_link)
- [커밋 메시지 전략](https://www.notion.so/2e00f2fa8a208065b0b6da6960d3d10e?source=copy_link)
- [Pull Request 전략](https://www.notion.so/Pull-Request-2e00f2fa8a2080d6bf26ff0c2c11c43f?source=copy_link)
