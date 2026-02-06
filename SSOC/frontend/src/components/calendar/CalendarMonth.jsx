import React, { useMemo, useRef, useEffect, useState } from "react";
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
  const [hoveredEventId, setHoveredEventId] = useState(null);

  useEffect(() => {
    const onDown = (e) => {
      // 캘린더 외부 클릭 시 닫기 (단, 모달은 제외)
      const isModalClick = e.target.closest('[role="dialog"]') || e.target.closest('.fixed.inset-0');
      if (ref.current && !ref.current.contains(e.target) && !isModalClick) {
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
          // 일(Day) 단위로 정렬하기 위해 시간 정보 제거
          const sa = startOfDay(a.startAt).getTime();
          const sb = startOfDay(b.startAt).getTime();
          const ea = startOfDay(a.endAt || a.startAt).getTime();
          const eb = startOfDay(b.endAt || b.startAt).getTime();

          const durA = ea - sa;
          const durB = eb - sb;

          // 1. 기간(일수)이 긴 일정을 우선순위로
          if (durA !== durB) return durB - durA;

          // 2. 기간이 같다면 최신 등록순 (ID 내림차순)
          // ID가 숫자라면 b.id - a.id, 문자열이라면 localeCompare 사용
          return String(b.id).localeCompare(String(a.id));
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
    if (expandedWeek === idx) {
      setExpandedWeek(null);
    } else {
      setExpandedWeek(idx);
    }
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
      <div
        className="grid border-b border-slate-100 bg-white"
        style={{ gridTemplateColumns: '12px repeat(7, 1fr) 12px' }}
      >
        <div /> {/* Left Spacer */}
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
        <div /> {/* Right Spacer */}
      </div>

      {/* 캘린더 바디 */}
      <div key={currentDate.getTime()} className="flex flex-col relative animate-apple-slide-right">
        {weeks.map((week, wi) => {
          const isExpanded = expandedWeek === wi;
          const lanes = weekLanes[wi] || [];

          return (
            <div
              key={wi}
              className={`grid border-b border-slate-100 transition-all duration-500 apple-bezier relative ${isExpanded ? "h-[20rem] bg-slate-50/50 shadow-inner overflow-y-auto overflow-x-hidden custom-scrollbar" : "h-32 overflow-hidden"
                }`}
              style={{ gridTemplateColumns: '12px repeat(7, 1fr) 12px' }}
            >
              <div /> {/* Left Spacer */}
              {week.map((date, di) => {
                const today = date && isSameDay(date, new Date());

                // 해당 날짜에 있는 전제 일정 개수
                const allEventsOnDay = lanes.map(lane =>
                  lane.find(e => {
                    const s = startOfDay(e.startAt);
                    const end = startOfDay(e.endAt || e.startAt);
                    const t = startOfDay(date);
                    return t >= s && t <= end;
                  })
                ).filter(Boolean);

                const totalCount = allEventsOnDay.length;

                // 실제로 칩(Chip)으로 그려지는 일정 개수 (상위 N개 레인 내)
                const visibleCount = lanes.slice(0, MAX_VISIBLE_LANES).filter(lane =>
                  lane.some(e => {
                    const s = startOfDay(e.startAt);
                    const end = startOfDay(e.endAt || e.startAt);
                    const t = startOfDay(date);
                    return t >= s && t <= end;
                  })
                ).length;

                const hiddenCount = Math.max(0, totalCount - visibleCount);

                return (
                  <div
                    key={di}
                    onClick={() => date && toggleWeek(wi)}
                    className={`min-w-0 border-r border-slate-50 last:border-r-0 relative group transition-all ${date
                      ? "hover:bg-slate-50/50 cursor-pointer"
                      : "bg-slate-50/10"
                      }`}
                  >
                    {date && (
                      <>
                        <div
                          className={`flex items-center justify-center text-sm transition-all duration-300 z-20 absolute top-3 right-3 w-7 h-7 rounded-full ${today
                            ? "bg-[#FFBC1F] text-[#1E325C] font-black shadow-sm scale-110"
                            : `font-medium ${di === 0 ? "text-[#FF3B30]" : di === 6 ? "text-[#007AFF]" : "text-slate-500"} ${isExpanded ? "bg-slate-50/70 backdrop-blur-sm shadow-sm" : ""}`
                            }`}
                        >
                          {date.getDate()}
                        </div>

                        <div className="mt-11 space-y-1 min-w-0 overflow-hidden">
                          {!isExpanded &&
                            lanes.slice(0, MAX_VISIBLE_LANES).map((lane, li) => {
                              const ev = lane.find((e) => {
                                const s = startOfDay(e.startAt);
                                const end = startOfDay(e.endAt || e.startAt);
                                const t = startOfDay(date);
                                return t >= s && t <= end;
                              });

                              if (!ev)
                                return <div key={li} className="h-6 mx-2" />;

                              const pos = getEventPosition(ev, date);

                              const isSunday = di === 0;
                              const showTitle = pos === "start" || pos === "single" || date.getDate() === 1 || isSunday;

                              const chipStyle = makeChipStyle(ev.color || getDefaultColorForCategory(ev.category), {
                                accentLeft: pos === "start" || pos === "single",
                                accentRight: pos === "end" || pos === "single",
                              });

                              let chip =
                                "h-6 text-[10px] font-black flex items-center px-2 relative min-w-0";

                              if (pos === "start")
                                chip += " rounded-l-md ml-2 mr-[-1px]";
                              else if (pos === "end")
                                chip += " rounded-r-md ml-[-1px] mr-2";
                              else if (pos === "middle")
                                chip += " rounded-none mx-[-1px]";
                              else chip += " rounded-md mx-2";

                              return (
                                <div
                                  key={li}
                                  className={`${chip} border border-transparent overflow-hidden`}
                                  style={chipStyle}
                                >
                                  {showTitle ? (
                                    <span className="truncate flex-1">{ev.title}</span>
                                  ) : (
                                    "\u00A0"
                                  )}
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
                                return <div key={li} className="h-6 mx-2" />;

                              const pos = getEventPosition(ev, date);

                              const isSunday = di === 0;
                              const showTitle = pos === "start" || pos === "single" || date.getDate() === 1 || isSunday;

                              const isHovered = hoveredEventId === ev.id;

                              let chip =
                                "h-6 text-[10px] font-black flex items-center px-2 relative min-w-0 transition-all duration-200 cursor-pointer";

                              if (isHovered) {
                                chip += " scale-y-[1.1] shadow-xl brightness-105 z-20";
                              }

                              const chipStyle = {
                                ...makeChipStyle(ev.color || getDefaultColorForCategory(ev.category), {
                                  accentLeft: pos === "start" || pos === "single",
                                  accentRight: pos === "end" || pos === "single",
                                }),
                                animationDelay: `${li * 0.05}s`
                              };

                              if (isHovered) {
                                let leftClip = "-100px";
                                let rightClip = "-100px";

                                // 토요일(di=6)에서 오른쪽으로 튀어나가지 않게, 일요일(di=0)에서 왼쪽으로 튀어나가지 않게 조정
                                if (pos === "start" || pos === "middle") {
                                  rightClip = di === 6 ? "0px" : "-5px";
                                }
                                if (pos === "end" || pos === "middle") {
                                  leftClip = di === 0 ? "0px" : "-5px";
                                }

                                chipStyle.clipPath = `inset(-100px ${rightClip} -100px ${leftClip})`;
                              }

                              if (pos === "start") {
                                const marginRight = (isHovered && di !== 6) ? "mr-[-5px]" : (di === 6 ? "mr-0" : "mr-[-1px]");
                                chip += ` rounded-l-md ml-2 ${marginRight}`;
                              } else if (pos === "end") {
                                const marginLeft = (isHovered && di !== 0) ? "ml-[-5px]" : (di === 0 ? "ml-0" : "ml-[-1px]");
                                chip += ` rounded-r-md ${marginLeft} mr-2`;
                              } else if (pos === "middle") {
                                const marginLeft = (isHovered && di !== 0) ? "ml-[-5px]" : (di === 0 ? "ml-0" : "ml-[-1px]");
                                const marginRight = (isHovered && di !== 6) ? "mr-[-5px]" : (di === 6 ? "mr-0" : "mr-[-1px]");
                                chip += ` rounded-none ${marginLeft} ${marginRight}`;
                              } else {
                                chip += " rounded-md mx-2";
                              }

                              return (
                                <div
                                  key={li}
                                  className={`${chip} border border-transparent animate-apple-slide-up`}
                                  style={chipStyle}
                                  onMouseEnter={() => setHoveredEventId(ev.id)}
                                  onMouseLeave={() => setHoveredEventId(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEvent(ev);
                                  }}
                                >
                                  {showTitle ? (
                                    <span className="truncate flex-1">{ev.title}</span>
                                  ) : (
                                    "\u00A0"
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              <div /> {/* Right Spacer */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
