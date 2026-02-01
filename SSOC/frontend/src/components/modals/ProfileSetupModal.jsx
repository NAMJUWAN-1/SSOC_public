import React, { useMemo, useState } from "react";
import { Check, User, X } from "lucide-react";

const AVATAR_LIST = [
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
  "/avatars/5.png",
  "/avatars/6.png",
  "/avatars/7.png",
  "/avatars/8.png"
];

function clampNickname(s) {
  return String(s ?? "").slice(0, 20);
}

export default function ProfileSetupModal({ user, force = false, onClose, onSubmit }) {
  const defaultNickname = useMemo(() => {
    return (
      user?.nickname ||
      user?.name ||
      user?.username ||
      (typeof user?.email === "string" ? user.email.split("@")[0] : "") ||
      ""
    );
  }, [user]);

  const defaultAvatar = useMemo(() => user?.profile_image_url || AVATAR_LIST[0], [user]);

  const [nickname, setNickname] = useState(clampNickname(defaultNickname));
  const [profileImageUrl, setProfileImageUrl] = useState(defaultAvatar);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = () => {
    const nn = (nickname || "").trim();
    if (!nn) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      return;
    }
    if (nn.length > 20) return;
    onSubmit?.({ nickname: nn, profile_image_url: profileImageUrl });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-apple-fade">
      <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-apple-modal relative">

        {/* Top Header */}
        <div className="p-10 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-4 animate-apple-slide-up">
            <span className="w-2 h-10 bg-[#FFBC1F] rounded-full shadow-sm shadow-[#FFBC1F]/20" />
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">프로필 설정</h2>
          </div>

          {!force && (
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all hover:rotate-90"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="p-10 pt-8">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Left Section: Big Preview */}
            <div className="lg:w-1/3 flex flex-col items-center gap-6 animate-apple-slide-up [animation-delay:0.1s]">
              <div className="w-56 h-56 rounded-[3.5rem] bg-slate-50 p-1.5 border-4 border-white shadow-2xl overflow-hidden relative group transition-transform hover:scale-105 duration-500">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <User size={80} fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-[#FFBC1F] uppercase tracking-[0.2em] mb-1">Preview</p>
                <h3 className="text-2xl font-black text-slate-800 truncate max-w-[200px]">
                  {nickname || "닉네임 입력"}
                </h3>
              </div>
            </div>

            {/* Right Section: Inputs & Grid */}
            <div className="flex-1 space-y-10">

              {/* Nickname Input */}
              <div className="space-y-3 animate-apple-slide-up [animation-delay:0.2s]">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                  활동 닉네임
                </label>
                <input
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => setNickname(clampNickname(e.target.value))}
                  placeholder="사용하실 닉네임을 입력해주세요"
                  className={`w-full bg-transparent border-b-2 py-4 text-3xl font-black focus:outline-none transition-all placeholder:text-slate-200 
                        ${isShaking
                      ? "border-red-500 text-red-500 animate-shake"
                      : "border-slate-100 text-slate-800 focus:border-[#1E325C]"}`}
                />
                <p className={`text-xs font-bold pl-1 transition-colors ${nickname.length > 20 ? "text-red-500" : "text-slate-400"}`}>
                  * 닉네임은 최대 20자 까지 설정 가능합니다.
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-4 animate-apple-slide-up [animation-delay:0.3s]">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                  아바타 선택
                </label>
                <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
                  {AVATAR_LIST.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setProfileImageUrl(src)}
                      className={`aspect-square rounded-[1.5rem] overflow-hidden relative transition-all duration-300 group
                        ${profileImageUrl === src
                          ? "ring-4 ring-[#1E325C]/10 border-2 border-[#1E325C] scale-105 shadow-xl shadow-[#1E325C]/10"
                          : "border border-slate-100 hover:border-slate-300 hover:scale-105"
                        }`}
                    >
                      <img src={src} alt={`avatar-${i}`} className="w-full h-full object-cover" />
                      {profileImageUrl === src && (
                        <div className="absolute inset-0 bg-[#1E325C]/10 flex items-center justify-center animate-apple-fade">
                          <div className="bg-[#1E325C] text-white rounded-full p-1.5 shadow-lg">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 animate-apple-slide-up [animation-delay:0.4s]">
                <button
                  onClick={handleSubmit}
                  className="w-full py-5 rounded-[1.5rem] bg-[#1E325C] text-white text-lg font-black shadow-2xl shadow-[#1E325C]/20 hover:shadow-3xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} strokeWidth={3} />
                  {force ? "SSOC 시작하기" : "변경사항 저장하기"}
                </button>
                {!force && (
                  <button
                    onClick={onClose}
                    className="w-full mt-3 py-4 rounded-[1.5rem] bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                  >
                    나중에 설정하기
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
