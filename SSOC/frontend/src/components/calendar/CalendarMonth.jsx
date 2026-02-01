import React, { useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { isSameDay, startOfDay } from "../../utils/date";
import { getDefaultColorForCategory, makeChipStyle } from "../../utils/eventColor";

const monthNames = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

const MAX_VISIBLE_LANES = 2;

function getEventPosition(ev, date) {
  const s = startOfDay(ev.startAt);
  const e = startOfDay(ev.endAt || ev.startAt);
  const t = startOfDay(date);

  if (s.getTime() === e.getTime()) return "single";
  if (t.getTime() === s.getTime()) return "start";
  if (t.getTime() === e.getTime()) return "end";
  return "middle";
}


export default function CalendarMonth({
  currentDate,
  setCurrentDate,
  events,
  expandedWeek,
  setExpandedWeek,
  onOpenEvent,
  hideHeader = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setExpandedWeek(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [setExpandedWeek]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = first.getDay();

    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const ws = [];
    for (let i = 0; i < cells.length; i += 7) ws.push(cells.slice(i, i + 7));
    return ws;
  }, [year, month]);

  const weekLanes = useMemo(() => {
    return weeks.map((week) => {
      const validDays = week.filter(Boolean);
      if (validDays.length === 0) return [];

      const weekStart = startOfDay(validDays[0]);
      const weekEnd = startOfDay(validDays[validDays.length - 1]);

      const weekEvents = events
        .filter((ev) => {
          const s = startOfDay(ev.startAt);
          const e = startOfDay(ev.endAt || ev.startAt);
          return e >= weekStart && s <= weekEnd;
        })
        .sort((a, b) => {
          const sa = new Date(a.startAt).getTime();
          const sb = new Date(b.startAt).getTime();
          const ea = new Date(a.endAt || a.startAt).getTime();
          const eb = new Date(b.endAt || b.startAt).getTime();

          // NOTE: 겹치는 일정의 "위/아래" 우선순위 규칙
          // - 포함(완전 겹침/포함 관계): 긴 일정(범위가 더 큰 것)이 위로
          // - 부분 겹침: 빨리 끝나는 일정이 위로
          const overlap = sa <= eb && sb <= ea;
          if (overlap) {
            const aContains = sa <= sb && ea >= eb;
            const bContains = sb <= sa && eb >= ea;
            if (aContains && !bContains) return -1;
            if (bContains && !aContains) return 1;

            if (ea !== eb) return ea - eb; // partial overlap: earlier end first
            if (sa !== sb) return sa - sb;
            return String(a.id).localeCompare(String(b.id));
          }

          if (sa !== sb) return sa - sb;
          if (ea !== eb) return ea - eb;
          return String(a.id).localeCompare(String(b.id));
        });

      const lanes = [];
      weekEvents.forEach((ev) => {
        const s = startOfDay(ev.startAt);

        let placed = false;
        for (let i = 0; i < lanes.length; i++) {
          const last = lanes[i][lanes[i].length - 1];
          const lastEnd = startOfDay(last.endAt || last.startAt);
          if (lastEnd < s) {
            lanes[i].push(ev);
            placed = true;
            break;
          }
        }
        if (!placed) lanes.push([ev]);
      });

      return lanes;
    });
  }, [weeks, events]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setExpandedWeek(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setExpandedWeek(null);
  };

  const toggleWeek = (idx) => {
    setExpandedWeek(expandedWeek === idx ? null : idx);
  };

  return (
    <div
      ref={ref}
      className="bg-white rounded-[2rem] overflow-hidden select-none"
    >
      {!hideHeader && (
        <div className="flex justify-center items-center px-6 py-8 relative">
          <div className="flex items-center gap-8">
            <button
              onClick={prevMonth}
              className="p-1 text-slate-400 hover:text-[#1E325C] transition-colors"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>

            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
              {year}년 {monthNames[month]}
            </h2>

            <button
              onClick={nextMonth}
              className="p-1 text-slate-400 hover:text-[#1E325C] transition-colors"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, i) => (
          <div
            key={d}
            className={`py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase ${i === 0
              ? "text-[#FF3B30]"
              : i === 6
                ? "text-[#007AFF]"
                : "text-[#8E8E93]"
              }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 캘린더 바디 */}
      <div key={currentDate.getTime()} className="flex flex-col relative animate-apple-slide-right">
        {weeks.map((week, wi) => {
          const isExpanded = expandedWeek === wi;
          const lanes = weekLanes[wi] || [];

          return (
            <div
              key={wi}
              className={`grid grid-cols-7 border-b border-slate-100 transition-all duration-500 apple-bezier relative overflow-hidden ${isExpanded ? "h-[20rem] bg-slate-50/50 shadow-inner" : "h-32"
                }`}
            >
              {week.map((date, di) => {
                const today = date && isSameDay(date, new Date());

                // ✅ 여기만 기능 수정
                const actualCount = lanes.reduce((acc, lane) => {
                  const hasEvent = lane.some((e) => {
                    const s = startOfDay(e.startAt);
                    const end = startOfDay(e.endAt || e.startAt);
                    const t = startOfDay(date);
                    return t >= s && t <= end;
                  });
                  return acc + (hasEvent ? 1 : 0);
                }, 0);

                const hiddenCount = Math.max(
                  0,
                  actualCount - MAX_VISIBLE_LANES
                );

                return (
                  <div
                    key={di}
                    onClick={() => date && toggleWeek(wi)}
                    className={`border-r border-slate-50 last:border-r-0 relative group transition-all ${date
                      ? "hover:bg-slate-50/50 cursor-pointer"
                      : "bg-slate-50/10"
                      }`}
                  >
                    {date && (
                      <>
                        <div
                          className={`flex items-center justify-center text-sm absolute top-3 right-3 w-7 h-7 rounded-full transition-all duration-300 ${today
                            ? "bg-[#FFBC1F] text-[#1E325C] font-black shadow-sm scale-110"
                            : `font-medium ${di === 0 ? "text-[#FF3B30]" : di === 6 ? "text-[#007AFF]" : "text-slate-500"}`
                            }`}
                        >
                          {date.getDate()}
                        </div>

                        <div className="mt-11 space-y-1">
                          {!isExpanded &&
                            lanes.slice(0, MAX_VISIBLE_LANES).map((lane, li) => {
                              const ev = lane.find((e) => {
                                const s = startOfDay(e.startAt);
                                const end = startOfDay(e.endAt || e.startAt);
                                const t = startOfDay(date);
                                return t >= s && t <= end;
                              });

                              if (!ev)
                                return <div key={li} className="h-5 mx-2" />;

                              const pos = getEventPosition(ev, date);
                              let chip =
                                "h-5 text-[9px] font-black flex items-center px-2 truncate opacity-80 transition-all hover:brightness-105";

                              if (pos === "start")
                                chip += " rounded-l-md ml-2 mr-0";
                              else if (pos === "end")
                                chip += " rounded-r-md ml-0 mr-2";
                              else if (pos === "middle")
                                chip += " rounded-none mx-0";
                              else chip += " rounded-md mx-2";

                              return (
                                <div
                                  key={li}
                                  className={`${chip} border border-transparent`}
                                  style={makeChipStyle(ev.color || getDefaultColorForCategory(ev.category), {
                                    accentLeft: pos === "start" || pos === "single",
                                    accentRight: pos === "end" || pos === "single",
                                  })}
                                >
                                  {pos === "start" || pos === "single"
                                    ? ev.title
                                    : "\u00A0"}
                                </div>
                              );
                            })}

                          {!isExpanded && hiddenCount > 0 && (
                            <div className="text-[9px] text-slate-400 font-black pl-2 mt-1">
                              +{hiddenCount}건 더보기
                            </div>
                          )}

                          {isExpanded &&
                            lanes.map((lane, li) => {
                              const ev = lane.find((e) => {
                                const s = startOfDay(e.startAt);
                                const end = startOfDay(e.endAt || e.startAt);
                                const t = startOfDay(date);
                                return t >= s && t <= end;
                              });

                              if (!ev)
                                return <div key={li} className="h-5 mx-2" />;

                              const pos = getEventPosition(ev, date);
                              let chip =
                                "h-5 text-[9px] font-black flex items-center px-2 truncate transition-all hover:brightness-105 cursor-pointer";

                              if (pos === "start")
                                chip += " rounded-l-md ml-2 mr-0";
                              else if (pos === "end")
                                chip += " rounded-r-md ml-0 mr-2";
                              else if (pos === "middle")
                                chip += " rounded-none mx-0";
                              else chip += " rounded-md mx-2";

                              return (
                                <div
                                  key={li}
                                  className={`${chip} border border-transparent animate-apple-slide-up`}
                                  style={{
                                    ...makeChipStyle(ev.color || getDefaultColorForCategory(ev.category), {
                                      accentLeft: pos === "start" || pos === "single",
                                      accentRight: pos === "end" || pos === "single",
                                    }),
                                    animationDelay: `${li * 0.05}s`
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEvent(ev);
                                  }}
                                >
                                  {pos === "start" || pos === "single"
                                    ? ev.title
                                    : "\u00A0"}
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
