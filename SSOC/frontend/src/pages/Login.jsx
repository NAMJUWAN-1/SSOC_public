import { ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import MMLoginModal from "../components/modals/MMLoginModal";


export default function Login() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [state.isAuthenticated, navigate]);
  
  const LOGO_URL = "https://i.postimg.cc/RZbh63Gc/LOGO-total.png";

  return (
    <>
      {/* ===== 배경 / 레이아웃 (CSS 추가) ===== */}
      <div
        className="
          h-screen flex items-center justify-center
          bg-gradient-to-br
          from-[#4F467F]/5
          via-white
          to-[#4F467F]/10
        "
      >
        <div className="text-center space-y-6">
          {/* 로고 */}
          <div className="w-70 h-70 flex items-center justify-center mx-auto">
            <img
              src={LOGO_URL}
              alt="SSOC Logo"
              className="
                w-full h-full
                object-contain
                drop-shadow-sm
                transition-all
                hover:scale-105
              "
            />
          </div>

          {/* 설명 문구 */}
          <p className="text-slate-500 text-lg md:text-xl font-medium">
            싸피인들을 위한 스마트한 공지 관리 솔루션
          </p>

          {/* 로그인 버튼 (기존 버튼에 CSS만 추가) */}
          <button
            onClick={() => setOpen(true)}
            className="
              mt-8 px-8 py-3 rounded-xl
              bg-[#4F467F]/90 text-white font-semibold
              inline-flex items-center justify-center gap-2
              shadow-[0_8px_24px_rgba(79,70,127,0.25)]
              hover:bg-[#4F467F]
              transition-all duration-150 ease-out
              hover:scale-105 active:scale-95
            "
          >
            Mattermost 계정으로 시작하기
            <ExternalLink size={18} />
          </button>
        </div>

        {/* 하단 문구 */}
        <p className="absolute bottom-8 text-slate-400 text-xs font-medium">
          © 2026 SSOC. All rights reserved.
        </p>
      </div>

      {/* 로그인 모달 */}
      {open && (
        <MMLoginModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            navigate("/app", { replace: true });
          }}
        />
      )}
    </>
  );
}
