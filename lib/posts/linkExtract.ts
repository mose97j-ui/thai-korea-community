import {
  getAllHomeCategories,
  getCategorySubItems,
} from "@/lib/categories/registry";
import type { HomeSubItem } from "@/lib/i18n/content";

export type LinkImportDraft = {
  storeName: string;
  address: string;
  title: string;
  content: string;
  categoryId?: string;
  subId?: string;
  videoUrl?: string;
  sourceUrl: string;
};

export type LinkExtractInput = {
  html: string;
  sourceUrl: string;
  defaultCategoryId: string;
  defaultSubId: string;
};

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getMetaContent(html: string, key: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return "";
}

function getTitleTag(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractBodyText(html: string): string {
  const articleMatch = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  const raw = articleMatch?.[1] || mainMatch?.[1] || bodyMatch?.[1] || html;
  return stripTags(raw).slice(0, 1200);
}

export function extractAddress(text: string): string {
  const patterns = [
    /(?:서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|세종시)[^\n,.]{0,80}/,
    /(?:경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\n,.]{0,20}(?:도|특별자치도)[^\n,.]{0,80}/,
    /[가-힣]{2,8}(?:시|군)\s+[가-힣]{2,8}(?:구|군|읍|면|동)[^\n,.]{0,80}/,
    /[가-힣]+(?:로|길|번길)\s*\d+[^\n,.]{0,40}/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      return match[0].trim().replace(/\s+/g, " ");
    }
  }

  return "";
}

function cleanStoreName(raw: string): string {
  return raw
    .split(/[|\-–—·]/)[0]
    .replace(/홈페이지|공식|Official|Home/gi, "")
    .trim()
    .slice(0, 60);
}

function scoreSubCategory(text: string, categoryId: string, item: HomeSubItem): number {
  const haystack = text.toLowerCase();
  const needles = [
    item.title.ko,
    item.title.th,
    item.description.ko,
    item.description.th,
    item.icon,
  ];

  let score = 0;
  for (const needle of needles) {
    const token = needle.trim().toLowerCase();
    if (token.length >= 2 && haystack.includes(token)) {
      score += token.length * 2;
    }
  }

  const category = getAllHomeCategories().find((entry) => entry.id === categoryId);
  if (category) {
    for (const label of [category.label.ko, category.label.th]) {
      const token = label.trim().toLowerCase();
      if (token.length >= 2 && haystack.includes(token)) {
        score += token.length;
      }
    }
  }

  return score;
}

export function suggestCategoryFromText(
  text: string,
  defaultCategoryId: string,
  defaultSubId: string
): { categoryId: string; subId: string } {
  let bestScore = 0;
  let best = { categoryId: defaultCategoryId, subId: defaultSubId };

  for (const category of getAllHomeCategories()) {
    const items = getCategorySubItems(category.id);
    for (const item of items) {
      const score = scoreSubCategory(text, category.id, item);
      if (score > bestScore) {
        bestScore = score;
        best = { categoryId: category.id, subId: item.id };
      }
    }
  }

  return best;
}

function isVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function extractJsonLd(html: string): { name?: string; address?: string; description?: string } {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  if (!scripts) {
    return {};
  }

  for (const script of scripts) {
    const jsonText = script
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();

    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of nodes) {
        if (!node || typeof node !== "object") {
          continue;
        }

        const record = node as Record<string, unknown>;
        const name =
          typeof record.name === "string"
            ? record.name
            : typeof (record.publisher as Record<string, unknown> | undefined)?.name ===
                "string"
              ? ((record.publisher as Record<string, unknown>).name as string)
              : undefined;

        let address: string | undefined;
        const addressNode = record.address;
        if (typeof addressNode === "string") {
          address = addressNode;
        } else if (addressNode && typeof addressNode === "object") {
          const parts = [
            (addressNode as Record<string, unknown>).streetAddress,
            (addressNode as Record<string, unknown>).addressLocality,
            (addressNode as Record<string, unknown>).addressRegion,
          ]
            .filter((part) => typeof part === "string")
            .join(" ");
          address = parts || undefined;
        }

        const description =
          typeof record.description === "string" ? record.description : undefined;

        if (name || address || description) {
          return { name, address, description };
        }
      }
    } catch {
      continue;
    }
  }

  return {};
}

export function buildDraftFromHtml(input: LinkExtractInput): LinkImportDraft {
  const ogTitle = getMetaContent(input.html, "og:title");
  const ogDescription = getMetaContent(input.html, "og:description");
  const ogSiteName = getMetaContent(input.html, "og:site_name");
  const metaDescription = getMetaContent(input.html, "description");
  const titleTag = getTitleTag(input.html);
  const bodyText = extractBodyText(input.html);
  const structured = extractJsonLd(input.html);

  const title = ogTitle || structured.name || titleTag;
  const description = ogDescription || structured.description || metaDescription;
  const combinedText = [title, description, bodyText, ogSiteName, structured.address]
    .filter(Boolean)
    .join("\n");
  const storeName = cleanStoreName(structured.name || ogSiteName || title || titleTag);
  const address = structured.address || extractAddress(combinedText);
  const suggested = suggestCategoryFromText(
    combinedText,
    input.defaultCategoryId,
    input.defaultSubId
  );

  const contentParts = [
    description,
    bodyText && bodyText !== description ? bodyText : "",
    `🔗 ${input.sourceUrl}`,
  ].filter(Boolean);

  return {
    storeName,
    address,
    title: title.slice(0, 80),
    content: contentParts.join("\n\n").slice(0, 3000),
    categoryId: suggested.categoryId,
    subId: suggested.subId,
    videoUrl: isVideoUrl(input.sourceUrl) ? input.sourceUrl : undefined,
    sourceUrl: input.sourceUrl,
  };
}

export function isValidImportUrl(raw: string): boolean {
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeImportUrl(raw: string): string {
  const trimmed = raw.trim();
  const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  return url.toString();
}
