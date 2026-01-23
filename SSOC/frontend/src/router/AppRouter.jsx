import { Routes, Route, Navigate } from "react-router-dom"

import Login from "../pages/Login"
import SplashScreen from "../pages/SplashScreen"
import OAuthCallbackPage from "../pages/oauth/OAuthCallbackPage"
import ProfileSetup from "../pages/profile/ProfileSetup"
import PublicRoute from "./PublicRoute"
import ProtectedRoute from "./ProtectedRoute"
import ProfileSetupRoute from "./ProfileSetupRoute"
import Home from "../pages/Home"

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/splash" element={<PublicRoute><SplashScreen /></PublicRoute>} />
      <Route path="/oauth/callback" element={<PublicRoute><OAuthCallbackPage /></PublicRoute>} />

      <Route
        path="/profile/setup"
        element={
          <ProfileSetupRoute>
            <ProfileSetup />
          </ProfileSetupRoute>
        }
      />

      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
