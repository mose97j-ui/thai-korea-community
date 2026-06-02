import { normalizePhone } from "./phone";
import type { AuthErrorKey } from "./errors";

export type VerificationMethod = "email" | "phone";
export type VerificationPurpose =
  | "signup"
  | "find-id"
  | "reset-password"
  | "change-phone"
  | "change-password";

type StoredVerification = {
  code: string;
  expires: number;
  method: VerificationMethod;
};

type VerifyFail = { ok: false; errorKey: AuthErrorKey };

const PREFIX = "tkc_verify_";
const TTL_MS = 3 * 60 * 1000;

function storageKey(purpose: VerificationPurpose, target: string): string {
  const normalized =
    target.includes("@") ? target.trim().toLowerCase() : normalizePhone(target);
  return `${PREFIX}${purpose}_${normalized}`;
}

function read(key: string): StoredVerification | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredVerification;
  } catch {
    return null;
  }
}

function write(key: string, value: StoredVerification): void {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function sendVerificationCode(
  target: string,
  method: VerificationMethod,
  purpose: VerificationPurpose
): { ok: true; devCode: string } | VerifyFail {
  if (typeof window === "undefined") {
    return { ok: false, errorKey: "VERIFY_BROWSER" };
  }

  const trimmed = target.trim();
  if (method === "email" && !trimmed.includes("@")) {
    return { ok: false, errorKey: "VERIFY_EMAIL_INVALID" };
  }
  if (method === "phone" && normalizePhone(trimmed).length < 10) {
    return { ok: false, errorKey: "VERIFY_PHONE_INVALID" };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  write(storageKey(purpose, trimmed), {
    code,
    expires: Date.now() + TTL_MS,
    method,
  });

  return { ok: true, devCode: code };
}

export function verifyCode(
  target: string,
  inputCode: string,
  purpose: VerificationPurpose
): { ok: true } | VerifyFail {
  const stored = read(storageKey(purpose, target.trim()));
  if (!stored) {
    return { ok: false, errorKey: "VERIFY_NOT_SENT" };
  }
  if (Date.now() > stored.expires) {
    return { ok: false, errorKey: "VERIFY_EXPIRED" };
  }
  if (stored.code !== inputCode.trim()) {
    return { ok: false, errorKey: "VERIFY_WRONG" };
  }
  return { ok: true };
}

export function clearVerification(
  target: string,
  purpose: VerificationPurpose
): void {
  sessionStorage.removeItem(storageKey(purpose, target.trim()));
}
