const DEFAULT_TITLE_KO = "운영자 문의";
const DEFAULT_TITLE_TH = "ติดต่อผู้ดูแล";

/** Short list title from the first line of the member message. */
export function deriveSupportTitle(content: string, locale?: "ko" | "th"): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return locale === "th" ? DEFAULT_TITLE_TH : DEFAULT_TITLE_KO;
  }

  const firstLine = trimmed.split(/\n/).find((line) => line.trim())?.trim() ?? trimmed;
  const maxLen = 56;
  if (firstLine.length <= maxLen) {
    return firstLine;
  }

  const slice = firstLine.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 24 ? slice.slice(0, lastSpace) : slice;
  return `${cut}…`;
}
