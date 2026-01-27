import { Navigate } from "react-router-dom"
import {
  isAuthenticated,
  isProfileCompleted,
} from "../utils/auth"

export default function ProfileSetupRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (isProfileCompleted()) {
    return <Navigate to="/home" replace />
  }

  return children
}
