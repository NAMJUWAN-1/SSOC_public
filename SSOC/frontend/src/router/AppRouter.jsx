import { Routes, Route, Navigate } from "react-router-dom"

import Login from "../pages/Login"
import SplashScreen from "../pages/SplashScreen"
import OAuthCallbackPage from "../pages/oauth/OAuthCallbackPage"
import ProfileSetup from "../pages/profile/ProfileSetup"

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/profile/setup" element={<ProfileSetup />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
