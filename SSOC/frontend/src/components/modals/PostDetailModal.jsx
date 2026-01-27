import React from "react";
import { CalendarPlus, ExternalLink, Layout, MessageSquare, Clock, Sparkles, Trash2, Edit } from "lucide-react";
import ModalBase from "../common/ModalBase";
import { getBoardAndChannelName } from "../../utils/board";

export default function PostDetailModal({
  mode,            // "post" | "event"
  payload,         // post or calendarEvent
  onClose,
  onRegister,      // (post) => open calendar register
  onEditEvent,     // (event) => open edit modal
  onDeleteEvent,   // (event) => open delete confirm
}) {
  if (!payload) return null;

  const isEvent = mode === "event";
  const postLike = isEvent ? null : payload;
  const eventLike = isEvent ? payload : null;

  const boardId = isEvent ? null : payload.boardId;
  const channelId = isEvent ? null : payload.channelId;
  const { boardName, channelName } = getBoardAndChannelName(boardId, channelId);

  const title = payload.title;
  const content = isEvent ? (payload.content || "일정 내용") : (payload.rawContent || "");
  const startAt = isEvent ? payload.startAt : payload.startAt;
  const endAt = isEvent ? payload.endAt : payload.endAt;
  const link = isEvent ? payload.mmLink : payload.mmLink;

  return (
    <ModalBase title="상세 정보" onClose={onClose} size="lg" headerVariant="dark">
      <div className="space-y-6">
        {!isEvent && (
          <div className="flex items-center text-xs font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
            <Layout size={14} className="mr-2 text-slate-400" />
            <span className="text-slate-700">{boardName}</span>
            {channelName && (
              <>
                <span className="mx-2 text-slate-300">/</span>
                <span className="text-slate-900">{channelName}</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center text-sm font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <Clock size={14} className="mr-1.5" />
            <span>{new Date(startAt).toLocaleString("ko-KR")}</span>
            <span className="mx-1">~</span>
            <span>{new Date(endAt || startAt).toLocaleString("ko-KR")}</span>
          </div>

          {!isEvent && (
            <div className="flex items-center text-[10px] text-slate-400 font-bold">
              <Sparkles size={10} className="mr-1 text-yellow-400 fill-current" />
              AI가 추출한 정보입니다. 정확하지 않을 수 있습니다.
            </div>
          )}
        </div>

        <h2 className="text-2xl font-black text-slate-900 leading-tight">{title}</h2>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-h-[260px] overflow-y-auto">
          <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center">
            <MessageSquare size={12} className="mr-1.5" /> 내용
          </h4>
          <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap font-medium">
            {content}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 pt-6">
          {isEvent ? (
            <>
              <button
                onClick={() => onDeleteEvent(eventLike)}
                className="flex items-center justify-center bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black hover:bg-red-100 transition-all active:scale-95"
              >
                <Trash2 size={18} className="mr-2" /> 삭제하기
              </button>
              <button
                onClick={() => onEditEvent(eventLike)}
                className="flex items-center justify-center bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-black hover:bg-slate-200 transition-all active:scale-95"
              >
                <Edit size={18} className="mr-2" /> 수정하기
              </button>
            </>
          ) : (
            <button
              onClick={() => onRegister(postLike)}
              className="flex items-center justify-center bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-black hover:bg-slate-200 transition-all active:scale-95"
            >
              <CalendarPlus size={18} className="mr-2" /> 내 캘린더에 등록
            </button>
          )}

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              Mattermost에서 보기 <ExternalLink size={18} className="ml-2" />
            </a>
          )}
        </div>
      </div>
    </ModalBase>
  );
}
