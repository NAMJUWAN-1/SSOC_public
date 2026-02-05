import { getAccessToken, setAccessToken } from "./tokenManager";
import { refreshAccessToken } from "./authApi";

let refreshPromise = null;

async function getFreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const token = await refreshAccessToken();
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

  if (!token) {
    try {
      token = await getFreshAccessToken();
    } catch {
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
    const hasSession = localStorage.getItem("ssoc_has_session") === "true";
    if (!hasSession) return res;

    const newToken = await getFreshAccessToken();
    return doFetch(newToken);
  }

  return res;
}
