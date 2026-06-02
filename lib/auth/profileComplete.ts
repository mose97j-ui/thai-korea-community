import type { User } from "./types";

export function isProfileComplete(user: Partial<User> | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return Boolean(
    user.nickname?.trim() &&
      (user.gender === "male" || user.gender === "female") &&
      user.profileImage?.trim() &&
      user.birthDate?.trim() &&
      user.hometown?.trim() &&
      user.gmail?.trim()
  );
}
