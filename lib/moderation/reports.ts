import { findUserById } from "@/lib/auth/storage";
import { isOperatorUser } from "@/lib/auth/operator";
import type { User } from "@/lib/auth/types";

export type ReportTargetType = "post" | "comment" | "message";

export type ReportReason =
  | "profanity"
  | "sexual"
  | "spam"
  | "harassment"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export type ContentReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  postId?: string;
  reportedUserId: string;
  reportedUserNickname: string;
  reporterId: string;
  reporterNickname: string;
  reason: ReportReason;
  detail?: string;
  contentPreview: string;
  status: ReportStatus;
  autoFlagged?: boolean;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type SubmitReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  postId?: string;
  reportedUserId: string;
  reportedUserNickname: string;
  contentPreview: string;
  reason: ReportReason;
  detail?: string;
};

export const REPORT_CHANGE_EVENT = "tkc-report-change";

export const AUTO_REPORT_THRESHOLD = 3;
export const USER_REPORT_WINDOW_DAYS = 7;
export const USER_REPORT_THRESHOLD = 5;

function notifyReportChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REPORT_CHANGE_EVENT));
  }
}

function readReports(): ContentReport[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem("tkc_content_reports");
    return raw ? (JSON.parse(raw) as ContentReport[]) : [];
  } catch {
    return [];
  }
}

function writeReports(reports: ContentReport[]): void {
  localStorage.setItem("tkc_content_reports", JSON.stringify(reports));
  notifyReportChange();
}

export function submitContentReport(
  reporter: User,
  input: SubmitReportInput
):
  | { ok: true; report: ContentReport; autoFlagged: boolean }
  | { ok: false; error: "SELF" | "DUPLICATE" | "OPERATOR" } {
  if (reporter.id === input.reportedUserId) {
    return { ok: false, error: "SELF" };
  }

  const reports = readReports();
  const duplicate = reports.some(
    (item) =>
      item.reporterId === reporter.id &&
      item.targetType === input.targetType &&
      item.targetId === input.targetId &&
      item.status !== "dismissed"
  );
  if (duplicate) {
    return { ok: false, error: "DUPLICATE" };
  }

  const report: ContentReport = {
    id: crypto.randomUUID(),
    targetType: input.targetType,
    targetId: input.targetId,
    postId: input.postId,
    reportedUserId: input.reportedUserId,
    reportedUserNickname: input.reportedUserNickname,
    reporterId: reporter.id,
    reporterNickname: reporter.nickname || reporter.name,
    reason: input.reason,
    detail: input.detail?.trim() || undefined,
    contentPreview: input.contentPreview.slice(0, 300),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const uniqueReporters = new Set(
    reports
      .filter(
        (item) =>
          item.targetType === input.targetType &&
          item.targetId === input.targetId &&
          item.status !== "dismissed"
      )
      .map((item) => item.reporterId)
  );
  uniqueReporters.add(reporter.id);

  if (uniqueReporters.size >= AUTO_REPORT_THRESHOLD) {
    report.autoFlagged = true;
  }

  reports.push(report);
  writeReports(reports);

  return {
    ok: true,
    report,
    autoFlagged: Boolean(report.autoFlagged),
  };
}

export function getPendingReports(): ContentReport[] {
  return readReports()
    .filter((item) => item.status === "pending")
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getReportsForTarget(
  targetType: ReportTargetType,
  targetId: string
): ContentReport[] {
  return readReports().filter(
    (item) => item.targetType === targetType && item.targetId === targetId
  );
}

export function countUniqueReportersForTarget(
  targetType: ReportTargetType,
  targetId: string
): number {
  return new Set(
    readReports()
      .filter(
        (item) =>
          item.targetType === targetType &&
          item.targetId === targetId &&
          item.status !== "dismissed"
      )
      .map((item) => item.reporterId)
  ).size;
}

export function countRecentReportsAgainstUser(userId: string, days: number): number {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return readReports().filter(
    (item) =>
      item.reportedUserId === userId &&
      item.status !== "dismissed" &&
      new Date(item.createdAt).getTime() >= since
  ).length;
}

export function getPendingReportCount(): number {
  return getPendingReports().length;
}

export function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  operator: User
): ContentReport | null {
  if (!isOperatorUser(operator)) {
    return null;
  }

  const reports = readReports();
  const index = reports.findIndex((item) => item.id === reportId);
  if (index === -1) {
    return null;
  }

  reports[index] = {
    ...reports[index],
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy: operator.id,
  };
  writeReports(reports);
  return reports[index];
}

export function dismissReportsForTarget(
  targetType: ReportTargetType,
  targetId: string,
  operator: User
): void {
  if (!isOperatorUser(operator)) {
    return;
  }

  const reports = readReports();
  let changed = false;
  const now = new Date().toISOString();

  for (let index = 0; index < reports.length; index += 1) {
    const item = reports[index];
    if (
      item.targetType === targetType &&
      item.targetId === targetId &&
      item.status === "pending"
    ) {
      reports[index] = {
        ...item,
        status: "dismissed",
        reviewedAt: now,
        reviewedBy: operator.id,
      };
      changed = true;
    }
  }

  if (changed) {
    writeReports(reports);
  }
}

export function markTargetReportsActioned(
  targetType: ReportTargetType,
  targetId: string,
  operator: User
): void {
  if (!isOperatorUser(operator)) {
    return;
  }

  const reports = readReports();
  let changed = false;
  const now = new Date().toISOString();

  for (let index = 0; index < reports.length; index += 1) {
    const item = reports[index];
    if (
      item.targetType === targetType &&
      item.targetId === targetId &&
      item.status === "pending"
    ) {
      reports[index] = {
        ...item,
        status: "actioned",
        reviewedAt: now,
        reviewedBy: operator.id,
      };
      changed = true;
    }
  }

  if (changed) {
    writeReports(reports);
  }
}

export function getReportById(reportId: string): ContentReport | null {
  return readReports().find((item) => item.id === reportId) ?? null;
}

export function getReportedUser(userId: string): User | null {
  return findUserById(userId) ?? null;
}
