import type { User } from "./types";
import { SIGNUP_PROFILE_PHOTO_REQUIRED } from "./features";

export function isProfileComplete(user: Partial<User> | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return Boolean(
    user.nickname?.trim() &&
      (user.gender === "male" || user.gender === "female") &&
      (SIGNUP_PROFILE_PHOTO_REQUIRED ? user.profileImage?.trim() : true) &&
      user.birthDate?.trim() &&
      user.hometown?.trim() &&
      user.gmail?.trim()
  );
}
