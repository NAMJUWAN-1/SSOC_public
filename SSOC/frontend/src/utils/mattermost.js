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


export function buildMattermostPermalink({
  base,
  channelId,
  channel_id,
  mm_channel_id,
  mmChannelId,
  boardId,
  board_id,
  mm_board_id,
  mmBoardId,
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


export function getMattermostLink(obj) {
  if (!obj) return null;

  const segmentId = firstDefined(
    obj.mm_board_id,
    obj.board?.mm_board_id,
    obj.channel?.board?.mm_board_id,
    obj.mmBoardId,
    obj.board_id,
    obj.boardId,
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
