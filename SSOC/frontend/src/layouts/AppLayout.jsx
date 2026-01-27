import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import { useApp } from "../state/AppProvider";

import PostDetailModal from "../components/modals/PostDetailModal";
import EditProfileModal from "../components/modals/EditProfileModal";
import CalendarEventModal from "../components/modals/CalendarEventModal";
import ConfirmModal from "../components/common/ConfirmModal";

export default function AppLayout() {
  const { state, actions } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  
  const active = (() => {
    if (loc.pathname.startsWith("/app/calendar")) return "calendar";
    if (loc.pathname.startsWith("/app/mypage")) return "mypage";
    return "home";
  })();

  const onNav = (id) => {
    if (id === "home") return nav("/app");
    if (id === "calendar") return nav("/app/calendar");
    if (id === "mypage") return nav("/app/mypage");
  };
  
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <Sidebar
        active={active}
        onNavigate={onNav}
        user={state.auth.user}
        onLogout={() => actions.openConfirm("logout", null)}
      />

      <main className="flex-1 ml-[70px]">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>

      {/* ---- Modal Root ---- */}
      {state.modals.postDetail.open && (
        <PostDetailModal
          mode={state.modals.postDetail.mode}
          payload={state.modals.postDetail.payload}
          onClose={actions.closePostDetail}
          onRegister={(post) => actions.openCalendarEventCreateFromPost(post)}
          onEditEvent={(ev) => actions.openCalendarEventEdit(ev)}
          onDeleteEvent={(ev) => actions.openConfirm("delete_event", { eventId: ev.id })}
        />
      )}

      {state.modals.calendarEvent.open && (
        <CalendarEventModal
          mode={state.modals.calendarEvent.mode}
          payload={state.modals.calendarEvent.payload}
          onClose={actions.closeCalendarEvent}
        />
      )}

      {state.modals.editProfile.open && (
        <EditProfileModal
          user={state.auth.user}
          onClose={actions.closeEditProfile}
          onSave={(u) => actions.saveProfile(u)}
        />
      )}

      {state.modals.confirm.open && (
        <ConfirmModal
          type={state.modals.confirm.type}
          payload={state.modals.confirm.payload}
        />
      )}
    </div>
  );
}
