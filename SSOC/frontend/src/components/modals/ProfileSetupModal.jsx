import React, { useMemo, useState } from "react";
import { Check, Upload, User, X } from "lucide-react";
import { AVATAR_PRESETS } from "../../data/mockData";

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function clampNickname(s) {
  return String(s ?? "").slice(0, 20);
}

/**
 * ProfileSetupModal
 * - force: true이면 닫기(X)/취소를 숨기고 설정 완료를 유도
 * - user: 기존 프로필 값을 초기값으로 사용
 *
 * Backend field names:
 * - nickname
 * - profile_image_url
 */
export default function ProfileSetupModal({ user, force = false, onClose, onSubmit }) {
  const defaultNickname = useMemo(() => {
    return (
      user?.nickname ||
      user?.name ||
      user?.username ||
      (typeof user?.email === "string" ? user.email.split("@")[0] : "") ||
      ""
    );
  }, [user]);

  const defaultAvatar = useMemo(() => user?.profile_image_url || AVATAR_PRESETS[0], [user]);

  const submitLabel = force ? "설정 완료 및 시작" : "새 프로필 저장하기";

  const [nickname, setNickname] = useState(clampNickname(defaultNickname));
  const [profileImageUrl, setProfileImageUrl] = useState(defaultAvatar);

  const presets = useMemo(() => {
    const arr = Array.isArray(AVATAR_PRESETS) ? AVATAR_PRESETS.filter(Boolean) : [];
    return arr.slice(0, 4);
  }, []);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // simple guard (2MB)
    if (f.size > 2 * 1024 * 1024) {
      alert("이미지 파일이 너무 큽니다. (2MB 이하 권장)");
      return;
    }

    try {
      const dataUrl = await readAsDataURL(f);
      setProfileImageUrl(dataUrl);
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  const handleSubmit = () => {
    const nn = (nickname || "").trim();
    if (!nn) return alert("닉네임을 입력해주세요.");
    if (nn.length > 20) return alert("닉네임은 최대 20자까지 가능합니다.");
    onSubmit?.({ nickname: nn, profile_image_url: profileImageUrl });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-6xl bg-white rounded-[2.75rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-start justify-between px-6 md:px-10 pt-8 md:pt-10">
          <div className="flex items-center gap-4">
            <span className="w-2 h-10 bg-amber-400 rounded-full shadow shadow-amber-200" />
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">프로필</h2>
          </div>

          {!force && (
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              aria-label="close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="px-6 md:px-10 pb-10 pt-6 md:pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* left: avatar */}
            <section className="bg-slate-50 rounded-[2rem] p-6 md:p-8 border border-slate-100">
              <div className="flex justify-center">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white shadow-lg overflow-hidden border-4 border-white">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User size={48} />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-black text-slate-700">프로필 선택</p>

                <div className="mt-5 flex flex-wrap items-center gap-5">
                  {presets.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setProfileImageUrl(src)}
                      className={
                        "relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden transition-all bg-white " +
                        (profileImageUrl === src
                          ? "ring-2 ring-amber-400 shadow-lg scale-[1.02]"
                          : "border border-slate-200 hover:bg-slate-50")
                      }
                    >
                      <img src={src} alt="avatar" className="w-full h-full object-cover" />
                      {profileImageUrl === src && (
                        <div className="absolute inset-0 bg-amber-400/10 flex items-center justify-center">
                          <div className="bg-amber-500 text-white p-1 rounded-full">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}

                  <label
                    htmlFor="profile-upload-tile"
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-dashed border-amber-400 bg-white hover:bg-amber-50 cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-700"
                  >
                    <Upload size={20} />
                    <span className="text-xs font-black">직접 업로드</span>
                  </label>
                  <input
                    id="profile-upload-tile"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onFile}
                  />
                </div>
              </div>
            </section>

            {/* right: nickname + actions */}
            <section className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
              <p className="text-sm font-black text-slate-700">닉네임 설정</p>
              <div className="mt-4">
                <input
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => setNickname(clampNickname(e.target.value))}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="mt-2 text-xs font-semibold text-slate-400">* 닉네임은 최대 20자까지 가능합니다.</p>
              </div>

              <div className="mt-10 flex gap-4">
                {!force && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black hover:bg-slate-50"
                  >
                    취소
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={
                    (force ? "w-full" : "flex-1") +
                    " py-4 rounded-2xl bg-slate-900 text-white font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.99]"
                  }
                >
                  {submitLabel}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
