import React from "react";
import { AlertTriangle, LogOut, BookmarkMinus, Trash2 } from "lucide-react";
import ModalBase from "./ModalBase";
import { useApp } from "../../state/AppProvider";

export default function ConfirmModal({ type, payload }) {
  const { actions, state } = useApp();

  const config = (() => {
    if (type === "logout") {
      return {
        icon: <LogOut size={28} className="text-slate-700" />,
        title: "로그아웃 하시겠습니까?",
        desc: "언제든지 다시 로그인하여 서비스를 이용할 수 있습니다.",
        confirmText: "로그아웃",
        confirmClass: "bg-slate-900 hover:bg-slate-800 text-white",
      };
    }
    if (type === "unarchive") {
      return {
        icon: <BookmarkMinus size={28} className="text-yellow-600" />,
        title: "아카이빙 해제",
        desc: "이 공지를 보관함에서 제거하시겠습니까?",
        confirmText: "해제하기",
        confirmClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
      };
    }
    if (type === "delete_event") {
      return {
        icon: <Trash2 size={28} className="text-red-600" />,
        title: "일정을 삭제하시겠습니까?",
        desc: "내 캘린더에서 이 일정이 사라집니다. (복구 불가)",
        confirmText: "삭제하기",
        confirmClass: "bg-red-600 hover:bg-red-700 text-white",
      };
    }
    return {
      icon: <AlertTriangle size={28} className="text-red-600" />,
      title: "확인",
      desc: "진행하시겠습니까?",
      confirmText: "확인",
      confirmClass: "bg-slate-900 hover:bg-slate-800 text-white",
    };
  })();

  const onConfirm = () => {
    if (type === "logout") {
      actions.closeConfirm();
      actions.logout();
      return;
    }
    if (type === "unarchive") {
      actions.toggleArchive(payload.postId);
      actions.closeConfirm();
      return;
    }
    if (type === "delete_event") {
      actions.deleteCalendarEvent(payload.eventId);
      actions.closeConfirm();
      actions.closePostDetail();
      return;
    }
    actions.closeConfirm();
  };

  return (
    <ModalBase title={config.title} onClose={actions.closeConfirm} size="sm" headerVariant="light">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          {config.icon}
        </div>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">{config.desc}</p>

        <div className="flex gap-3">
          <button
            onClick={actions.closeConfirm}
            className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-black ${config.confirmClass}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
