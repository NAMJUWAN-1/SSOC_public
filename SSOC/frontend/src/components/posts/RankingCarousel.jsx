import React, { useRef } from "react";
import { TrendingUp, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../components/ui/utils";

/**
 * RankingCarousel
 * Displays top posts with a badge and archiving stats.
 * Includes its own header and navigation controls.
 */
export default function RankingCarousel({ posts = [], onOpen }) {
  const scrollRef = useRef(null);

  if (!posts || posts.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300; // Approx card width + gap
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
      {/* Added pt-4 to accommodate the overlapping badge */}
      <div
        ref={scrollRef}
        className="flex space-x-6 overflow-x-auto pb-4 pt-4 snap-x scrollbar-hide"
      >
        {posts.map((p, idx) => {
          const id = p.post_id ?? p.id;
          const headline = p.ai_title ?? p.title ?? "(제목 없음)";
          // Mocking archiving count for visual match since actual data might not exist in this snippet
          // Using random numbers for demo or p.views if available as a proxy
          const archivingCount = p.views ? p.views * 12 : 120 + idx * 30;
          const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : "2026. 1. 1.";

          return (
            <div
              key={id}
              onClick={() => onOpen?.(p)}
              className="flex-shrink-0 w-[320px] snap-start bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-lg transition-all cursor-pointer relative mt-2"
            >
              {/* Ranking Badge - Overlapping Top Left */}
              <div className="absolute -top-4 left-6 w-10 h-10 rounded-full bg-[#FFBC1F] text-[#1E325C] flex items-center justify-center font-black text-lg shadow-md z-10">
                {idx + 1}
              </div>

              <div className="mt-4 mb-3">
                <h3 className="font-bold text-slate-800 text-lg line-clamp-2 leading-snug h-14">
                  {headline}
                </h3>
              </div>

              {/* Info */}
              <div className="text-sm text-slate-400 font-medium">
                {dateStr}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
