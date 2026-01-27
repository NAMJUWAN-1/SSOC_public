import React, { useEffect, useState } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { useApp } from "../../state/AppProvider";

export default function MMLoginModal({ onClose, onSuccess }) {
  const { actions } = useApp();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

      onClose();
      onSuccess();
    } catch (err) {
      setError(
        err?.message ||
          "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="
          relative w-full max-w-md mx-4
          rounded-2xl bg-white
          shadow-[0_20px_60px_rgba(0,0,0,0.25)]
          px-8 py-7
          animate-[fadeIn_0.2s_ease-out]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-[#4F467F]/10 flex items-center justify-center">
            <ExternalLink className="text-[#4F467F]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Mattermost 로그인
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            SSAFY Mattermost 계정으로 인증합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="Mattermost 로그인 ID"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mattermost 비밀번호"
            className="w-full rounded-xl border px-4 py-3"
          />

          {error && (
            <p className="text-sm text-red-500 font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#4F467F] text-white"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
