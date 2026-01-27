import React, { useEffect, useRef, useState } from "react";
import { Search, History, X } from "lucide-react";

export default function SearchWithHistory({
  storageKey = "recent_searches",
  value,
  onChange,
  placeholder,
  onSearch,
}) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setRecent(JSON.parse(saved));
    } catch {}
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [storageKey]);

  const save = (term) => {
    if (!term.trim()) return;
    const next = [term, ...recent.filter((x) => x !== term)].slice(0, 5);
    setRecent(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      save(value);
      onSearch?.(value);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative flex-1 group z-50">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 w-full sm:w-[300px] shadow-sm"
      />
      {open && recent.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-wider">
            최근 검색어
          </div>
          <ul>
            {recent.map((term) => (
              <li
                key={term}
                className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 cursor-pointer group/item"
                onClick={() => {
                  onChange({ target: { value: term } });
                  onSearch?.(term);
                  setOpen(false);
                }}
              >
                <div className="flex items-center text-sm text-slate-600">
                  <History size={14} className="mr-2 text-slate-300" />
                  {term}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = recent.filter((x) => x !== term);
                    setRecent(next);
                    localStorage.setItem(storageKey, JSON.stringify(next));
                  }}
                  className="text-slate-300 hover:text-red-400 opacity-0 group-hover/item:opacity-100"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
