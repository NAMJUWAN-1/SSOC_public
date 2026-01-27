import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import symbolLogo from "../assets/LOGO_logo.png"
import textLogo from "../assets/LOGO_name.png"

export default function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/oauth/callback", { replace: true })
    }, 2000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      className="
        w-screen h-screen
        flex flex-col items-center justify-center
        relative overflow-hidden
        bg-gradient-to-br
        from-[#4F467F]/5
        via-white
        to-[#4F467F]/10
      "
    >
      <div className="z-10 flex flex-col items-center">
        <img
          src={symbolLogo}
          alt="SSOC Symbol Logo"
          className="symbol-logo"
        />
        <img
          src={textLogo}
          alt="SSOC Text Logo"
          className="text-logo"
        />
        <p className="mt-6 text-slate-400 text-xs sm:text-sm md:text-base tracking-wide animate-pulse">
          Mattermost 계정과 연동 중입니다
        </p>
      </div>

      {/* 푸터 */}
      <p className="absolute bottom-8 text-slate-400 text-xs font-medium z-10">
        © 2026 SSOC. All rights reserved.
      </p>

      {/* 기존 애니메이션 그대로 */}
      <style>
        {`
          .symbol-logo,
          .text-logo {
            opacity: 0;
            transform: scale(0.96);
            will-change: opacity, transform;
          }

          .symbol-logo {
            width: 210px;
            animation: fadeLoop 1.4s ease-in-out infinite;
          }

          .text-logo {
            margin-top: 22px;
            width: 300px;
            animation: fadeLoop 1.4s ease-in-out infinite;
            animation-delay: 0.25s;
          }

          @keyframes fadeLoop {
            0% {
              opacity: 0;
              transform: scale(0.96);
            }
            30% {
              opacity: 1;
              transform: scale(1);
            }
            60% {
              opacity: 1;
              transform: scale(1);
            }
            80% {
              opacity: 0;
              transform: scale(0.96);
            }
            100% {
              opacity: 0;
              transform: scale(0.96);
            }
          }
        `}
      </style>
    </div>
  )
}
