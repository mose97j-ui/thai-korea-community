/** Routes that use centered auth layout (no TopNav). */
export const AUTH_LAYOUT_PATHS = [
  "/login",
  "/signup",
  "/signup/complete",
  "/auth/continue",
  "/account/find-id",
  "/account/reset-password",
  "/privacy",
  "/terms",
] as const;

export function isAuthLayoutPath(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }

  return AUTH_LAYOUT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
