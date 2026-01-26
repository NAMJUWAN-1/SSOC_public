import { getAccessToken } from "./tokenManager";
import { refreshAccessToken } from "./authApi";

export async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken();

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    await refreshAccessToken();

    const retryToken = getAccessToken();

    return fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
        ...(retryToken ? { Authorization: `Bearer ${retryToken}` } : {}),
      },
    });
  }

  return res;
}
