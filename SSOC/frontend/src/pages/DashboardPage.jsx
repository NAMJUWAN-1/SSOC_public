import React, { useMemo, useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { useApp } from "../state/AppProvider";

import RankingCarousel from "../components/posts/RankingCarousel";
import SearchWithHistory from "../components/search/SearchWithHistory";
import BoardChannelFilter from "../components/filter/BoardChannelFilter";
import PostList from "../components/posts/PostList";
import Pagination from "../components/common/Pagination";

export default function DashboardPage() {
  const { state, actions } = useApp();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState([]);

  const ITEMS_PER_PAGE = 10;

  const rankingTop5 = useMemo(() => {
    return [...state.posts].sort((a, b) => b.scrapCount - a.scrapCount).slice(0, 5);
  }, [state.posts]);

  const filtered = useMemo(() => {
    return state.posts.filter((p) => {
      const matchQ = p.title.toLowerCase().includes(q.toLowerCase());
      let matchFilter = true;
      if (selectedChannels.length > 0) matchFilter = selectedChannels.includes(p.channelId);
      else if (selectedBoard) matchFilter = p.boardId === selectedBoard;
      return matchQ && matchFilter;
    });
  }, [state.posts, q, selectedBoard, selectedChannels]);

  useEffect(() => setPage(1), [q, selectedBoard, selectedChannels]);

  const current = useMemo(() => {
    const s = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const onSelectBoard = (boardId) => {
    if (selectedBoard === boardId) {
      setSelectedBoard(null);
      setSelectedChannels([]);
      return;
    }
    setSelectedBoard(boardId);
    setSelectedChannels([]);
  };

  const onToggleChannel = (cid) => {
    setSelectedChannels((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* 1) ranking */}
      <RankingCarousel posts={rankingTop5} onOpen={actions.openPostDetailFromPost} />

      {/* 2) list + filter/search */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3 shadow-lg shadow-blue-200" />
            전체 공지사항
          </h2>

          <div className="relative w-full sm:w-auto flex items-center gap-2">
            <SearchWithHistory
              storageKey="recent_searches_dashboard"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="제목으로 검색..."
              onSearch={() => {}}
            />
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={[
                "p-3 rounded-2xl border transition-all",
                filterOpen ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        <BoardChannelFilter
          open={filterOpen}
          selectedBoard={selectedBoard}
          selectedChannels={selectedChannels}
          onSelectBoard={onSelectBoard}
          onToggleChannel={onToggleChannel}
          onReset={() => { setSelectedBoard(null); setSelectedChannels([]); }}
        />

        <PostList
          items={current}
          archivesSet={state.archives}
          onOpen={actions.openPostDetailFromPost}
          onToggleArchive={actions.toggleArchive}
          // 메인에서는 confirm 없이 바로 토글
          showArchiveConfirm={null}
        />

        <Pagination
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={page}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
