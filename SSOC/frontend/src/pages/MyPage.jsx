import React, { useMemo, useState, useEffect } from "react";
import { Archive, Filter, LogOut, Settings, Trash2, Bookmark, Calendar as CalendarIcon } from "lucide-react";
import { useApp } from "../state/AppProvider";

import SearchWithHistory from "../components/search/SearchWithHistory";
import BoardChannelFilter from "../components/filter/BoardChannelFilter";
import ArchiveGrid from "../components/posts/ArchiveGrid";
import Pagination from "../components/common/Pagination";

export default function MyPage() {
  const { state, actions } = useApp();

  // boards tree (for filter UI)
  const boards = useMemo(() => {
    const userChannels = state.auth.user?.channels || [];
    const map = new Map();
    for (const ch of userChannels) {
      const b = ch.board;
      if (!b) continue;
      const bid = b.board_id;
      if (!map.has(bid)) {
        map.set(bid, { board_id: bid, board_name: b.board_name, channels: [] });
      }
      const entry = map.get(bid);
      if (!entry.channels.some((x) => x.channel_id === ch.channel_id)) {
        entry.channels.push({ channel_id: ch.channel_id, channel_name: ch.channel_name });
      }
    }
    return Array.from(map.values());
  }, [state.auth.user]);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const ITEMS_PER_PAGE = 10;

  // '남은 일정'은 현재 시간 기준으로 계산 (1분마다 갱신)
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const myArchivedPosts = useMemo(() => {
    // 현재 단계에서는 backend에서 아카이브 데이터를 가져오지 않음
    return (state.posts || []).filter((p) => {
      const pid = p.post_id ?? p.id;
      return pid != null && state.archives.has(String(pid));
    });
  }, [state.posts, state.archives]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return myArchivedPosts.filter((p) => {
      const title = String(p.ai_title ?? p.title ?? "").toLowerCase();
      const matchQ = title.includes(ql);

      const pidBoard = p.board_id ?? p.boardId;
      const pidChannel = p.channel_id ?? p.channelId;

      let matchFilter = true;
      if (selectedChannels.length > 0) matchFilter = selectedChannels.includes(pidChannel);
      else if (selectedBoard) matchFilter = pidBoard === selectedBoard;

      return matchQ && matchFilter;
    });
  }, [myArchivedPosts, q, selectedBoard, selectedChannels]);

  useEffect(() => setPage(1), [q, selectedBoard, selectedChannels]);

  const current = useMemo(() => {
    const s = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const myArchiveCount = state.archiveCount || myArchivedPosts.length;
  const upcomingCount = useMemo(() => {
    const now = nowTick;
    return state.calendarEvents.filter((ev) => {
      const end = new Date(ev.endAt || ev.startAt).getTime();
      if (Number.isNaN(end)) return false;
      return end >= now;
    }).length;
  }, [state.calendarEvents, nowTick]);

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
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
      <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center">
        <span className="w-2 h-10 bg-emerald-500 rounded-full mr-4 shadow-lg shadow-emerald-200" />
        마이페이지
      </h2>

      {/* profile header */}
      <div className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[800px] gap-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-100 p-1 shadow-md overflow-hidden">
              {state.auth.user.profile_image_url ? (
                <img
                  src={state.auth.user.profile_image_url}
                  alt="profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-black">
                  U
                </div>
              )}
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">{state.auth.user.nickname || "사용자"}</h3>
              <p className="text-base font-black text-slate-500 mt-1">SSAFY 11기</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => actions.openEditProfile()}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 flex items-center shadow-sm whitespace-nowrap"
            >
              <Settings size={16} className="mr-2" /> 정보 수정
            </button>
            <button
              onClick={() => actions.openConfirm("logout", null)}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 flex items-center shadow-sm whitespace-nowrap"
            >
              <LogOut size={16} className="mr-2" /> 로그아웃
            </button>
            <button
              onClick={() => actions.openConfirm("delete_account", null)}
              className="px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-black hover:bg-red-100 flex items-center shadow-sm whitespace-nowrap"
            >
              <Trash2 size={16} className="mr-2" /> 회원 탈퇴
            </button>
          </div>

          <div className="w-px h-16 bg-slate-100 mx-2" />

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl min-w-[200px] border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Bookmark size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">스크랩한 공지 수</p>
              <p className="text-xl font-black text-slate-900">
                {myArchiveCount}
                <span className="text-xs font-medium text-slate-400 ml-1">개</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl min-w-[200px] border border-slate-100">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CalendarIcon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">남은 일정 수</p>
              <p className="text-xl font-black text-slate-900">
                {upcomingCount}
                <span className="text-xs font-medium text-slate-400 ml-1">건</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* archive list */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-black text-slate-800 flex items-center">
            <Archive size={20} className="mr-2 text-slate-400" /> 아카이빙된 공지
          </h3>

          <div className="relative w-full sm:w-auto flex items-center gap-2">
            <SearchWithHistory
              value={q}
              onChange={setQ}
              placeholder="제목으로 검색..."
              historyMode="memory"
              onSearch={(term) => setQ(term)}
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
          boards={boards}
          showCategory={false}
          selectedBoard={selectedBoard}
          selectedChannels={selectedChannels}
          onSelectBoard={onSelectBoard}
          onToggleChannel={onToggleChannel}
          onReset={() => {
            setSelectedBoard(null);
            setSelectedChannels([]);
          }}
        />

        <ArchiveGrid
          items={current}
          archivesSet={state.archives}
          onOpen={actions.openPostDetailFromPost}
          onToggleArchive={actions.toggleArchive}
          // 마이페이지에서만 unarchive confirm
          showArchiveConfirm={(postId) => actions.openConfirm("unarchive", { postId })}
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
