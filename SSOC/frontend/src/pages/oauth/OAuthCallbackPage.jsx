import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { setAuthenticated, isProfileCompleted } from "../../utils/auth"
import { OAUTH_STATUS } from "../../constants/oauthStatus"

export default function OAuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    setAuthenticated()

    if (!isProfileCompleted()) {
      navigate("/profile/setup", { replace: true })
    } else {
      navigate("/home", { replace: true })
    }
  }, [])

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-slate-400">계정 연동 중입니다...</p>
    </div>
  )
}
