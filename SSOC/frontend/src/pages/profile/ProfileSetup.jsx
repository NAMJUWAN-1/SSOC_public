export default function ProfileSetup() {
  const LOGO_URL = "https://i.postimg.cc/RZbh63Gc/LOGO-total.png"

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center space-y-6">

        {/* 타이틀 */}
        <h1 className="text-slate-700 text-xl md:text-2xl font-semibold">
          프로필 설정
        </h1>

        {/* 설명 */}
        <p className="text-slate-500 text-sm md:text-base">
          서비스 이용을 위해 기본 정보를 설정해주세요
        </p>

        {/* 3단계에서 실제 폼으로 교체될 영역 */}
        <div className="mt-6 w-72 mx-auto rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-400">
          Profile Setup Form (Coming Soon)
        </div>
      </div>

      {/* 푸터 */}
      <p className="absolute bottom-8 text-slate-400 text-xs font-medium z-10">
        © 2026 SSOC. All rights reserved.
      </p>
    </div>
  )
}
