"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  SectionLabel,
  pillSecondaryButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import ContentModerationActions from "@/components/ContentModerationActions";
import { useOperatorView } from "@/hooks/useOperatorView";
import { formatPostDate } from "@/lib/posts/format";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  getPendingReportCount,
  getPendingReports,
  type ContentReport,
  type ReportReason,
  type ReportTargetType,
  REPORT_CHANGE_EVENT,
} from "@/lib/moderation/reports";

function targetLabelKey(type: ReportTargetType): MessageKey {
  switch (type) {
    case "post":
      return "report.targetPost";
    case "comment":
      return "report.targetComment";
    default:
      return "report.targetMessage";
  }
}

function reasonLabelKey(reason: ReportReason): MessageKey {
  switch (reason) {
    case "profanity":
      return "report.reasonProfanity";
    case "sexual":
      return "report.reasonSexual";
    case "spam":
      return "report.reasonSpam";
    case "harassment":
      return "report.reasonHarassment";
    default:
      return "report.reasonOther";
  }
}

function targetHref(report: ContentReport): string {
  if (report.targetType === "post") {
    return `/p/${report.targetId}`;
  }
  if (report.postId) {
    return `/p/${report.postId}`;
  }
  return "/";
}

export default function OperatorReportsPanel() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const { showOperatorUI } = useOperatorView();
  const [reports, setReports] = useState<ContentReport[]>([]);

  const refresh = useCallback(() => {
    setReports(getPendingReports());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(REPORT_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(REPORT_CHANGE_EVENT, refresh);
  }, [refresh]);

  if (!user || !showOperatorUI) {
    return null;
  }

  const pendingCount = getPendingReportCount();

  return (
    <Card className="mb-4 border-l-4 border-l-orange-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-gray-900">{t("report.panelTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {t("report.panelDesc")}
          </p>
        </div>
        <span className="rounded-full bg-orange-100 px-3 py-1.5 text-sm font-bold text-orange-700 ring-1 ring-orange-200">
          {t("report.pendingCount").replace("{count}", String(pendingCount))}
        </span>
      </div>

      {reports.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">{t("report.noPending")}</p>
      ) : (
        <div className="mt-5 space-y-3">
          <SectionLabel>{t("report.pendingList")}</SectionLabel>
          {reports.slice(0, 8).map((report) => (
            <div
              key={report.id}
              className="rounded-2xl bg-[#F8F9FA] p-4 ring-1 ring-black/[0.04]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-black/[0.06]">
                  {t(targetLabelKey(report.targetType))}
                </span>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                  {t(reasonLabelKey(report.reason))}
                </span>
                {report.autoFlagged && (
                  <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">
                    AUTO
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm font-bold text-gray-900">
                {report.reportedUserNickname} · {report.reportedUserId.slice(0, 8)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("report.reporter")}: {report.reporterNickname} ·{" "}
                {formatPostDate(report.createdAt, locale)}
              </p>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {report.contentPreview}
              </p>
              {report.detail && (
                <p className="mt-2 text-xs text-gray-500">
                  {t("report.detailOptional")}: {report.detail}
                </p>
              )}

              <div className="mt-4 space-y-3 border-t border-black/[0.04] pt-3">
                <Link
                  href={targetHref(report)}
                  className={`inline-flex ${pillSecondaryButtonClassName}`}
                >
                  {t("report.viewContent")}
                </Link>
                <div className="rounded-xl bg-amber-50/70 px-2 py-2 ring-1 ring-amber-100/80">
                  <ContentModerationActions
                    targetUserId={report.reportedUserId}
                    targetType={report.targetType}
                    targetId={report.targetId}
                    compact
                  />
                </div>
              </div>
            </div>
          ))}

          {reports.length > 8 && (
            <p className="text-sm text-gray-500">
              {t("report.morePending").replace("{count}", String(reports.length - 8))}
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-gray-400">
        {t("report.autoNote")}
      </p>
    </Card>
  );
}
