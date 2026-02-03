export const CATEGORY_COLOR_MAP = {
  "시험": "#a855f7",   // purple-500
  "과제": "#ef4444",   // red-500
  "특강": "#6366f1",   // indigo-500
  "취업": "#3b82f6",   // blue-500
  "행사": "#1E325C",   // Denim
  "기타": "#64748b",   // slate-500
};

export const EVENT_COLORS = [
  "#FF3B30", // System Red 
  "#FF9500", // System Orange
  "#FFCC00", // System Yellow
  "#34C759", // System Green
  "#00C7BE", // System Mint
  "#007AFF", // System Blue
  "#5856D6", // System Indigo
  "#8E8E93", // System Gray
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


export function makeChipStyle(colorHex, opts = {}) {
  const rgb = hexToRgb(colorHex);
  if (!rgb) return undefined;

  const { r, g, b } = rgb;
  const alpha = opts.alpha ?? 0.18;

  const br = Math.floor(r * alpha + 255 * (1 - alpha));
  const bg = Math.floor(g * alpha + 255 * (1 - alpha));
  const bb = Math.floor(b * alpha + 255 * (1 - alpha));

  const darkR = Math.floor(r * 0.5);
  const darkG = Math.floor(g * 0.5);
  const darkB = Math.floor(b * 0.5);

  const style = {
    backgroundColor: `rgb(${br}, ${bg}, ${bb})`,
    color: `rgb(${darkR}, ${darkG}, ${darkB})`,
    fontWeight: "700",
  };

  if (opts.accentLeft) {
    style.borderLeft = `3px solid rgb(${r}, ${g}, ${b})`;
  }
  if (opts.accentRight) {
    style.borderRight = `3px solid rgb(${r}, ${g}, ${b})`;
  }

  return style;
}
