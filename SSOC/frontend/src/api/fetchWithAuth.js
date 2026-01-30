import { getAccessToken, setAccessToken } from "./tokenManager";
import { refreshAccessToken } from "./authApi";

// Single-flight refresh (avoid multiple concurrent refresh calls)
let refreshPromise = null;

async function getFreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const token = await refreshAccessToken();
    // refreshAccessToken already setAccessToken, but keep it explicit
    setAccessToken(token);
    return token;
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function fetchWithAuth(url, options = {}) {
  let token = getAccessToken();

  // If token is missing (page refreshed), try refresh once (if cookie exists)
  if (!token) {
    try {
      token = await getFreshAccessToken();
    } catch {
      // ignore: proceed without token
    }
  }

  const doFetch = (tk) =>
    fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
        ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
      },
    });

  const res = await doFetch(token);

  if (res.status === 401) {
    // token expired or invalid -> refresh and retry once
    const newToken = await getFreshAccessToken();
    return doFetch(newToken);
  }

  return res;
}
