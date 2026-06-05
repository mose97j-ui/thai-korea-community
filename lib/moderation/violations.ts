import type { ContentFilterCategory } from "./contentFilter";

export type ViolationRecord = {
  id: string;
  userId: string;
  categories: ContentFilterCategory[];
  contentType: "post" | "comment" | "message";
  createdAt: string;
};

const VIOLATIONS_KEY = "tkc_content_violations";

function readViolations(): ViolationRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(VIOLATIONS_KEY);
    return raw ? (JSON.parse(raw) as ViolationRecord[]) : [];
  } catch {
    return [];
  }
}

function writeViolations(records: ViolationRecord[]): void {
  localStorage.setItem(VIOLATIONS_KEY, JSON.stringify(records.slice(-500)));
}

export function recordContentViolation(
  userId: string,
  categories: ContentFilterCategory[],
  contentType: ViolationRecord["contentType"]
): number {
  const records = readViolations();
  records.push({
    id: crypto.randomUUID(),
    userId,
    categories,
    contentType,
    createdAt: new Date().toISOString(),
  });
  writeViolations(records);
  return countRecentViolations(userId, 30);
}

export function countRecentViolations(userId: string, days: number): number {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return readViolations().filter(
    (item) =>
      item.userId === userId &&
      new Date(item.createdAt).getTime() >= since
  ).length;
}

export function clearViolationsByUser(userId: string): number {
  const records = readViolations();
  const remain = records.filter((item) => item.userId !== userId);
  const deleted = records.length - remain.length;
  if (deleted > 0) {
    writeViolations(remain);
  }
  return deleted;
}
