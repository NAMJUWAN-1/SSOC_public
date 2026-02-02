import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User, Circle } from 'lucide-react';
import { cn } from '../../components/ui/utils';

import LogoLogo from '../../assets/LOGO_logo.png';
import LogoName from '../../assets/LOGO_name_2.png';

const SideNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { id: 'dashboard', icon: Home, label: '홈', subLabel: '대시보드', path: '/app' },
        { id: 'calendar', icon: Calendar, label: '캘린더', subLabel: '일정 관리', path: '/app/calendar' },
        { id: 'mypage', icon: User, label: '프로필', subLabel: '개인 설정', path: '/app/mypage' },
    ];

    return (
        <div className="fixed left-0 top-0 h-full w-16 hover:w-[220px] bg-[#1E325C] border-r border-[#1E325C] flex flex-col items-center py-8 z-[100] shadow-xl transition-all duration-300 ease-in-out group overflow-hidden">
            {/* Logo Area */}
            <div
                className="mb-10 cursor-pointer flex items-center justify-center whitespace-nowrap w-full overflow-hidden"
                onClick={() => navigate('/app')}
            >
                {/* Logo wrapper: auto width to sit tight with text */}
                <div className="flex items-center justify-center shrink-0 z-10">
                    <div className="w-14 h-14 flex items-center justify-center">
                        <img src={LogoLogo} alt="SSOC" className="w-full h-full object-contain" />
                    </div>
                </div>
                {/* Logo Name - flows to the right, hidden when collapsed */}
                <div className="w-0 group-hover:w-auto overflow-hidden transition-all duration-300 group-hover:pl-2">
                    <img
                        src={LogoName}
                        alt="SSOC Name"
                        className="h-9 w-auto object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 min-w-[max-content]"
                    />
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col gap-4 w-full items-center">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Strict match or trailing slash match
                    const isActive = location.pathname === item.path || location.pathname === `${item.path}/`;

                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "relative flex items-center justify-start transition-all duration-300 overflow-hidden group/item",
                                // Shape transition: Circle (collapsed) -> Rounded Rectangle (expanded)
                                "rounded-full group-hover:rounded-2xl",
                                // Width transition: Fixed (collapsed) -> Full (expanded)
                                "w-[40px] group-hover:w-full",
                                isActive
                                    ? "bg-[#FFBC1F] text-[#1E325C] shadow-[0_4px_18px_rgba(255,188,31,0.4)] transition-all active:scale-95 apple-spring"
                                    : "bg-transparent text-white hover:bg-white/5 transition-all active:scale-95 apple-spring"
                            )}
                            style={{ height: '40px' }}
                        >
                            {/* Icon Wrapper - Center in collapsed, Left in expanded */}
                            <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                    isActive ? "bg-white/20" : "bg-white/10"
                                )}>
                                    <Icon
                                        size={16}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={cn("transition-transform duration-300", isActive && "scale-105")}
                                    />
                                </div>
                            </div>

                            {/* Label & SubLabel - visible on expand */}
                            <div className={cn(
                                "flex flex-col items-start justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 w-full pr-4 whitespace-nowrap pl-2"
                            )}>
                                <span className={cn(
                                    "text-sm font-bold leading-none mb-0.5",
                                    isActive ? "text-[#1E325C]" : "text-white"
                                )}>
                                    {item.label}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    isActive ? "text-[#1E325C]/70" : "text-slate-400"
                                )}>
                                    {item.subLabel}
                                </span>
                            </div>

                            {/* Active Indicator Dot - Right side */}
                            {isActive && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                    <Circle size={6} fill="#1E325C" stroke="none" className="opacity-50" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SideNav;
