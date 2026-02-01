// 로고/아바타/보드/공지 mock
export const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/2921/2921222.png";

export const AVATAR_PRESETS = [
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
  "/avatars/5.png",
  "/avatars/6.png",
  "/avatars/7.png",
  "/avatars/8.png",
];

export const MOCK_BOARDS = [
  {
    id: "b1",
    name: "14기 공지 전용",
    channels: [
      { id: "c1", name: "공지사항" },
      { id: "c2", name: "소통" },
      { id: "c3", name: "자주묻는 질문" },
      { id: "c4", name: "발표회 이벤트" },
      { id: "c5", name: "[취업] 공지사항" },
      { id: "c6", name: "[취업] 취업정보" },
      { id: "c7", name: "SSAFY 스터디" },
      { id: "c8", name: "AI News" },
      { id: "c9", name: "AI강의 II Q&A" },
      { id: "c10", name: "AI 챌린지" },
      { id: "c11", name: "라이브방송" },
    ],
  },
  {
    id: "b2",
    name: "14기 공통 대전 2반",
    channels: [
      { id: "c12", name: "공지사항" },
      { id: "c13", name: "잡담" },
    ],
  },
];

// 날짜 생성
const TODAY = new Date();
const Y = TODAY.getFullYear();
const M = TODAY.getMonth(); // 0-index

const createISO = (day, hour = 9, minute = 0) => new Date(Y, M, day, hour, minute).toISOString();

export const MOCK_POSTS = [
  {
    id: 1,
    title: "[필수] 1학기 관통 프로젝트 최종 기획안 제출 안내",
    category: "과제",
    boardId: "b1",
    channelId: "c1",
    startAt: createISO(20, 18),
    endAt: createISO(20, 18),
    scrapCount: 142,
  },
  {
    id: 2,
    title: "싸피레이스(SSAFY Race) 참가 신청 및 코스 안내",
    category: "행사",
    boardId: "b1",
    channelId: "c4",
    startAt: createISO(25, 9),
    endAt: createISO(25, 13),
    scrapCount: 56,
  },
  {
    id: 3,
    title: "알고리즘 주간 평가(IM/A형) 고사장 안내",
    category: "시험",
    boardId: "b2",
    channelId: "c12",
    startAt: createISO(21, 9),
    endAt: createISO(21, 12),
    scrapCount: 210,
  },
  {
    id: 4,
    title: "삼성전자 하반기 신입사원 채용 설명회",
    category: "취업",
    boardId: "b1",
    channelId: "c6",
    startAt: createISO(22, 9),
    endAt: createISO(24, 18),
    scrapCount: 89,
  },
  {
    id: 5,
    title: "관통 프로젝트 집중 개발 기간",
    category: "과제",
    boardId: "b1",
    channelId: "c1",
    startAt: createISO(27, 9),
    endAt: createISO(31, 18),
    scrapCount: 120,
  },
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: 100 + i,
    title: `알고리즘 스터디 모집합니다 (${i + 1}팀)`,
    category: "커뮤니티",
    boardId: "b1",
    channelId: "c7",
    startAt: createISO(20, 9),
    endAt: createISO(20, 10),
    scrapCount: i + 5,
  })),
].map((p) => ({
  ...p,
  createdAt: createISO(1, 9),
  rawContent:
    p.rawContent ||
    `${p.title}에 대한 상세 내용입니다.\n\n본문 내용이 여기에 들어갑니다.`,
  mmLink: p.mmLink || "https://mattermost.com",
}));
