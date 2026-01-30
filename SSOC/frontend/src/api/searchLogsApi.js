import { fetchWithAuth } from "./fetchWithAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
function apiUrl(path) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function requireOk(res, fallbackMsg) {
  if (res.ok) return;
  const data = await safeJson(res);
  const msg = data?.detail || data?.message || fallbackMsg;
  throw new Error(msg);
}

export async function listSearchLogs({ user_id, limit = 5 }) {
  const qs = new URLSearchParams();
  if (user_id != null) qs.set("user_id", String(user_id));
  if (limit != null) qs.set("limit", String(limit));

  const res = await fetchWithAuth(apiUrl(`/api/search-logs/?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "검색 기록을 불러오지 못했습니다.");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createSearchLog({ keyword }) {
  const res = await fetchWithAuth(apiUrl("/api/search-logs/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
  });
  await requireOk(res, "검색 기록 저장에 실패했습니다.");
  return await res.json();
}

export async function deleteSearchLog(search_log_id) {
  const res = await fetchWithAuth(apiUrl(`/api/search-logs/${encodeURIComponent(search_log_id)}/`), {
    method: "DELETE",
  });
  await requireOk(res, "검색 기록 삭제에 실패했습니다.");
  return true;
}

export async function clearSearchLogs({ user_id }) {
  const qs = new URLSearchParams();
  if (user_id != null) qs.set("user_id", String(user_id));
  const res = await fetchWithAuth(apiUrl(`/api/search-logs/?${qs.toString()}`), {
    method: "DELETE",
  });
  await requireOk(res, "검색 기록 전체 삭제에 실패했습니다.");
  return true;
}
