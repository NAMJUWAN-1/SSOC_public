import { useNavigate } from "react-router-dom";
import { clearAuthenticated } from "../utils/auth";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthenticated();          
    navigate("/login", { replace: true }); 
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold text-slate-700">
        메인 페이지
      </h1>

      {/* 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded bg-slate-600 text-white hover:bg-slate-700 transition"
      >
        로그아웃
      </button>
    </div>
  );
}
