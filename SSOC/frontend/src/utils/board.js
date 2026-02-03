import { BOARDS_CONFIG } from "../data/constants";

export function getBoardAndChannelName(boardId, channelId) {
  if (!boardId) return { boardName: "사용자 일정", channelName: null };
  const b = BOARDS_CONFIG.find((x) => x.id === boardId);
  const c = b?.channels?.find((x) => x.id === channelId);
  return {
    boardName: b?.name || "Unknown Board",
    channelName: c?.name || "Unknown Channel",
  };
}

export function findChannelName(channelId) {
  const all = BOARDS_CONFIG.flatMap((b) => b.channels.map((c) => ({ ...c, boardId: b.id })));
  return all.find((x) => x.id === channelId)?.name;
}
