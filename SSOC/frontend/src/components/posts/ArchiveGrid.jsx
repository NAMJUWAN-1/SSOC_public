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
    hour: "2-digit",
    minute: "2-digit",
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
}) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-24 text-center text-slate-400 font-black">
        보관된 공지가 없습니다.
        <div className="text-sm font-medium mt-1">대시보드에서 북마크(아카이브) 해보세요.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((p) => {
        const id = String(p.post_id ?? p.id);
        const title = p.ai_title ?? p.title ?? "(제목 없음)";
        const content = p.display_content ?? p.displayContent ?? p.content ?? p.rawContent ?? "";
        const postedAt = p.posted_at ?? p.postedAt ?? p.createdAt ?? p.start_at ?? p.startAt;

        const channelName = p.channel_name ?? p.channelName ?? null;
        const categoryName = p.category_name ?? p.categoryName ?? null;

        const isArchived = !!archivesSet?.has?.(id);

        return (
          <div
            key={id}
            onClick={() => onOpen?.(p)}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 hover:bg-white cursor-pointer transition-all duration-300 flex flex-col group relative overflow-hidden h-full active:scale-95 hover:scale-[1.03] apple-bezier"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#1E325C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

            <div className="p-6 flex flex-col h-full">
              {/* Header Tags */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {channelName && (
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black border border-slate-100">
                    # {channelName}
                  </span>
                )}
                {categoryName && (
                  <span className="px-2.5 py-1 bg-slate-100 text-[#1E325C] rounded-lg text-[10px] font-black border border-slate-200">
                    {categoryName}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-black text-slate-900 group-hover:text-[#1E325C] transition-colors leading-snug text-base line-clamp-2 h-12">
                {title}
              </h3>

              {/* Content Preview */}
              <div className="mt-3 flex-1">
                {content ? (
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {snippet(content)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    (내용 요약 없음)
                  </p>
                )}
              </div>

              {/* Footer: Date & Action */}
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400">
                  {formatKoreanDate(postedAt)}
                </span>

                {onToggleArchive ? (
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
                        // Pass the full post object to toggleArchive
                        onToggleArchive(p);
                      }
                    }}
                  >
                    <Star size={18} className={isArchived ? "text-yellow-400 fill-current" : "text-slate-200"} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
