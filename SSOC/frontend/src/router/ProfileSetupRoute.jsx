import { Navigate } from "react-router-dom"
import {
  isAuthenticated,
  isProfileCompleted,
} from "../utils/auth"

export default function ProfileSetupRoute({ children }) {
  // 로그인 안 됐으면 login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  // 이미 프로필 설정 완료했으면 home
  if (isProfileCompleted()) {
    return <Navigate to="/home" replace />
  }

  // 로그인 됐고, 프로필 미완료 → 허용
  return children
}
