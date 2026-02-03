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

/*
 *Create archive
 */
export async function createArchive({ user_id, post_id }) {
  const res = await fetchWithAuth(apiUrl(`/api/archives/`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, post_id }),
  });
  await requireOk(res, "아카이브 생성에 실패했습니다.");
  return await res.json();
}

/*
 * Delete archive
 */
export async function deleteArchive({ user_id, archive_id }) {
  const res = await fetchWithAuth(
    apiUrl(`/api/archives/${encodeURIComponent(archive_id)}/`),
    { method: "DELETE" }
  );
  await requireOk(res, "아카이브 삭제에 실패했습니다.");
  return true;
}

/*
 * My archives list
 */
export async function listMyArchives({ user_id }) {
  const qs = new URLSearchParams();
  if (user_id != null) qs.set("user_id", String(user_id));
  const res = await fetchWithAuth(apiUrl(`/api/archives/?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "아카이브 목록을 불러오지 못했습니다.");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/*
 * Count my archives
 */
export async function countMyArchives({ user_id }) {
  const qs = new URLSearchParams();
  if (user_id != null) qs.set("user_id", String(user_id));
  const res = await fetchWithAuth(apiUrl(`/api/archives/count?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "아카이브 개수를 불러오지 못했습니다.");
  const data = await safeJson(res);
  // be tolerant: number | {count} | {total}
  if (typeof data === "number") return data;
  if (typeof data?.count === "number") return data.count;
  if (typeof data?.total === "number") return data.total;
  return 0;
}

/*
 * Archive ranking
 */
export async function listArchiveRanking() {
  const res = await fetchWithAuth(apiUrl(`/api/rankings/archives`), { method: "GET" });
  await requireOk(res, "아카이브 랭킹을 불러오지 못했습니다.");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
