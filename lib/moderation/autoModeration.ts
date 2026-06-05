import {
  applyUserRestriction,
  getActiveRestriction,
} from "@/lib/auth/moderation";
import { getOperatorDefaults, isOperatorUser } from "@/lib/auth/operator";
import { findUserByGmail, findUserById } from "@/lib/auth/storage";
import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";
import {
  joinContentParts,
  scanContent,
  type ContentScanResult,
} from "./contentFilter";
import {
  AUTO_REPORT_THRESHOLD,
  countRecentReportsAgainstUser,
  countUniqueReportersForTarget,
  REPORT_CHANGE_EVENT,
  USER_REPORT_THRESHOLD,
  USER_REPORT_WINDOW_DAYS,
  type ReportTargetType,
} from "./reports";
import { recordContentViolation } from "./violations";

export type ContentValidationError =
  | "CONTENT_FILTERED"
  | "CONTENT_FILTERED_SEVERE";

export type ContentValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: ContentValidationError;
      scan: ContentScanResult;
      autoRestricted?: boolean;
    };

const AUTO_VIOLATION_LIMIT = 5;

function getOperatorAccount(): User | null {
  const defaults = getOperatorDefaults();
  return findUserByGmail(defaults.gmail) ?? findUserById(defaults.id) ?? null;
}

export function validateUserContent(
  text: string
): ContentValidationResult {
  const scan = scanContent(text);
  if (!scan.blocked) {
    return { ok: true };
  }

  return {
    ok: false,
    error:
      scan.severity === "severe"
        ? "CONTENT_FILTERED_SEVERE"
        : "CONTENT_FILTERED",
    scan,
  };
}

export function handleContentViolation(
  user: User,
  text: string,
  contentType: "post" | "comment" | "message"
): ContentValidationResult {
  if (hasOperatorPrivileges(user)) {
    return { ok: true };
  }

  const validation = validateUserContent(text);
  if (validation.ok) {
    return validation;
  }

  const violationCount = recordContentViolation(
    user.id,
    validation.scan.categories,
    contentType
  );

  let autoRestricted = false;
  if (
    violationCount >= AUTO_VIOLATION_LIMIT &&
    !getActiveRestriction(user)
  ) {
    autoRestricted = applyAutoRestriction(user.id, {
      scope: "activity",
      durationDays: 7,
      reason: "자동 필터: 부적절한 표현 누적",
      source: "auto",
    });
  } else if (
    validation.scan.severity === "severe" &&
    violationCount >= 2 &&
    !getActiveRestriction(user)
  ) {
    autoRestricted = applyAutoRestriction(user.id, {
      scope: "write",
      durationDays: 7,
      reason: "자동 필터: 심각한 부적절 표현",
      source: "auto",
    });
  }

  return { ...validation, autoRestricted };
}

export function applyAutoRestriction(
  targetUserId: string,
  input: {
    scope: "write" | "comment" | "message" | "activity" | "permanent";
    durationDays?: number | null;
    reason: string;
    source: "auto" | "report";
  }
): boolean {
  const operator = getOperatorAccount();
  const target = findUserById(targetUserId);
  if (!operator || !target || isOperatorUser(target) || getActiveRestriction(target)?.scope === "permanent") {
    return false;
  }

  const result = applyUserRestriction(targetUserId, operator, {
    scope: input.scope,
    reason: input.reason,
    durationDays: input.durationDays,
    source: input.source,
  });

  return result.ok;
}

export function evaluateReportThresholds(
  reportedUserId: string,
  targetType: ReportTargetType,
  targetId: string
): { targetAutoFlag: boolean; userAutoRestricted: boolean } {
  const uniqueReporters = countUniqueReportersForTarget(targetType, targetId);
  const recentReports = countRecentReportsAgainstUser(
    reportedUserId,
    USER_REPORT_WINDOW_DAYS
  );

  let userAutoRestricted = false;
  const reportedUser = findUserById(reportedUserId);

  if (
    recentReports >= USER_REPORT_THRESHOLD &&
    !getActiveRestriction(reportedUser)
  ) {
    userAutoRestricted = applyAutoRestriction(reportedUserId, {
      scope: "activity",
      durationDays: 7,
      reason: "회원 신고 누적 자동 활동 정지",
      source: "report",
    });
  }

  if (
    uniqueReporters >= AUTO_REPORT_THRESHOLD &&
    !userAutoRestricted &&
    !getActiveRestriction(reportedUser)
  ) {
    userAutoRestricted = applyAutoRestriction(reportedUserId, {
      scope: "write",
      durationDays: 3,
      reason: "동일 게시물 신고 누적",
      source: "report",
    });
  }

  return {
    targetAutoFlag: uniqueReporters >= AUTO_REPORT_THRESHOLD,
    userAutoRestricted,
  };
}

export function validatePostContent(
  user: User,
  fields: {
    storeName?: string;
    title?: string;
    content?: string;
    address?: string;
  }
): ContentValidationResult {
  const text = joinContentParts(
    fields.storeName,
    fields.title,
    fields.content,
    fields.address
  );
  return handleContentViolation(user, text, "post");
}

export function validateCommentContent(
  user: User,
  content: string
): ContentValidationResult {
  return handleContentViolation(user, content, "comment");
}

export function validateMessageContent(
  user: User,
  content: string
): ContentValidationResult {
  return handleContentViolation(user, content, "message");
}

export { REPORT_CHANGE_EVENT };
