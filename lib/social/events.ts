import { SOCIAL_CHANGE_EVENT } from "./types";

export function emitSocialChange(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(SOCIAL_CHANGE_EVENT));
}
