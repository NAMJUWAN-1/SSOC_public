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

  // 1. Try fields that might hold a full link
  const direct = firstNonEmpty(
    obj.mm_link,
    obj.mmLink,
    obj.mattermost_link,
    obj.mattermostLink,
    obj.mm_post_url,
    obj.mmPostUrl,
    obj.mm_post_permalink,
    obj.mmPostPermalink,
    obj.mm_post_link,
    obj.mmPostLink,
    obj.permalink,
    obj.link,
    obj.url
  );
  const absoluteDirect = ensureAbsolute(direct);
  if (absoluteDirect && absoluteDirect.includes("meeting.ssafy.com")) return absoluteDirect;

  // 2. Try building from ids with exhaustive field name checks
  const boardId = firstNonEmpty(
    obj.mm_board_id,
    obj.mmBoardId,
    obj.board?.mm_board_id,
    obj.board?.mmBoardId,
    obj.board_id,
    obj.boardId,
    obj.board?.board_id,
    obj.board?.boardId,
    obj.board?.id,
    obj.team_id,
    obj.teamId,
    obj.mm_team_id,
    obj.mmTeamId,
    typeof obj.board === "string" ? obj.board : null
  );

  const mmPostId = firstNonEmpty(
    obj.mm_post_id,
    obj.mmPostId,
    obj.mattermost_post_id,
    obj.mattermostPostId,
    obj.post_mm_id,
    obj.postMmId,
    obj.mm_postid,
    obj.mmPostid,
    obj.post_id, // Last resort if internal ID is used as MM ID
    obj.id
  );

  const computed = buildMattermostPermalink({ boardId, mmPostId });

  // Prefer computed (ID-based) if valid meeting.ssafy link; else use direct absolute link
  return computed || absoluteDirect;
}
