import { emitSocialChange } from "./events";
import type { MessageBlock } from "./types";

const BLOCKS_KEY = "tkc_message_blocks";

function readBlocks(): MessageBlock[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    return raw ? (JSON.parse(raw) as MessageBlock[]) : [];
  } catch {
    return [];
  }
}

function writeBlocks(blocks: MessageBlock[]): void {
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
}

export function blockUser(blockerId: string, blockedId: string): void {
  if (blockerId === blockedId) {
    return;
  }

  const blocks = readBlocks();
  if (
    blocks.some(
      (block) => block.blockerId === blockerId && block.blockedId === blockedId
    )
  ) {
    return;
  }

  blocks.push({
    blockerId,
    blockedId,
    createdAt: new Date().toISOString(),
  });
  writeBlocks(blocks);
  emitSocialChange();
}

export function unblockUser(blockerId: string, blockedId: string): void {
  const blocks = readBlocks().filter(
    (block) =>
      !(block.blockerId === blockerId && block.blockedId === blockedId)
  );
  writeBlocks(blocks);
  emitSocialChange();
}

export function isUserBlocked(blockerId: string, blockedId: string): boolean {
  return readBlocks().some(
    (block) => block.blockerId === blockerId && block.blockedId === blockedId
  );
}

export function isMessagingBlocked(userA: string, userB: string): boolean {
  return (
    isUserBlocked(userA, userB) ||
    isUserBlocked(userB, userA)
  );
}

export function getBlockedPeerIds(userId: string): string[] {
  return readBlocks()
    .filter((block) => block.blockerId === userId)
    .map((block) => block.blockedId);
}
