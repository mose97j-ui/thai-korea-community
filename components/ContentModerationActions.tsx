"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import {
  applyUserRestriction,
  clearUserRestriction,
} from "@/lib/auth/moderation";
import {
  dismissReportsForTarget,
  markTargetReportsActioned,
  type ReportTargetType,
} from "@/lib/moderation/reports";
import { compactSecondaryButtonClassName } from "@/components/ui";

type ContentModerationActionsProps = {
  targetUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  compact?: boolean;
  className?: string;
};

export default function ContentModerationActions({
  targetUserId,
  targetType,
  targetId,
  compact = false,
  className = "",
}: ContentModerationActionsProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { showOperatorUI } = useOperatorView();

  if (!user || !showOperatorUI) {
    return null;
  }

  const apply = (
    scope: "write" | "comment" | "activity" | "permanent",
    durationDays: number | null,
    reason: string
  ) => {
    applyUserRestriction(targetUserId, user, {
      scope,
      durationDays,
      reason,
      source: "manual",
    });
    markTargetReportsActioned(targetType, targetId, user);
  };

  const buttonClass = compact
    ? `${compactSecondaryButtonClassName} px-2 py-2 text-[11px] sm:text-xs`
    : `${compactSecondaryButtonClassName} py-2.5 text-xs sm:text-sm`;

  return (
    <div
      className={`grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 ${className}`.trim()}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => apply("write", 7, t("report.modReasonWrite"))}
      >
        {t("report.modWrite7")}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => apply("activity", 7, t("report.modReasonActivity"))}
      >
        {t("report.modActivity7")}
      </button>
      <button
        type="button"
        className={`${buttonClass} bg-rose-600 text-white hover:bg-rose-700`}
        onClick={() => apply("permanent", null, t("report.modReasonPermanent"))}
      >
        {t("report.modPermanent")}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => clearUserRestriction(targetUserId, user)}
      >
        {t("report.modClear")}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => dismissReportsForTarget(targetType, targetId, user)}
      >
        {t("report.modDismiss")}
      </button>
    </div>
  );
}
