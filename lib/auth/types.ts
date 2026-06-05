import type { Locale } from "@/lib/i18n/types";

export type UserRole = "user" | "operator";

export type Gender = "male" | "female";

export type UserRestriction = {
  scope: "write" | "comment" | "message" | "activity" | "permanent";
  reason?: string;
  until?: string;
  createdAt: string;
  createdBy: string;
  source?: "manual" | "auto" | "report";
};

export type PointTransactionType = "post_create" | "manual_adjust" | "spend";

export type PointTransaction = {
  id: string;
  userId: string;
  type: PointTransactionType;
  amount: number;
  balanceAfter: number;
  reason?: string;
  referenceId?: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  nickname: string;
  gender?: Gender;
  profileImage?: string;
  /** @deprecated birthDate 사용 */
  age?: number;
  birthDate: string;
  hometown: string;
  gmail: string;
  koreanPhone: string;
  personalCode: string;
  referredBy?: string;
  password: string;
  role?: UserRole;
  preferredLocale?: Locale;
  isKoreanMember?: boolean;
  /** ISO date — active while in the future */
  premiumUntil?: string;
  restriction?: UserRestriction;
  points?: number;
  createdAt: string;
  supabaseId?: string;
  authProvider?: "local" | "google";
};

export type GoogleSignupInput = {
  name: string;
  nickname: string;
  gender: Gender;
  profileImage?: string;
  birthDate: string;
  hometown: string;
  koreanPhone: string;
  referralCode?: string;
  isKoreanMember?: boolean;
};

export type SignupInput = {
  name: string;
  nickname: string;
  gender: Gender;
  profileImage?: string;
  birthDate: string;
  hometown: string;
  gmail: string;
  koreanPhone: string;
  password: string;
  referralCode?: string;
  isKoreanMember?: boolean;
};

export type LoginInput = {
  gmail: string;
  password: string;
};
