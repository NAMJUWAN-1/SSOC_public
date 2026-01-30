import React from "react";
import { Star, Clock } from "lucide-react";

function formatKoreanDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

function snippet(text, n = 90) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > n ? t.slice(0, n) + "..." : t;
}

export default function ArchiveGrid({
  items,
  onOpen,
  archivesSet,
  onToggleArchive,
  showArchiveConfirm,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-24 text-center text-slate-400 font-black">
        불러오는 중...
        <div className="text-sm font-medium mt-1">잠시만 기다려주세요.</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-24 text-center text-slate-400 font-black">
        보관된 공지가 없습니다.
        <div className="text-sm font-medium mt-1">대시보드에서 북마크(아카이브) 해보세요.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p) => {
        const id = String(p.post_id ?? p.id);
        const title = p.ai_title ?? p.title ?? "(제목 없음)";
        const content = p.content ?? p.rawContent ?? "";
        const postedAt = p.posted_at ?? p.postedAt ?? p.createdAt ?? p.start_at ?? p.startAt;

        const channelName = p.channel_name ?? p.channelName ?? null;
        const categoryName = p.category_name ?? p.categoryName ?? null;

        const isArchived = !!archivesSet?.has?.(id);

        return (
          <div
            key={id}
            onClick={() => onOpen?.(p)}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer p-6 relative overflow-hidden group"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {channelName && (
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-black border border-slate-100">
                      # {channelName}
                    </span>
                  )}
                  {categoryName && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-black border border-emerald-100">
                      {categoryName}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-black text-slate-900 leading-snug text-base line-clamp-2 group-hover:text-emerald-700 transition-colors">
                  {title}
                </h3>
              </div>

              {onToggleArchive ? (
                <button
                  className={[
                    "p-2 rounded-xl transition-all shrink-0",
                    isArchived ? "bg-yellow-50 scale-110" : "bg-slate-50 group-hover:bg-white",
                  ].join(" ")}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showArchiveConfirm && isArchived) {
                      showArchiveConfirm(id);
                    } else {
                      onToggleArchive(id);
                    }
                  }}
                  aria-label="toggle-archive"
                >
                  <Star size={18} className={isArchived ? "text-yellow-400 fill-current" : "text-slate-200"} />
                </button>
              ) : null}
            </div>

            {content ? (
              <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-3">
                {snippet(content)}
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                (내용 없음)
              </p>
            )}

            <div className="mt-5 flex items-center text-[11px] font-black text-slate-400 gap-2">
              <Clock size={14} className="text-slate-300" />
              <span>{formatKoreanDate(postedAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
