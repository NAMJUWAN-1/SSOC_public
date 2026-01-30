import React from "react";
import { Sparkles } from "lucide-react";

/**
 * RankingCarousel
 * (기존: 아카이빙 랭킹)
 * 현재는 backend 연동 전이므로, Dashboard에서 "최근 공지" 형태로 사용.
 */
export default function RankingCarousel({ posts = [], onOpen, title = "최근 공지" }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3 shadow-lg shadow-emerald-100" />
          {title}
        </h2>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4 snap-x">
        {posts.map((p, idx) => {
          const id = p.post_id ?? p.id;
          const headline = p.ai_title ?? p.title ?? "(제목 없음)";
          const channel = p.channel_name ?? p.channelName ?? "";
          const category = p.category_name ?? p.categoryName ?? "";

          return (
            <div
              key={id}
              onClick={() => onOpen?.(p)}
              className="flex-shrink-0 w-64 snap-center bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                {idx + 1}
              </div>
              <div className="mt-8 mb-2">
                <h3 className="font-black text-slate-900 line-clamp-2 leading-snug h-12">{headline}</h3>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span className="flex items-center text-emerald-600">
                  <Sparkles size={12} className="mr-1 fill-current" /> 최신
                </span>
                <span className="truncate max-w-[120px]">{channel ? `#${channel}` : category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
