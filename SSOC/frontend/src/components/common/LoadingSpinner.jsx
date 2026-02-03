import React from "react";

export default function LoadingSpinner({ message = "불러오는 중..." }) {
    const bars = Array.from({ length: 12 });

    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-8">
            <div className="relative w-16 h-16">
                {bars.map((_, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 flex justify-center"
                        style={{ transform: `rotate(${i * 30}deg)` }}
                    >
                        <div
                            className="w-[3px] h-[16px] rounded-full animate-spinner-fade"
                            style={{
                                backgroundColor: "#FFBC1F",
                                animationDelay: `${(i * 0.1) - 1.2}s`,
                            }}
                        />
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes spinner-fade {
          0%, 39%, 100% { opacity: 0.1; background-color: #1E325C; transform: scale(0.85); }
          40% { opacity: 1; background-color: #FFBC1F; transform: scale(1.1); }
        }
        .animate-spinner-fade {
          animation: spinner-fade 1.2s linear infinite;
        }
      `}} />

            <div className="flex flex-col items-center space-y-1">
                <span className="text-[#1E325C] font-black text-xl tracking-tighter">{message}</span>
                <span className="text-slate-400 text-sm font-bold opacity-70">잠시만 기다려주세요</span>
            </div>
        </div>
    );
}
