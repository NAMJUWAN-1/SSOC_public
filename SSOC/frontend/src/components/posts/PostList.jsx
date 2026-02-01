import React from "react";
import { Star } from "lucide-react";

function formatKoreanDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function snippet100(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > 100 ? t.slice(0, 100) + "..." : t;
}

export default function PostList({
  items,
  onOpen,
  archivesSet,
  onToggleArchive,
  showArchiveConfirm,
  showArchiveButton = true,
  loading = false,
}) {
  return (
    <div className="min-h-[400px] flex flex-col gap-4">
      {loading ? (
        <div className="bg-white rounded-[2rem] p-24 text-center text-slate-400 font-black border border-slate-100 shadow-sm">
          불러오는 중...
          <div className="text-sm font-medium mt-1">잠시만 기다려주세요.</div>
        </div>
      ) : items.length > 0 ? (
        items.map((p) => {
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
              className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 hover:bg-white cursor-pointer transition-all duration-300 flex items-start gap-6 group relative overflow-hidden active:scale-95 hover:scale-[1.02] apple-bezier"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1E325C] scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {channelName && (
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-black border border-slate-100">
                      # {channelName}
                    </span>
                  )}
                  {categoryName && (
                    <span className="px-2.5 py-1 bg-slate-100 text-[#1E325C] rounded-lg text-[11px] font-black border border-slate-200">
                      {categoryName}
                    </span>
                  )}
                </div>

                <h3 className="font-black text-slate-900 group-hover:text-[#1E325C] transition-colors leading-snug text-base">
                  {title}
                </h3>

                {content ? (
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {snippet100(content)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-end shrink-0 space-y-3">
                <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">
                  {formatKoreanDate(postedAt)}
                </span>

                {showArchiveButton && onToggleArchive ? (
                  <button
                    className={[
                      "p-2 rounded-xl transition-all",
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
                  >
                    <Star size={18} className={isArchived ? "text-yellow-400 fill-current" : "text-slate-200"} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white rounded-[2rem] p-24 text-center text-slate-400 font-black border border-slate-100 shadow-sm">
          검색 결과가 없습니다.
          <div className="text-sm font-medium mt-1">필터/검색어를 바꿔보세요.</div>
        </div>
      )}
    </div>
  );
}
