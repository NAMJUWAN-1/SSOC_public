import {
  setAccessToken,
  setUserId,
  getAccessToken,
  clearAccessToken,
} from "./tokenManager";

// Prefer relative base ("") + Vite proxy for /api to keep refresh cookie same-site.
// If you set VITE_API_BASE_URL (e.g. "https://api.example.com"), it will be used.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function apiUrl(path) {
  if (!API_BASE_URL) return path;
  // avoid double slashes
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function loginWithMattermost(loginId, password) {
  const res = await fetch(apiUrl("/api/auth/mm/login/"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login_id: loginId,
      password,
    }),
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Login failed");
  }

  const data = await res.json();

  if (!data?.access || !data?.user?.user_id) {
    throw new Error("Invalid login response");
  }

  setAccessToken(data.access);
  setUserId(data.user.user_id);

  return { accessToken: data.access, user: data.user };
}

export async function refreshAccessToken() {
  const res = await fetch(apiUrl("/api/auth/refresh/"), {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    // refresh failed -> treat as logged out
    clearAccessToken();
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Refresh failed");
  }

  const data = await res.json();
  if (!data?.access) {
    clearAccessToken();
    throw new Error("Invalid refresh response");
  }

  setAccessToken(data.access);
  return data.access;
}

export async function logoutBackend() {
  try {
    await fetch(apiUrl("/api/auth/logout/"), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  } finally {
    clearAccessToken();
  }
}

export async function fetchUserById(userId, accessToken = getAccessToken()) {
  const res = await fetch(apiUrl(`/api/users/?user_id=${encodeURIComponent(userId)}`), {
    method: "GET",
    credentials: "include",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Fetch user failed");
  }

  return await res.json();
}

async function safeErrorMessage(res) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
  } catch {
    // ignore
  }
  return "";
}
