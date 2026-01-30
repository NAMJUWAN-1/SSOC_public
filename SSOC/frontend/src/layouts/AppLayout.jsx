import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import { useApp } from "../state/AppProvider";

import PostDetailModal from "../components/modals/PostDetailModal";
import ProfileSetupModal from "../components/modals/ProfileSetupModal";
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

  const disableApp = state.modals.profileSetup.open;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <div className={disableApp ? "pointer-events-none blur-sm" : ""}>
        <Sidebar
          active={active}
          onNavigate={onNav}
          user={state.auth.user}
          onLogout={() => actions.openConfirm("logout", null)}
        />
      </div>

      <main className={"flex-1 ml-[70px] " + (disableApp ? "pointer-events-none blur-sm" : "")}>
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
          allowArchive={true}
          allowCalendarAdd={true}
          isArchived={(() => {
            const p = state.modals.postDetail.payload;
            const pid = p?.post_id ?? p?.id;
            return !!pid && state.archives.has(pid);
          })()}
          onToggleArchive={(post) => {
            const pid = post?.post_id ?? post?.id;
            if (pid != null) actions.toggleArchive(String(pid));
          }}
          onAddToCalendar={(post) => {
            actions.closePostDetail();
            actions.openCalendarEventCreateFromPost(post);
          }}
          onEditEvent={(ev) => {
            actions.closePostDetail();
            actions.openCalendarEventEdit(ev);
          }}
          onDeleteEvent={(ev) => {
            actions.closePostDetail();
            actions.openConfirm("delete_event", { eventId: ev.id });
          }}
        />
      )}

      {state.modals.calendarEvent.open && (
        <CalendarEventModal
          mode={state.modals.calendarEvent.mode}
          payload={state.modals.calendarEvent.payload}
          onClose={actions.closeCalendarEvent}
        />
      )}

      {state.modals.profileSetup.open && (
        <ProfileSetupModal
          user={state.auth.user}
          force={!!state.modals.profileSetup.force}
          onClose={() => {
            if (state.modals.profileSetup.force) return;
            actions.closeProfileSetup();
          }}
          onSubmit={async (u) => {
            try {
              await actions.saveProfile(u);
              actions.closeProfileSetup();
              if (state.modals.profileSetup.redirectTo) {
                nav(state.modals.profileSetup.redirectTo, { replace: true });
              }
            } catch (e) {
              alert(e?.message || "프로필 업데이트에 실패했습니다.");
            }
          }}
        />
      )}

      {state.modals.confirm.open && <ConfirmModal type={state.modals.confirm.type} payload={state.modals.confirm.payload} />}

      {/* optional global loading overlay */}
      {state.loading && (
        <div className="fixed inset-0 z-[999] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-4 text-sm font-black text-slate-800">
            처리 중...
          </div>
        </div>
      )}
    </div>
  );
}
