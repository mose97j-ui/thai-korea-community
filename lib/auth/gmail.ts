/** 아이디 = Gmail 주소 (@gmail.com 만 허용) */
const GMAIL_PATTERN = /^[^\s@]+@gmail\.com$/i;

export function normalizeGmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidGmail(email: string): boolean {
  const normalized = normalizeGmail(email);
  if (!GMAIL_PATTERN.test(normalized)) {
    return false;
  }

  const [localPart] = normalized.split("@");
  return localPart.length >= 1 && localPart.length <= 64;
}

export function validateGmail(email: string): { ok: true; gmail: string } | { ok: false } {
  const gmail = normalizeGmail(email);
  if (!isValidGmail(gmail)) {
    return { ok: false };
  }
  return { ok: true, gmail };
}
