import type { MessageKey } from "@/lib/i18n/messages";

export type PlaceReviewRatingKey =
  | "taste"
  | "cleanliness"
  | "menu"
  | "service"
  | "value"
  | "ambiance"
  | "product"
  | "variety"
  | "location"
  | "quality"
  | "responsiveness"
  | "satisfaction"
  | "facilities"
  | "songSelection"
  | "atmosphere"
  | "music"
  | "drinks"
  | "price";

export type PlaceReviewPriceLevel = "budget" | "moderate" | "premium" | "luxury";

export type PlaceReviewRating = {
  key: PlaceReviewRatingKey;
  score: number;
};

export type PlaceReviewData = {
  schemaId: string;
  ratings: PlaceReviewRating[];
  pricePerPerson?: string;
  priceLevel?: PlaceReviewPriceLevel;
  priceNote?: string;
  overallScore: number;
};

export type PlaceReviewDimension = {
  key: PlaceReviewRatingKey;
  labelKey: MessageKey;
};

export type PlaceReviewSchema = {
  id: string;
  subId: string;
  dimensions: PlaceReviewDimension[];
};

const RESTAURANT: PlaceReviewSchema = {
  id: "restaurant",
  subId: "reviews-0",
  dimensions: [
    { key: "taste", labelKey: "review.rating.taste" },
    { key: "cleanliness", labelKey: "review.rating.cleanliness" },
    { key: "menu", labelKey: "review.rating.menu" },
    { key: "service", labelKey: "review.rating.service" },
    { key: "value", labelKey: "review.rating.value" },
  ],
};

const CAFE: PlaceReviewSchema = {
  id: "cafe",
  subId: "reviews-1",
  dimensions: [
    { key: "taste", labelKey: "review.rating.tasteDrink" },
    { key: "ambiance", labelKey: "review.rating.ambiance" },
    { key: "cleanliness", labelKey: "review.rating.cleanliness" },
    { key: "service", labelKey: "review.rating.service" },
    { key: "value", labelKey: "review.rating.value" },
  ],
};

const SHOPPING: PlaceReviewSchema = {
  id: "shopping",
  subId: "reviews-2",
  dimensions: [
    { key: "product", labelKey: "review.rating.product" },
    { key: "price", labelKey: "review.rating.price" },
    { key: "variety", labelKey: "review.rating.variety" },
    { key: "service", labelKey: "review.rating.service" },
    { key: "location", labelKey: "review.rating.location" },
  ],
};

const SERVICE: PlaceReviewSchema = {
  id: "service",
  subId: "reviews-3",
  dimensions: [
    { key: "quality", labelKey: "review.rating.quality" },
    { key: "cleanliness", labelKey: "review.rating.cleanliness" },
    { key: "responsiveness", labelKey: "review.rating.responsiveness" },
    { key: "price", labelKey: "review.rating.price" },
    { key: "satisfaction", labelKey: "review.rating.satisfaction" },
  ],
};

const KARAOKE: PlaceReviewSchema = {
  id: "karaoke",
  subId: "reviews-4",
  dimensions: [
    { key: "facilities", labelKey: "review.rating.facilities" },
    { key: "cleanliness", labelKey: "review.rating.cleanliness" },
    { key: "songSelection", labelKey: "review.rating.songSelection" },
    { key: "service", labelKey: "review.rating.service" },
    { key: "value", labelKey: "review.rating.value" },
  ],
};

const CLUB: PlaceReviewSchema = {
  id: "club",
  subId: "reviews-5",
  dimensions: [
    { key: "atmosphere", labelKey: "review.rating.atmosphere" },
    { key: "music", labelKey: "review.rating.music" },
    { key: "drinks", labelKey: "review.rating.drinks" },
    { key: "service", labelKey: "review.rating.service" },
    { key: "value", labelKey: "review.rating.value" },
  ],
};

const SCHEMA_BY_SUB_ID: Record<string, PlaceReviewSchema> = {
  [RESTAURANT.subId]: RESTAURANT,
  [CAFE.subId]: CAFE,
  [SHOPPING.subId]: SHOPPING,
  [SERVICE.subId]: SERVICE,
  [KARAOKE.subId]: KARAOKE,
  [CLUB.subId]: CLUB,
};

export const REVIEWS_CATEGORY_ID = "reviews";

export function isReviewsCategory(categoryId: string): boolean {
  return categoryId === REVIEWS_CATEGORY_ID;
}

export function getPlaceReviewSchema(
  categoryId: string,
  subId: string
): PlaceReviewSchema | null {
  if (!isReviewsCategory(categoryId)) {
    return null;
  }
  return SCHEMA_BY_SUB_ID[subId] ?? null;
}

export function createEmptyPlaceReviewRatings(
  schema: PlaceReviewSchema
): Record<PlaceReviewRatingKey, number> {
  const ratings = {} as Record<PlaceReviewRatingKey, number>;
  for (const dimension of schema.dimensions) {
    ratings[dimension.key] = 0;
  }
  return ratings;
}

export function computeOverallScore(ratings: PlaceReviewRating[]): number {
  if (ratings.length === 0) {
    return 0;
  }
  const sum = ratings.reduce((total, item) => total + item.score, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function buildPlaceReviewData(input: {
  schema: PlaceReviewSchema;
  ratings: Record<PlaceReviewRatingKey, number>;
  pricePerPerson?: string;
  priceLevel?: PlaceReviewPriceLevel;
  priceNote?: string;
}): PlaceReviewData | null {
  const ratings: PlaceReviewRating[] = [];

  for (const dimension of input.schema.dimensions) {
    const score = input.ratings[dimension.key];
    if (!score || score < 1 || score > 5) {
      return null;
    }
    ratings.push({ key: dimension.key, score });
  }

  return {
    schemaId: input.schema.id,
    ratings,
    pricePerPerson: input.pricePerPerson?.trim() || undefined,
    priceLevel: input.priceLevel,
    priceNote: input.priceNote?.trim() || undefined,
    overallScore: computeOverallScore(ratings),
  };
}

export function ratingsRecordFromPost(
  data: PlaceReviewData | undefined,
  schema: PlaceReviewSchema | null
): Record<PlaceReviewRatingKey, number> {
  if (!schema) {
    return {} as Record<PlaceReviewRatingKey, number>;
  }

  const record = createEmptyPlaceReviewRatings(schema);
  for (const rating of data?.ratings ?? []) {
    record[rating.key] = rating.score;
  }
  return record;
}

export function getRatingLabelKey(key: PlaceReviewRatingKey): MessageKey {
  const all = [
    ...RESTAURANT.dimensions,
    ...CAFE.dimensions,
    ...SHOPPING.dimensions,
    ...SERVICE.dimensions,
    ...KARAOKE.dimensions,
    ...CLUB.dimensions,
  ];
  return all.find((item) => item.key === key)?.labelKey ?? "review.rating.overall";
}
