/**
 * Event color utilities
 * - color: hex string like "#3b82f6"
 */

export const CATEGORY_COLOR_MAP = {
  "시험": "#a855f7",   // purple-500
  "과제": "#ef4444",   // red-500
  "특강": "#6366f1",   // indigo-500
  "취업": "#3b82f6",   // blue-500
  "행사": "#10b981",   // emerald-500
  "기타": "#64748b",   // slate-500
};

export const EVENT_COLOR_PRESETS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export function getDefaultColorForCategory(category) {
  if (!category) return CATEGORY_COLOR_MAP["기타"];
  return CATEGORY_COLOR_MAP[category] || CATEGORY_COLOR_MAP["기타"];
}

function hexToRgb(hex) {
  if (!hex) return null;
  const h = String(hex).trim();
  const m = /^#?([0-9a-fA-F]{6})$/.exec(h);
  if (!m) return null;
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return { r, g, b };
}

/**
 * Make inline style for calendar chips
 * - We keep Tailwind layout classes, but set dynamic colors via style.
 */
export function makeChipStyle(colorHex, opts = {}) {
  const rgb = hexToRgb(colorHex);
  if (!rgb) return undefined;

  const { r, g, b } = rgb;
  const alpha = opts.alpha ?? 0.18;

  const style = {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    color: `rgb(${r}, ${g}, ${b})`,
  };

  if (opts.accentLeft) {
    style.borderLeft = `3px solid rgb(${r}, ${g}, ${b})`;
  }
  if (opts.accentRight) {
    style.borderRight = `3px solid rgb(${r}, ${g}, ${b})`;
  }

  return style;
}
