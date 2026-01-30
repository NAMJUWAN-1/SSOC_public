import React, { useMemo, useState } from "react";
import { CalendarPlus, Sparkles } from "lucide-react";
import ModalBase from "../common/ModalBase";
import ColorPicker from "../common/ColorPicker";
import { useApp } from "../../state/AppProvider";
import { toInputValue } from "../../utils/date";
import { EVENT_COLOR_PRESETS, getDefaultColorForCategory } from "../../utils/eventColor";
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

export default function CalendarEventModal({ mode, payload, onClose }) {
  const { actions } = useApp();

  const isEdit = mode === "edit";

  // payload:
  // - create: post(공지) or null(개인 일정)
  // - edit: calendarEvent
  const isFromPost = !isEdit && !!payload;

  const postTitle = useMemo(() => {
    if (!isFromPost) return "";
    return payload?.ai_title ?? payload?.title ?? "";
  }, [isFromPost, payload]);

  const postContent = useMemo(() => {
    if (!isFromPost) return "";
    return payload?.content ?? payload?.rawContent ?? "";
  }, [isFromPost, payload]);

  const postCategory = useMemo(() => {
    if (!isFromPost) return "기타";
    return payload?.category_name ?? payload?.categoryName ?? payload?.category ?? "기타";
  }, [isFromPost, payload]);

  const postStartRaw = useMemo(() => {
    if (!isFromPost) return "";
    return payload?.start_at ?? payload?.startAt ?? payload?.posted_at ?? payload?.postedAt ?? "";
  }, [isFromPost, payload]);

  const postEndRaw = useMemo(() => {
    if (!isFromPost) return "";
    return payload?.end_at ?? payload?.endAt ?? payload?.start_at ?? payload?.startAt ?? "";
  }, [isFromPost, payload]);

  // AI 추천(현재는 post의 값을 그대로 추천값으로 사용)
  const aiTitle = useMemo(() => (isFromPost ? postTitle : ""), [isFromPost, postTitle]);
  const aiContent = useMemo(() => (isFromPost ? postContent : ""), [isFromPost, postContent]);
  const aiStart = useMemo(() => (isFromPost ? (postStartRaw ? toInputValue(postStartRaw) : "") : ""), [isFromPost, postStartRaw]);
  const aiEnd = useMemo(() => (isFromPost ? (postEndRaw ? toInputValue(postEndRaw) : "") : ""), [isFromPost, postEndRaw]);

  const [title, setTitle] = useState(isEdit ? (payload?.title ?? payload?.name ?? "") : "");
  const [content, setContent] = useState(isEdit ? (payload?.content ?? payload?.rawContent ?? "") : "");
  const [startAt, setStartAt] = useState(isEdit ? toInputValue(payload?.startAt ?? payload?.start_at) : "");
  const [endAt, setEndAt] = useState(isEdit ? toInputValue(payload?.endAt ?? payload?.end_at ?? payload?.startAt ?? payload?.start_at) : "");
  const [color, setColor] = useState(() => {
    if (isEdit) return payload?.color || getDefaultColorForCategory(payload?.category);
    if (isFromPost) return payload?.color || getDefaultColorForCategory(postCategory);
    return getDefaultColorForCategory("기타");
  });
  const [saving, setSaving] = useState(false);

  const applyAi = () => {
    setTitle(aiTitle);
    setContent(aiContent);
    setStartAt(aiStart);
    setEndAt(aiEnd);
    if (isFromPost) setColor(getDefaultColorForCategory(postCategory));
  };

  const submit = async () => {
    const finalTitle = title || aiTitle;
    const finalStart = startAt || aiStart;
    const finalEnd = endAt || aiEnd;

    if (!finalTitle) return alert("제목을 입력해주세요.");
    if (!finalStart) return alert("시작 일시를 입력해주세요.");

    setSaving(true);
    try {
      if (isEdit) {
        await actions.updateCalendarEvent(payload.id, {
          title: finalTitle,
          content: content ?? "",
          startAt: new Date(finalStart).toISOString(),
          endAt: finalEnd ? new Date(finalEnd).toISOString() : new Date(finalStart).toISOString(),
          color,
        });
        actions.closeCalendarEvent();
        return;
      }

      // create
      const newEvent = {
        id: uid(),
        source: isFromPost ? "post" : "manual",
        postId: isFromPost ? getPostId(payload) : null,
        title: finalTitle,
        content: content || (isFromPost ? aiContent : "사용자가 직접 등록한 일정입니다."),
        startAt: new Date(finalStart).toISOString(),
        endAt: finalEnd ? new Date(finalEnd).toISOString() : new Date(finalStart).toISOString(),
        mmLink: isFromPost ? getPostLink(payload) : null,
        category: isFromPost ? postCategory : "기타",
        color,
        createdAt: new Date().toISOString(),
      };

      await actions.createCalendarEvent(newEvent);
      actions.closeCalendarEvent();
    } catch (e) {
      alert(e?.message || "일정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBase
      title={isEdit ? "일정 수정" : "일정 등록"}
      onClose={onClose}
      size="md"
      headerVariant="light"
    >
      <div className="space-y-5">
        {!isEdit && isFromPost && (
          <button
            onClick={applyAi}
            className="w-full flex items-center justify-center py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 border border-indigo-100"
            disabled={saving}
          >
            <Sparkles size={14} className="mr-1.5" /> ✨ AI 추천 내용 한 번에 적용하기
          </button>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 ml-1">일정 기간 설정</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!isEdit && isFromPost && !startAt && postStartRaw && (
                <p className="text-[10px] text-slate-400 ml-1">
                  추천: {new Date(postStartRaw).toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 ml-1">일정 색상</label>
          <ColorPicker value={color} onChange={setColor} colors={EVENT_COLOR_PRESETS} />
          <p className="text-[10px] text-slate-400 ml-1">
            기본값은 카테고리 기준으로 자동 선택됩니다.
          </p>
        </div>

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
          <label className="text-xs font-black text-slate-600 ml-1">상세 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상세 내용을 입력하세요"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 resize-none h-28"
          />
          {!isEdit && isFromPost && !content && aiContent ? (
            <p className="text-[10px] text-slate-400 ml-1">추천 내용이 있습니다. 위 버튼으로 적용할 수 있어요.</p>
          ) : null}
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-4 bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-black text-base shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <CalendarPlus size={18} /> {saving ? "저장 중..." : isEdit ? "수정하기" : "일정 등록하기"}
        </button>
      </div>
    </ModalBase>
  );
}
