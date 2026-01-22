import { ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export default function Login() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    if (isLoading) return
    setIsLoading(true)

    // BE 연동 전: Splash로 이동
    navigate("/splash")
  }

  const LOGO_URL = "https://i.postimg.cc/RZbh63Gc/LOGO-total.png"

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6">
        {/* 로고 */}
        <div className="w-70 h-70 flex items-center justify-center mx-auto hover:scale-105 transition-transform duration-500">
          <img
            src={LOGO_URL}
            alt="SSOC Logo"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>

        {/* 슬로건 */}
        <p className="text-slate-500 text-lg md:text-xl font-medium">
          싸피인들을 위한 스마트한 공지 관리 솔루션
        </p>

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          className="px-6 py-3 rounded bg-indigo-600 text-white cursor-pointer hover:scale-102 transition-transform active:scale-95
                     hover:bg-indigo-700 transition inline-flex items-center gap-2 whitespace-nowrap"
        >
          Mattermost 계정으로 시작하기<ExternalLink size={18} />
        </button>
      </div>

      {/* 푸터 */}
      <p className="absolute bottom-8 text-slate-400 text-xs font-medium z-10">
        © 2026 SSOC. All rights reserved.
      </p>
    </div>
  )
}
