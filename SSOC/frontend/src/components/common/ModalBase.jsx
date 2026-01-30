import React from "react";
import { X } from "lucide-react";

export default function ModalBase({ title, children, onClose, size = "md", headerVariant = "dark" }) {
  const maxW =
    size === "lg" ? "max-w-3xl" :
    size === "sm" ? "max-w-sm" :
    "max-w-lg";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} overflow-hidden`}>
        <div className={`p-5 flex justify-between items-center ${headerVariant === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border-b"}`}>
          <h3 className="font-black text-lg">{title}</h3>
          {onClose && (
          <button onClick={onClose} className="opacity-80 hover:opacity-100">
            <X size={22} />
          </button>
        )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
