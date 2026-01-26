import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Main from "../pages/Main";
import { useApp } from "../state/AppProvider";

export default function AppRouter() {
  const { state } = useApp();

  if (state.loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        로딩 중...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          state.isAuthenticated ? (
            <Navigate to="/app" replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/app"
        element={
          state.isAuthenticated ? (
            <Main />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
