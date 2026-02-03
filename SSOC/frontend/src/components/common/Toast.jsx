import React from "react";

export default function Toast({ message, open }) {
    if (!open) return null;

    return (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#1E325C] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400/20">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                </div>
                <span className="text-sm font-black tracking-tight">{message}</span>
            </div>
        </div>
    );
}
