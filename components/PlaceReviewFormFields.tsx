"use client";

import { FormField, SectionLabel, inputClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  createEmptyPlaceReviewRatings,
  getPlaceReviewSchema,
  type PlaceReviewPriceLevel,
  type PlaceReviewRatingKey,
} from "@/lib/posts/placeReview";

type PlaceReviewFormFieldsProps = {
  categoryId: string;
  subId: string;
  ratings: Record<PlaceReviewRatingKey, number>;
  onRatingChange: (key: PlaceReviewRatingKey, score: number) => void;
  pricePerPerson: string;
  onPricePerPersonChange: (value: string) => void;
  priceLevel: PlaceReviewPriceLevel | "";
  onPriceLevelChange: (value: PlaceReviewPriceLevel | "") => void;
  priceNote: string;
  onPriceNoteChange: (value: string) => void;
};

function StarRatingInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (score: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 flex-1 text-sm font-medium text-gray-800">{label}</span>
      <div className="flex shrink-0 items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`text-2xl leading-none transition ${
              score <= value ? "text-amber-400" : "text-gray-300 hover:text-amber-200"
            }`}
            aria-label={`${score}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 w-8 text-right text-sm font-semibold text-gray-600">
          {value > 0 ? value : "—"}
        </span>
      </div>
    </div>
  );
}

export default function PlaceReviewFormFields({
  categoryId,
  subId,
  ratings,
  onRatingChange,
  pricePerPerson,
  onPricePerPersonChange,
  priceLevel,
  onPriceLevelChange,
  priceNote,
  onPriceNoteChange,
}: PlaceReviewFormFieldsProps) {
  const { t } = useLocale();
  const schema = getPlaceReviewSchema(categoryId, subId);

  if (!schema) {
    return null;
  }

  const priceLevels: { value: PlaceReviewPriceLevel; labelKey: MessageKey }[] = [
    { value: "budget", labelKey: "review.priceLevel.budget" },
    { value: "moderate", labelKey: "review.priceLevel.moderate" },
    { value: "premium", labelKey: "review.priceLevel.premium" },
    { value: "luxury", labelKey: "review.priceLevel.luxury" },
  ];

  const filledCount = schema.dimensions.filter((d) => ratings[d.key] >= 1).length;
  const average =
    filledCount === schema.dimensions.length
      ? (
          schema.dimensions.reduce((sum, d) => sum + ratings[d.key], 0) /
          schema.dimensions.length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
      <div>
        <SectionLabel>{t("review.ratingsSection")}</SectionLabel>
        <p className="mt-1 text-sm text-gray-600">{t("review.ratingsHint")}</p>
        {average ? (
          <p className="mt-2 text-sm font-semibold text-amber-700">
            {t("review.rating.overall")}: ★ {average}
          </p>
        ) : null}
      </div>

      <div className="divide-y divide-amber-100 rounded-xl bg-white px-3 ring-1 ring-amber-100">
        {schema.dimensions.map((dimension) => (
          <StarRatingInput
            key={dimension.key}
            label={t(dimension.labelKey)}
            value={ratings[dimension.key] ?? 0}
            onChange={(score) => onRatingChange(dimension.key, score)}
          />
        ))}
      </div>

      <div>
        <SectionLabel>{t("review.priceSection")}</SectionLabel>
        <div className="mt-3 space-y-3">
          <FormField label={t("review.pricePerPerson")}>
            <input
              type="text"
              value={pricePerPerson}
              onChange={(event) => onPricePerPersonChange(event.target.value)}
              placeholder={t("review.pricePerPersonPlaceholder")}
              className={inputClassName}
            />
          </FormField>

          <FormField label={t("review.priceLevelLabel")}>
            <div className="flex flex-wrap gap-2">
              {priceLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() =>
                    onPriceLevelChange(priceLevel === level.value ? "" : level.value)
                  }
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    priceLevel === level.value
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t(level.labelKey)}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label={t("review.priceNote")}>
            <input
              type="text"
              value={priceNote}
              onChange={(event) => onPriceNoteChange(event.target.value)}
              placeholder={t("review.priceNotePlaceholder")}
              className={inputClassName}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}

export function createInitialReviewRatings(
  categoryId: string,
  subId: string
): Record<PlaceReviewRatingKey, number> {
  const schema = getPlaceReviewSchema(categoryId, subId);
  return schema ? createEmptyPlaceReviewRatings(schema) : ({} as Record<PlaceReviewRatingKey, number>);
}
