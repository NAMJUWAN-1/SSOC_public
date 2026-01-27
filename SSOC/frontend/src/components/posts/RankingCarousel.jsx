import React from "react";
import { Flame } from "lucide-react";
import { getBoardAndChannelName } from "../../utils/board";

export default function RankingCarousel({ posts, onOpen }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center">
          <span className="w-1.5 h-6 bg-yellow-400 rounded-full mr-3 shadow-lg shadow-yellow-100" />
          실시간 아카이빙 랭킹
        </h2>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4 snap-x">
        {posts.map((p, idx) => {
          const { boardName, channelName } = getBoardAndChannelName(p.boardId, p.channelId);
          return (
            <div
              key={p.id}
              onClick={() => onOpen(p)}
              className="flex-shrink-0 w-64 snap-center bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                {idx + 1}
              </div>
              <div className="mt-8 mb-2">
                <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug h-10">
                  {p.title}
                </h3>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span className="flex items-center text-red-500">
                  <Flame size={12} className="mr-1 fill-current" /> {p.scrapCount} Scraps
                </span>
                <span className="truncate max-w-[90px]">{channelName || boardName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
