import type { MessageKey } from "@/lib/i18n/messages";

export function isMenuIconImage(value: string): boolean {
  return value.trim().startsWith("data:image/jpeg") || value.trim().startsWith("data:image/png");
}

export function normalizeMenuIcon(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "📌";
  }
  if (isMenuIconImage(trimmed)) {
    return trimmed.length <= 180_000 ? trimmed : "📌";
  }
  return trimmed.slice(0, 8);
}

export function validateMenuIconImagePolicy(
  icon: string,
  policyAccepted?: boolean
): { ok: true } | { ok: false; errorKey: MessageKey } {
  if (!isMenuIconImage(icon)) {
    return { ok: true };
  }
  if (!policyAccepted) {
    return { ok: false, errorKey: "userMenu.errorIconImagePolicy" };
  }
  return { ok: true };
}
