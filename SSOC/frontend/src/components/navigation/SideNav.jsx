import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User, Circle, LogOut } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import { useApp } from '../../state/AppProvider';

import LogoLogo from '../../assets/LOGO_logo.png';
import LogoName from '../../assets/LOGO_name_2.png';

const SideNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state, actions } = useApp();
    const user = state.auth.user;

    const normalizeAvatarUrl = (u) => {
        const s = String(u ?? "").trim();
        if (!s) return "";
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        if (s.startsWith("/")) return s;
        return `/${s}`;
    };

    const handleNavigation = (path) => {
        // Compare paths. Note: location.pathname might or might not have trailing slash
        // normalize to no trailing slash for comparison
        const current = location.pathname.replace(/\/$/, "");
        const target = path.replace(/\/$/, "");

        if (current === target) {
            actions.triggerRefresh();
        } else {
            navigate(path);
        }
    };

    const navItems = [
        { id: 'dashboard', icon: Home, label: '홈', subLabel: '공지사항', path: '/app' },
        { id: 'calendar', icon: Calendar, label: '캘린더', subLabel: '일정 관리', path: '/app/calendar' },
        { id: 'mypage', icon: User, label: '프로필', subLabel: '개인 설정', path: '/app/mypage' },
    ];

    return (
        <div className="fixed left-0 top-0 h-full w-16 hover:w-[220px] bg-[#1E325C] border-r border-[#1E325C] flex flex-col items-center py-8 z-[100] shadow-xl transition-all duration-300 ease-in-out group overflow-hidden">
            {/* Logo Area */}
            <div
                className="mb-10 cursor-pointer flex items-center justify-center whitespace-nowrap w-full overflow-hidden"
                onClick={() => handleNavigation('/app')}
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
                    const isActive = location.pathname === item.path || location.pathname === `${item.path}/`;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.path)}
                            className={cn(
                                "relative flex items-center justify-start transition-all duration-300 overflow-hidden group/item",
                                "rounded-full group-hover:rounded-2xl",
                                "w-[40px] group-hover:w-[calc(100%-1.5rem)]",
                                isActive
                                    ? "bg-[#FFBC1F] text-[#1E325C] shadow-[0_4px_18px_rgba(255,188,31,0.4)] transition-all active:scale-95 apple-spring"
                                    : "bg-transparent text-white hover:bg-white/5 transition-all active:scale-95 apple-spring"
                            )}
                            style={{ height: '40px' }}
                        >
                            {/* Icon Wrapper */}
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

                            {/* Label & SubLabel */}
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

                            {/* Active Indicator Dot */}
                            {isActive && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                    <Circle size={6} fill="#1E325C" stroke="none" className="opacity-50" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Profile Section */}
            <div className="mt-auto w-full flex flex-col items-center">
                <div className={cn(
                    "relative flex items-center justify-start transition-all duration-300 overflow-hidden group/profile",
                    "rounded-full group-hover:rounded-2xl",
                    "w-[48px] group-hover:w-[calc(100%-1.5rem)] h-[48px]",
                    "bg-white/5 group-hover:bg-white/10"
                )}>
                    {/* Avatar Wrapper */}
                    <div className="w-[48px] h-[48px] flex items-center justify-center shrink-0">
                        <div
                            className="w-10 h-10 rounded-full overflow-hidden border border-white/10 cursor-pointer active:scale-95 transition-transform"
                            onClick={() => handleNavigation('/app/mypage')}
                        >
                            {user.profile_image_url ? (
                                <img
                                    src={normalizeAvatarUrl(user.profile_image_url)}
                                    alt="profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info & Logout */}
                    <div className="flex items-center justify-between flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 overflow-hidden pr-4">
                        <div className="flex flex-col ml-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate">
                                {user.nickname || '닉네임'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                                SSAFY 14기
                            </span>
                        </div>

                        <button
                            onClick={() => actions.openConfirm("logout")}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all ml-2 shrink-0"
                            title="로그아웃"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SideNav;
