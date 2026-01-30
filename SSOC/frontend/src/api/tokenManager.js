// In-memory token store (✅ no localStorage)
//
// - access token: memory only
// - refresh token: backend-managed HttpOnly cookie
// - refresh flow: /api/auth/refresh/ -> { access }

let accessToken = null;
let userId = null;

const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try {
      fn({ accessToken, userId });
    } catch {
      // ignore
    }
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
  notify();
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  userId = null;
  notify();
}

export function setUserId(id) {
  userId = id ?? null;
  notify();
}

export function getUserId() {
  return userId;
}

// optional subscription (debug/UI sync)
export function subscribeTokenStore(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
