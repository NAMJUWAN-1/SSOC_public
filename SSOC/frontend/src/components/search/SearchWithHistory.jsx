import React, { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { useApp } from "../../state/AppProvider";
import { clearSearchLogs, createSearchLog, deleteSearchLog, listSearchLogs } from "../../api/searchLogsApi";

export default function SearchWithHistory({
  value,
  onChange,
  onSearch,
  placeholder = "검색어를 입력하세요",
  historyMode = "backend",
  limit = 5,
}) {
  const { state } = useApp();
  const userId = state.auth.user?.user_id;

  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [recentBackend, setRecentBackend] = useState([]);
  const [recentMemory, setRecentMemory] = useState([]);
  const rootRef = useRef(null);

  const recent = useMemo(() => {
    if (historyMode === "backend") return recentBackend;
    if (historyMode === "memory") return recentMemory.map((k) => ({ keyword: k }));
    return [];
  }, [historyMode, recentBackend, recentMemory]);

  const recentShown = useMemo(() => {
    const v = (value ?? "").trim().toLowerCase();
    if (!v) return recent;
    return recent.filter((item) => String(item.keyword || "").toLowerCase().startsWith(v));
  }, [recent, value]);

  const loadBackend = async () => {
    if (!userId) return;


    const fetchLimit = Math.max(limit * 5, limit);
    const data = await listSearchLogs({ user_id: userId, limit: fetchLimit });

    const seen = new Set();
    const unique = [];
    for (const item of data) {
      const k = String(item?.keyword ?? "").trim().toLowerCase();
      if (!k) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(item);
      if (unique.length >= limit) break;
    }
    setRecentBackend(unique);
  };

  useEffect(() => {
    if (historyMode !== "backend") return;
    loadBackend().catch(() => {
    });
  }, [historyMode, userId]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (historyMode !== "backend") return;
    loadBackend().catch(() => { });
  }, [open, historyMode, userId]);

  const commitSearch = async (term) => {
    const t = (term ?? value ?? "").trim();
    if (!t) return;

    if (historyMode === "backend") {
      if (!userId) {
        onSearch?.(t);
        setOpen(true);
        queueMicrotask(() => inputRef.current?.focus());
        return;
      }
      try {
        await createSearchLog({ keyword: t });
        await loadBackend();
      } catch {
      }
    } else if (historyMode === "memory") {
      setRecentMemory((prev) => {
        const next = [t, ...prev.filter((x) => x !== t)];
        return next.slice(0, limit);
      });
    }

    onSearch?.(t);

    setOpen(true);
    queueMicrotask(() => inputRef.current?.focus());
  };

  const removeItem = async (item) => {
    if (historyMode === "backend") {
      if (!item.search_log_id) return;
      await deleteSearchLog(item.search_log_id);
      await loadBackend();
      setOpen(true);
      inputRef.current?.focus();
    } else if (historyMode === "memory") {
      setRecentMemory((prev) => prev.filter((x) => x !== item.keyword));
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  const clearAll = async () => {
    if (historyMode === "backend") {
      if (!userId) return;
      await clearSearchLogs({ user_id: userId });
      await loadBackend();
      setOpen(true);
      inputRef.current?.focus();
    } else if (historyMode === "memory") {
      setRecentMemory([]);
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
        <Search size={18} className="text-slate-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => (historyMode === "none" ? null : setOpen(true))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitSearch();
            }
          }}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
        />
        {value ? (
          <button type="button" onClick={() => onChange?.("")} className="p-1 rounded-full hover:bg-slate-100">
            <X size={16} className="text-slate-500" />
          </button>
        ) : null}
      </div>

      {historyMode !== "none" && open && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500">
              <Clock size={14} /> 최근 검색
            </div>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => clearAll().catch(() => { })}
              className="text-xs font-black text-slate-400 hover:text-slate-700"
            >
              전체삭제
            </button>
          </div>

          {recentShown.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-400">
              {(value ?? "").trim()
                ? "일치하는 검색 기록이 없습니다."
                : "최근 검색 기록이 없습니다."}
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto">
              {recentShown.map((item) => (
                <li key={item.search_log_id || item.keyword} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      onChange?.(item.keyword);
                      commitSearch(item.keyword);
                    }}
                    className="flex-1 text-left text-sm font-medium text-slate-800"
                  >
                    {item.keyword}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => removeItem(item).catch(() => { })}
                    className="p-1 rounded-full hover:bg-slate-100"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
