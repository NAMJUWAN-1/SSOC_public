import React from "react";
import { ExternalLink, Layout, MessageSquare, Clock, Sparkles, Trash2, Edit, Star, Tag, CalendarPlus } from "lucide-react";
import ModalBase from "../common/ModalBase";
import { getMattermostLink } from "../../utils/mattermost";

function safeKoreanDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR");
}

export default function PostDetailModal({
  mode,            // "post" | "event"
  payload,         // post or calendarEvent
  onClose,
  onEditEvent,
  onDeleteEvent,
  // optional
  allowArchive = false,
  allowCalendarAdd = false,
  isArchived,
  onToggleArchive,
  onAddToCalendar,
  linkUrl, // optional direct link override
}) {
  if (!payload) return null;

  const isEvent = mode === "event";
  const postLike = isEvent ? null : payload;
  const eventLike = isEvent ? payload : null;

  // Backend post shape
  const boardName = postLike?.board_name ?? postLike?.boardName;
  const channelName = postLike?.channel_name ?? postLike?.channelName;
  const categoryName = postLike?.category_name ?? postLike?.categoryName;

  const title = isEvent ? (payload.title || "일정") : (postLike?.ai_title ?? postLike?.title ?? "(제목 없음)");
  const content = isEvent ? (payload.content || "") : (postLike?.content ?? postLike?.rawContent ?? "");

  const postedAt = isEvent ? (payload.startAt || payload.start_at) : (postLike?.posted_at ?? postLike?.postedAt ?? postLike?.start_at ?? postLike?.startAt);

  const link = linkUrl || (isEvent ? getMattermostLink(payload) : getMattermostLink(postLike));

  return (
    <ModalBase title="상세 정보" onClose={onClose} size="lg" headerVariant="dark">
      <div className="space-y-6">
        {!isEvent && (boardName || channelName || categoryName) && (
          <div className="flex items-center flex-wrap gap-2 text-xs font-black">
            {boardName ? (
              <span className="flex items-center bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">
                <Layout size={14} className="mr-2 text-slate-400" /> {boardName}
              </span>
            ) : null}
            {channelName ? (
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
                # {channelName}
              </span>
            ) : null}
            {categoryName ? (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center">
                <Tag size={14} className="mr-1" /> {categoryName}
              </span>
            ) : null}
          </div>
        )}

        <div className="flex items-center flex-wrap gap-2">
          {postedAt ? (
            <div className="flex items-center text-sm font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <Clock size={14} className="mr-1.5" />
              <span>{safeKoreanDate(postedAt)}</span>
            </div>
          ) : null}

          {!isEvent && (
            <div className="flex items-center text-[10px] text-slate-400 font-bold">
              <Sparkles size={10} className="mr-1 text-yellow-400 fill-current" />
              AI가 추출한 정보입니다. 정확하지 않을 수 있습니다.
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{title}</h2>

          {/* Mattermost quick shortcut icon */}
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              title="Mattermost 바로가기"
              className="shrink-0 p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 active:scale-95 transition"
            >
              <ExternalLink size={18} />
            </a>
          ) : null}
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-h-[300px] overflow-y-auto">
          <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center">
            <MessageSquare size={12} className="mr-1.5" /> 내용
          </h4>
          <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap font-medium">
            {content || "(내용 없음)"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 pt-6">
          {isEvent ? (
            <>
              <button
                onClick={() => onDeleteEvent?.(eventLike)}
                className="flex items-center justify-center bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black hover:bg-red-100 transition-all active:scale-95"
              >
                <Trash2 size={18} className="mr-2" /> 삭제하기
              </button>
              <button
                onClick={() => onEditEvent?.(eventLike)}
                className="flex items-center justify-center bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-black hover:bg-slate-200 transition-all active:scale-95"
              >
                <Edit size={18} className="mr-2" /> 수정하기
              </button>
            </>
          ) : allowArchive ? (
            <button
              onClick={() => onToggleArchive?.(postLike)}
              className={
                "flex items-center justify-center px-6 py-3 rounded-xl font-black transition-all active:scale-95 " +
                (isArchived ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              <Star size={18} className={"mr-2 " + (isArchived ? "fill-current" : "")} />
              {isArchived ? "북마크 해제" : "북마크"}
            </button>
          ) : null}

          {!isEvent && allowCalendarAdd ? (
            <button
              onClick={() => onAddToCalendar?.(postLike)}
              className="flex items-center justify-center bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-black hover:bg-slate-200 transition-all active:scale-95"
            >
              <CalendarPlus size={18} className="mr-2" /> 내 캘린더에 추가
            </button>
          ) : null}

          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              Mattermost에서 보기 <ExternalLink size={18} className="ml-2" />
            </a>
          ) : null}
        </div>
      </div>
    </ModalBase>
  );
}
