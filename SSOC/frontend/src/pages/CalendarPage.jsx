import React, { useEffect, useState } from "react";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../state/AppProvider";
import CalendarMonth from "../components/calendar/CalendarMonth";

export default function CalendarPage() {
  const { state, actions } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedWeek, setExpandedWeek] = useState(null);

  useEffect(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
    actions.fetchCalendarEvents({ start, end });
  }, [currentDate, state.refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center">
          <span className="w-1.5 h-6 bg-[#FFBC1F] rounded-full mr-3" />
          캘린더
        </h2>

        <div className="flex items-center gap-4">
          {/* Month Navigation */}
          <div className="bg-white rounded-xl px-4 py-2 border border-slate-100 flex items-center gap-4 shadow-sm">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-1 text-slate-400 hover:text-[#1E325C] transition-colors"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <span className="text-sm font-black text-slate-700 min-w-[100px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-1 text-slate-400 hover:text-[#1E325C] transition-colors"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => actions.openCalendarEventCreateManual()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center px-6 py-3 bg-[#1E325C] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-900/10 hover:brightness-110 transition-all active:scale-95 group"
          >
            <Plus size={18} className="mr-2 stroke-[3]" /> 일정 등록
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <section className="bg-white rounded-[2rem] p-4 md:p-8 shadow-sm border border-slate-100">
        <CalendarMonth
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          events={state.calendarEvents}
          expandedWeek={expandedWeek}
          setExpandedWeek={setExpandedWeek}
          onOpenEvent={(ev) => actions.openPostDetailFromEvent(ev)}
          hideHeader={true}
        />
      </section>
    </div>
  );
}
