const FLASH_KEY = "tkc_post_publish_flash";
const FLASH_TTL_MS = 3 * 60 * 1000;

export type PostPublishFlash = {
  postId: string;
  categoryId: string;
  subId: string;
  title: string;
  isSecret: boolean;
  createdAt: number;
};

function readRaw(): PostPublishFlash | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) {
      return null;
    }
    const flash = JSON.parse(raw) as PostPublishFlash;
    if (Date.now() - flash.createdAt > FLASH_TTL_MS) {
      sessionStorage.removeItem(FLASH_KEY);
      return null;
    }
    return flash;
  } catch {
    return null;
  }
}

export function setPostPublishFlash(flash: Omit<PostPublishFlash, "createdAt">): void {
  if (typeof window === "undefined") {
    return;
  }
  const payload: PostPublishFlash = {
    ...flash,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(FLASH_KEY, JSON.stringify(payload));
}

export function peekPostPublishFlash(): PostPublishFlash | null {
  return readRaw();
}

export function clearPostPublishFlash(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(FLASH_KEY);
}

/** Flash for this board (same category + sub). */
export function peekPostPublishFlashForBoard(
  categoryId: string,
  subId: string
): PostPublishFlash | null {
  const flash = peekPostPublishFlash();
  if (!flash || flash.categoryId !== categoryId || flash.subId !== subId) {
    return null;
  }
  return flash;
}

export function parsePostHashId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const hash = window.location.hash.slice(1);
  if (!hash.startsWith("post-")) {
    return null;
  }
  const id = hash.slice(5).trim();
  return id || null;
}
