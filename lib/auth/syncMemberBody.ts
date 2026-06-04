import type { User } from "@/lib/auth/types";

export type SyncMemberBody = {
  id?: string;
  name?: string;
  nickname?: string;
  gender?: User["gender"];
  profileImage?: string;
  birthDate?: string;
  hometown?: string;
  gmail?: string;
  koreanPhone?: string;
  personalCode?: string;
  referredBy?: string;
  role?: User["role"];
  premiumUntil?: string;
  restriction?: User["restriction"];
  authProvider?: User["authProvider"];
  createdAt?: string;
  syncAsOperator?: boolean;
  operatorGmail?: string;
};

export function getOperatorGmail(): string {
  return (process.env.NEXT_PUBLIC_OPERATOR_GMAIL || "mose97j@gmail.com").toLowerCase();
}

export function isOperatorSyncRequest(body: SyncMemberBody): boolean {
  const operatorGmail = body.operatorGmail?.trim().toLowerCase();
  return body.syncAsOperator === true && operatorGmail === getOperatorGmail();
}

export function parseSyncBody(body: SyncMemberBody, operatorSync: boolean): User | null {
  const gmail = body.gmail?.trim().toLowerCase();
  const id = body.id?.trim();
  const nickname = body.nickname?.trim();
  const name = body.name?.trim();

  if (!id || !gmail || !nickname || !name || !body.personalCode?.trim()) {
    return null;
  }

  if (!gmail.endsWith("@gmail.com")) {
    return null;
  }

  return {
    id,
    name,
    nickname,
    gender: body.gender,
    profileImage: body.profileImage?.trim() || undefined,
    birthDate: body.birthDate?.trim() || "",
    hometown: body.hometown?.trim() || "",
    gmail,
    koreanPhone: body.koreanPhone?.trim() || "",
    personalCode: body.personalCode.trim().toUpperCase(),
    referredBy: body.referredBy?.trim().toUpperCase() || undefined,
    password: "",
    role: operatorSync && body.role === "operator" ? "operator" : "user",
    premiumUntil: operatorSync ? body.premiumUntil : undefined,
    restriction: operatorSync ? body.restriction : undefined,
    authProvider: body.authProvider ?? "local",
    createdAt: body.createdAt || new Date().toISOString(),
  };
}
