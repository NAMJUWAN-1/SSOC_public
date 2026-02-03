/**
 * Mattermost permalink helper
 *
 * Requirement:
 *   https://meeting.ssafy.com/${mm_board_id}/pl/${post_mm_id}
 *
 * Notes
 * - Backend / DB field names can vary (mm_post_id vs post_mm_id, channel_id vs mm_channel_id, etc.)
 * - Some payloads also include channel_id; we prioritize mm_board_id for the first path segment.
 */

const DEFAULT_BASE = "https://meeting.ssafy.com";

function normalizeBase(base) {
  const b = String(base || DEFAULT_BASE).trim();
  return b.replace(/\/$/, "");
}

function firstDefined(...vals) {
  for (const v of vals) {
    if (v === 0) return 0;
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

/**
 * Build a permalink.
 *
 * Accepted key aliases:
 * - channelId, channel_id, mm_channel_id
 * - mmPostId, mm_post_id, post_mm_id
 * - legacy: boardId, mm_board_id (as fallback for channel id)
 */
export function buildMattermostPermalink({
  base,
  channelId,
  channel_id,
  mm_channel_id,
  mmChannelId,
  // legacy fallbacks
  boardId,
  board_id,
  mm_board_id,
  mmBoardId,
  // post id
  mmPostId,
  mm_post_id,
  post_mm_id,
  postMmId,
}) {
  const b = normalizeBase(base);
  const seg = firstDefined(mm_board_id, mmBoardId, boardId, board_id, channelId, channel_id, mm_channel_id, mmChannelId);
  const pid = firstDefined(mmPostId, mm_post_id, post_mm_id, postMmId);
  if (!seg || !pid) return null;
  return `${b}/${encodeURIComponent(String(seg))}/pl/${encodeURIComponent(String(pid))}`;
}

/**
 * Robustly derive a Mattermost link from any post-like / event-like payload.
 */
export function getMattermostLink(obj) {
  if (!obj) return null;

  const segmentId = firstDefined(
    // Prefer mm_board_id (SSAFY meeting permalink uses board segment)
    obj.mm_board_id,
    obj.board?.mm_board_id,
    obj.channel?.board?.mm_board_id,
    obj.mmBoardId,
    obj.board_id,
    obj.boardId,
    // fallback
    obj.channel_id,
    obj.channelId,
    obj.mm_channel_id,
    obj.mmChannelId
  );

  const mmPostId = firstDefined(
    obj.post_mm_id,
    obj.postMmId,
    obj.mm_post_id,
    obj.mmPostId,
    obj.mm_postid,
    obj.mm_postId
  );

  return buildMattermostPermalink({ mm_board_id: segmentId, post_mm_id: mmPostId });
}
