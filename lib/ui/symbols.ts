/** UI symbols as Unicode escapes — avoids editor encoding corrupting emoji literals. */

export const SYMBOL_LOCK = "\uD83D\uDD12";
export const SYMBOL_STAR_ON = "\u2605";
export const SYMBOL_STAR_OFF = "\u2606";
export const SYMBOL_ARROW_RIGHT = "\u2192";
export const SYMBOL_BOARD = "\uD83D\uDCCB";
export const SYMBOL_PIN = "\uD83D\uDCCC";

export const SYMBOL_NAV_HOME = "\uD83C\uDFE0";
export const SYMBOL_NAV_CHAT = "\uD83D\uDCAC";
export const SYMBOL_NAV_ALERT = "\uD83D\uDD14";
export const SYMBOL_NAV_PROFILE = "\uD83D\uDC64";
export const SYMBOL_NAV_SUPPORT = "\uD83D\uDCEE";
export const SYMBOL_WRITE = "\u270F\uFE0F";
export const SYMBOL_CHEVRON_DOWN = "\u25BE";
export const SYMBOL_CHEVRON_UP = "\u25B4";
export const SYMBOL_DOCK_EXPAND = "\u25B2";

const PLACEHOLDER_ICON = /^[?\uFFFD]+$/;

/** Broken or placeholder icons from bad encoding / localStorage — show pin instead. */
export function sanitizeDisplayIcon(icon: string | undefined | null): string {
  const trimmed = (icon ?? "").trim();
  if (!trimmed || trimmed === "??" || PLACEHOLDER_ICON.test(trimmed)) {
    return SYMBOL_PIN;
  }
  return trimmed;
}
