import React, { useMemo, useState, useEffect } from "react";
import { Filter, LogOut, Settings, Trash2, Bell, Calendar as CalendarIcon, Search, User, X, Check } from "lucide-react";
import { useApp } from "../state/AppProvider";

import BoardChannelFilter from "../components/filter/BoardChannelFilter";
import ArchiveGrid from "../components/posts/ArchiveGrid";
import Pagination from "../components/common/Pagination";

// Local Avatars
const AVATAR_LIST = [
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
  "/avatars/5.png",
  "/avatars/6.png",
  "/avatars/7.png",
  "/avatars/8.png"
];

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
  const ITEMS_PER_PAGE = 9; // Grid (3x3)

  // '남은 일정'은 현재 시간 기준으로 계산 (1분마다 갱신)
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // --- Edit Mode State ---
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const nicknameInputRef = React.useRef(null);

  const handleStartEdit = () => {
    setEditNickname(state.auth.user.nickname || "");
    setEditAvatar(state.auth.user.profile_image_url || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editNickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    if (editNickname.length > 20) {
      setIsShaking(true);
      nicknameInputRef.current?.focus();
      setTimeout(() => setIsShaking(false), 600);
      return;
    }
    try {
      await actions.saveProfile({
        nickname: editNickname,
        profile_image_url: editAvatar,
      });
      setIsEditing(false);
      actions.openConfirm("profile_success");
    } catch (e) {
      alert(e.message);
    }
  };

  const myArchivedPosts = useMemo(() => {
    return state.archivedPosts || [];
  }, [state.archivedPosts]);

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
    const today = new Date(nowTick);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    return state.archivedPosts.filter((p) => {
      if (!p.archive_created_at) return false;
      const arcTime = new Date(p.archive_created_at).getTime();
      return arcTime >= startOfToday && arcTime <= endOfToday;
    }).length;
  }, [state.archivedPosts, nowTick]);

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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  function apiUrl(path) {
    if (!API_BASE_URL) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return API_BASE_URL.replace(/\/$/, "") + p;
  }

  // Open post detail (prefer server-side detail payload when available)
  const onOpenPost = async (post) => {
    const pid = post?.post_id ?? post?.id;
    if (!pid) {
      actions.openPostDetailFromPost(post);
      return;
    }
    try {
      const res = await fetchWithAuth(apiUrl(`/api/posts/?post_id=${encodeURIComponent(pid)}`), { method: "GET" });
      if (!res.ok) throw new Error("detail fetch failed");
      const data = await res.json();
      // Merge: preserve IDs from list item if they are missing in the detail response
      actions.openPostDetailFromPost(data ? { ...post, ...data } : post);
    } catch {
      actions.openPostDetailFromPost(post);
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Top Section: Unified Card (Switch between View and Edit) */}
      <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 min-h-[300px] flex flex-col relative transition-all duration-500 apple-bezier overflow-hidden">

        {!isEditing ? (
          <div key="view" className="animate-apple-fade flex flex-col justify-center h-full">
            {/* Header Title inside card */}
            <div className="absolute top-10 left-10 flex items-center">
              <div className="w-1.5 h-6 bg-[#FFBC1F] rounded-full mr-3" />
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">프로필</h2>
            </div>

            <div className="mt-12 flex flex-col xl:flex-row items-center xl:items-end justify-between gap-10">
              {/* Left: Profile Info */}
              <div className="flex flex-col md:flex-row items-center gap-8 px-4 xl:px-0">
                {/* Avatar */}
                <div className="shrink-0 rounded-[3rem] p-1 border-4 border-white shadow-xl overflow-hidden bg-slate-50">
                  <div className="w-48 h-48">
                    {state.auth.user.profile_image_url ? (
                      <img
                        src={state.auth.user.profile_image_url}
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <User size={80} fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="text-center md:text-left">
                  <p className="text-xs font-bold text-slate-400 mb-1 ml-1">닉네임</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
                    {state.auth.user.nickname || "닉네임 없음"}
                  </h3>
                  <p className="text-sm font-bold text-slate-400 mb-5 ml-1">SSAFY 14기</p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                    <button
                      onClick={handleStartEdit}
                      className="px-6 py-3 bg-[#1E325C] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-900/10 hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 group"
                    >
                      <Settings size={16} className="group-hover:rotate-45 transition-transform duration-300" /> 프로필 수정
                    </button>
                    <button
                      onClick={() => actions.openConfirm("logout", null)}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <LogOut size={16} /> 로그아웃
                    </button>
                    <button
                      onClick={() => actions.openConfirm("delete_account", null)}
                      className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-black hover:bg-red-100/50 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Trash2 size={16} /> 회원 탈퇴
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Stats Cards */}
              <div className="flex gap-4 w-full xl:w-auto justify-center xl:justify-end">
                {/* Stats Card 1 */}
                <div className="w-[160px] h-[120px] border border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center bg-white shadow-sm shrink-0">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 mb-2">
                    <CalendarIcon size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">금일 아카이빙한 일정</p>
                  <p className="text-2xl font-black text-slate-800">
                    {upcomingCount} <span className="text-xs font-bold text-slate-400">개</span>
                  </p>
                </div>

                {/* Stats Card 2 */}
                <div className="w-[160px] h-[120px] border border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center bg-white shadow-sm shrink-0">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 mb-2">
                    <Bell size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">아카이빙한 총 공지</p>
                  <p className="text-2xl font-black text-slate-800">
                    {myArchiveCount} <span className="text-xs font-bold text-slate-400">개</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div key="edit" className="w-full h-full flex flex-col gap-6 animate-apple-slide-up">
            {/* Header Part: Selected Avatar & Name */}
            <div className="flex items-center gap-8 pb-6 border-b border-slate-100">
              <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 p-1 border-4 border-white shadow-xl overflow-hidden shrink-0">
                {editAvatar ? (
                  <img src={editAvatar} alt="current" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-300">
                    <User size={64} />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {editNickname || "닉네임 입력"}
                </h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  SSAFY 14기
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Avatar Grid */}
              <div className="flex-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 animate-apple-slide-up [animation-delay:0.1s]">
                  아바타 선택
                </p>
                <div className="grid grid-cols-4 gap-3 w-full max-w-sm animate-apple-slide-up [animation-delay:0.15s]">
                  {AVATAR_LIST.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setEditAvatar(url)}
                      className={`aspect-square rounded-2xl border-2 overflow-hidden relative transition-all ${editAvatar === url
                        ? "border-[#1E325C] ring-4 ring-[#1E325C]/10 scale-105 shadow-md"
                        : "border-slate-100 hover:border-slate-300 hover:scale-105"
                        }`}
                    >
                      <img src={url} alt={`avatar-${i}`} className="w-full h-full object-cover" />
                      {editAvatar === url && (
                        <div className="absolute inset-0 bg-[#1E325C]/10 flex items-center justify-center">
                          <div className="bg-[#1E325C] text-white rounded-full p-1 shadow-lg">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Identity Input */}
              <div className="flex-1 lg:max-w-md flex flex-col">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 animate-apple-slide-up [animation-delay:0.2s]">
                  내 정보 설정
                </p>

                <div className="flex-1 space-y-8 animate-apple-slide-up [animation-delay:0.25s]">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 block">닉네임</label>
                    <input
                      ref={nicknameInputRef}
                      type="text"
                      maxLength={20}
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className={`w-full bg-transparent border-b-2 py-3 text-2xl font-black focus:outline-none transition-colors placeholder:text-slate-200 
                            ${isShaking
                          ? "border-red-500 text-red-500 animate-shake"
                          : "border-slate-100 text-slate-800 focus:border-[#1E325C]"}`}
                      placeholder="닉네임을 입력하세요"
                    />
                    <p className={`text-xs font-bold mt-2 transition-colors ${editNickname.length > 20 ? "text-red-500" : "text-slate-400"}`}>
                      * 닉네임은 최대 20자 까지 설정 가능합니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-4 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-4 rounded-xl bg-[#1E325C] text-white font-bold shadow-lg shadow-[#1E325C]/20 hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>


      {/* Archived Notices Section (Unchanged) */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden min-h-[600px]">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center">
            <span className="w-1.5 h-6 bg-[#FFBC1F] rounded-full mr-3" />
            아카이빙된 공지
          </h2>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="아카이빙된 공지 검색..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1E325C] w-[240px] transition-all shadow-sm"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow transition-all group"
            >
              <Filter size={16} className="text-slate-400 group-hover:text-[#1E325C]" />
              <span className="text-xs font-black text-slate-500 group-hover:text-[#1E325C]">필터</span>
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

        <div className="mt-4 px-2">
          <ArchiveGrid
            items={current}
            archivesSet={state.archives}
            onOpen={onOpenPost}
            onToggleArchive={actions.toggleArchive}
            showArchiveConfirm={(postId) => actions.openConfirm("unarchive", { postId })}
          />
        </div>

        <div className="mt-12 flex justify-center">
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>

      </div>

    </div>
  );
}
