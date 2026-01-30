import React, { useMemo, useState } from "react";
import { AVATAR_PRESETS } from "../../data/mockData";

/**
 * (Legacy) EditProfileModal
 * - kept for future use
 * - Backend field names:
 *   - nickname
 *   - profile_image_url
 */
export default function EditProfileModal({ user, onClose, onSave }) {
  const defaultAvatar = useMemo(
    () => user?.profile_image_url || AVATAR_PRESETS[0],
    [user]
  );

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [profileImageUrl, setProfileImageUrl] = useState(defaultAvatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-4">프로필 수정</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {AVATAR_PRESETS.map((src) => (
            <button
              key={src}
              onClick={() => setProfileImageUrl(src)}
              className={[
                "w-14 h-14 rounded-xl overflow-hidden border-2 transition",
                profileImageUrl === src
                  ? "border-blue-600 scale-110 ring-2 ring-blue-100"
                  : "border-transparent hover:border-slate-200",
              ].join(" ")}
            >
              <img src={src} alt="avatar" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-100">
            취소
          </button>
          <button
            onClick={() => {
              onSave?.({ nickname, profile_image_url: profileImageUrl });
              onClose?.();
            }}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
