import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";

export default function Main() {
  const { actions } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.logout();
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">메인 페이지</h1>

      <p className="text-slate-500">
        로그인 성공 상태입니다.
      </p>

      <button
        onClick={handleLogout}
        className="
          px-6 py-2 rounded-lg
          bg-red-500 text-white font-semibold
          hover:bg-red-600
          transition
        "
      >
        로그아웃
      </button>
    </div>
  );
}
