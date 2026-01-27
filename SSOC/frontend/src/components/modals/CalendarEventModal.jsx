import React, { useMemo, useState } from "react";
import { CalendarPlus, Sparkles } from "lucide-react";
import ModalBase from "../common/ModalBase";
import { useApp } from "../../state/AppProvider";
import { toInputValue } from "../../utils/date";

function uid() {
  return `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export default function CalendarEventModal({ mode, payload, onClose }) {
  const { state, actions } = useApp();

  const isEdit = mode === "edit";

  // payload:
  // - create: post(공지) or null(개인 일정)
  // - edit: calendarEvent
  const isFromPost = !isEdit && !!payload;

  // AI 추천(여기서는 post의 title/rawContent/startAt/endAt를 그대로 추천값으로 사용)
  const aiTitle = useMemo(() => (isFromPost ? payload.title : ""), [isFromPost, payload]);
  const aiContent = useMemo(() => (isFromPost ? payload.rawContent : ""), [isFromPost, payload]);
  const aiStart = useMemo(() => (isFromPost ? toInputValue(payload.startAt) : ""), [isFromPost, payload]);
  const aiEnd = useMemo(() => (isFromPost ? toInputValue(payload.endAt || payload.startAt) : ""), [isFromPost, payload]);

  const [title, setTitle] = useState(isEdit ? payload.title : "");
  const [content, setContent] = useState(isEdit ? (payload.content || "") : "");
  const [startAt, setStartAt] = useState(isEdit ? toInputValue(payload.startAt) : "");
  const [endAt, setEndAt] = useState(isEdit ? toInputValue(payload.endAt || payload.startAt) : "");

  const applyAi = () => {
    setTitle(aiTitle);
    setContent(aiContent);
    setStartAt(aiStart);
    setEndAt(aiEnd);
  };

  const submit = () => {
    const finalTitle = title || aiTitle;
    const finalStart = startAt || aiStart;
    const finalEnd = endAt || aiEnd;

    if (!finalTitle) return alert("제목을 입력해주세요.");
    if (!finalStart) return alert("시작 일시를 입력해주세요.");

    if (isEdit) {
      actions.updateCalendarEvent(payload.id, {
        title: finalTitle,
        content,
        startAt: new Date(finalStart).toISOString(),
        endAt: finalEnd ? new Date(finalEnd).toISOString() : new Date(finalStart).toISOString(),
      });
      actions.closeCalendarEvent();
      return;
    }

    // create
    const newEvent = {
      id: uid(),
      source: isFromPost ? "post" : "manual",
      postId: isFromPost ? payload.id : null,
      title: finalTitle,
      content: content || (isFromPost ? aiContent : "사용자가 직접 등록한 일정입니다."),
      startAt: new Date(finalStart).toISOString(),
      endAt: finalEnd ? new Date(finalEnd).toISOString() : new Date(finalStart).toISOString(),
      mmLink: isFromPost ? payload.mmLink : null,
      category: isFromPost ? payload.category : "기타",
      createdAt: new Date().toISOString(),
    };

    actions.createCalendarEvent(newEvent);
    actions.closeCalendarEvent();
  };

  return (
    <ModalBase
      title={isEdit ? "일정 수정" : "내 캘린더에 일정 등록"}
      onClose={onClose}
      size="md"
      headerVariant="light"
    >
      <div className="space-y-5">
        {!isEdit && isFromPost && (
          <button
            onClick={applyAi}
            className="w-full flex items-center justify-center py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 border border-indigo-100"
          >
            <Sparkles size={14} className="mr-1.5" /> ✨ AI 추천 내용 한 번에 적용하기
          </button>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 ml-1">일정 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isFromPost ? aiTitle : "일정 제목을 입력하세요"}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 ml-1">일정 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="일정 상세 내용을 입력하세요"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 resize-none h-28"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-600 ml-1">시작 일시</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!isEdit && isFromPost && !startAt && (
              <p className="text-[10px] text-slate-400 ml-1">추천: {new Date(payload.startAt).toLocaleString()}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-600 ml-1">종료 일시</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={submit}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-base shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <CalendarPlus size={18} /> {isEdit ? "수정하기" : "등록하기"}
        </button>
      </div>
    </ModalBase>
  );
}
