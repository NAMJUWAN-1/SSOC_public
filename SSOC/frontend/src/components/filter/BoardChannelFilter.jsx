import React from "react";
import { Check, Layers, X } from "lucide-react";
import { MOCK_BOARDS } from "../../data/mockData";
import { findChannelName } from "../../utils/board";

export default function BoardChannelFilter({
  open,
  selectedBoard,
  selectedChannels,
  onSelectBoard,
  onToggleChannel,
  onReset,
}) {
  if (!open) return null;

  const board = MOCK_BOARDS.find((b) => b.id === selectedBoard);

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mb-6">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
          Board 선택
        </h4>
        <div className="flex flex-wrap gap-2">
          {MOCK_BOARDS.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBoard(b.id)}
              className={[
                "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                selectedBoard === b.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100",
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <Layers size={14} /> {b.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedBoard && (
        <div className="animate-in fade-in duration-300">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
            Channel 필터
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {board?.channels?.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onToggleChannel(ch.id)}
                className={[
                  "px-4 py-3 rounded-xl text-xs font-black transition-all border text-left flex items-center justify-between",
                  selectedChannels.includes(ch.id)
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 ring-1 ring-indigo-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <span># {ch.name}</span>
                {selectedChannels.includes(ch.id) && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {(selectedBoard || selectedChannels.length > 0) && (
        <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black text-slate-400 mr-2">적용된 필터:</span>

          {selectedBoard && (
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100 flex items-center">
              {board?.name}
              <button onClick={() => onSelectBoard(selectedBoard)} className="ml-2 hover:text-blue-800">
                <X size={10} />
              </button>
            </span>
          )}

          {selectedChannels.map((cid) => (
            <span key={cid} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black border border-indigo-100 flex items-center">
              # {findChannelName(cid)}
              <button onClick={() => onToggleChannel(cid)} className="ml-2 hover:text-indigo-800">
                <X size={10} />
              </button>
            </span>
          ))}

          <button onClick={onReset} className="text-[10px] text-slate-400 underline hover:text-slate-600 ml-auto">
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
