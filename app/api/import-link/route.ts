import { NextResponse } from "next/server";
import {
  buildDraftFromHtml,
  isValidImportUrl,
  normalizeImportUrl,
  type LinkImportDraft,
} from "@/lib/posts/linkExtract";

type ImportLinkBody = {
  url?: string;
  defaultCategoryId?: string;
  defaultSubId?: string;
};

const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 10_000;

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }

  const match = host.match(/^(\d+)\.(\d+)\./);
  if (!match) {
    return false;
  }

  const first = Number(match[1]);
  const second = Number(match[2]);

  if (first === 10 || first === 127) {
    return true;
  }
  if (first === 192 && second === 168) {
    return true;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }

  return false;
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ThaiKoreaCommunityBot/1.0; +https://thai-korea-community.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("Not an HTML page");
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new Error("Page too large");
    }

    return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ImportLinkBody;
    const rawUrl = body.url?.trim() ?? "";

    if (!isValidImportUrl(rawUrl)) {
      return NextResponse.json({ ok: false, error: "INVALID_URL" }, { status: 400 });
    }

    const sourceUrl = normalizeImportUrl(rawUrl);
    const parsed = new URL(sourceUrl);

    if (isBlockedHost(parsed.hostname)) {
      return NextResponse.json({ ok: false, error: "BLOCKED_URL" }, { status: 400 });
    }

    const html = await fetchHtml(sourceUrl);
    const draft: LinkImportDraft = buildDraftFromHtml({
      html,
      sourceUrl,
      defaultCategoryId: body.defaultCategoryId || "info",
      defaultSubId: body.defaultSubId || "info-0",
    });

    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IMPORT_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
