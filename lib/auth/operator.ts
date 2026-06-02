import type { User } from "./types";

const OPERATOR_ID = "tkc-operator";

export const OPERATOR_REFERRAL_CODE =
  process.env.NEXT_PUBLIC_OPERATOR_CODE || "CAPTAINKOREA97";

export function getOperatorDefaults(): Omit<User, "createdAt"> {
  return {
    id: OPERATOR_ID,
    name: process.env.NEXT_PUBLIC_OPERATOR_NAME || "운영자",
    nickname: process.env.NEXT_PUBLIC_OPERATOR_NICKNAME || "CaptainKorea",
    gender: "male",
    birthDate: process.env.NEXT_PUBLIC_OPERATOR_BIRTHDATE || "1997-03-15",
    hometown: process.env.NEXT_PUBLIC_OPERATOR_HOMETOWN || "서울",
    gmail: (
      process.env.NEXT_PUBLIC_OPERATOR_GMAIL || "mose97j@gmail.com"
    ).toLowerCase(),
    koreanPhone:
      process.env.NEXT_PUBLIC_OPERATOR_PHONE || "01028024705",
    personalCode: OPERATOR_REFERRAL_CODE.toUpperCase(),
    password: process.env.NEXT_PUBLIC_OPERATOR_PASSWORD || "hnjeong01@@",
    role: "operator",
  };
}

export function isOperator(user: User | null | undefined): boolean {
  return isOperatorUser(user);
}

export function isOperatorUser(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (user.role === "operator") {
    return true;
  }

  const defaults = getOperatorDefaults();
  return (
    user.id === defaults.id ||
    user.gmail.toLowerCase() === defaults.gmail.toLowerCase() ||
    user.personalCode.toUpperCase() === defaults.personalCode.toUpperCase()
  );
}
