"use client";

import { useState } from "react";
import {
  ErrorMessage,
  FormField,
  SubmitButton,
  inputClassName,
  compactPillButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { evaluateReportThresholds } from "@/lib/moderation/autoModeration";
import {
  submitContentReport,
  type ReportReason,
  type ReportTargetType,
} from "@/lib/moderation/reports";
import type { MessageKey } from "@/lib/i18n/messages";

type ContentReportButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId: string;
  reportedUserNickname: string;
  contentPreview: string;
  postId?: string;
  compact?: boolean;
  className?: string;
};

const reasons: ReportReason[] = [
  "profanity",
  "sexual",
  "spam",
  "harassment",
  "other",
];

function reasonKey(reason: ReportReason): MessageKey {
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

export default function ContentReportButton({
  targetType,
  targetId,
  reportedUserId,
  reportedUserNickname,
  contentPreview,
  postId,
  compact = false,
  className = "",
}: ContentReportButtonProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("profanity");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user || user.id === reportedUserId) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const result = submitContentReport(user, {
      targetType,
      targetId,
      postId,
      reportedUserId,
      reportedUserNickname,
      contentPreview,
      reason,
      detail,
    });

    if (!result.ok) {
      setError(
        result.error === "DUPLICATE"
          ? t("report.errorDuplicate")
          : t("report.errorSelf")
      );
      return;
    }

    evaluateReportThresholds(reportedUserId, targetType, targetId);
    setSuccess(true);
    setOpen(false);
    setDetail("");
  };

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`${compactPillButtonClassName} ${
          className.includes("w-full") ? "w-full" : ""
        } ${compact ? "" : "px-4 py-2 text-sm"}`}
      >
        🚨 {t("report.report")}
      </button>

      {open && (
        <div className="mt-2 w-full min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/10">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">{t("report.reportTitle")}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={t("common.back")}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <FormField label={t("report.reason")}>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value as ReportReason)}
                className={inputClassName}
              >
                {reasons.map((item) => (
                  <option key={item} value={item}>
                    {t(reasonKey(item))}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t("report.detailOptional")}>
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                placeholder={t("report.detailPlaceholder")}
                rows={3}
                maxLength={300}
                className={`${inputClassName} min-h-[80px] resize-y`}
              />
            </FormField>
            {error && <ErrorMessage message={error} />}
            <SubmitButton>{t("report.submit")}</SubmitButton>
          </form>
        </div>
      )}

      {success && !open && (
        <p className="mt-1.5 text-xs font-semibold text-emerald-600">
          {t("report.success")}
        </p>
      )}
    </div>
  );
}
