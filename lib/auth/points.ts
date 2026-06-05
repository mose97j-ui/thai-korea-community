import { findUserById, updateUser } from "@/lib/auth/storage";
import type { PointTransaction, PointTransactionType, User } from "@/lib/auth/types";
import { scheduleMemberSync } from "@/lib/auth/memberSync";

const POINTS_LEDGER_KEY = "tkc_points_ledger";
export const POST_CREATE_REWARD = 50;
export const POINTS_CHANGE_EVENT = "tkc-points-change";

function readLedger(): PointTransaction[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(POINTS_LEDGER_KEY);
    return raw ? (JSON.parse(raw) as PointTransaction[]) : [];
  } catch {
    return [];
  }
}

function writeLedger(transactions: PointTransaction[]): void {
  localStorage.setItem(POINTS_LEDGER_KEY, JSON.stringify(transactions));
}

function notifyPointsChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(POINTS_CHANGE_EVENT));
  }
}

function getSafePoints(user: User): number {
  return Number.isFinite(user.points) ? Math.max(0, Math.floor(user.points ?? 0)) : 0;
}

export function getPointTransactionsByUser(userId: string): PointTransaction[] {
  return readLedger()
    .filter((tx) => tx.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function awardPoints(params: {
  userId: string;
  amount: number;
  type: PointTransactionType;
  reason?: string;
  referenceId?: string;
}): { ok: true; user: User; transaction: PointTransaction } | { ok: false } {
  if (typeof window === "undefined") {
    return { ok: false };
  }

  const user = findUserById(params.userId);
  if (!user) {
    return { ok: false };
  }

  const amount = Math.floor(params.amount);
  if (!Number.isFinite(amount) || amount === 0) {
    return { ok: false };
  }

  const currentPoints = getSafePoints(user);
  const nextPoints = Math.max(0, currentPoints + amount);
  const updatedUser: User = {
    ...user,
    points: nextPoints,
  };
  updateUser(updatedUser);
  scheduleMemberSync(updatedUser, true);

  const transaction: PointTransaction = {
    id: crypto.randomUUID(),
    userId: user.id,
    type: params.type,
    amount,
    balanceAfter: nextPoints,
    reason: params.reason?.trim() || undefined,
    referenceId: params.referenceId?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const ledger = readLedger();
  ledger.push(transaction);
  writeLedger(ledger);
  notifyPointsChange();

  return { ok: true, user: updatedUser, transaction };
}

export function awardPostCreatePoints(
  userId: string,
  postId: string
): { ok: true } | { ok: false } {
  const duplicated = readLedger().some(
    (tx) =>
      tx.userId === userId &&
      tx.type === "post_create" &&
      tx.referenceId === postId
  );
  if (duplicated) {
    return { ok: false };
  }

  const result = awardPoints({
    userId,
    amount: POST_CREATE_REWARD,
    type: "post_create",
    reason: "Post creation reward",
    referenceId: postId,
  });
  return result.ok ? { ok: true } : { ok: false };
}

