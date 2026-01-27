import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../state/AppProvider";
import CalendarMonth from "../components/calendar/CalendarMonth";

export default function CalendarPage() {
  const { state, actions } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedWeek, setExpandedWeek] = useState(null);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => actions.openCalendarEventCreateManual()}
          className="flex items-center px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg hover:bg-slate-800 transition-all active:scale-95"
        >
          <Plus size={16} className="mr-2" /> 일정 추가
        </button>
      </div>

      <CalendarMonth
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        events={state.calendarEvents}
        expandedWeek={expandedWeek}
        setExpandedWeek={setExpandedWeek}
        onOpenEvent={(ev) => actions.openPostDetailFromEvent(ev)}
      />
    </div>
  );
}
