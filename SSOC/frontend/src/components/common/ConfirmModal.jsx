import React from "react";
import { AlertTriangle, LogOut, BookmarkMinus, Trash2, CheckCircle2 } from "lucide-react";
import ModalBase from "./ModalBase";
import { useApp } from "../../state/AppProvider";

export default function ConfirmModal({ type, payload }) {
  const { actions } = useApp();

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
    if (type === "delete_account") {
      return {
        icon: <Trash2 size={28} className="text-red-600" />,
        title: "회원 탈퇴를 진행할까요?",
        desc: "계정이 삭제되며 복구할 수 없습니다.",
        confirmText: "탈퇴하기",
        confirmClass: "bg-red-600 hover:bg-red-700 text-white",
      };
    }
    if (type === "event_success") {
      return {
        icon: <CheckCircle2 size={28} className="text-green-600" />,
        title: "일정 등록 완료",
        desc: "새로운 일정이 캘린더에 성공적으로 등록되었습니다.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "event_update_success") {
      return {
        icon: <CheckCircle2 size={28} className="text-green-600" />,
        title: "일정 수정 완료",
        desc: "일정 정보가 성공적으로 업데이트되었습니다.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "profile_success") {
      return {
        icon: <CheckCircle2 size={28} className="text-green-600" />,
        title: "프로필 수정 완료",
        desc: "프로필 정보가 성공적으로 변경되었습니다.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "event_color_required") {
      return {
        icon: <AlertTriangle size={28} className="text-[#FFBC1F]" />,
        title: "일정 색상 선택 필요",
        desc: "일정 색상을 선택해주세요.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "event_title_required") {
      return {
        icon: <AlertTriangle size={28} className="text-[#FFBC1F]" />,
        title: "일정 제목 입력 필요",
        desc: "일정 제목을 입력해주세요.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "event_content_required") {
      return {
        icon: <AlertTriangle size={28} className="text-[#FFBC1F]" />,
        title: "상세 내용 입력 필요",
        desc: "상세 내용을 입력해주세요.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "event_date_required") {
      return {
        icon: <AlertTriangle size={28} className="text-[#FFBC1F]" />,
        title: "일정 기간 선택 필요",
        desc: "일정 기간을 선택해주세요.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "event_start_date_required") {
      return {
        icon: <AlertTriangle size={28} className="text-[#FFBC1F]" />,
        title: "시작 일시 선택 필요",
        desc: "시작날짜를 설정해주세요.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }
    if (type === "event_end_date_required") {
      return {
        icon: <AlertTriangle size={28} className="text-[#FFBC1F]" />,
        title: "종료 일시 선택 필요",
        desc: "종료날짜를 설정해주세요.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
      };
    }

    if (type === "event_invalid_period") {
      return {
        icon: <AlertTriangle size={28} className="text-[#FFBC1F]" />,
        title: "일정 기간 오류",
        desc: "종료 일시는 시작 일시보다 빠를 수 없습니다.",
        confirmText: "확인",
        confirmClass: "bg-[#1E325C] hover:bg-[#2a457a] text-white",
        isAlert: true,
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
      actions.closeCalendarEvent();
      return;
    }
    if (type === "delete_account") {
      actions.closeConfirm();
      actions.deleteAccount();
      return;
    }
    if (
      type === "event_success" ||
      type === "event_update_success" ||
      type === "profile_success" ||
      type === "event_color_required" ||
      type === "event_title_required" ||
      type === "event_content_required" ||
      type === "event_date_required" ||
      type === "event_start_date_required" ||
      type === "event_end_date_required" ||
      type === "event_invalid_period"
    ) {
      actions.closeConfirm();
      return;
    }
    // Fallback: unknown confirm type -> show placeholder instead of silent no-op
    actions.closeConfirm();
    alert("구현중입니다.");
  };

  return (
    <ModalBase title={config.title} onClose={actions.closeConfirm} size="sm" headerVariant="light">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          {config.icon}
        </div>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">{config.desc}</p>

        <div className="flex gap-3">
          {!config.isAlert && (
            <button
              onClick={actions.closeConfirm}
              className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              취소
            </button>
          )}
          <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-black ${config.confirmClass}`}>
            {config.confirmText}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
