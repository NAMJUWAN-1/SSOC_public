import React, { useMemo, useState, useEffect } from "react";
import { CalendarPlus, Sparkles, Clock, Calendar as CalendarIcon, ArrowRight, RotateCcw } from "lucide-react";
import ModalBase from "../common/ModalBase";
import ColorPicker from "../common/ColorPicker";
import { useApp } from "../../state/AppProvider";
import { toInputValue } from "../../utils/date";
import { EVENT_COLORS, getDefaultColorForCategory } from "../../utils/eventColor";
import { getMattermostLink } from "../../utils/mattermost";

function uid() {
  return `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getPostId(post) {
  return post?.post_id ?? post?.id ?? post?.postId ?? null;
}

function getPostLink(post) {
  return getMattermostLink(post) || null;
}

function splitDateTime(isoStr) {
  if (!isoStr) return { date: "", time: "" };
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };

  const date = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
  const time = String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0');

  return { date, time };
}


function CustomTimePicker({ value, onChange, color }) {
  const [isOpen, setIsOpen] = useState(false);
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const [h, m] = (value || "00:00").split(":");

  return (
    <div className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center shadow-sm hover:bg-slate-50 transition-all cursor-pointer h-12"
        style={{ borderColor: isOpen ? color : undefined }}
      >
        <Clock className="mr-2 text-slate-400 opacity-60" size={14} style={{ color: isOpen ? color : undefined }} />
        <span className="text-sm font-black text-slate-700 whitespace-nowrap">{value || "시간"}</span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[70] p-4 flex gap-4 w-48 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              <div className="text-[10px] font-black text-slate-400 mb-2 sticky top-0 bg-white py-1">시</div>
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => {
                    onChange(`${hour}:${m}`);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${h === hour ? "bg-slate-100 text-[#1E325C]" : "text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  {hour}
                </button>
              ))}
            </div>
            <div className="w-[2px] bg-slate-50 my-2" />
            <div className="flex-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              <div className="text-[10px] font-black text-slate-400 mb-2 sticky top-0 bg-white py-1">분</div>
              {minutes.map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    onChange(`${h}:${min}`);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${m === min ? "bg-slate-100 text-[#1E325C]" : "text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  {min}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CustomDatePicker({ value, onChange, color }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [direction, setDirection] = useState(null); // 'prev' or 'next'

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setDirection('prev');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setDirection('next');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? new Date(value) : null;
  if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`;

  return (
    <div className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center shadow-sm hover:bg-slate-50 transition-all cursor-pointer h-12"
        style={{ borderColor: isOpen ? color : undefined }}
      >
        <CalendarIcon className="mr-2 text-slate-400 opacity-60" size={14} style={{ color: isOpen ? color : undefined }} />
        <div className="flex items-center min-w-0">
          {value ? (
            <span className="text-sm font-black text-slate-700 whitespace-nowrap">
              {value}
            </span>
          ) : (
            <span className="text-sm font-black text-slate-400">날짜 선택</span>
          )}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[70] p-5 w-72 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowRight size={16} className="rotate-180" />
              </button>
              <div className="text-sm font-black text-slate-700">{monthLabel}</div>
              <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                <div key={d} className={`text-[10px] font-black text-center ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"}`}>
                  {d}
                </div>
              ))}
            </div>

            <div
              key={`${currentYear}-${currentMonth}`}
              className={`grid grid-cols-7 gap-1 ${direction === 'next' ? 'animate-slide-in-right' :
                  direction === 'prev' ? 'animate-slide-in-left' : ''
                }`}
            >
              {/* Ghost Days (Previous Month) */}
              {Array.from({ length: firstDayOfMonth(currentYear, currentMonth) }).map((_, i) => {
                const prevMonthDate = new Date(currentYear, currentMonth, 0);
                const day = prevMonthDate.getDate() - firstDayOfMonth(currentYear, currentMonth) + i + 1;
                return (
                  <button
                    key={`prev-${day}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(currentYear, currentMonth - 1, 1));
                    }}
                    className="aspect-square rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center"
                  >
                    {day}
                  </button>
                );
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth(currentYear, currentMonth) }).map((_, i) => {
                const day = i + 1;
                const d = new Date(currentYear, currentMonth, day);
                const isToday = d.getTime() === today.getTime();
                const isSelected = selectedDate && d.getTime() === selectedDate.getTime();

                return (
                  <button
                    key={day}
                    onClick={() => {
                      const yyyy = currentYear;
                      const mm = String(currentMonth + 1).padStart(2, "0");
                      const dd = String(day).padStart(2, "0");
                      onChange(`${yyyy}-${mm}-${dd}`);
                      setIsOpen(false);
                    }}
                    className={`aspect-square rounded-xl text-xs font-bold transition-all flex items-center justify-center relative ${isSelected
                      ? "bg-[#1E325C] text-white shadow-md shadow-slate-200"
                      : isToday
                        ? "bg-slate-100 text-[#1E325C]"
                        : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <div className="absolute bottom-1 w-1 h-1 bg-[#FFBC1F] rounded-full" />
                    )}
                  </button>
                );
              })}

              {/* Ghost Days (Next Month) */}
              {Array.from({
                length: 42 - (firstDayOfMonth(currentYear, currentMonth) + daysInMonth(currentYear, currentMonth))
              }).map((_, i) => {
                const day = i + 1;
                return (
                  <button
                    key={`next-${day}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(currentYear, currentMonth + 1, 1));
                    }}
                    className="aspect-square rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center"
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CalendarEventModal({ mode, payload, onClose }) {
  const { actions } = useApp();

  const isEdit = mode === "edit";
  const isFromPost = !isEdit && !!getPostId(payload);

  const postTitle = useMemo(() => isFromPost ? (payload?.ai_title ?? payload?.title ?? "") : "", [isFromPost, payload]);
  const postContent = useMemo(() => isFromPost ? (payload?.content ?? payload?.rawContent ?? "") : "", [isFromPost, payload]);
  const postCategory = useMemo(() => isFromPost ? (payload?.category_name ?? payload?.categoryName ?? payload?.category ?? "기타") : "기타", [isFromPost, payload]);
  const postChannel = useMemo(() => isFromPost ? (payload?.channel_name ?? payload?.channelName ?? "") : "", [isFromPost, payload]);
  const postBoard = useMemo(() => isFromPost ? (payload?.board_name ?? payload?.boardName ?? "") : "", [isFromPost, payload]);

  const postStartRaw = useMemo(() => isFromPost ? (payload?.start_at ?? payload?.startAt ?? payload?.posted_at ?? payload?.postedAt ?? "") : "", [isFromPost, payload]);
  const postEndRaw = useMemo(() => isFromPost ? (payload?.end_at ?? payload?.endAt ?? payload?.start_at ?? payload?.startAt ?? "") : "", [isFromPost, payload]);

  const aiTitle = useMemo(() => (isFromPost ? postTitle : ""), [isFromPost, postTitle]);
  const aiContent = useMemo(() => (isFromPost ? postContent : ""), [isFromPost, postContent]);

  const getInitialStart = () => {
    if (isEdit) return splitDateTime(payload?.startAt || payload?.start_at);
    return { date: "", time: "00:00" };
  };

  const getInitialEnd = () => {
    if (isEdit) return splitDateTime(payload?.endAt || payload?.end_at);
    return { date: "", time: "00:00" };
  };

  const [title, setTitle] = useState(isEdit ? (payload?.title ?? payload?.name ?? "") : "");
  const [content, setContent] = useState(isEdit ? (payload?.content ?? payload?.rawContent ?? "") : "");

  const [startDate, setStartDate] = useState(getInitialStart().date);
  const [startTime, setStartTime] = useState(getInitialStart().time);
  const [endDate, setEndDate] = useState(getInitialEnd().date);
  const [endTime, setEndTime] = useState(getInitialEnd().time);

  const [color, setColor] = useState(() => {
    if (isEdit) return payload?.color || getDefaultColorForCategory(payload?.category);
    return "";
  });
  const [saving, setSaving] = useState(false);
  const [isAiApplied, setIsAiApplied] = useState(false);
  const [originalValues, setOriginalValues] = useState(null);

  const TITLE_LIMIT = 50;
  const CONTENT_LIMIT = 2000;

  const titleError = title.length > TITLE_LIMIT;
  const contentError = content.length > CONTENT_LIMIT;

  useEffect(() => {
    // 1분 단위로 변경되면서 기존 5분 단위 반올림 로직 제거
  }, []);

  const toggleAi = () => {
    if (!isAiApplied) {
      setOriginalValues({
        title,
        content,
        startDate,
        startTime,
        endDate,
        endTime,
      });

      setTitle(aiTitle);
      setContent(aiContent);
      const s = splitDateTime(postStartRaw);
      const e = splitDateTime(postEndRaw);
      setStartDate(s.date);
      setStartTime(s.time);
      setEndDate(e.date);
      setEndTime(e.time);
      setIsAiApplied(true);
    } else {
      if (originalValues) {
        setTitle(originalValues.title);
        setContent(originalValues.content);
        setStartDate(originalValues.startDate);
        setStartTime(originalValues.startTime);
        setEndDate(originalValues.endDate);
        setEndTime(originalValues.endTime);
      }
      setIsAiApplied(false);
    }
  };

  const submit = async () => {
    const finalTitle = title || (isFromPost ? aiTitle : "");
    const combine = (d, t) => {
      if (!d) return null;
      return new Date(`${d}T${t || "00:00"}:00`).toISOString();
    };

    const finalStartISO = combine(startDate, startTime);
    const finalEndISO = combine(endDate, endTime);
    const finalColor = color || "#8E8E93";

    if (!finalTitle.trim()) return actions.openConfirm("event_title_required");
    if (titleError || contentError) return;

    if (!startDate) return actions.openConfirm("event_start_date_required");
    if (!endDate) return actions.openConfirm("event_end_date_required");

    if (finalStartISO && finalEndISO && finalEndISO < finalStartISO) {
      return actions.openConfirm("event_invalid_period");
    }

    setSaving(true);
    try {
      if (isEdit) {
        await actions.updateCalendarEvent(payload.id, {
          title: finalTitle,
          content: content ?? "",
          startAt: finalStartISO,
          endAt: finalEndISO,
          color: finalColor,
        });
        actions.closeCalendarEvent();
        actions.openConfirm("event_update_success");
        return;
      }

      const newEvent = {
        id: uid(),
        source: isFromPost ? "post" : "manual",
        postId: isFromPost ? getPostId(payload) : null,
        title: finalTitle,
        content: content || (isFromPost ? aiContent : ""),
        startAt: finalStartISO,
        endAt: finalEndISO,
        mmLink: isFromPost ? getPostLink(payload) : null,
        boardName: isFromPost ? postBoard : "개인일정",
        channelName: isFromPost ? postChannel : "",
        category: isFromPost ? postCategory : "기타",
        color: finalColor,
        createdAt: new Date().toISOString(),
      };

      await actions.createCalendarEvent(newEvent);
      actions.closeCalendarEvent();
      actions.openConfirm("event_success");
    } catch (e) {
      alert(e?.message || "일정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    actions.openConfirm("delete_event", { eventId: payload.id });
  };

  const headerContent = (
    <div>
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3">
        {isEdit ? (
          <>
            <span>일정 수정</span>
            <span className="text-slate-300">|</span>
            <span>{payload?.category || "기타"}</span>
          </>
        ) : (
          <>
            {postBoard && <span>{postBoard}</span>}
            {(postChannel || postCategory) && <span className="text-slate-300">|</span>}
            {postChannel && <span># {postChannel}</span>}
            {postCategory && (
              <span className="bg-slate-100 text-[#1E325C] px-2 py-0.5 rounded text-[10px] ml-1 font-black">
                {postCategory}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-3 mb-[-8px]">
        <h3 className="font-medium text-2xl text-slate-900">{isEdit ? "일정 수정" : "일정 등록"}</h3>
        {!isEdit && isFromPost && (
          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={toggleAi}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all shadow-sm ${isAiApplied
                ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                : "bg-[#FFBC1F] text-[#1E325C] hover:brightness-105"
                }`}
              disabled={saving}
            >
              {isAiApplied ? (
                <>
                  <RotateCcw size={12} /> 추천 내용 취소하기
                </>
              ) : (
                <>
                  <Sparkles size={12} className="fill-current" /> AI 추천 내용 한번에 등록하기
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-400 font-bold">
              AI로 등록한 내용은 수정할 수 있습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ModalBase
      title={headerContent}
      onClose={onClose}
      size="lg"
      headerVariant="light"
    >
      <div className="space-y-6">

        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 block pl-1">일정 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_LIMIT}
            placeholder={isFromPost ? (aiTitle || "일정 제목을 입력하세요") : "일정 제목을 입력하세요"}
            className={`w-full px-0 py-3 bg-transparent border-b-2 text-xl font-bold focus:outline-none placeholder:text-slate-300 transition-colors ${titleError ? "border-red-500" : "border-slate-100 focus:border-[#1E325C]"
              }`}
          />
          {titleError && (
            <p className="text-[10px] text-red-500 pl-1 font-bold">글자수 제한은 {TITLE_LIMIT}자입니다 ({title.length}/{TITLE_LIMIT})</p>
          )}
          {isFromPost && !title && (
            <p className="text-[10px] text-slate-400 pl-1">AI 추천: {aiTitle}</p>
          )}
        </div>

        {/* Content Input */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center border-l-[3px] border-[#FFBC1F] pl-3 font-bold text-slate-700 h-4">
              상세 내용
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={CONTENT_LIMIT}
            placeholder="상세 내용을 입력하세요"
            className={`w-full pt-2 pb-5 px-5 bg-[#F8F9FC] border rounded-2xl text-slate-600 font-medium focus:outline-none focus:bg-white focus:ring-1 transition-all resize-none h-32 custom-scrollbar ${contentError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-transparent focus:border-[#1E325C] focus:ring-[#1E325C]"
              }`}
          />
          {contentError && (
            <p className="text-[10px] text-red-500 pl-1 font-bold">글자수 제한은 {CONTENT_LIMIT}자입니다 ({content.length}/{CONTENT_LIMIT})</p>
          )}
        </div>

        {/* Color Selection */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center border-l-[3px] border-[#FFBC1F] pl-3 font-bold text-slate-700 h-4">
            일정 색상 선택
          </div>
          <div className="bg-[#F8F9FC] p-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <ColorPicker value={color} onChange={setColor} colors={EVENT_COLORS} />
          </div>
        </div>

        {/* Time Setting Box */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center border-l-[3px] border-[#FFBC1F] pl-3 font-bold text-slate-700 h-4">
            일정 기간 설정
          </div>
          <div className="bg-[#F8F9FC] rounded-2xl p-6 border border-slate-100 shadow-sm relative z-30">
            <div className="flex flex-col md:flex-row items-stretch gap-6">
              {/* Start */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <span className="w-2 h-2 rounded-full bg-[#FFBC1F]" />
                  <label className="text-sm font-black text-[#1E325C] uppercase tracking-wider">시작 일시</label>
                </div>
                <div className="flex gap-2">
                  <div className="flex-[1.2]">
                    <CustomDatePicker value={startDate} onChange={setStartDate} color="#1E325C" />
                  </div>
                  <div className="flex-[1]">
                    <CustomTimePicker value={startTime} onChange={setStartTime} color="#1E325C" />
                  </div>
                </div>
              </div>

              {/* Arrow Divider */}
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
                <div className="flex gap-2">
                  <div className="flex-[1.2]">
                    <CustomDatePicker value={endDate} onChange={setEndDate} color="#FFBC1F" />
                  </div>
                  <div className="flex-[1]">
                    <CustomTimePicker value={endTime} onChange={setEndTime} color="#FFBC1F" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
          <button
            onClick={submit}
            disabled={saving || titleError || contentError}
            className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${saving || titleError || contentError
              ? "bg-slate-300 text-slate-100 cursor-not-allowed"
              : "bg-[#1E325C] text-white hover:bg-[#2a457a] shadow-blue-900/10"
              }`}
          >
            {saving ? "저장 중..." : (isEdit ? "수정 완료" : "일정 등록하기")}
          </button>
          <button
            onClick={isEdit ? handleDelete : onClose}
            className={`px-8 py-3 rounded-xl font-bold transition-all border ${isEdit
              ? "bg-white border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white"
              : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
          >
            {isEdit ? "삭제" : "취소"}
          </button>
        </div>

      </div>
    </ModalBase>
  );
}
