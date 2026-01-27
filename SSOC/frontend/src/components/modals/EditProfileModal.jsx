import React, { useState } from "react";
import { Camera, User } from "lucide-react";
import ModalBase from "../common/ModalBase";
import { AVATAR_PRESETS } from "../../data/mockData";

export default function EditProfileModal({ user, onClose, onSave }) {
  const [nickname, setNickname] = useState(user.nickname);
  const [profileImage, setProfileImage] = useState(user.profileImage);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setProfileImage(URL.createObjectURL(f));
  };

  return (
    <ModalBase title="정보 수정" onClose={onClose} size="md" headerVariant="light">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="relative group cursor-pointer">
            <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-300" />
              )}
            </div>
            <label
              htmlFor="edit-profile-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-700"
            >
              <Camera size={14} />
            </label>
            <input id="edit-profile-upload" type="file" className="hidden" accept="image/*" onChange={onFile} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">캐릭터 선택</label>
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_PRESETS.slice(0, 5).map((src) => (
              <button
                key={src}
                onClick={() => setProfileImage(src)}
                className={[
                  "relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all",
                  profileImage === src ? "border-blue-600 scale-110 ring-2 ring-blue-100" : "border-transparent hover:border-slate-200",
                ].join(" ")}
              >
                <img src={src} alt="avatar" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700 ml-1">별칭 (Nickname)</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => { onSave({ nickname, profileImage }); onClose(); }}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          저장하기
        </button>
      </div>
    </ModalBase>
  );
}
