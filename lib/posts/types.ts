import type { Locale } from "@/lib/i18n/types";
import type { PlaceReviewData } from "@/lib/posts/placeReview";

export type PostLocalizedText = {
  storeName: string;
  title: string;
  content: string;
  address: string;
};

export type Post = {
  id: string;
  categoryId: string;
  subId: string;
  storeName: string;
  address: string;
  addressKey: string;
  roadAddress?: string;
  jibunAddress?: string;
  displayAddress?: string;
  mapLat?: number;
  mapLng?: number;
  authorId: string;
  authorNickname: string;
  authorProfileImage?: string;
  title: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  sourceLocale?: Locale;
  localized?: Partial<Record<Locale, PostLocalizedText>>;
  isSecret?: boolean;
  secretPasswordHash?: string;
  isHiddenByAuthor?: boolean;
  placeReview?: PlaceReviewData;
  createdAt: string;
};

export type CreatePostInput = {
  categoryId: string;
  subId: string;
  storeName: string;
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  displayAddress?: string;
  mapLat?: number;
  mapLng?: number;
  authorId: string;
  authorNickname: string;
  authorProfileImage?: string;
  title: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  sourceLocale: Locale;
  isSecret?: boolean;
  secretPasswordHash?: string;
  placeReview?: PlaceReviewData;
};

export type UpdatePostInput = {
  storeName: string;
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  displayAddress?: string;
  mapLat?: number;
  mapLng?: number;
  title: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  sourceLocale: Locale;
  isSecret?: boolean;
  secretPasswordHash?: string;
  placeReview?: PlaceReviewData;
};

export type AddressGroup = {
  addressKey: string;
  address: string;
  postCount: number;
};

export type SubCategoryPostGroup = {
  subId: string;
  posts: Post[];
};
