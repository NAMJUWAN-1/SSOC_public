import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { loginWithMattermost } from "../api/authApi";
import { getAccessToken, clearAccessToken } from "../api/tokenManager";
import { MOCK_POSTS } from "../data/mockData";

const AppContext = createContext(null);

const LS = {
  user: "ssoc_auth_user",
  archives: "ssoc_archives",
  events: "ssoc_calendar_events",
};

function loadJson(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const initialState = (() => {
  const token = getAccessToken();
  const user = loadJson(LS.user, null) ?? { nickname: "", profileImage: null };

  const archivesArr = loadJson(LS.archives, []);
  const archives = new Set(Array.isArray(archivesArr) ? archivesArr : []);

  const calendarEvents = loadJson(LS.events, []);

  return {
    loading: false,
    isAuthenticated: !!token,
    user,

    // v005 호환(auth 객체)
    auth: {
      status: "ready", // loading | ready
      isAuthenticated: !!token,
      user,
    },

    posts: MOCK_POSTS,
    archives,
    calendarEvents: Array.isArray(calendarEvents) ? calendarEvents : [],

    modals: {
      postDetail: { open: false, payload: null, mode: "post" }, // mode: post | event
      calendarEvent: { open: false, payload: null, mode: "create" }, // create | edit
      editProfile: { open: false },
      profileSetup: { open: false },
      confirm: { open: false, type: null, payload: null },
    },
  };
})();

function reducer(state, action) {
  switch (action.type) {
    case "AUTH/SET": {
      const next = {
        ...state,
        isAuthenticated: action.isAuthenticated,
        user: action.user ?? state.user,
        auth: {
          ...state.auth,
          isAuthenticated: action.isAuthenticated,
          user: action.user ?? state.user,
          status: "ready",
        },
      };
      return next;
    }
    case "ARCHIVES/SET": {
      return { ...state, archives: action.archives };
    }
    case "CALENDAR/SET": {
      return { ...state, calendarEvents: action.events };
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
    case "MODAL/CLOSE_POST_DETAIL": {
      return {
        ...state,
        modals: { ...state.modals, postDetail: { open: false, payload: null, mode: "post" } },
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
        modals: { ...state.modals, calendarEvent: { open: false, payload: null, mode: "create" } },
      };
    }
    case "MODAL/OPEN_EDIT_PROFILE": {
      return { ...state, modals: { ...state.modals, editProfile: { open: true } } };
    }
    case "MODAL/CLOSE_EDIT_PROFILE": {
      return { ...state, modals: { ...state.modals, editProfile: { open: false } } };
    }
    case "MODAL/OPEN_PROFILE_SETUP": {
      return { ...state, modals: { ...state.modals, profileSetup: { open: true } } };
    }
    case "MODAL/CLOSE_PROFILE_SETUP": {
      return { ...state, modals: { ...state.modals, profileSetup: { open: false } } };
    }
    case "MODAL/OPEN_CONFIRM": {
      return { ...state, modals: { ...state.modals, confirm: { open: true, type: action.confirmType, payload: action.payload ?? null } } };
    }
    case "MODAL/CLOSE_CONFIRM": {
      return { ...state, modals: { ...state.modals, confirm: { open: false, type: null, payload: null } } };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // keep localStorage in sync when archives/events change
  useEffect(() => {
    saveJson(LS.archives, Array.from(state.archives));
  }, [state.archives]);

  useEffect(() => {
    saveJson(LS.events, state.calendarEvents);
  }, [state.calendarEvents]);

  useEffect(() => {
    saveJson(LS.user, state.user);
  }, [state.user]);

  const loginWithPassword = async (loginId, password) => {
    const { accessToken, user } = await loginWithMattermost(loginId, password);

    // authApi에서 token 저장을 하는 구조면 여기서는 state만 갱신
    const nextUser = {
      nickname: user?.nickname ?? user?.username ?? user?.name ?? "사용자",
      profileImage: user?.profileImage ?? user?.profile_image ?? null,
      ...user,
    };

    dispatch({ type: "AUTH/SET", isAuthenticated: true, user: nextUser });
    return accessToken;
  };

  const logout = () => {
    clearAccessToken();
    dispatch({ type: "AUTH/SET", isAuthenticated: false, user: { nickname: "", profileImage: null } });
  };

  // Dashboard / MyPage
  const toggleArchive = (postId) => {
    const next = new Set(state.archives);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    dispatch({ type: "ARCHIVES/SET", archives: next });
  };

  // Post detail modal
  const openPostDetailFromPost = (post) => {
    dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "post", payload: post });
  };
  const openPostDetailFromEvent = (ev) => {
    dispatch({ type: "MODAL/OPEN_POST_DETAIL", mode: "event", payload: ev });
  };
  const closePostDetail = () => dispatch({ type: "MODAL/CLOSE_POST_DETAIL" });

  // Calendar event modal (✅ 일정추가 버튼 동작 핵심)
  const openCalendarEventCreateFromPost = (post) => {
    dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "create", payload: post });
  };
  const openCalendarEventCreateManual = () => {
    dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "create", payload: null });
  };
  const openCalendarEventEdit = (ev) => {
    dispatch({ type: "MODAL/OPEN_CALENDAR_EVENT", mode: "edit", payload: ev });
  };
  const closeCalendarEvent = () => dispatch({ type: "MODAL/CLOSE_CALENDAR_EVENT" });

  const createCalendarEvent = (newEvent) => {
    const next = [newEvent, ...state.calendarEvents];
    dispatch({ type: "CALENDAR/SET", events: next });
  };

  const updateCalendarEvent = (eventId, patch) => {
    const next = state.calendarEvents.map((ev) => (ev.id === eventId ? { ...ev, ...patch } : ev));
    dispatch({ type: "CALENDAR/SET", events: next });
  };

  const deleteCalendarEvent = (eventId) => {
    const next = state.calendarEvents.filter((ev) => ev.id !== eventId);
    dispatch({ type: "CALENDAR/SET", events: next });
  };

  // Profile
  const openEditProfile = () => dispatch({ type: "MODAL/OPEN_EDIT_PROFILE" });
  const closeEditProfile = () => dispatch({ type: "MODAL/CLOSE_EDIT_PROFILE" });
  const saveProfile = (u) => {
    const nextUser = { ...state.user, ...u };
    dispatch({ type: "AUTH/SET", isAuthenticated: state.isAuthenticated, user: nextUser });
    dispatch({ type: "MODAL/CLOSE_EDIT_PROFILE" });
  };

  // Profile setup (optional)
  const openProfileSetup = () => dispatch({ type: "MODAL/OPEN_PROFILE_SETUP" });
  const closeProfileSetup = () => dispatch({ type: "MODAL/CLOSE_PROFILE_SETUP" });

  // Confirm
  const openConfirm = (confirmType, payload) => dispatch({ type: "MODAL/OPEN_CONFIRM", confirmType, payload });
  const closeConfirm = () => dispatch({ type: "MODAL/CLOSE_CONFIRM" });

  const actions = useMemo(
    () => ({
      loginWithPassword,
      logout,

      toggleArchive,

      openPostDetailFromPost,
      openPostDetailFromEvent,
      closePostDetail,

      openCalendarEventCreateFromPost,
      openCalendarEventCreateManual,
      openCalendarEventEdit,
      closeCalendarEvent,

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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.archives, state.calendarEvents, state.isAuthenticated, state.user]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
