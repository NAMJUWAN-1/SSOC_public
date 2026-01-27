import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { setAuthenticated, setProfileCompleted } from "../../utils/auth"

const avatars = [
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
]

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])

  const handleComplete = () => {
    if (!nickname.trim()) return
    setAuthenticated()
    setProfileCompleted()
    navigate("/home", { replace: true })
  }

  return (
    /* 전체 배경 */
    <div
      className="
        min-h-screen flex items-center justify-center px-4
        bg-gradient-to-br
        from-[#4F467F]/5
        via-white
        to-[#4F467F]/10
      "
    >
      {/* 메인 카드 */}
      <div
        className="
          w-full max-w-md
          rounded-[28px]
          bg-gradient-to-b from-white to-[#4F467F]/5
          border border-[#4F467F]/15
          shadow-sm
          px-10 py-12
        "
      >
        {/* 타이틀 */}
        <h1 className="text-2xl font-semibold text-center text-slate-800">
          프로필 설정
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          SSOC에서 사용할 프로필을 선택해주세요.
        </p>

        {/* 대표 아바타 */}
        <div className="mt-10 flex justify-center">
          <div
            className="
              w-36 h-36 rounded-full
              bg-gradient-to-b from-white to-[#4F467F]/5
              border border-[#4F467F]/20
              flex items-center justify-center
            "
          >
            <img
              src={selectedAvatar}
              alt="선택된 아바타"
              className="w-28 h-28 rounded-full object-cover"
            />
          </div>
        </div>

        {/* 캐릭터 선택 영역 */}
        <div
          className="
            mt-6 rounded-2xl
            bg-white/70
            border border-[#4F467F]/10
            px-5 py-4
          "
        >
          <p className="mb-4 text-sm font-medium text-slate-600">
            캐릭터 선택
          </p>

          <div className="flex justify-between gap-3">
            {avatars.map((avatar) => {
              const selected = avatar === selectedAvatar

              return (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`
                    w-16 h-16 rounded-full
                    flex items-center justify-center
                    transition transition-all
                    duration-150
                    ease-out
                    hover:scale-120
                    ${
                      selected
                        ? "ring-2 ring-[#4F467F]/40 border border-[#4F467F]/60"
                        : "border border-transparent hover:ring-2 hover:ring-[#4F467F]/25"
                    }
                  `}
                >
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-15 h-15 rounded-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* 닉네임 입력 */}
        <div className="mt-10">
          <label className="block mb-2 text-sm font-medium text-slate-600">
            닉네임 (Nickname)
          </label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력해주세요"
            className="
              w-full rounded-xl
              border border-slate-200
              bg-white
              px-4 py-3
              text-slate-700
              placeholder-slate-400
              focus:outline-none
              focus:ring-2 focus:ring-[#4F467F]/40
              transition-all
              duration-150
              ease-out
              hover:scale-105
            "
          />
        </div>

        {/* CTA 버튼 */}
        <button
          onClick={handleComplete}
          disabled={!nickname.trim()}
          className="
            mt-10 w-full
            rounded-xl
            bg-[#4F467F]/90
            py-3
            text-white
            font-semibold
            shadow-[0_8px_24px_rgba(79,70,127,0.25)]
            hover:bg-[#4F467F]
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition-all
            duration-150
            ease-out
            hover:scale-105
            active:scale-95
            active:opacity-90
          "
        >
          설정 완료 및 시작
        </button>
      </div>
    </div>
  )
}