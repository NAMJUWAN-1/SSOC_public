import React from "react";
import { ChevronRight, Star } from "lucide-react";
import { getBoardAndChannelName } from "../../utils/board";
import { formatDate } from "../../utils/date";

export default function PostList({ items, archivesSet, onOpen, onToggleArchive, showArchiveConfirm }) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50 min-h-[400px] flex flex-col">
      <div className="flex-1">
        {items.length > 0 ? (
          items.map((p) => {
            const { boardName, channelName } = getBoardAndChannelName(p.boardId, p.channelId);
            const isArchived = archivesSet.has(p.id);

            return (
              <div
                key={p.id}
                onClick={() => onOpen(p)}
                className="p-6 hover:bg-slate-50 cursor-pointer transition flex items-center group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                <div className="flex-1 pr-8">
                  <div className="flex items-center mb-2 space-x-2 text-xs font-black text-slate-400 uppercase tracking-wide">
                    <span className="text-slate-500">{boardName}</span>
                    {channelName && (
                      <>
                        <ChevronRight size={12} />
                        <span className="text-blue-600">{channelName}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug text-base">
                    {p.title}
                  </h3>
                </div>

                <div className="flex flex-col items-end shrink-0 space-y-2">
                  <span className="text-[10px] font-black text-slate-400">
                    {formatDate(p.createdAt)}
                  </span>

                  <button
                    className={[
                      "p-2 rounded-xl transition-all",
                      isArchived ? "bg-yellow-50 scale-110" : "bg-slate-50 group-hover:bg-white",
                    ].join(" ")}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showArchiveConfirm && isArchived) {
                        // 마이페이지에서만 confirm
                        showArchiveConfirm(p.id);
                      } else {
                        onToggleArchive(p.id);
                      }
                    }}
                  >
                    <Star size={18} className={isArchived ? "text-yellow-400 fill-current" : "text-slate-200"} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-24 text-center text-slate-400 font-black">
            검색 결과가 없습니다.
            <div className="text-sm font-medium mt-1">필터/검색어를 바꿔보세요.</div>
          </div>
        )}
      </div>
    </div>
  );
}
