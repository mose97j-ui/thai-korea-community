"use client";

import { useLocale } from "@/contexts/LocaleContext";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  getPlaceReviewSchema,
  getRatingLabelKey,
  type PlaceReviewData,
  type PlaceReviewPriceLevel,
} from "@/lib/posts/placeReview";

function getPriceLevelLabelKey(level: PlaceReviewPriceLevel): MessageKey {
  return `review.priceLevel.${level}` as MessageKey;
}

type PlaceReviewDisplayProps = {
  categoryId: string;
  subId: string;
  placeReview: PlaceReviewData;
  compact?: boolean;
};

function Stars({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const textSize = size === "md" ? "text-lg" : "text-sm";
  return (
    <span className={`${textSize} text-amber-400`} aria-hidden>
      {"★".repeat(Math.round(score))}
      <span className="text-gray-300">{"★".repeat(Math.max(0, 5 - Math.round(score)))}</span>
    </span>
  );
}

export default function PlaceReviewDisplay({
  categoryId,
  subId,
  placeReview,
  compact = false,
}: PlaceReviewDisplayProps) {
  const { t } = useLocale();
  const schema = getPlaceReviewSchema(categoryId, subId);

  if (!schema) {
    return null;
  }

  const priceLevelLabel = placeReview.priceLevel
    ? t(getPriceLevelLabelKey(placeReview.priceLevel))
    : null;

  const shellClass = compact
    ? "mt-3 rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100"
    : "mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-4";

  const titleClass = compact ? "text-sm font-semibold text-amber-800" : "text-sm font-semibold text-amber-800";
  const overallClass = compact ? "text-sm font-bold text-amber-700" : "text-lg font-bold text-amber-700";
  const rowClass = compact
    ? "flex items-center justify-between gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 ring-1 ring-amber-100"
    : "flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-amber-100";
  const labelClass = compact ? "text-xs text-gray-700 sm:text-sm" : "text-sm text-gray-700";
  const scoreClass = compact ? "text-xs font-semibold text-gray-600 sm:text-sm" : "text-sm font-semibold text-gray-600";

  return (
    <div className={shellClass}>
      <div className={`${compact ? "mb-2" : "mb-3"} flex flex-wrap items-center justify-between gap-2`}>
        <p className={titleClass}>{t("review.displayTitle")}</p>
        <p className={overallClass}>
          {t("review.rating.overall")} ★ {placeReview.overallScore.toFixed(1)}
        </p>
      </div>

      <div className={`grid gap-1.5 ${compact ? "sm:grid-cols-2" : "gap-2 sm:grid-cols-2"}`}>
        {placeReview.ratings.map((rating) => (
          <div key={rating.key} className={rowClass}>
            <span className={labelClass}>{t(getRatingLabelKey(rating.key))}</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Stars score={rating.score} size={compact ? "sm" : "md"} />
              <span className={scoreClass}>{rating.score}</span>
            </div>
          </div>
        ))}
      </div>

      {(placeReview.pricePerPerson || priceLevelLabel || placeReview.priceNote) && (
        <div
          className={`${
            compact ? "mt-2 space-y-1 text-xs sm:text-sm" : "mt-3 space-y-1 text-sm"
          } rounded-xl bg-white px-3 py-2.5 text-gray-700 ring-1 ring-amber-100`}
        >
          {placeReview.pricePerPerson ? (
            <p>
              <span className="font-semibold">{t("review.pricePerPerson")}: </span>
              {placeReview.pricePerPerson}
            </p>
          ) : null}
          {priceLevelLabel ? (
            <p>
              <span className="font-semibold">{t("review.priceLevelLabel")}: </span>
              {priceLevelLabel}
            </p>
          ) : null}
          {placeReview.priceNote ? (
            <p>
              <span className="font-semibold">{t("review.priceNote")}: </span>
              {placeReview.priceNote}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
