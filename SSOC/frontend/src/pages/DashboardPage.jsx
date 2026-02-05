import React, { useEffect, useMemo, useRef, useState } from "react";
// import { flushSync } from "react-dom";
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

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const queryRef = useRef(query);
  const categoryRef = useRef(selectedCategory);
  const prevArchivesRef = useRef(new Set(state.archives));
  const noticeSectionRef = useRef(null);
  const isFirstRun = useRef(true);

  // Track last processed refresh trigger to know when to force bypass cache
  const lastRankingRefreshRef = useRef(state.refreshTrigger);
  const lastScopeRefreshRef = useRef(state.refreshTrigger);


  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  useEffect(() => {
    categoryRef.current = selectedCategory;
  }, [selectedCategory]);


  const [scopePosts, setScopePosts] = useState(state.dashboardCache.scopePosts || []);
  const [posts, setPosts] = useState(state.dashboardCache.scopePosts || []);
  const [rankingPosts, setRankingPosts] = useState(state.dashboardCache.rankingPosts || []);
  const [loading, setLoading] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    const currentArchives = state.archives;
    const prevArchives = prevArchivesRef.current;

    const added = [...currentArchives].find(id => !prevArchives.has(id));
    const removed = [...prevArchives].find(id => !currentArchives.has(id));

    if (added || removed) {
      const targetId = added || removed;
      const isAdding = !!added;

      const next = rankingPosts.map(p => {
        const pid = String(p.post_id ?? p.id);
        if (pid === targetId) {
          const oldCount = Number(p.scrap_count ?? 0);
          return {
            ...p,
            scrap_count: isAdding ? oldCount + 1 : Math.max(0, oldCount - 1),
            _spark: true
          };
        }
        return { ...p, _spark: false };
      });

      const sorted = [...next].sort((a, b) => {
        const diff = Number(b.scrap_count ?? 0) - Number(a.scrap_count ?? 0);
        if (diff !== 0) return diff;
        const dateA = new Date(a.created_at ?? 0).getTime();
        const dateB = new Date(b.created_at ?? 0).getTime();
        return dateB - dateA;
      });

      setRankingPosts(sorted);
      actions.setDashboardCache({ rankingPosts: sorted });
    }

    prevArchivesRef.current = new Set(currentArchives);
  }, [state.archives, actions, rankingPosts]);

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
      const m = s.match(/^\s*#?\s*(\d+)\s*[\.)]/);
      return m ? Number.parseInt(m[1], 10) : null;
    };

    for (const b of out) {
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
    if (selectedChannels.length > 0) return selectedChannels;

    if (selectedBoard) {
      const board = boards.find((b) => b.board_id === selectedBoard);
      return uniq((board?.channels || []).map((c) => c.channel_id));
    }

    return allUserChannelIds;
  }, [selectedChannels, selectedBoard, boards, allUserChannelIds]);

  const channelScopeKey = channelScopeIds.join(",");

  useEffect(() => {
    setSelectedCategory(null);
    setPage(1);
  }, [selectedBoard, selectedChannels.join(",")]);

  useEffect(() => {
    if ((selectedChannels?.length ?? 0) !== 1) {
      setSelectedCategory(null);
    }
  }, [selectedChannels]);

  useEffect(() => {
    let alive = true;
    const fetchRanking = async () => {
      const isForceRefresh = state.refreshTrigger !== lastRankingRefreshRef.current;
      if (isForceRefresh) lastRankingRefreshRef.current = state.refreshTrigger;

      const cache = state.dashboardCache;
      // If forced refresh, ignore cache freshness
      const isFresh = !isForceRefresh && cache.lastUpdated && (new Date() - new Date(cache.lastUpdated)) < 300000;

      if (isFresh && cache.rankingPosts?.length > 0) {
        setRankingPosts(cache.rankingPosts);
        return;
      }

      setRankingLoading(true);
      try {
        const res = await fetchWithAuth(apiUrl("/api/archives/ranking/"), { method: "GET" });
        if (!res.ok) throw new Error("ranking fetch failed");
        const data = await res.json();
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setRankingPosts(list);
        actions.setDashboardCache({ rankingPosts: list });
      } catch (e) {
        console.error("[ranking fetch] error:", e);
      } finally {
        if (alive) setRankingLoading(false);
      }
    };

    if (state.auth.isAuthenticated) {
      fetchRanking();
    }
    return () => { alive = false; };
  }, [state.auth.isAuthenticated, state.refreshTrigger]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!state.auth.isAuthenticated) return;

      // If active search or category is selected, we skip the background scope fetch
      // to avoid double requests. The Search Effect will handle data loading.
      if (query.trim() || selectedCategory) {
        setScopePosts([]);
        return;
      }

      if (!allUserChannelIds || allUserChannelIds.length === 0) return;

      const allChannelsKey = allUserChannelIds.join(",");
      const isInitialAllScope = channelScopeKey === allChannelsKey;

      const isForceRefresh = state.refreshTrigger !== lastScopeRefreshRef.current;
      if (isForceRefresh) lastScopeRefreshRef.current = state.refreshTrigger;

      const cache = state.dashboardCache;
      // If forced refresh, ignore cache freshness
      const isFresh = !isForceRefresh && cache.lastUpdated && (new Date() - new Date(cache.lastUpdated)) < 300000;

      const fetchScope = async () => {
        // If query or category is active, active search effect handles loading.
        // fetchScope is background work, so keep it silent.
        const isBackground = !!queryRef.current || !!categoryRef.current;

        if (!isBackground && scopePosts.length === 0) setLoading(true);
        try {
          const res = await fetchWithAuth(apiUrl(`/api/posts/?channel_id=${channelScopeKey}`), { method: "GET" });
          if (!res.ok) throw new Error("scope fetch failed");
          const data = await res.json();
          if (!alive) return;
          const list = Array.isArray(data) ? data : [];
          setScopePosts(list);
          if (isInitialAllScope) {
            actions.setDashboardCache({ scopePosts: list });
          }
        } catch (e) {
          if (!alive) return;
          console.error("[scope fetch] error:", e);
        } finally {
          if (!alive) return;
          if (!isBackground) setLoading(false);
        }
      };

      if (isInitialAllScope) {
        const canUseScopeCache = isFresh && cache.scopePosts?.length > 0;

        if (canUseScopeCache) {
          setScopePosts(cache.scopePosts);
        } else {
          // If query/category active, keep silent
          const isBackground = !!queryRef.current || !!categoryRef.current;
          if (!isBackground) setLoading(true);
          try {
            const res = await fetchWithAuth(apiUrl(`/api/posts/?channel_id=${allChannelsKey}`), { method: "GET" });
            if (!res.ok) throw new Error("combined fetch failed");
            const data = await res.json();
            if (!alive) return;
            const list = Array.isArray(data) ? data : [];
            setScopePosts(list);
            actions.setDashboardCache({ scopePosts: list });
          } catch (e) {
            if (!alive) return;
            console.error("[consolidated posts fetch] error:", e);
          } finally {
            if (!alive) return;
            if (!isBackground) setLoading(false);
          }
        }
        return;
      }

      fetchScope();
    };

    run();
    return () => { alive = false; };
  }, [state.auth.isAuthenticated, channelScopeKey, allUserChannelIds.join(","), state.refreshTrigger, query, selectedCategory]);

  // 1. Sync Effect: Keep posts in sync with scopePosts when NOT searching
  // This ensures that when we clear search/filters, we immediately show the background data.
  useEffect(() => {
    const hasActiveSearch = !!query.trim() || !!selectedCategory;
    if (!hasActiveSearch) {
      setPosts(scopePosts);
    }
  }, [scopePosts, query, selectedCategory]);

  // 2. Search Effect: Fetch data ONLY when searching
  // We removed 'scopePosts' from dependency to prevent double-fetch loop.
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!state.auth.isAuthenticated) return;

      const hasActiveSearch = !!query.trim() || !!selectedCategory;
      if (!hasActiveSearch) return; // Handled by Sync Effect

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (channelScopeIds.length > 0) params.set("channel_id", channelScopeIds.join(","));
        if (selectedCategory) params.set("category_id", String(selectedCategory));
        if (query.trim()) params.set("keyword", query.trim());

        const res = await fetchWithAuth(apiUrl(`/api/posts/?${params.toString()}`), { method: "GET" });
        if (!res.ok) throw new Error(`posts fetch failed (${res.status})`);
        const data = await res.json();

        if (!alive) return;
        setPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setPosts([]);
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
  }, [query, selectedCategory, channelScopeKey, state.auth.isAuthenticated, state.refreshTrigger]);

  const categories = useMemo(() => {
    if ((selectedChannels?.length ?? 0) !== 1) return [];

    const targetId = selectedChannels[0];
    const userChannels = state.auth.user?.channels || [];
    const ch = userChannels.find((c) => c.channel_id === targetId);

    if (!ch || !ch.categories) return [];

    const out = [...ch.categories];
    out.sort((a, b) => String(a.category_name).localeCompare(String(b.category_name), "ko"));
    return out;
  }, [selectedChannels, state.auth.user?.channels]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const pidBoard = p.board_id ?? p.boardId;
      const pidChannel = p.channel_id ?? p.channelId;
      const pidCategory = p.category_id ?? p.categoryId;

      let matchFilter = true;

      if (selectedChannels.length > 0) {
        matchFilter = selectedChannels.includes(pidChannel);
      }
      else if (selectedBoard) {
        matchFilter = pidBoard === selectedBoard;
      }

      if (matchFilter && selectedCategory) {
        matchFilter = pidCategory === selectedCategory;
      }

      return matchFilter;
    });
  }, [posts, selectedBoard, selectedChannels, selectedCategory]);

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

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (noticeSectionRef.current) {
      const headerOffset = 65;
      const elementPosition = noticeSectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, [page]);

  const onSelectBoard = (boardId) => {
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
    <div className="space-y-6">

      {/* Ranking Section */}
      <RankingCarousel
        posts={rankingPosts.slice(0, 5)}
        onOpen={onOpenPost}
        loading={rankingLoading}
      />

      {/* Main Notice Section */}
      <section ref={noticeSectionRef} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
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
      </section >
    </div >
  );
}
