import React from "react";
import { Home, Calendar as CalendarIcon, User, LogOut } from "lucide-react";
import { LOGO_URL } from "../../data/mockData";

export default function Sidebar({ active, onNavigate, user, onLogout }) {
  const items = [
    { id: "home", label: "홈", icon: Home },
    { id: "mypage", label: "마이페이지", icon: User },
    { id: "calendar", label: "내 캘린더", icon: CalendarIcon },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen bg-slate-950 text-white z-50 flex flex-col py-6 w-[70px] hover:w-64 group overflow-hidden shadow-2xl transition-all duration-300">
      <div className="px-5 mb-8 flex items-center w-full">
        <div className="w-8 h-8 rounded-lg overflow-hidden">
          <img src={LOGO_URL} alt="logo" className="w-full h-full object-contain" />
        </div>
        <span className="ml-4 text-xl font-black italic opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          SS<span className="text-blue-500">OC</span>
        </span>
      </div>

      <ul className="flex-1 w-full space-y-2 px-3">
        {items.map((it) => (
          <li key={it.id}>
            <button
              onClick={() => onNavigate(it.id)}
              className={[
                "w-full flex items-center p-3 rounded-xl transition-all duration-300",
                active === it.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
              ].join(" ")}
            >
              <it.icon size={22} className="flex-shrink-0" />
              <span className="ml-4 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {it.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="px-3 w-full mt-auto">
        <button
          onClick={onLogout}
          className="w-full bg-slate-900/50 rounded-xl p-2 flex items-center overflow-hidden border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex-shrink-0 overflow-hidden flex items-center justify-center font-black">
            {user.profile_image_url ? (
              <img src={user.profile_image_url} alt="profile" className="w-full h-full object-cover" />
            ) : (
              (user.nickname || "SS").slice(0, 2)
            )}
          </div>
          <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <p className="text-sm font-bold text-slate-100">{user.nickname || "사용자"}</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <LogOut size={12} /> 로그아웃
            </p>
          </div>
        </button>
      </div>
    </nav>
  );
}
