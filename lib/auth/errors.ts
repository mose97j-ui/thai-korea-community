export type AuthErrorKey =
  | "EMAIL_TAKEN"
  | "PHONE_TAKEN"
  | "AGE_INVALID"
  | "REFERRAL_INVALID"
  | "LOGIN_FAILED"
  | "LOGIN_REQUIRED"
  | "REFERRAL_ALREADY"
  | "REFERRAL_SELF"
  | "ACCOUNT_NOT_FOUND"
  | "PASSWORD_SHORT"
  | "PASSWORD_WRONG"
  | "PHONE_IN_USE"
  | "GMAIL_NOT_FOUND"
  | "VERIFY_REQUIRED"
  | "PASSWORD_MISMATCH"
  | "REFERRAL_SUCCESS"
  | "VERIFY_PHONE_REQUIRED"
  | "VERIFY_BROWSER"
  | "VERIFY_EMAIL_INVALID"
  | "VERIFY_PHONE_INVALID"
  | "VERIFY_NOT_SENT"
  | "VERIFY_EXPIRED"
  | "VERIFY_WRONG"
  | "NICKNAME_TAKEN"
  | "NICKNAME_INVALID"
  | "PROFILE_REQUIRED"
  | "PROFILE_INVALID"
  | "PROFILE_TOO_LARGE"
  | "GENDER_REQUIRED"
  | "PAYMENT_FAILED"
  | "PAYMENT_CONFIRM_FAILED"
  | "PAYMENT_CONFIG_MISSING"
  | "ACCOUNT_BANNED"
  | "WRITE_BANNED"
  | "COMMENT_BANNED"
  | "MESSAGE_BANNED"
  | "ACTIVITY_BANNED"
  | "GMAIL_INVALID"
  | "PROFILE_SAVE_FAILED";

export type AuthFail = { ok: false; errorKey: AuthErrorKey };

export function authFail(errorKey: AuthErrorKey): AuthFail {
  return { ok: false, errorKey };
}

export type AuthResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; errorKey: AuthErrorKey };
