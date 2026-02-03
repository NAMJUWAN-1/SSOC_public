import React, { useRef } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import { TrendingUp, ChevronLeft, ChevronRight, ArrowUpRight, Star, Flame } from "lucide-react";
import { cn } from "../../components/ui/utils";

function snippet100(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > 100 ? t.slice(0, 100) + "..." : t;
}

export default function RankingCarousel({ posts = [], onOpen, loading = false }) {
  const scrollRef = useRef(null);

  if (loading) {
    return (
      <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8">
        <LoadingSpinner message="랭킹을 불러오는 중..." />
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <TrendingUp className="text-[#FFBC1F]" size={28} />
          실시간 아카이빙 랭킹
        </h2>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#1E325C] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#1E325C] transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="bg-slate-50/50 rounded-[2rem] p-6">
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto pb-4 pt-4 snap-x scrollbar-hide"
        >
          {posts.map((p, idx) => {
            const id = p.post_id ?? p.id;
            const headline = p.ai_title ?? p.title ?? "(제목 없음)";
            const content = p.display_content ?? p.displayContent ?? p.content ?? p.rawContent ?? "";
            const archivingCount = p.views ? p.views * 12 : 120 + idx * 30;
            const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : "2026. 1. 1.";

            return (
              <div
                key={id}
                onClick={() => onOpen?.(p)}
                className="flex-shrink-0 w-[320px] snap-start bg-white pt-6 px-6 pb-3 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative mt-2 active:scale-95"
              >
                {/* Ranking Badge */}
                <div className="absolute -top-4 left-6 w-10 h-10 rounded-full bg-[#FFBC1F] text-[#1E325C] flex items-center justify-center font-black text-lg shadow-md z-10">
                  {idx + 1}
                </div>

                <div className="mt-2 mb-1">
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-2 leading-snug h-12">
                    {headline}
                  </h3>
                </div>

                {content ? (
                  <p className="mb-2 text-sm text-slate-500 leading-relaxed line-clamp-2 h-10">
                    {snippet100(content)}
                  </p>
                ) : (
                  <div className="mb-2 h-10" />
                )}

                {/* Scrap Count Display */}
                <div className="flex items-center gap-1 text-[#E7625F] font-black text-[11px] tracking-tight mt-3 ml-[-2px]">
                  <Flame size={14} className="fill-current" />
                  <span>{p.scrap_count ?? 0} SCRAPS</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
