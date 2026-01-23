import { ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export default function Login() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    if (isLoading) return
    setIsLoading(true)
    navigate("/splash", { replace: true })
  }

  const LOGO_URL = "https://i.postimg.cc/RZbh63Gc/LOGO-total.png"

  return (
    <div
      className="
        h-screen flex items-center justify-center
        bg-gradient-to-br
        from-[#4F467F]/5
        via-white
        to-[#4F467F]/10
      "
    >
      <div className="text-center space-y-6">
        {/* 로고 */}
        <div className="w-70 h-70 flex items-center justify-center mx-auto">
          <img
            src={LOGO_URL}
            alt="SSOC Logo"
            className="w-full h-full transition-all hover:scale-105 object-contain drop-shadow-sm"
          />
        </div>

        {/* 슬로건 */}
        <p className="text-slate-500 text-lg md:text-xl font-medium">
          싸피인들을 위한 스마트한 공지 관리 솔루션
        </p>

        {/* 🔥 로그인 버튼 (ProfileSetup 버튼과 완전 동일 테마) */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="
            mt-8
            px-8 py-3
            rounded-xl
            bg-[#4F467F]/90
            text-white
            font-semibold
            inline-flex items-center justify-center gap-2
            cursor-pointer
            shadow-[0_8px_24px_rgba(79,70,127,0.25)]
            hover:bg-[#4F467F]
            transition-all
            disabled:opacity-50
            disabled:cursor-not-allowed
            duration-150
            ease-out
            hover:scale-105
            active:scale-95
            active:opacity-90
          "
        > 
          Mattermost 계정으로 시작하기
          <ExternalLink size={18} />
        </button>
      </div>

      {/* 푸터 */}
      <p className="absolute bottom-8 text-slate-400 text-xs font-medium">
        © 2026 SSOC. All rights reserved.
      </p>
    </div>
  )
}
