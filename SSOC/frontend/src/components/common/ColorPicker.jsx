import React from "react";

export default function ColorPicker({ value, onChange, colors = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => {
        const active = String(value || "").toLowerCase() === String(c || "").toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange?.(c)}
            className={[
              "w-9 h-9 rounded-full border transition-all flex items-center justify-center",
              active ? "border-slate-900 ring-2 ring-slate-200 scale-105" : "border-slate-200 hover:scale-105",
            ].join(" ")}
            aria-label={`color-${c}`}
          >
            <span
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: c }}
            />
          </button>
        );
      })}
    </div>
  );
}
