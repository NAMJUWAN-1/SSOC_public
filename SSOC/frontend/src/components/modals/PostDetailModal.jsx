import React from "react";
import { ExternalLink, Clock, Trash2, Edit, Star, CalendarPlus, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import ModalBase from "../common/ModalBase";
import MarkdownRenderer from "../common/MarkdownRenderer";
import { getMattermostLink } from "../../utils/mattermost";

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function PostDetailModal({
  mode,
  payload,
  onClose,
  onEditEvent,
  onDeleteEvent,
  allowArchive = false,
  allowCalendarAdd = false,
  isArchived,
  onToggleArchive,
  onAddToCalendar,

  linkUrl,
}) {
  if (!payload) return null;

  const isEvent = mode === "event";
  const postLike = isEvent ? null : payload;
  const eventLike = isEvent ? payload : null;

  const linkedPost = isEvent ? (payload?.linkedPost ?? payload?.linked_post ?? null) : null;

  const boardName = postLike?.board_name ?? postLike?.boardName;
  const channelName = postLike?.channel_name ?? postLike?.channelName;
  const categoryName = postLike?.category_name ?? postLike?.categoryName;

  const eventBoardName =
    linkedPost?.board_name ??
    linkedPost?.boardName ??
    eventLike?.board_name ??
    eventLike?.boardName ??
    "";
  const eventChannelName =
    linkedPost?.channel_name ??
    linkedPost?.channelName ??
    eventLike?.channel_name ??
    eventLike?.channelName ??
    "";
  const eventCategoryName =
    linkedPost?.category_name ??
    linkedPost?.categoryName ??
    eventLike?.category_name ??
    eventLike?.categoryName ??
    eventLike?.category ??
    "";
  const isPersonalEvent = !eventLike?.postId && !eventLike?.post_id && !eventBoardName && !eventChannelName;
  const eventBoardLabel = eventBoardName === "개인" ? "개인일정" : eventBoardName;

  const title = isEvent ? (payload.title || "일정") : (postLike?.ai_title ?? postLike?.title ?? "(제목 없음)");
  const content = isEvent ? (payload.content || "") : (postLike?.content ?? postLike?.rawContent ?? "");

  const startObj = isEvent
    ? (payload.startAt || payload.start_at)
    : (postLike?.start_at ?? postLike?.startAt ?? postLike?.posted_at ?? postLike?.postedAt);
  const endObj = isEvent
    ? (payload.endAt || payload.end_at)
    : (postLike?.end_at ?? postLike?.endAt);

  const displayStart = startObj;
  const displayEnd = endObj || startObj;

  const link =
    linkUrl ||
    (isEvent
      ? payload?.mmLink ?? payload?.mm_link ?? getMattermostLink(payload)
      : getMattermostLink(postLike));

  const headerContent = (
    <div>
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3">
        {isEvent ? (
          <>
            {(eventBoardLabel || isPersonalEvent) && <span>{eventBoardLabel || "개인일정"}</span>}
            {(eventChannelName || eventCategoryName) && <span className="text-slate-300">|</span>}
            {eventChannelName && <span># {eventChannelName}</span>}
            {(eventCategoryName || isPersonalEvent) && (
              <span className="bg-slate-100 text-[#1E325C] px-2 py-0.5 rounded text-[10px] ml-1 font-black">
                {eventCategoryName || payload?.category || "기타"}
              </span>
            )}
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
      <h3 className="font-black text-2xl text-slate-900 tracking-tight line-clamp-1 mb-[-8px]">{title}</h3>
    </div>
  );

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
      bodyClassName="p-4"
    >
      <div className="space-y-3">

        {/* Content */}
        <div className="space-y-4 pt-1">

          <div className="space-y-4 pt-1">
            <div className="flex items-center border-l-[3px] border-[#FFBC1F] pl-3 font-bold text-slate-700 h-4">
              상세 내용
            </div>
            {/* Height restricted to 300px for scrolling */}
            <div className="bg-[#F8F9FC] pt-2 pb-5 px-5 rounded-2xl text-slate-600 font-medium min-h-[100px] max-h-[305px] overflow-y-auto border border-slate-100 shadow-sm custom-scrollbar">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <span className="text-slate-400 italic">상세 내용이 없습니다.</span>
              )}
            </div>
          </div>
        </div>

        {/* Date/Time Info Box - Bottom */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center border-l-[3px] border-[#FFBC1F] pl-3 font-bold text-slate-700 h-4">
            일정 기간 정보
          </div>
          <div className="bg-[#F8F9FC] rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch gap-6">
              {/* Start */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <span className="w-2 h-2 rounded-full bg-[#FFBC1F]" />
                  <label className="text-sm font-black text-[#1E325C] uppercase tracking-wider">시작 일시</label>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex-[1.2] bg-white border border-slate-200 rounded-2xl p-2 flex items-center shadow-sm h-12 min-w-0">
                    <CalendarIcon size={14} className="text-[#1E325C] mr-2 shrink-0 opacity-60" />
                    <span className="text-sm font-black text-slate-700 whitespace-nowrap">
                      {new Date(displayStart).getFullYear()}-{String(new Date(displayStart).getMonth() + 1).padStart(2, "0")}-{String(new Date(displayStart).getDate()).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex-[1] bg-white border border-slate-200 rounded-2xl p-2 flex items-center text-sm font-black text-slate-700 shadow-sm h-12 min-w-0">
                    <Clock size={14} className="text-[#1E325C] mr-2 shrink-0 opacity-60 ml-1" />
                    <span className="whitespace-nowrap">{formatTime(displayStart)}</span>
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
                  <label className="text-sm font-black text-[#1E325C] uppercase tracking-wider">종료 일시</label>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex-[1.2] bg-white border border-slate-200 rounded-2xl p-2 flex items-center shadow-sm h-12 min-w-0">
                    <CalendarIcon size={14} className="text-[#FFBC1F] mr-2 shrink-0 opacity-60" />
                    <span className="text-sm font-black text-slate-700 whitespace-nowrap">
                      {new Date(displayEnd).getFullYear()}-{String(new Date(displayEnd).getMonth() + 1).padStart(2, "0")}-{String(new Date(displayEnd).getDate()).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex-[1] bg-white border border-slate-200 rounded-2xl p-2 flex items-center text-sm font-black text-slate-700 shadow-sm h-12 min-w-0">
                    <Clock size={14} className="text-[#FFBC1F] mr-2 shrink-0 opacity-60 ml-1" />
                    <span className="whitespace-nowrap">{formatTime(displayEnd)}</span>
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
                className="flex items-center justify-center bg-red-50 text-red-600 px-6 py-3 rounded-xl font-medium hover:bg-red-100 transition-all border border-red-100"
              >
                <Trash2 size={18} className="mr-2" /> 삭제
              </button>
              <button
                onClick={() => onEditEvent?.(eventLike)}
                className="flex items-center justify-center bg-white text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
              >
                <Edit size={18} className="mr-2" /> 수정
              </button>
            </>
          )}

          {!isEvent && allowCalendarAdd && (
            <button
              onClick={() => onAddToCalendar?.(postLike)}
              className="flex-1 flex items-center justify-center bg-white text-slate-700 px-6 py-3 rounded-xl font-black transition-all border border-slate-300 hover:bg-slate-50 shadow-sm"
            >
              <CalendarPlus size={18} className="mr-2" />
              내 캘린더에 추가
            </button>
          )}

          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center bg-[#1E325C] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2a457a] shadow-lg shadow-slate-200 transition-all"
            >
              Mattermost에서 보기 <ExternalLink size={18} className="ml-2" />
            </a>
          ) : null}
        </div>
      </div>
    </ModalBase>
  );
}
