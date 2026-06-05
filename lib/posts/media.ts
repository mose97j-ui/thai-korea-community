export const MAX_POST_IMAGES = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const OUTPUT_MAX_PX = 960;
const JPEG_QUALITY = 0.78;
const MAX_DATA_URL_LENGTH = 900_000;

export type PostMediaErrorKey = "POST_IMAGE_INVALID" | "POST_IMAGE_TOO_LARGE" | "POST_IMAGE_LIMIT";

export type PostImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; errorKey: PostMediaErrorKey };

export type VideoLinkInfo = {
  provider: "youtube" | "vimeo" | "external";
  href: string;
  embedUrl?: string;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid image"));
    };
    image.src = url;
  });
}

export async function readPostImage(
  file: File,
  currentCount: number
): Promise<PostImageResult> {
  if (currentCount >= MAX_POST_IMAGES) {
    return { ok: false, errorKey: "POST_IMAGE_LIMIT" };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, errorKey: "POST_IMAGE_INVALID" };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, errorKey: "POST_IMAGE_TOO_LARGE" };
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, OUTPUT_MAX_PX / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return { ok: false, errorKey: "POST_IMAGE_INVALID" };
    }

    context.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      return { ok: false, errorKey: "POST_IMAGE_TOO_LARGE" };
    }

    return { ok: true, dataUrl };
  } catch {
    return { ok: false, errorKey: "POST_IMAGE_INVALID" };
  }
}

function extractYouTubeId(url: URL): string | null {
  if (url.hostname.includes("youtube.com")) {
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) {
      return fromQuery;
    }

    const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) {
      return shortsMatch[1];
    }

    const embedMatch = url.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch?.[1]) {
      return embedMatch[1];
    }
  }

  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return id || null;
  }

  return null;
}

function extractVimeoId(url: URL): string | null {
  if (!url.hostname.includes("vimeo.com")) {
    return null;
  }

  const match = url.pathname.match(/\/(\d+)/);
  return match?.[1] ?? null;
}

export function parseVideoLink(raw: string): VideoLinkInfo | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const href = url.toString();
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      return {
        provider: "youtube",
        href,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      };
    }

    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      return {
        provider: "vimeo",
        href,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      };
    }

    return { provider: "external", href };
  } catch {
    return null;
  }
}

export function validateVideoUrl(raw: string): boolean {
  if (!raw.trim()) {
    return true;
  }
  return parseVideoLink(raw) !== null;
}

export function normalizeVideoUrl(raw: string): string {
  const parsed = parseVideoLink(raw);
  return parsed?.href ?? raw.trim();
}
