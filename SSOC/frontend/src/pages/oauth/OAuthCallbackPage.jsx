import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { handleOAuthCallback } from "../../api/auth"
import { OAUTH_STATUS } from "../../constants/oauthStatus"

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code) {
      navigate("/login?error=oauth")
      return
    }

    const processOAuth = async () => {
      try {
        const result = await handleOAuthCallback(code, state)

        switch (result.status) {
          case OAUTH_STATUS.NEW_USER:
            navigate("/profile/setup")
            break

          case OAUTH_STATUS.EXISTING_USER:
            navigate("/home")
            break

          default:
            navigate("/login?error=oauth")
        }
      } catch {
        navigate("/login?error=oauth")
      }
    }

    processOAuth()
  }, [navigate, searchParams])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
      <div className="text-center">
        <p className="text-lg font-medium">
          Mattermost 계정 연동 중
        </p>
        <p className="mt-1 text-sm text-slate-400">
          인증 정보를 확인하고 있어요
        </p>
      </div>
    </div>
  )
}
