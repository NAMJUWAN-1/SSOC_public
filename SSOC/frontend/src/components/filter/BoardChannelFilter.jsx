import React from "react";
import { Check, Tag, X } from "lucide-react";


export default function BoardChannelFilter({
  open,
  boards = [],
  categories = [],
  showCategory = true,
  selectedBoard,
  selectedChannels,
  selectedCategory,
  onSelectBoard,
  onToggleChannel,
  onSelectCategory,
  onReset,
}) {
  if (!open) return null;

  const canShowCategory = !!showCategory && (selectedChannels?.length ?? 0) === 1;

  const board = boards.find((b) => b.board_id === selectedBoard);

  const findChannelName = (cid) => {
    for (const b of boards) {
      const ch = b.channels?.find((c) => c.channel_id === cid);
      if (ch) return ch.channel_name;
    }
    return String(cid);
  };

  const findCategoryName = (catId) => {
    const c = categories.find((x) => x.category_id === catId);
    return c?.category_name ?? String(catId);
  };

  return (
    <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Board */}
      <div className="mb-4 flex items-center gap-4">
        <h4 className="text-sm font-bold text-slate-800 shrink-0 border-r-2 border-slate-200 mr-2 w-24 text-center">보드</h4>
        <div className="flex flex-wrap gap-2">
          {boards.map((b) => (
            <button
              key={b.board_id}
              onClick={() => onSelectBoard?.(b.board_id)}
              className={[
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                selectedBoard === b.board_id
                  ? "bg-[#1E325C] text-white border-[#1E325C] shadow-md font-black"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              {b.board_name}
            </button>
          ))}
        </div>
      </div>

      {/* Channel */}
      {
        selectedBoard && (
          <div className="animate-in fade-in duration-300 flex items-center gap-4">
            <h4 className="text-sm font-bold text-slate-800 shrink-0 border-r-2 border-slate-200 mr-2 w-24 text-center">채널</h4>
            <div className="flex flex-wrap gap-2 flex-1">
              {board?.channels?.map((ch) => (
                <button
                  key={ch.channel_id}
                  onClick={() => onToggleChannel?.(ch.channel_id)}
                  className={[
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1",
                    selectedChannels?.includes(ch.channel_id)
                      ? "bg-[#1E325C] text-white border-[#1E325C] shadow-md font-black"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span>{ch.channel_name}</span>
                </button>
              ))}
            </div>
          </div>
        )
      }

      {/* Category */}
      {selectedBoard && (
        <div className="mt-4 animate-in fade-in duration-300 flex items-center gap-4">
          <h4 className="text-sm font-bold text-slate-800 shrink-0 border-r-2 border-slate-200 mr-2 w-24 text-center">카테고리</h4>
          {!canShowCategory ? (
            <div className="text-sm text-slate-400 py-1.5">카테고리 없음</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-slate-400 py-1.5">카테고리 없음</div>
          ) : (
            <div className="flex flex-wrap gap-2 flex-1">
              {categories.map((c) => (
                <button
                  key={c.category_id}
                  onClick={() => onSelectCategory?.(c.category_id)}
                  className={[
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                    selectedCategory === c.category_id
                      ? "bg-[#1E325C] text-white border-[#1E325C] shadow-md font-black"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span>{c.category_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applied */}
      {
        (selectedBoard || (selectedChannels?.length ?? 0) > 0 || (canShowCategory && !!selectedCategory)) && (
          <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-black text-slate-400 mr-2">적용된 필터:</span>

            {selectedBoard && (
              <span className="px-3 py-1 bg-white text-[#1E325C] rounded-lg text-[10px] font-black border border-[#1E325C] flex items-center">
                {board?.board_name ?? selectedBoard}
                <button onClick={() => onSelectBoard?.(selectedBoard)} className="ml-2 hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            )}

            {(selectedChannels || []).map((cid) => (
              <span
                key={cid}
                className="px-3 py-1 bg-white text-[#1E325C] rounded-lg text-[10px] font-black border border-[#1E325C] flex items-center"
              >
                # {findChannelName(cid)}
                <button onClick={() => onToggleChannel?.(cid)} className="ml-2 hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}

            {canShowCategory && selectedCategory && (
              <span className="px-3 py-1 bg-white text-[#1E325C] rounded-lg text-[10px] font-black border border-[#1E325C] flex items-center">
                {findCategoryName(selectedCategory)}
                <button onClick={() => onSelectCategory?.(selectedCategory)} className="ml-2 hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            )}

            <button onClick={onReset} className="text-[10px] text-slate-400 underline hover:text-slate-600 ml-auto">
              필터 초기화
            </button>
          </div>
        )
      }
    </div >
  );
}
