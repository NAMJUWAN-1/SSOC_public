import React, { useMemo, useState, useEffect } from "react";
import { Filter, LogOut, Settings, Trash2, Bell, Calendar as CalendarIcon, Search, User, X, Check } from "lucide-react";
import { fetchWithAuth } from "../api/fetchWithAuth";
import { loginWithMattermost, refreshAccessToken, logoutBackend } from "../api/authApi";
import { useApp } from "../state/AppProvider";

import BoardChannelFilter from "../components/filter/BoardChannelFilter";
import ArchiveGrid from "../components/posts/ArchiveGrid";
import Pagination from "../components/common/Pagination";
import SearchWithHistory from "../components/search/SearchWithHistory";
import LoadingSpinner from "../components/common/LoadingSpinner";

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

function normalizeAvatarUrl(u) {
  const s = String(u ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return `/${s}`;
}

export default function MyPage() {
  const { state, actions } = useApp();

  // boards tree
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

  const channelToBoardMap = useMemo(() => {
    const map = new Map();
    const userChannels = state.auth.user?.channels || [];
    for (const ch of userChannels) {
      if (ch.channel_id && ch.board?.board_id) {
        map.set(ch.channel_id, ch.board.board_id);
      }
    }
    return map;
  }, [state.auth.user]);

  const [searchInput, setSearchInput] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const ITEMS_PER_PAGE = 9;

  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Search effect
  useEffect(() => {
    if (!committedQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const run = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        params.set("keyword", committedQuery.trim());
        const res = await fetchWithAuth(apiUrl(`/api/posts/?${params.toString()}`), { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Vector search failed", e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    run();
  }, [committedQuery, state.refreshTrigger]);

  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const nicknameInputRef = React.useRef(null);
  const archiveSectionRef = React.useRef(null);
  const isFirstRun = React.useRef(true);

  const handleStartEdit = () => {
    setEditNickname(state.auth.user.nickname || "");
    setEditAvatar(normalizeAvatarUrl(state.auth.user.profile_image_url || state.auth.user.profile_image || ""));
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
        profile_image_url: normalizeAvatarUrl(editAvatar),
      });
      setIsEditing(false);
      actions.openConfirm("profile_success");
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    // Reload archives when refresh triggered
    if (state.auth.user?.user_id) {
      actions.loadMyArchives(state.auth.user.user_id);
    }
  }, [state.refreshTrigger]);

  const myArchivedPosts = useMemo(() => {
    return state.archivedPosts || [];
  }, [state.archivedPosts]);

  const filtered = useMemo(() => {
    let sourceList = myArchivedPosts;
    const trimQ = committedQuery.trim().toLowerCase();

    if (trimQ) {
      if (searchResults) {
        // 서버에서 온 AI 검색 결과 중, 내가 아카이빙한 것만 필터링
        sourceList = searchResults.filter(p => p.is_archived);
      } else {
        // 검색 중이거나 결과가 아직 오지 않았을 때는 빈 리스트
        sourceList = [];
      }
    }

    return sourceList.filter((p) => {
      let pidBoard = p.board_id ?? p.boardId;
      const pidChannel = p.channel_id ?? p.channelId;

      if (pidBoard === undefined || pidBoard === null) {
        pidBoard = channelToBoardMap.get(pidChannel);
      }

      let matchFilter = true;
      if (selectedChannels.length > 0) matchFilter = selectedChannels.includes(pidChannel);
      else if (selectedBoard) matchFilter = (pidBoard === selectedBoard);

      return matchFilter;
    });
  }, [myArchivedPosts, committedQuery, searchResults, selectedBoard, selectedChannels, state.archives, channelToBoardMap]);


  useEffect(() => setPage(1), [committedQuery, selectedBoard, selectedChannels]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (archiveSectionRef.current) {
      const headerOffset = 65;
      const elementPosition = archiveSectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, [page]);

  const current = useMemo(() => {
    const s = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const myArchiveCount = state.archiveCount || myArchivedPosts.length;
  const todayArchiveCount = useMemo(() => {
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
      actions.openPostDetailFromPost(data ? { ...post, ...data } : post);
    } catch {
      actions.openPostDetailFromPost(post);
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Top Section */}
      <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 min-h-[220px] flex flex-col relative transition-all duration-500 apple-bezier overflow-hidden">

        {!isEditing ? (
          <div key="view" className="animate-apple-fade flex flex-col justify-center h-full">
            {/* Header Title inside card */}
            <div className="flex items-center mb-6">
              <div className="w-1.5 h-6 bg-[#FFBC1F] rounded-full mr-3" />
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">프로필</h2>
            </div>

            <div className="bg-slate-50/50 rounded-[2rem] p-6 lg:p-8">
              <div className="flex flex-col xl:flex-row items-center xl:items-center justify-between gap-6">
                {/* Left: Profile Info */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Avatar */}
                  <div className="shrink-0 rounded-[3rem] p-1 border-4 border-white shadow-xl overflow-hidden bg-white">
                    <div className="w-48 h-48">
                      {state.auth.user.profile_image_url ? (
                        <img
                          src={normalizeAvatarUrl(state.auth.user.profile_image_url)}
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
                    <p className="text-xs font-bold text-slate-400 mb-1 ml-1 text-slate-400">닉네임</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
                      {state.auth.user.nickname || "닉네임 없음"}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mb-5 ml-1">SSAFY 14기</p>

                    <div className="flex flex-nowrap justify-center md:justify-start gap-3 mt-2 overflow-x-auto no-scrollbar">
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
                  <div className="w-[160px] h-[120px] border border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center bg-white shadow-md shrink-0">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 mb-2">
                      <CalendarIcon size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mb-0.5">금일 아카이빙한 공지</p>
                    <p className="text-2xl font-black text-slate-800">
                      {todayArchiveCount} <span className="text-xs font-bold text-slate-400">개</span>
                    </p>
                  </div>

                  {/* Stats Card 2 */}
                  <div className="w-[160px] h-[120px] border border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center bg-white shadow-md shrink-0">
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
          </div>
        ) : (
          <div key="edit" className="w-full h-full flex flex-col animate-apple-slide-up">
            {/* 1. Header Preview Part */}
            <div className="flex items-center gap-10 mb-16">
              <div className="w-36 h-36 rounded-[2.5rem] bg-white p-1 border-4 border-white shadow-xl overflow-hidden shrink-0">
                {editAvatar ? (
                  <img src={normalizeAvatarUrl(editAvatar)} alt="current" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-300">
                    <User size={56} />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {editNickname || "닉네임을 입력하세요"}
                </h2>
                <p className="text-[11px] font-bold text-slate-300 mt-1 uppercase tracking-widest">
                  SSAFY 14기
                </p>
              </div>
            </div>

            {/* 2. Main Content Part: Grid (Left) + Form (Right) */}
            <div className="flex flex-col lg:flex-row gap-x-24 gap-y-16">
              {/* Left: Avatar Grid */}
              <div className="w-full lg:w-[320px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  아바타 선택
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_LIST.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setEditAvatar(url)}
                      className={`aspect-square rounded-[1rem] border-2 overflow-hidden relative transition-all apple-spring ${editAvatar === url
                        ? "border-[#1E325C] ring-4 ring-[#1E325C]/5 scale-105 shadow-md"
                        : "border-slate-50 hover:border-slate-200 bg-white shadow-sm"
                        } `}
                    >
                      <img src={url} alt={`avatar-${i} `} className="w-full h-full object-cover" />
                      {editAvatar === url && (
                        <div className="absolute inset-0 bg-[#1E325C]/10 flex items-center justify-center backdrop-blur-[0.5px]">
                          <div className="bg-[#1E325C] text-white rounded-full p-1 shadow-md">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Input & Buttons */}
              <div className="flex-1 flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  내 정보 설정
                </p>

                <div className="flex-1 space-y-10">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-300 block ml-1">닉네임</label>
                    <input
                      ref={nicknameInputRef}
                      type="text"
                      maxLength={20}
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className={`w-full bg-transparent border-b border-slate-100 py-3 text-2xl font-black focus:outline-none transition-all placeholder:text-slate-100 
                            ${isShaking
                          ? "border-red-500 text-red-500 animate-shake"
                          : "text-slate-800 focus:border-slate-200"
                        } `}
                      placeholder="이름을 입력하세요"
                    />
                    <p className={`text-[10px] font-bold mt-2 ml-1 transition-colors ${editNickname.length > 20 ? "text-red-500" : "text-slate-300"} `}>
                      * 닉네임은 최대 20자 까지 설정 가능합니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-4 rounded-xl border border-slate-50 bg-white text-slate-400 font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-4 rounded-xl bg-[#1E325C] text-white font-bold shadow-lg shadow-[#1E325C]/20 hover:brightness-110 transition-all active:scale-95"
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
      <div ref={archiveSectionRef} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden min-h-[600px]">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center">
            <span className="w-1.5 h-6 bg-[#FFBC1F] rounded-full mr-3" />
            아카이빙된 공지
          </h2>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="flex-1 md:w-[280px]">
              <SearchWithHistory
                value={searchInput}
                onChange={(v) => {
                  setSearchInput(v);
                  if (!v) {
                    setCommittedQuery("");
                    setSearchResults(null);
                    setIsSearching(false);
                  }
                }}
                onSearch={(t) => {
                  setSearchInput(t);
                  setCommittedQuery(t);
                }}
                placeholder="아카이빙된 공지 검색..."
                historyMode="backend"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all group"
            >
              <Filter size={18} className="text-slate-400 group-hover:text-[#1E325C]" />
              <span className="text-sm font-black text-slate-600 group-hover:text-[#1E325C]">필터</span>
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

        <div className="mt-8 bg-slate-50/50 rounded-[2rem] p-8 space-y-4">
          {isSearching ? (
            <LoadingSpinner message="결과 검색 중..." />
          ) : (
            <ArchiveGrid
              items={current}
              archivesSet={state.archives}
              onOpen={onOpenPost}
              onToggleArchive={actions.toggleArchive}
              showArchiveConfirm={(postId) => actions.openConfirm("unarchive", { postId })}
            />
          )}
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
