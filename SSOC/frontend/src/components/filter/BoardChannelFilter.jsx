import React from "react";
import { Check, Layers, Tag, X } from "lucide-react";

/**
 * BoardChannelFilter
 * - boards: [{ board_id, board_name, channels: [{ channel_id, channel_name }] }]
 * - categories: [{ category_id, category_name }]
 */
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

  // Backend structure: category is nested under a single channel.
  // UX requirement: show category filter ONLY when exactly ONE channel is selected.
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
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Board */}
      <div className="mb-6">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Board 선택</h4>
        <div className="flex flex-wrap gap-2">
          {boards.map((b) => (
            <button
              key={b.board_id}
              onClick={() => onSelectBoard?.(b.board_id)}
              className={[
                "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                selectedBoard === b.board_id
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100",
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <Layers size={14} /> {b.board_name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Channel */}
      {selectedBoard && (
        <div className="animate-in fade-in duration-300">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Channel 필터</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {board?.channels?.map((ch) => (
              <button
                key={ch.channel_id}
                onClick={() => onToggleChannel?.(ch.channel_id)}
                className={[
                  "px-4 py-3 rounded-xl text-xs font-black transition-all border text-left flex items-center justify-between",
                  selectedChannels?.includes(ch.channel_id)
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 ring-1 ring-indigo-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <span># {ch.channel_name}</span>
                {selectedChannels?.includes(ch.channel_id) && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category */}
      {canShowCategory && (
        <div className="mt-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Category 필터</h4>
          {categories.length === 0 ? (
            <div className="text-sm text-slate-400 px-2 py-3">해당 조건에서 카테고리가 없습니다.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.category_id}
                  onClick={() => onSelectCategory?.(c.category_id)}
                  className={[
                    "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                    selectedCategory === c.category_id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <Tag size={14} /> {c.category_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applied */}
      {(selectedBoard || (selectedChannels?.length ?? 0) > 0 || (canShowCategory && !!selectedCategory)) && (
        <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black text-slate-400 mr-2">적용된 필터:</span>

          {selectedBoard && (
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100 flex items-center">
              {board?.board_name ?? selectedBoard}
              <button onClick={() => onSelectBoard?.(selectedBoard)} className="ml-2 hover:text-blue-800">
                <X size={10} />
              </button>
            </span>
          )}

          {(selectedChannels || []).map((cid) => (
            <span
              key={cid}
              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black border border-indigo-100 flex items-center"
            >
              # {findChannelName(cid)}
              <button onClick={() => onToggleChannel?.(cid)} className="ml-2 hover:text-indigo-800">
                <X size={10} />
              </button>
            </span>
          ))}

          {canShowCategory && selectedCategory && (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-100 flex items-center">
              {findCategoryName(selectedCategory)}
              <button onClick={() => onSelectCategory?.(selectedCategory)} className="ml-2 hover:text-emerald-900">
                <X size={10} />
              </button>
            </span>
          )}

          <button onClick={onReset} className="text-[10px] text-slate-400 underline hover:text-slate-600 ml-auto">
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
