"use client";

import { useOperatorView } from "@/hooks/useOperatorView";
import { useLocale } from "@/contexts/LocaleContext";

export default function OperatorModeBar() {
  const { t } = useLocale();
  const {
    isOperator,
    viewAsUser,
    showOperatorUI,
    enterOperatorMode,
    enterMemberPreviewMode,
  } = useOperatorView();

  if (!isOperator) {
    return null;
  }

  return (
    <div
      className={`sticky top-2 z-40 mb-4 rounded-2xl border px-3 py-3 shadow-sm sm:px-4 ${
        viewAsUser
          ? "border-amber-200 bg-amber-50/95 ring-1 ring-amber-100"
          : "border-[#06C755]/25 bg-white/95 ring-1 ring-[#06C755]/15"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            className={`text-ui-title text-sm ${
              viewAsUser ? "text-amber-900" : "text-[#06C755]"
            }`}
          >
            {showOperatorUI
              ? t("operator.modeOperatorActive")
              : t("operator.modeMemberActive")}
          </p>
          <p className="text-ui-caption mt-1">
            {showOperatorUI
              ? t("operator.modeOperatorDesc")
              : t("operator.modeMemberDesc")}
          </p>
        </div>

        <div
          className="flex shrink-0 rounded-full bg-[#F0F2F5] p-1 ring-1 ring-black/[0.06]"
          role="tablist"
          aria-label={t("operator.modeSwitchLabel")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={showOperatorUI}
            onClick={enterOperatorMode}
            className={`text-ui-btn rounded-full px-4 py-2 text-sm transition sm:px-5 ${
              showOperatorUI
                ? "bg-[#06C755] text-white shadow-sm"
                : "text-[#65676B] hover:text-[#050505]"
            }`}
          >
            {t("operator.modeOperator")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewAsUser}
            onClick={enterMemberPreviewMode}
            className={`text-ui-btn rounded-full px-4 py-2 text-sm transition sm:px-5 ${
              viewAsUser
                ? "bg-amber-500 text-white shadow-sm"
                : "text-[#65676B] hover:text-[#050505]"
            }`}
          >
            {t("operator.modeMemberPreview")}
          </button>
        </div>
      </div>
    </div>
  );
}
