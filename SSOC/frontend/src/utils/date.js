export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toInputValue(dateOrIso) {
  if (!dateOrIso) return "";
  const d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  return (
    d.getFullYear() +
    "-" + pad2(d.getMonth() + 1) +
    "-" + pad2(d.getDate()) +
    "T" + pad2(d.getHours()) +
    ":" + pad2(d.getMinutes())
  );
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function startOfDay(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function durationMs(startAt, endAt) {
  const s = new Date(startAt).getTime();
  const e = new Date(endAt || startAt).getTime();
  return Math.max(0, e - s);
}
