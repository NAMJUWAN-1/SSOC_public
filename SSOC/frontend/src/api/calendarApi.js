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

export function normalizeCalendarEvent(raw) {
  if (!raw) return null;
  return {
    id: raw.calendar_event_id ?? raw.id ?? raw.calendarEventId,
    title: raw.title ?? raw.name ?? "일정",
    content: raw.content ?? raw.description ?? "",
    startAt: raw.start_at ?? raw.startAt,
    endAt: raw.end_at ?? raw.endAt ?? raw.start_at ?? raw.startAt,
    category: raw.category ?? raw.category_name ?? raw.categoryName ?? "기타",
    color: raw.color,
    postId: raw.post_id ?? raw.postId ?? null,
    mmLink: raw.mm_link ?? raw.mmLink ?? raw.link ?? null,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

/**
 * GET /api/users/{user_id}/calendars
 */
export async function listCalendars({ user_id }) {
  const res = await fetchWithAuth(apiUrl(`/api/users/${encodeURIComponent(user_id)}/calendars`), { method: "GET" });
  await requireOk(res, "캘린더 정보를 불러오지 못했습니다.");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * GET /api/calendar-events?user_id={user_id}&start={start_at}&end={end_at}
 */
export async function listCalendarEvents({ user_id, start, end }) {
  const qs = new URLSearchParams();
  if (user_id != null) qs.set("user_id", String(user_id));
  if (start) qs.set("start", String(start));
  if (end) qs.set("end", String(end));

  const res = await fetchWithAuth(apiUrl(`/api/calendar-events?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "캘린더 일정을 불러오지 못했습니다.");
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  return arr.map(normalizeCalendarEvent).filter(Boolean);
}

/**
 * GET /api/posts?post_id={post_id}
 * - backend 구현이 query param 기반일 수 있어 tolerance를 둠
 */
export async function getPostForCalendar({ post_id }) {
  const qs = new URLSearchParams();
  qs.set("post_id", String(post_id));
  const res = await fetchWithAuth(apiUrl(`/api/posts?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "공지 정보를 불러오지 못했습니다.");
  const data = await res.json();
  // sometimes returns list
  return Array.isArray(data) ? data[0] : data;
}

/**
 * POST /api/calendar-events
 */
export async function createCalendarEvent(payload) {
  const res = await fetchWithAuth(apiUrl(`/api/calendar-events`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await requireOk(res, "캘린더 일정 등록에 실패했습니다.");
  const data = await res.json();
  return normalizeCalendarEvent(data) || data;
}

/**
 * PATCH /api/calendar-events/{calendar_event_id}
 */
export async function patchCalendarEvent(calendar_event_id, patch) {
  const res = await fetchWithAuth(apiUrl(`/api/calendar-events/${encodeURIComponent(calendar_event_id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  await requireOk(res, "캘린더 일정 수정에 실패했습니다.");
  const data = await res.json();
  return normalizeCalendarEvent(data) || data;
}

/**
 * DELETE /api/calendar-events/{calendar_event_id}
 */
export async function deleteCalendarEvent(calendar_event_id) {
  const res = await fetchWithAuth(apiUrl(`/api/calendar-events/${encodeURIComponent(calendar_event_id)}`), {
    method: "DELETE",
  });
  await requireOk(res, "캘린더 일정 삭제에 실패했습니다.");
  return true;
}
