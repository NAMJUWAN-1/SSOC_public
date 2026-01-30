import React, { useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";
import { useApp } from "../state/AppProvider";

import RankingCarousel from "../components/posts/RankingCarousel";
import SearchWithHistory from "../components/search/SearchWithHistory";
import BoardChannelFilter from "../components/filter/BoardChannelFilter";
import PostList from "../components/posts/PostList";
import Pagination from "../components/common/Pagination";
import { fetchWithAuth } from "../api/fetchWithAuth";

function apiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return base.replace(/\/$/, "") + p;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

export default function DashboardPage() {
  const { state, actions } = useApp();

  // ---- UI state ----
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Search input vs committed query
  // - input: typing only (no request spam)
  // - committed: actual backend search trigger (Enter / history click)
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Avoid stale-closure updates from async requests.
  const queryRef = useRef(query);
  const categoryRef = useRef(selectedCategory);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  useEffect(() => {
    categoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // ---- Data state ----
  const [scopePosts, setScopePosts] = useState([]); // channel scope without category
  const [posts, setPosts] = useState([]); // final list (maybe category-filtered)
  const [loading, setLoading] = useState(false);

  // ---- Build board/channel tree from backend user profile ----
  const boards = useMemo(() => {
    const userChannels = state.auth.user?.channels || [];
    const map = new Map();
    for (const ch of userChannels) {
      const b = ch.board;
      if (!b) continue;
      const bid = b.board_id;
      if (!map.has(bid)) {
        map.set(bid, {
          board_id: bid,
          board_name: b.board_name,
          channels: [],
        });
      }
      const entry = map.get(bid);
      // avoid duplicates
      if (!entry.channels.some((x) => x.channel_id === ch.channel_id)) {
        entry.channels.push({
          channel_id: ch.channel_id,
          channel_name: ch.channel_name,
        });
      }
    }
    const out = Array.from(map.values());
    out.sort((a, b) => String(a.board_name).localeCompare(String(b.board_name), "ko"));

    const leadingNumber = (name) => {
      const s = String(name ?? "");
      // e.g. "# 10. AI" -> 10
      const m = s.match(/^\s*#?\s*(\d+)\s*[\.)]/);
      return m ? Number.parseInt(m[1], 10) : null;
    };

    for (const b of out) {
      // Fix lexicographic sorting issue: "10" should come after "2".
      b.channels.sort((x, y) => {
        const nx = leadingNumber(x.channel_name);
        const ny = leadingNumber(y.channel_name);
        if (nx != null && ny != null && nx !== ny) return nx - ny;
        if (nx != null && ny == null) return -1;
        if (nx == null && ny != null) return 1;
        return String(x.channel_name).localeCompare(String(y.channel_name), "ko");
      });
    }
    return out;
  }, [state.auth.user]);

  const allUserChannelIds = useMemo(() => {
    const userChannels = state.auth.user?.channels || [];
    return uniq(userChannels.map((c) => c.channel_id).filter(Boolean));
  }, [state.auth.user]);

  const channelScopeIds = useMemo(() => {
    // 우선순위: 선택된 채널 > 선택된 보드의 전체 채널 > 유저의 전체 채널
    if (selectedChannels.length > 0) return selectedChannels;

    if (selectedBoard) {
      const board = boards.find((b) => b.board_id === selectedBoard);
      return uniq((board?.channels || []).map((c) => c.channel_id));
    }

    return allUserChannelIds;
  }, [selectedChannels, selectedBoard, boards, allUserChannelIds]);

  const channelScopeKey = useMemo(() => channelScopeIds.join(","), [channelScopeIds]);

  // Reset category/page whenever scope changes (board/channel)
  useEffect(() => {
    setSelectedCategory(null);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard, selectedChannels.join(",")]);

  // Category is only meaningful when exactly one channel is selected.
  useEffect(() => {
    if ((selectedChannels?.length ?? 0) !== 1) {
      setSelectedCategory(null);
    }
  }, [selectedChannels]);

  // Fetch posts for current channel scope (without category)
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!state.auth.isAuthenticated) return;
      if (!channelScopeIds || channelScopeIds.length === 0) {
        setScopePosts([]);
        setPosts([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("channel_id", channelScopeIds.join(","));

        const res = await fetchWithAuth(apiUrl(`/api/posts/?${params.toString()}`), { method: "GET" });
        if (!res.ok) throw new Error(`posts fetch failed (${res.status})`);
        const data = await res.json();

        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setScopePosts(list);
        // Avoid flicker: if user is searching or category-filtering, leave display list to the other effect.
        if (!queryRef.current.trim() && !categoryRef.current) {
          setPosts(list);
        }
      } catch (e) {
        if (!alive) return;
        setScopePosts([]);
        setPosts([]);
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [state.auth.isAuthenticated, channelScopeKey]);

  // Fetch display posts using backend-side filters/search (vector search ready)
  // - when query is committed, always request from backend
  // - when category is selected, request from backend
  // - otherwise reuse scopePosts to avoid redundant requests
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!state.auth.isAuthenticated) return;

      const hasQuery = !!query.trim();
      const hasCategory = !!selectedCategory;
      if (!hasQuery && !hasCategory) {
        setPosts(scopePosts);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (channelScopeIds.length > 0) params.set("channel_id", channelScopeIds.join(","));
        if (selectedCategory) params.set("category_id", String(selectedCategory));
        if (hasQuery) params.set("q", query.trim());

        const res = await fetchWithAuth(apiUrl(`/api/posts/?${params.toString()}`), { method: "GET" });
        if (!res.ok) throw new Error(`posts fetch failed (${res.status})`);
        const data = await res.json();

        if (!alive) return;
        setPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setPosts([]);
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [query, selectedCategory, scopePosts, channelScopeKey, state.auth.isAuthenticated]);

  // Categories for UI (from scopePosts)
  const categories = useMemo(() => {
    const m = new Map();
    for (const p of scopePosts) {
      const id = p.category_id;
      const name = p.category_name;
      if (id != null && !m.has(id)) m.set(id, name);
    }
    const out = Array.from(m.entries()).map(([category_id, category_name]) => ({ category_id, category_name }));
    out.sort((a, b) => String(a.category_name).localeCompare(String(b.category_name), "ko"));
    return out;
  }, [scopePosts]);

  // ---- Search + Pagination ----
  // Backend now handles search (vector embedding). No client-side filtering.
  const filtered = posts;

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [query, selectedCategory]);

  // ---- Handlers ----
  const onSelectBoard = (boardId) => {
    // toggle behavior (same as before)
    setSelectedBoard((prev) => (prev === boardId ? null : boardId));
    setSelectedChannels([]);
  };

  const onToggleChannel = (channelId) => {
    setSelectedChannels((prev) => {
      if (prev.includes(channelId)) return prev.filter((x) => x !== channelId);
      return [...prev, channelId];
    });
  };

  const onSelectCategory = (categoryId) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const onReset = () => {
    setSelectedBoard(null);
    setSelectedChannels([]);
    setSelectedCategory(null);
    setQueryInput("");
    setQuery("");
    setPage(1);
  };

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
      actions.openPostDetailFromPost(data || post);
    } catch {
      actions.openPostDetailFromPost(post);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* 최근 공지 */}
      <RankingCarousel
        posts={scopePosts.slice(0, 5)}
        onOpen={onOpenPost}
        title="최근 공지 TOP 5"
      />

      <div className="mt-10 flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block mr-3 align-middle" />
          전체 공지사항
        </h2>

        <div className="flex items-center gap-3">
          <div className="w-[320px] hidden sm:block">
            <SearchWithHistory
              value={queryInput}
              onChange={(v) => {
                setQueryInput(v);
                // UX: if user clears input, reset committed query immediately
                if (!v) setQuery("");
              }}
              onSearch={(t) => {
                setQueryInput(t);
                setQuery(t);
              }}
              placeholder="공지사항 검색..."
              historyMode="backend"
            />
          </div>

          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition"
          >
            <Filter size={18} className="text-slate-500" />
            <span className="text-sm font-black text-slate-700">필터</span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden mb-4">
        <SearchWithHistory
          value={queryInput}
          onChange={(v) => {
            setQueryInput(v);
            if (!v) setQuery("");
          }}
          onSearch={(t) => {
            setQueryInput(t);
            setQuery(t);
          }}
          placeholder="공지사항 검색..."
          historyMode="backend"
        />
      </div>

      <BoardChannelFilter
        open={filterOpen}
        boards={boards}
        categories={categories}
        // category is per-channel in backend: only show when exactly one channel is selected
        showCategory={(selectedChannels?.length ?? 0) === 1}
        selectedBoard={selectedBoard}
        selectedChannels={selectedChannels}
        selectedCategory={selectedCategory}
        onSelectBoard={onSelectBoard}
        onToggleChannel={onToggleChannel}
        onSelectCategory={onSelectCategory}
        onReset={onReset}
      />

      <div className="mt-6">
        <PostList
          items={pageItems}
          loading={loading}
          onOpen={onOpenPost}
          showArchiveButton={false}
        />

        <div className="mt-6 flex justify-center">
          <Pagination
            page={pageSafe}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
}
