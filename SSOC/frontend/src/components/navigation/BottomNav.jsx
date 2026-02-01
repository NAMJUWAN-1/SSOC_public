import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User } from 'lucide-react';
import { cn } from '../../components/ui/utils';

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { id: 'dashboard', icon: Home, label: '홈', path: '/app' },
        { id: 'calendar', icon: Calendar, label: '캘린더', path: '/app/calendar' },
        { id: 'mypage', icon: User, label: '프로필', path: '/app/mypage' },
    ];

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-auto">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-[2.5rem] px-4 py-3 flex items-center justify-center gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Strict match or trailing slash match
                    const isActive = location.pathname === item.path || location.pathname === `${item.path}/`;

                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "group relative flex flex-col items-center justify-center min-w-[70px] transition-all duration-300",
                                isActive ? "scale-110" : "hover:scale-105"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mb-1",
                                    isActive
                                        ? "bg-[#1E325C] text-white shadow-lg shadow-[#1E325C]/20"
                                        : "text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600"
                                )}
                            >
                                <Icon size={22} className={cn(isActive && "active-indicator")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black transition-colors duration-300",
                                isActive ? "text-[#1E325C]" : "text-slate-400 group-hover:text-slate-600"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute -bottom-1 w-1 h-1 bg-[#1E325C] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
