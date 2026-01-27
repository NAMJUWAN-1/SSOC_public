import { MOCK_BOARDS } from "../data/mockData";

export function getBoardAndChannelName(boardId, channelId) {
  if (!boardId) return { boardName: "사용자 일정", channelName: null };
  const b = MOCK_BOARDS.find((x) => x.id === boardId);
  const c = b?.channels?.find((x) => x.id === channelId);
  return {
    boardName: b?.name || "Unknown Board",
    channelName: c?.name || "Unknown Channel",
  };
}

export function findChannelName(channelId) {
  const all = MOCK_BOARDS.flatMap((b) => b.channels.map((c) => ({ ...c, boardId: b.id })));
  return all.find((x) => x.id === channelId)?.name;
}
