import type { LinkImportDraft } from "@/lib/posts/linkExtract";

type ImportLinkResponse =
  | { ok: true; draft: LinkImportDraft }
  | { ok: false; error: string };

export async function importPostFromLink(
  url: string,
  defaults: { categoryId: string; subId: string }
): Promise<ImportLinkResponse> {
  const response = await fetch("/api/import-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      defaultCategoryId: defaults.categoryId,
      defaultSubId: defaults.subId,
    }),
  });

  const data = (await response.json()) as ImportLinkResponse;
  return data;
}
