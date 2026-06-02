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
  /** ISO date — active while in the future */
  premiumUntil?: string;
  restriction?: UserRestriction;
  createdAt: string;
  supabaseId?: string;
  authProvider?: "local" | "google";
};

export type GoogleSignupInput = {
  name: string;
  nickname: string;
  gender: Gender;
  profileImage: string;
  birthDate: string;
  hometown: string;
  koreanPhone: string;
  referralCode?: string;
};

export type SignupInput = {
  name: string;
  nickname: string;
  gender: Gender;
  profileImage: string;
  birthDate: string;
  hometown: string;
  gmail: string;
  koreanPhone: string;
  password: string;
  referralCode?: string;
};

export type LoginInput = {
  gmail: string;
  password: string;
};
