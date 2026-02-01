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

  // Real-time search: Debounce queryInput into query
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(queryInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [queryInput]);

  // ---- Data state ----
  const [scopePosts, setScopePosts] = useState([]); // channel scope without category
  const [posts, setPosts] = useState([]); // final list (maybe category-filtered)
  const [rankingPosts, setRankingPosts] = useState([]); // fixed ranking independent of filters
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

  // Ranking fetch (Global/All Channels) - Independent of filters
  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!state.auth.isAuthenticated || allUserChannelIds.length === 0) return;
      try {
        const params = new URLSearchParams();
        params.set("channel_id", allUserChannelIds.join(","));
        const res = await fetchWithAuth(apiUrl(`/api/posts/?${params.toString()}`), { method: "GET" });
        if (!res.ok) throw new Error("ranking fetch failed");
        const data = await res.json();
        if (!alive) return;
        setRankingPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        console.error("[ranking] fetch error:", e);
      }
    };
    run();
    return () => { alive = false; };
  }, [state.auth.isAuthenticated, allUserChannelIds.join(",")]);

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
        if (hasQuery) params.set("keyword", query.trim());

        const res = await fetchWithAuth(apiUrl(`/api/posts/?${params.toString()}`), { method: "GET" });
        if (!res.ok) throw new Error(`posts fetch failed (${res.status})`);
        const data = await res.json();

        if (!alive) return;
        let list = Array.isArray(data) ? data : [];
        if (hasQuery) {
          // Backend handles pgvector search. No strict client-side string filter needed
          // to allow for semantic matches (e.g. searching 'dinner' finds 'meal').
          list = Array.isArray(data) ? data : [];
        }
        setPosts(list);
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
      // Merge: preserve IDs from list item if they are missing in the detail response
      actions.openPostDetailFromPost(data ? { ...post, ...data } : post);
    } catch {
      actions.openPostDetailFromPost(post);
    }
  };

  return (
    <div className="space-y-6">

      {/* Ranking Section */}
      <RankingCarousel
        posts={rankingPosts.slice(0, 5)}
        onOpen={onOpenPost}
      />

      {/* Main Notice Section */}
      <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center">
            <span className="w-1.5 h-6 bg-[#FFBC1F] rounded-full mr-3" />
            전체 공지사항
          </h2>

          <div className="flex items-center gap-3">
            <div className="flex-1 md:w-[280px]">
              <div className="relative group">
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
            </div>

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
          categories={categories}
          showCategory={(selectedChannels?.length ?? 0) === 1}
          selectedBoard={selectedBoard}
          selectedChannels={selectedChannels}
          selectedCategory={selectedCategory}
          onSelectBoard={onSelectBoard}
          onToggleChannel={onToggleChannel}
          onSelectCategory={onSelectCategory}
          onReset={onReset}
        />

        <div className="mt-8 bg-slate-50/50 rounded-[2rem] p-6 space-y-4">
          <PostList
            items={pageItems}
            loading={loading}
            onOpen={onOpenPost}
            showArchiveButton={true}
            archivesSet={state.archives}
            onToggleArchive={actions.toggleArchive}
            showArchiveConfirm={(postId) => actions.openConfirm("unarchive", { postId })}
          />

          <div className="mt-10 flex justify-center">
            <Pagination
              page={pageSafe}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
