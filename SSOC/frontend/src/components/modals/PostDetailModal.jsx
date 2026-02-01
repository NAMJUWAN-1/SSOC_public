import React from "react";
import { ExternalLink, Clock, Trash2, Edit, Star, CalendarPlus, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import ModalBase from "../common/ModalBase";
import MarkdownRenderer from "../common/MarkdownRenderer";
import { getMattermostLink } from "../../utils/mattermost";

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  // Format: 2026년 1월 30일 금
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  // Format: 10:45
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
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

  // Date Logic
  const startObj = isEvent ? (payload.startAt || payload.start_at) : (postLike?.posted_at ?? postLike?.postedAt ?? postLike?.start_at ?? postLike?.startAt);
  const endObj = isEvent ? (payload.endAt || payload.end_at) : null;

  const displayStart = startObj;
  const displayEnd = endObj || startObj;

  const link = linkUrl || (isEvent ? getMattermostLink(payload) : getMattermostLink(postLike));

  // Custom Header Content
  const headerContent = (
    <div>
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
        {isEvent ? (
          <>
            <span>일정 상세</span>
            <span className="text-slate-300">|</span>
            <span>{payload?.category || "기타"}</span>
          </>
        ) : (
          <>
            {boardName && <span>{boardName}</span>}
            {(channelName || categoryName) && <span className="text-slate-300">|</span>}
            {channelName && <span># {channelName}</span>}
            {categoryName && (
              <span className="bg-slate-100 text-[#1E325C] px-2 py-0.5 rounded text-[10px] ml-1 font-black">
                {categoryName}
              </span>
            )}
          </>
        )}
      </div>
      <h3 className="font-medium text-2xl text-slate-900 tracking-tighter">상세 정보</h3>
    </div>
  );

  // Header Actions (Star)
  const headerActions = (
    <>
      {!isEvent && allowArchive && (
        <button
          onClick={() => onToggleArchive?.(postLike)}
          className={`p-2 rounded-full transition-all ${isArchived ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
        >
          <Star size={20} className={isArchived ? "fill-current" : ""} />
        </button>
      )}
    </>
  );

  return (
    <ModalBase
      title={headerContent}
      headerActions={headerActions}
      onClose={onClose}
      size="lg"
      headerVariant="light"
    >
      <div className="space-y-3">

        {/* Title & Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug tracking-tight">{title}</h2>

          <div className="space-y-4">
            <div className="flex items-center border-l-[3px] border-[#FFBC1F] pl-3 font-bold text-slate-700 h-4">
              상세 내용
            </div>
            {/* Height restricted to 300px for scrolling */}
            <div className="bg-[#F8F9FC] p-8 rounded-2xl text-slate-600 font-medium min-h-[100px] max-h-[350px] overflow-y-auto border border-slate-100 shadow-sm custom-scrollbar">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <span className="text-slate-400 italic">상세 내용이 없습니다.</span>
              )}
            </div>
          </div>
        </div>

        {/* Date/Time Info Box - Bottom */}
        <div className="space-y-4">
          <div className="flex items-center border-l-[3px] border-[#FFBC1F] pl-3 font-bold text-slate-700 h-4">
            일정 기간 정보
          </div>
          <div className="bg-[#F8F9FC] rounded-2xl p-8 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch gap-6">
              {/* Start */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <span className="w-2 h-2 rounded-full bg-[#FFBC1F]" />
                  <label className="text-xs font-bold text-[#1E325C] uppercase tracking-wider">시작 일시</label>
                </div>
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center text-sm font-bold text-slate-700 shadow-sm">
                    <CalendarIcon size={16} className="text-[#1E325C] mr-3 opacity-60" />
                    {formatDate(displayStart)}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center text-sm font-bold text-slate-700 shadow-sm">
                    <Clock size={16} className="text-[#1E325C] mr-3 opacity-60" />
                    {formatTime(displayStart)}
                  </div>
                </div>
              </div>

              {/* Arrow divider */}
              <div className="hidden md:flex flex-col items-center justify-center px-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E325C] shadow-sm">
                  <ArrowRight size={20} />
                </div>
              </div>

              {/* End */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <span className="w-2 h-2 rounded-full bg-[#FFBC1F]" />
                  <label className="text-xs font-bold text-[#1E325C] uppercase tracking-wider">종료 일시</label>
                </div>
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center text-sm font-bold text-slate-700 shadow-sm">
                    <CalendarIcon size={16} className="text-[#FFBC1F] mr-3 opacity-60" />
                    {formatDate(displayEnd)}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center text-sm font-bold text-slate-700 shadow-sm">
                    <Clock size={16} className="text-[#FFBC1F] mr-3 opacity-60" />
                    {formatTime(displayEnd)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-row items-center gap-3 pt-1 border-t border-slate-50">
          {isEvent && (
            <>
              <button
                onClick={() => onDeleteEvent?.(eventLike)}
                className="flex items-center justify-center bg-red-50 text-red-600 px-6 py-3.5 rounded-xl font-medium hover:bg-red-100 transition-all border border-red-100"
              >
                <Trash2 size={18} className="mr-2" /> 삭제
              </button>
              <button
                onClick={() => onEditEvent?.(eventLike)}
                className="flex items-center justify-center bg-white text-slate-700 px-6 py-3.5 rounded-xl font-medium hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
              >
                <Edit size={18} className="mr-2" /> 수정
              </button>
            </>
          )}

          {!isEvent && allowCalendarAdd && (
            <button
              onClick={() => onAddToCalendar?.(postLike)}
              className="flex-1 flex items-center justify-center bg-white text-slate-700 px-6 py-3.5 rounded-xl font-medium hover:bg-slate-50 transition-all border border-slate-300 shadow-sm"
            >
              내 캘린더에 추가
            </button>
          )}

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center bg-[#1E325C] text-white px-6 py-3.5 rounded-xl font-medium hover:bg-[#2a457a] shadow-lg shadow-slate-200 transition-all"
            >
              Mattermost에서 보기 <ExternalLink size={18} className="ml-2" />
            </a>
          )}
        </div>
      </div>
    </ModalBase>
  );
}
