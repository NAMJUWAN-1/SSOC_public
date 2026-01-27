import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import { useApp } from "../state/AppProvider";

import PostDetailModal from "../components/modals/PostDetailModal";
import EditProfileModal from "../components/modals/EditProfileModal";
import ConfirmModal from "../components/common/ConfirmModal";

export default function AppLayout() {
  const { state, actions } = useApp();
  const nav = useNavigate();
  const loc = useLocation();

  const active =
    loc.pathname.includes("/app/mypage") ? "mypage" : "home";

  const onNav = (id) => {
    if (id === "home") nav("/app");
    if (id === "mypage") nav("/app/mypage");
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
          onRegister={() => alert("캘린더 페이지(PR#2)에서 일정 등록 기능을 추가할 예정입니다.")}
          onEditEvent={() => {}}
          onDeleteEvent={() => {}}
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
