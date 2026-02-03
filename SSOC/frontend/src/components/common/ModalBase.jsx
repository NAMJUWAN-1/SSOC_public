import React from "react";
import { X } from "lucide-react";

export default function ModalBase({
  title,
  children,
  onClose,
  size = "md",
  headerVariant = "dark",
  headerActions,
  bodyClassName,
}) {
  const maxW =
    size === "lg" ? "max-w-3xl" :
      size === "sm" ? "max-w-sm" :
        "max-w-lg";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-apple-fade">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} overflow-hidden animate-apple-modal max-h-[90vh] flex flex-col`}>
        <div className={`p-5 flex justify-between items-start ${headerVariant === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border-b"}`}>
          <div className="flex-1 min-w-0 pr-4">
            {React.isValidElement(title) ? title : <h3 className="font-black text-lg text-left">{title}</h3>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            {onClose && (
              <button onClick={onClose} className="opacity-80 hover:opacity-100 p-1 rounded-full hover:bg-black/5 transition-colors">
                <X size={22} />
              </button>
            )}
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${bodyClassName ?? "p-6"}`}>{children}</div>
      </div>
    </div>
  );
}
