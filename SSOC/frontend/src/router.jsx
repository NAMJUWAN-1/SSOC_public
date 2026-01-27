import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useApp } from "./state/AppProvider";

import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import MyPage from "./pages/MyPage";
import CalendarPage from "./pages/CalendarPage";
import AppLayout from "./layouts/AppLayout";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500 font-bold">인증 확인 중...</div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { state } = useApp();
  if (state.loading) return <FullScreenLoader />;
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <Login /> },

  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "mypage", element: <MyPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "*", element: <Navigate to="/app" replace /> },
    ],
  },

  { path: "*", element: <Navigate to="/login" replace /> },
]);
