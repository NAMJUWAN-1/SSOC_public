// NOTE:
// Vite dev server 기본 포트(5173)를 쓰면 다른 프로젝트와 localStorage(origin)가 겹칠 수 있습니다.
// 예: 다른 앱이 'access_token'을 저장해두면 이 앱이 "로그인 된 것"으로 오인할 수 있음.
// 그래서 SSOC 전용 네임스페이스 키를 사용합니다.
const ACCESS_TOKEN_KEY = "ssoc_access_token";
const USER_ID_KEY = "ssoc_user_id";

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function setUserId(userId) {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}
