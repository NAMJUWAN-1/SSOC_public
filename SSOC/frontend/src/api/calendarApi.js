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
    title: raw.custom_title ?? raw.title ?? raw.name ?? "일정",
    content: raw.custom_content ?? raw.content ?? raw.description ?? "",
    startAt: raw.custom_start_at ?? raw.start_at ?? raw.startAt,
    endAt: raw.custom_end_at ?? raw.end_at ?? raw.endAt ?? raw.custom_start_at ?? raw.start_at ?? raw.startAt,
    category: raw.category ?? raw.category_name ?? raw.categoryName ?? "기타",
    color: raw.color,
    postId: raw.post_id ?? raw.postId ?? null,
    mmLink: raw.mm_link ?? raw.mmLink ?? raw.link ?? null,
    createdAt: raw.created_at ?? raw.createdAt,
    boardName: raw.board_name ?? raw.boardName,
    channelName: raw.channel_name ?? raw.channelName,
  };
}

/**
 * GET /api/users/{user_id}/calendars
 */
export async function listCalendars({ user_id }) {
  const res = await fetchWithAuth(apiUrl(`/api/users/${encodeURIComponent(user_id)}/calendars/`), { method: "GET" });
  await requireOk(res, "캘린더 정보를 불러오지 못했습니다.");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * GET /api/calendar-events/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
export async function listCalendarEvents({ user_id, start, end }) {
  const qs = new URLSearchParams();
  // 명세서에 따르면 start_date, end_date를 사용하여 서버 사이드 필터링 권장
  if (start) qs.set("start_date", String(start).split("T")[0]); // YYYY-MM-DD 형식 추출 적극 시도
  if (end) qs.set("end_date", String(end).split("T")[0]);

  const res = await fetchWithAuth(apiUrl(`/api/calendar-events/?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "캘린더 일정을 불러오지 못했습니다.");
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  return arr.map(normalizeCalendarEvent).filter(Boolean);
}

/**
 * GET /api/calendar-events/?calendar_event_id={id}
 * 명세서: 주의: ID를 Path Variable이 아닌 Query Parameter로 넘기는 방식
 */
export async function getCalendarEventDetail(calendar_event_id) {
  const qs = new URLSearchParams();
  qs.set("calendar_event_id", String(calendar_event_id));
  const res = await fetchWithAuth(apiUrl(`/api/calendar-events/?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "일정 상세 정보를 불러오지 못했습니다.");
  const data = await res.json();
  return Array.isArray(data) ? normalizeCalendarEvent(data[0]) : normalizeCalendarEvent(data);
}

/**
 * GET /api/posts?post_id={post_id}
 */
export async function getPostForCalendar({ post_id }) {
  const qs = new URLSearchParams();
  qs.set("post_id", String(post_id));
  const res = await fetchWithAuth(apiUrl(`/api/posts/?${qs.toString()}`), { method: "GET" });
  await requireOk(res, "공지 정보를 불러오지 못했습니다.");
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * POST /api/calendar-events/
 */
export async function createCalendarEvent(payload) {
  // 명세서 필드명으로 변환
  const mapped = {
    custom_title: payload.title,
    custom_content: payload.content,
    custom_start_at: payload.start_at,
    custom_end_at: payload.end_at,
    mm_link: payload.mm_link,
    color: payload.color,
    board_name: payload.board_name,
    channel_name: payload.channel_name,
  };

  const res = await fetchWithAuth(apiUrl(`/api/calendar-events/`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapped),
  });
  await requireOk(res, "캘린더 일정 등록에 실패했습니다.");
  const data = await res.json();
  return normalizeCalendarEvent(data) || data;
}

/**
 * PATCH /api/calendar-events/{id}/
 */
export async function patchCalendarEvent(calendar_event_id, patch) {
  // 명세서 필드명으로 변환
  const mapped = {};
  if (patch.title !== undefined) mapped.custom_title = patch.title;
  if (patch.content !== undefined) mapped.custom_content = patch.content;
  if (patch.startAt !== undefined || patch.start_at !== undefined) {
    mapped.custom_start_at = patch.startAt ?? patch.start_at;
  }
  if (patch.endAt !== undefined || patch.end_at !== undefined) {
    mapped.custom_end_at = patch.endAt ?? patch.end_at;
  }
  if (patch.color !== undefined) mapped.color = patch.color;

  const res = await fetchWithAuth(apiUrl(`/api/calendar-events/${encodeURIComponent(calendar_event_id)}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapped),
  });
  await requireOk(res, "캘린더 일정 수정에 실패했습니다.");
  const data = await res.json();
  return normalizeCalendarEvent(data) || data;
}

/**
 * DELETE /api/calendar-events/{id}/
 */
export async function deleteCalendarEvent(calendar_event_id) {
  const res = await fetchWithAuth(apiUrl(`/api/calendar-events/${encodeURIComponent(calendar_event_id)}/`), {
    method: "DELETE",
  });
  await requireOk(res, "캘린더 일정 삭제에 실패했습니다.");
  return true;
}

