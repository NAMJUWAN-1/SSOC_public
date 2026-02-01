import { ExternalLink, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import LogoLogo from "../assets/LOGO_logo.png";
import LogoName from "../assets/LOGO_name.png";

export default function Login() {
  const { state, actions } = useApp();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [state.isAuthenticated, navigate]);

  // Load saved ID
  useEffect(() => {
    const savedId = localStorage.getItem("savedLoginId");
    if (savedId) {
      setLoginId(savedId);
      setRememberId(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!loginId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await actions.loginWithPassword(loginId, password);

      // Handle Remember ID
      if (rememberId) {
        localStorage.setItem("savedLoginId", loginId);
      } else {
        localStorage.removeItem("savedLoginId");
      }

      // Let the useEffect handle redirection
    } catch (err) {
      let errorMessage = err?.message || "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.";

      // Customize specific error messages
      if (errorMessage.includes("Invalid credentials")) {
        errorMessage = "아이디 또는 비밀번호를 확인해주세요";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#1E325C]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#FFBC1F]/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-[400px] mx-4 relative z-10">
        {/* Card Container */}
        <div className="bg-white rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] px-8 py-10">

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8 space-y-1">
            {/* Logo Icon */}
            <div className="w-32 h-32 flex items-center justify-center p-2 mb-[-10px]">
              <img src={LogoLogo} alt="SSOC" className="w-full h-full object-contain" />
            </div>

            {/* Logo Name Image */}
            <img src={LogoName} alt="SSOC" className="h-12 w-auto object-contain" />

            <p className="text-xs text-slate-400 font-bold tracking-tight mt-3">싸피인들을 위한 스마트한 공지 관리 솔루션</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 ml-1">Mattermost 로그인 ID</label>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Mattermost 로그인 ID"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1E325C] focus:ring-1 focus:ring-[#1E325C] transition-all bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 ml-1">Mattermost 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mattermost 비밀번호"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1E325C] focus:ring-1 focus:ring-[#1E325C] transition-all bg-slate-50/50"
              />
            </div>

            <div className="flex items-center">
              <input
                id="rememberId"
                type="checkbox"
                checked={rememberId}
                onChange={(e) => setRememberId(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1E325C] focus:ring-[#1E325C]"
              />
              <label htmlFor="rememberId" className="ml-2 text-xs font-bold text-slate-500 cursor-pointer">
                아이디 저장
              </label>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-bold text-center py-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center rounded-xl bg-[#1E325C] text-white font-bold text-sm shadow-md shadow-[#1E325C]/20 hover:bg-[#2a457d] active:scale-[0.98] transition-all duration-200 mt-6"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Mattermost 계정으로 시작하기"
              )}
            </button>
          </form>

          {/* Footer Link Removed */}

          {/* Copyright */}
          <div className="mt-4 text-center border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              © 2026 SSOC. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
