import React from "react";
import { Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import SideNav from "../components/navigation/SideNav";
import Header from "../components/layout/Header";

import PostDetailModal from "../components/modals/PostDetailModal";
import ProfileSetupModal from "../components/modals/ProfileSetupModal";
import CalendarEventModal from "../components/modals/CalendarEventModal";
import ConfirmModal from "../components/common/ConfirmModal";
import Toast from "../components/common/Toast";


export default function AppLayout() {
  const { state, actions } = useApp();
  const { user, loading } = state;
  const nav = useNavigate();
  const loc = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  const disableApp = state.modals.profileSetup.open;

  return (
    <div className="min-h-screen bg-[#F0F2F5] pl-16 font-sans">
      <div className={disableApp ? "pointer-events-none blur-sm w-full flex flex-col items-center" : "w-full flex flex-col items-center"}>
        {/* 상단 로고 */}
        {/* 상단 헤더 */}
        <Header />

        {/* 메인 컨텐츠 영역 */}
        <main className="w-full max-w-7xl px-4 md:px-0 pt-24 pb-32">
          <div key={loc.pathname} className="animate-apple-slide-up">
            <Outlet />
          </div>
        </main>

        {/* 사이드 내비게이션 */}
        <SideNav />
      </div>

      {/* ---- Modal Root ---- */}
      {state.modals.postDetail.open && (
        <PostDetailModal
          mode={state.modals.postDetail.mode}
          payload={(() => {
            const p = state.modals.postDetail.payload;
            if (!p || state.modals.postDetail.mode !== "post") return p;

            if (!p.mm_board_id && !p.mmBoardId) {
              const channelId = p.channel_id ?? p.channelId;
              const boardId = p.board_id ?? p.boardId;
              const cName = p.channel_name ?? p.channelName;
              const bName = p.board_name ?? p.boardName;

              const userChannels = state.auth.user?.channels || [];
              const channel = userChannels.find(c =>
                (channelId && c.channel_id === channelId) ||
                (boardId && c.board?.board_id === boardId) ||
                (cName && c.channel_name === cName) ||
                (bName && c.board?.board_name === bName)
              );
              if (channel?.board?.mm_board_id) {
                return { ...p, mm_board_id: channel.board.mm_board_id };
              }
            }
            return p;
          })()}
          onClose={actions.closePostDetail}
          allowArchive={true}
          allowCalendarAdd={true}
          isArchived={(() => {
            const p = state.modals.postDetail.payload;
            const pid = p?.post_id ?? p?.id ?? p?.postId ?? null;
            const fromPayload =
              typeof p?.is_archived === "boolean" ? p.is_archived : typeof p?.isArchived === "boolean" ? p.isArchived : null;
            const fromLocal = !!pid && state.archives.has(String(pid));
            return fromLocal || !!fromPayload;
          })()}

          onToggleArchive={(post) => {
            const pid = post?.post_id ?? post?.id ?? post?.postId ?? null;
            if (pid != null) {
              const sid = String(pid);
              const isArchived = state.archives.has(sid);
              if (isArchived) {
                actions.openConfirm("unarchive", { postId: sid });
              } else {
                actions.toggleArchive(sid);
              }
            }
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
          onClose={() => {
            const p = state.modals.calendarEvent.payload;
            const mode = state.modals.calendarEvent.mode;
            actions.closeCalendarEvent();
            const pid = p?.post_id ?? p?.id ?? p?.postId ?? null;
            if (mode === "create" && pid != null) {
              actions.openPostDetailFromPost(p);
            }
          }}
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

      {state.modals.confirm.open && (
        <ConfirmModal
          type={state.modals.confirm.type}
          payload={state.modals.confirm.payload}
        />
      )}

      {/* global loading overlay */}
      {state.loading && (
        <div className="fixed inset-0 z-[999] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-4 text-sm font-black text-[#1E325C] animate-pulse">
            처리 중...
          </div>
        </div>
      )}

      <Toast open={state.modals.toast.open} message={state.modals.toast.message} />
    </div>
  );
}
