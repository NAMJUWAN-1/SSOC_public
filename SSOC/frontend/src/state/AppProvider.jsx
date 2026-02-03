import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import { loginWithMattermost, refreshAccessToken, logoutBackend } from "../api/authApi";
import { fetchWithAuth } from "../api/fetchWithAuth";
import { getAccessToken, clearAccessToken, getUserId, setUserId } from "../api/tokenManager";
import {
  createArchive,
  deleteArchive,
  listMyArchives,
  countMyArchives,
} from "../api/archiveApi";
import {
  listCalendarEvents,
  createCalendarEvent as apiCreateCalendarEvent,
  patchCalendarEvent,
  deleteCalendarEvent as apiDeleteCalendarEvent,
  getPostForCalendar,
} from "../api/calendarApi";


const AppContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
function apiUrl(path) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const EMPTY_USER = {
  user_id: null,
  email: "",
  name: "",
  nickname: "",
  profile_image_url: null,
  channels: [],
};

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getUserIdFromAccessToken(token) {
  const p = decodeJwtPayload(token);
  return p?.user_id ?? p?.userId ?? p?.sub ?? null;
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

function normalizeUser(raw) {
  const u = Array.isArray(raw) ? raw[0] : raw;
  return {
    ...EMPTY_USER,
    ...(u || {}),
    profile_image_url: (u?.profile_image_url ?? null) || null,
    nickname: u?.nickname ?? u?.name ?? "",
    channels: Array.isArray(u?.channels) ? u.channels : [],
  };
}

const initialState = {
  loading: true,
  isAuthenticated: false,
  user: { ...EMPTY_USER },
  profileCompleted: false,

  auth: {
    status: "loading",
    isAuthenticated: false,
    user: { ...EMPTY_USER },
  },

  posts: [],
  archives: new Set(),
  archivedPosts: [],
  archiveIdByPostId: {},
  archiveCount: 0,
  calendarEvents: [],
  calendars: [],

  modals: {
    postDetail: { open: false, payload: null, mode: "post" },
    calendarEvent: { open: false, payload: null, mode: "create" },
    editProfile: { open: false },
    profileSetup: { open: false, force: false, redirectTo: null },
    confirm: { open: false, type: null, payload: null },
    toast: { open: false, message: "" },
  },
  dashboardCache: {
    scopePosts: [],
    rankingPosts: [],
    lastUpdated: null,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "APP/RESET": {
      return {
        ...initialState,
        loading: false,
        auth: { ...initialState.auth, status: "ready" },
      };
    }
    case "APP/LOADING": {
      return {
        ...state,
        loading: !!action.loading,
        auth: { ...state.auth, status: action.loading ? "loading" : "ready" },
      };
    }
    case "AUTH/SET": {
      const user = action.user ?? state.user;
      return {
        ...state,
        isAuthenticated: !!action.isAuthenticated,
        user,
        auth: {
          ...state.auth,
          isAuthenticated: !!action.isAuthenticated,
          user,
          status: "ready",
        },
      };
    }
    case "PROFILE/SET_COMPLETED": {
      return { ...state, profileCompleted: !!action.completed };
    }

    case "ARCHIVES/SET": {
      return {
        ...state,
        archives: action.archives,
        archivedPosts: action.archivedPosts ?? state.archivedPosts,
        archiveIdByPostId: action.archiveIdByPostId ?? state.archiveIdByPostId,
        archiveCount: typeof action.archiveCount === "number" ? action.archiveCount : state.archiveCount,
      };
    }

    case "ARCHIVES/SET_MAP_ITEM": {
      const next = { ...(state.archiveIdByPostId || {}) };
      if (action.archiveId == null) delete next[action.postId];
      else next[action.postId] = action.archiveId;
      return { ...state, archiveIdByPostId: next };
    }
    case "ARCHIVES/SET_COUNT": {
      return { ...state, archiveCount: typeof action.count === "number" ? action.count : state.archiveCount };
    }
    case "CALENDARS/SET": {
      return { ...state, calendars: action.calendars || [] };
    }

    case "CALENDAR/SET": {
      return { ...state, calendarEvents: action.events };
    }
    case "CALENDAR/ADD": {
      return { ...state, calendarEvents: [action.event, ...state.calendarEvents] };
    }
    case "CALENDAR/UPDATE": {
      return {
        ...state,
        calendarEvents: state.calendarEvents.map((ev) =>
          ev.id === action.eventId ? { ...ev, ...action.patch } : ev
        ),
      };
    }
    case "CALENDAR/DELETE": {
      return {
        ...state,
        calendarEvents: state.calendarEvents.filter((ev) => ev.id !== action.eventId),
      };
    }

    case "MODAL/OPEN_POST_DETAIL": {
      return {
        ...state,
        modals: {
          ...state.modals,
          postDetail: { open: true, payload: action.payload, mode: action.mode },
        },
      };
    }
    case "MODAL/UPDATE_POST_DETAIL_PAYLOAD": {
      // Keep modal open, only replace payload fields
      if (!state.modals?.postDetail?.open) return state;
      return {
        ...state,
        modals: {
          ...state.modals,
          postDetail: {
            ...state.modals.postDetail,
            payload: { ...(state.modals.postDetail.payload || {}), ...(action.payload || {}) },
          },
        },
      };
    }
    case "MODAL/CLOSE_POST_DETAIL": {
      return {
        ...state,
        modals: {
          ...state.modals,
          postDetail: { open: false, payload: null, mode: "post" },
        },
      };
    }
    case "MODAL/OPEN_CALENDAR_EVENT": {
      return {
        ...state,
        modals: {
          ...state.modals,
          calendarEvent: { open: true, mode: action.mode, payload: action.payload ?? null },
        },
      };
    }
    case "MODAL/CLOSE_CALENDAR_EVENT": {
      return {
        ...state,
        modals: {
          ...state.modals,
          calendarEvent: { open: false, payload: null, mode: "create" },
        },
      };
    }

    case "MODAL/OPEN_PROFILE_SETUP": {
      return {
        ...state,
        modals: {
          ...state.modals,
          profileSetup: {
            open: true,
            force: !!action.force,
            redirectTo: action.redirectTo ?? null,
          },
        },
      };
    }
    case "MODAL/CLOSE_PROFILE_SETUP": {
      return {
        ...state,
        modals: {
          ...state.modals,
          profileSetup: { open: false, force: false, redirectTo: null },
        },
      };
    }

    case "MODAL/OPEN_CONFIRM": {
      return {
        ...state,
        modals: {
          ...state.modals,
          confirm: { open: true, type: action.confirmType, payload: action.payload ?? null },
        },
      };
    }
    case "MODAL/CLOSE_CONFIRM": {
      return { ...state, modals: { ...state.modals, confirm: { open: false, type: null, payload: null } } };
    }
    case "TOAST/OPEN": {
      return {
        ...state,
        modals: {
          ...state.modals,
          toast: { open: true, message: action.message },
        },
      };
    }
    case "TOAST/CLOSE": {
      return {
        ...state,
        modals: {
          ...state.modals,
          toast: { open: false, message: "" },
        },
      };
    }
    case "DASHBOARD/SET_CACHE": {
      return {
        ...state,
        dashboardCache: {
          ...state.dashboardCache,
          ...action.payload,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    default:
      return state;
  }
}

// access-token auto refresh timer (optional)
function scheduleRefreshFactory(refreshFn) {
  let timer = null;
  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (accessToken) => {
    clear();
    const p = decodeJwtPayload(accessToken);
    const exp = p?.exp ? p.exp * 1000 : null;
    if (!exp) return;
    const delay = Math.max(0, exp - Date.now() - 30_000); // 30s before expiry
    timer = setTimeout(async () => {
      try {
        const t = await refreshFn();
        schedule(t);
      } catch {
        // ignore: fetchWithAuth will attempt refresh on 401
      }
    }, delay);
  };

  return { schedule, clear };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const refreshTimer = useRef(null);

  // ---- Auth bootstrap (no localStorage) ----
  useEffect(() => {
    let alive = true;

    const refreshTimerApi = scheduleRefreshFactory(async () => {
      const token = await refreshAccessToken();
      return token;
    });
    refreshTimer.current = refreshTimerApi;

    const bootstrap = async () => {
      dispatch({ type: "APP/LOADING", loading: true });

      try {
        let token = getAccessToken();

        // If access token not present (e.g. page reload), use refresh cookie
        if (!token) {
          token = await refreshAccessToken();
        }

        const id = getUserId() ?? getUserIdFromAccessToken(token);
        if (!id) throw new Error("Cannot determine user_id from access token");
        setUserId(id);

        const res = await fetchWithAuth(apiUrl(`/api/users/?user_id=${encodeURIComponent(id)}`), { method: "GET" });
        await requireOk(res, "Fetch user failed");
        const raw = await res.json();
        const user = normalizeUser(raw);

        if (!alive) return;
        dispatch({ type: "AUTH/SET", isAuthenticated: true, user });
        dispatch({ type: "PROFILE/SET_COMPLETED", completed: !!user.profile_image_url });

        // First login -> force profile setup
        if (!user.profile_image_url) {
          dispatch({ type: "MODAL/OPEN_PROFILE_SETUP", force: true, redirectTo: null });
        }

        // best-effort preload (backend 미구현 시에도 무시됨)
        try {
          loadMyArchives(id);
        } catch { }
        try {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
          fetchCalendarEvents({ start, end });
        } catch { }

        // optional scheduled refresh
        refreshTimerApi.schedule(token);
      } catch {
        if (!alive) return;
        clearAccessToken();
        dispatch({ type: "AUTH/SET", isAuthenticated: false, user: { ...EMPTY_USER } });
        dispatch({ type: "PROFILE/SET_COMPLETED", completed: false });
      } finally {
        if (!alive) return;
        dispatch({ type: "APP/LOADING", loading: false });
      }
    };

    bootstrap();

    return () => {
      alive = false;
      refreshTimerApi.clear();
    };
  }, []);

  // ---- Auth actions ----
  const loginWithPassword = async (loginId, password) => {
    dispatch({ type: "APP/LOADING", loading: true });
    try {
      const { accessToken, user: basicUser } = await loginWithMattermost(loginId, password);
      const id = basicUser?.user_id ?? getUserIdFromAccessToken(accessToken);
      if (!id) throw new Error("Login succeeded but user_id is missing");
      setUserId(id);

      // fetch full profile (nickname/profile_image_url/channels)
      const res = await fetchWithAuth(apiUrl(`/api/users/?user_id=${encodeURIComponent(id)}`), { method: "GET" });
      await requireOk(res, "Fetch user failed");
      const raw = await res.json();
      const user = normalizeUser(raw);

      dispatch({ type: "AUTH/SET", isAuthenticated: true, user });
      dispatch({ type: "PROFILE/SET_COMPLETED", completed: !!user.profile_image_url });

      // Immediate Archive Sync
      try {
        await loadMyArchives(id);
      } catch (e) {
        console.warn("[archives] initial load failed during login:", e);
      }

      if (!user.profile_image_url) {
        dispatch({ type: "MODAL/OPEN_PROFILE_SETUP", force: true, redirectTo: null });
      }

      // schedule token refresh
      refreshTimer.current?.schedule(accessToken);

      return user;
    } finally {
      dispatch({ type: "APP/LOADING", loading: false });
    }
  };

  const logout = async () => {
    refreshTimer.current?.clear();
    await logoutBackend();
    dispatch({ type: "APP/RESET" });
  };

  const deleteAccount = async () => {
    const id = state.user?.user_id;
    if (!id) throw new Error("No user_id");

    const res = await fetchWithAuth(apiUrl(`/api/users/${encodeURIComponent(id)}/`), { method: "DELETE" });
    await requireOk(res, "회원 탈퇴에 실패했습니다.");

    await logout();
  };

  // ---- Domain actions (API-ready, with local fallback) ----
  const getCurrentUserId = () => state.auth?.user?.user_id ?? state.user?.user_id ?? getUserId();

  const loadMyArchives = async (overrideUserId) => {
    const userId = overrideUserId ?? getCurrentUserId();
    if (!userId) return;

    try {
      const list = await listMyArchives({ user_id: userId });

      const set = new Set();
      const map = {};
      const archivedPosts = [];

      for (const a of list) {
        const postObj = a?.post || a;
        const postId = postObj?.post_id ?? postObj?.id ?? postObj?.postId ?? null;
        const archiveId = a?.archive_id ?? a?.archiveId ?? a?.id ?? null;

        if (postId != null) {
          const pid = String(postId);
          set.add(pid);
          if (archiveId != null) map[pid] = archiveId;

          const enrichedPost = {
            ...postObj,
            archive_id: archiveId,
            archive_created_at: a?.created_at ?? a?.createdAt ?? null,
          };
          archivedPosts.push(enrichedPost);
        }
      }

      dispatch({
        type: "ARCHIVES/SET",
        archives: set,
        archivedPosts,
        archiveIdByPostId: map,
        archiveCount: set.size,
      });

      return { set, map, archivedPosts };
    } catch (e) {
      console.warn("[archives] loadMyArchives failed:", e?.message || e);
    }
    return null;
  };

  const toggleArchive = async (postOrId) => {
    if (!postOrId) return;
    const postObj = typeof postOrId === "object" ? postOrId : null;
    const pid = String(postOrId?.post_id ?? postOrId?.id ?? postOrId?.postId ?? postOrId);
    const userId = getCurrentUserId();
    if (!userId) return;

    // Snapshot for rollback
    const prevArchives = new Set(state.archives);
    const prevArchivedPosts = [...(state.archivedPosts || [])];
    const prevMap = { ...(state.archiveIdByPostId || {}) };
    const wasArchived = prevArchives.has(pid);

    // 1. Optimistic UI Update
    const nextArchives = new Set(prevArchives);
    let nextArchivedPosts = [...prevArchivedPosts];
    const nextMap = { ...prevMap };

    if (wasArchived) {
      nextArchives.delete(pid);
      nextArchivedPosts = nextArchivedPosts.filter(p => String(p.post_id ?? p.id ?? p.postId) !== pid);
      delete nextMap[pid];
    } else {
      nextArchives.add(pid);
      if (postObj) {
        nextArchivedPosts.unshift({ ...postObj, is_archived: true, archive_created_at: new Date().toISOString() });
      }
    }

    dispatch({
      type: "ARCHIVES/SET",
      archives: nextArchives,
      archivedPosts: nextArchivedPosts,
      archiveIdByPostId: nextMap,
      archiveCount: nextArchives.size,
    });

    const syncModal = (isArchived) => {
      const m = state.modals?.postDetail;
      if (m?.open && String(m?.payload?.post_id ?? m?.payload?.id) === pid) {
        dispatch({ type: "MODAL/UPDATE_POST_DETAIL_PAYLOAD", payload: { is_archived: isArchived } });
      }
    };
    syncModal(!wasArchived);

    try {
      if (!wasArchived) {
        // Create
        showToast("아카이브에 저장되었습니다.");
        const created = await createArchive({ user_id: userId, post_id: pid });
        // Since backend might not return archive_id, we MUST fetch to get it for future deletion
        // But we wait slightly to avoid race condition on server DB write
        setTimeout(() => loadMyArchives(userId), 500);
      } else {
        // Delete
        showToast("아카이브에서 제거되었습니다.");
        let aid = prevMap[pid];
        if (!aid) {
          // Fallback: fetch list to find ID if missing
          const list = await listMyArchives({ user_id: userId });
          const found = list.find(a => String(a?.post_id ?? a?.post?.post_id) === pid);
          aid = found?.archive_id ?? found?.id;
        }
        if (aid) {
          await deleteArchive({ user_id: userId, archive_id: aid });
          // No need for immediate full refetch on delete, our local state is clean
        }
      }
    } catch (e) {
      console.error("[archives] toggleArchive failed:", e);
      // Rollback
      dispatch({
        type: "ARCHIVES/SET",
        archives: prevArchives,
        archivedPosts: prevArchivedPosts,
        archiveIdByPostId: prevMap,
        archiveCount: prevArchives.size,
      });
      syncModal(wasArchived);
      alert("북마크 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // Post detail modal
  const openPostDetailFromPost = async (post) => {
    const pid = post?.post_id ?? post?.id ?? post?.postId ?? null;
    if (!pid) {
      dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "post", payload: post });
      return;
    }

    try {
      const detail = await getPostForCalendar({ post_id: pid });
      dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "post", payload: detail || post });
    } catch {
      dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "post", payload: post });
    }
  };
  const openPostDetailFromEvent = async (ev) => {
    if (!ev) {
      dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "event", payload: ev });
      return;
    }

    // If the calendar event is derived from a post, try to fetch the latest post detail
    // so the detail modal can show board/channel metadata consistently.
    const pid = ev?.postId ?? ev?.post_id ?? null;
    if (!pid) {
      dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "event", payload: ev });
      return;
    }

    try {
      const detail = await getPostForCalendar({ post_id: pid });
      dispatch({
        type: "MODAL/OPEN_POST_DETAIL",
        mode: "event",
        payload: { ...ev, linkedPost: detail || null },
      });
    } catch {
      dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "event", payload: ev });
    }
  };
  const closePostDetail = () => dispatch({ type: "MODAL/CLOSE_POST_DETAIL" });

  // Calendar event modal
  const openCalendarEventCreateFromPost = async (post) => {
    const pid = post?.post_id ?? post?.id ?? post?.postId ?? null;

    if (!pid) {
      dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "create", payload: post });
      return;
    }

    try {
      // API spec: GET /api/posts?post_id={post_id}
      const detail = await getPostForCalendar({ post_id: pid });
      dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "create", payload: detail || post });
    } catch {
      dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "create", payload: post });
    }
  };
  const openCalendarEventCreateManual = () => {
    dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "create", payload: null });
  };
  const openCalendarEventEdit = (ev) => {
    dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "edit", payload: ev });
  };
  const closeCalendarEvent = () => dispatch({ type: "MODAL/CLOSE_CALENDAR_EVENT" });

  const fetchCalendarEvents = async ({ start, end } = {}) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const events = await listCalendarEvents({ user_id: userId, start, end });
      dispatch({ type: "CALENDAR/SET", events });
    } catch (e) {
      console.warn("[calendar] fetchCalendarEvents failed:", e?.message || e);
    }
  };

  const createCalendarEvent = async (newEvent) => {
    const userId = getCurrentUserId();

    // optimistic local add
    dispatch({ type: "CALENDAR/ADD", event: newEvent });

    if (!userId) return newEvent;

    try {
      const saved = await apiCreateCalendarEvent({
        user_id: userId,
        title: newEvent.title,
        content: newEvent.content,
        start_at: newEvent.startAt,
        end_at: newEvent.endAt,
        post_id: newEvent.postId,
        category: newEvent.category,
        color: newEvent.color,
        mm_link: newEvent.mmLink,
        board_name: newEvent.boardName || newEvent.board_name,
        channel_name: newEvent.channelName || newEvent.channel_name,
      });

      // Replace local temp event with saved id (best-effort)
      if (saved?.id && saved.id !== newEvent.id) {
        dispatch({ type: "CALENDAR/DELETE", eventId: newEvent.id });
        dispatch({ type: "CALENDAR/ADD", event: { ...newEvent, ...saved, id: saved.id } });
      } else {
        dispatch({ type: "CALENDAR/UPDATE", eventId: newEvent.id, patch: saved });
      }
      return saved;
    } catch (e) {
      console.warn("[calendar] create failed:", e?.message || e);
      return newEvent;
    }
  };

  const updateCalendarEvent = async (eventId, patch) => {
    // optimistic local update
    dispatch({ type: "CALENDAR/UPDATE", eventId, patch });

    try {
      const saved = await patchCalendarEvent(eventId, {
        title: patch.title,
        content: patch.content,
        start_at: patch.startAt,
        end_at: patch.endAt,
        color: patch.color,
      });
      dispatch({ type: "CALENDAR/UPDATE", eventId, patch: saved });
      return saved;
    } catch (e) {
      console.warn("[calendar] update failed:", e?.message || e);
      return null;
    }
  };

  const deleteCalendarEvent = async (eventId) => {
    // optimistic local delete
    dispatch({ type: "CALENDAR/DELETE", eventId });

    try {
      await apiDeleteCalendarEvent(eventId);
      return true;
    } catch (e) {
      console.warn("[calendar] delete failed:", e?.message || e);
      return false;
    }
  };
  // Profile setup / edit
  const saveProfile = async ({ nickname, profile_image_url }) => {
    const id = state.user?.user_id;
    if (!id) throw new Error("No user_id");

    const nextNickname = nickname != null ? String(nickname).trim() : null;
    const nextProfileUrl = profile_image_url != null ? String(profile_image_url) : null;

    const payload = {};
    // Avoid backend nickname conflict bug: only send when changed
    if (nextNickname && nextNickname !== (state.user?.nickname || '').trim()) payload.nickname = nextNickname;
    if (nextProfileUrl != null && nextProfileUrl !== (state.user?.profile_image_url || null)) payload.profile_image_url = nextProfileUrl;

    if (Object.keys(payload).length === 0) {
      // nothing to update; still return current user
      return state.user;
    }

    const res = await fetchWithAuth(apiUrl(`/api/users/${encodeURIComponent(id)}/`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await requireOk(res, "프로필 업데이트에 실패했습니다.");

    // re-fetch to keep server as source of truth
    const ref = await fetchWithAuth(apiUrl(`/api/users/?user_id=${encodeURIComponent(id)}`), { method: "GET" });
    await requireOk(ref, "Fetch user failed");
    const raw = await ref.json();
    const user = normalizeUser(raw);

    dispatch({ type: "AUTH/SET", isAuthenticated: true, user });
    dispatch({ type: "PROFILE/SET_COMPLETED", completed: !!user.profile_image_url });

    return user;
  };

  // Profile modal
  const openEditProfile = () =>
    dispatch({ type: "MODAL/OPEN_PROFILE_SETUP", force: false, redirectTo: null });
  const closeEditProfile = () => dispatch({ type: "MODAL/CLOSE_PROFILE_SETUP" });

  const openProfileSetup = (opts) =>
    dispatch({
      type: "MODAL/OPEN_PROFILE_SETUP",
      force: !!opts?.force,
      redirectTo: opts?.redirectTo ?? null,
    });
  const closeProfileSetup = () => dispatch({ type: "MODAL/CLOSE_PROFILE_SETUP" });

  // Confirm
  const openConfirm = (confirmType, payload) =>
    dispatch({ type: "MODAL/OPEN_CONFIRM", confirmType, payload });
  const closeConfirm = () => dispatch({ type: "MODAL/CLOSE_CONFIRM" });

  const showToast = (message, duration = 1000) => {
    dispatch({ type: "TOAST/OPEN", message });
    setTimeout(() => {
      dispatch({ type: "TOAST/CLOSE" });
    }, duration);
  };

  const actions = useMemo(
    () => ({
      loginWithPassword,
      logout,
      deleteAccount,

      toggleArchive,
      loadMyArchives,

      openPostDetailFromPost,
      openPostDetailFromEvent,
      closePostDetail,

      openCalendarEventCreateFromPost,
      openCalendarEventCreateManual,
      openCalendarEventEdit,
      closeCalendarEvent,

      fetchCalendarEvents,

      createCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,

      openEditProfile,
      closeEditProfile,
      saveProfile,

      openProfileSetup,
      closeProfileSetup,

      openConfirm,
      closeConfirm,

      setDashboardCache: (payload) => dispatch({ type: "DASHBOARD/SET_CACHE", payload }),
      showToast,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.user, state.isAuthenticated, state.archives, state.modals, state.loading, state.archivedPosts, state.calendarEvents]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
