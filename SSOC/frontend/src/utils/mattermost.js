// src/utils/mattermost.js
// SSAFY Mattermost permalink helper
// Expected format: https://meeting.ssafy.com/{board_id}/pl/{mm_post_id}

const MM_BASE = "https://meeting.ssafy.com";

function cleanId(v) {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  // strip possible prefixes
  s = s.replace(/^\/pl\//, "").replace(/^pl\//, "");
  return s || null;
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function ensureAbsolute(...urls) {
  const s = firstNonEmpty(...urls);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${MM_BASE}${s}`;
  // Sometimes backend may send a path without a leading slash: {board_id}/pl/{post_id}
  if (/^[^/]+\/pl\//i.test(s)) return `${MM_BASE}/${s}`;
  return null;
}

export function buildMattermostPermalink({ boardId, mmPostId }) {
  const b = cleanId(boardId);
  const p = cleanId(mmPostId);
  if (!b || !p) return null;
  return `${MM_BASE}/${b}/pl/${p}`;
}

/**
 * getMattermostLink(obj)
 * - Prefer building from ids when available.
 * - Otherwise fall back to provided URL-like fields.
 */
export function getMattermostLink(obj) {
  if (!obj) return null;

  const direct = ensureAbsolute(
    obj.mm_post_url,
    obj.mm_post_permalink,
    obj.mm_post_link,
    obj.mmLink,
    obj.mm_link,
    obj.mattermost_link,
    obj.link,
    obj.url
  );

  const boardId = firstNonEmpty(
    obj.board_id,
    obj.boardId,
    obj.board?.board_id,
    obj.board?.boardId,
    obj.board?.id,
    typeof obj.board === "string" ? obj.board : null
  );

  const mmPostId = firstNonEmpty(
    obj.mm_post_id,
    obj.mmPostId,
    obj.mattermost_post_id,
    obj.post_mm_id,
    obj.mm_postid
  );

  const computed = buildMattermostPermalink({ boardId, mmPostId });

  // If backend already provides a correct meeting.ssafy permalink, keep it.
  if (direct && /meeting\.ssafy\.com\/.+\/pl\//i.test(direct)) return direct;

  // Prefer computed when possible; else use direct
  return computed || direct;
}
