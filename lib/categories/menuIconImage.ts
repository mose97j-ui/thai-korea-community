import type { MessageKey } from "@/lib/i18n/messages";

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const OUTPUT_MAX_PX = 96;
const JPEG_QUALITY = 0.84;
const MAX_DATA_URL_LENGTH = 120_000;
const MIN_PX = 48;
const MAX_ASPECT_RATIO = 3;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type MenuIconImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; errorKey: MessageKey };

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

export async function readMenuIconImage(file: File): Promise<MenuIconImageResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, errorKey: "userMenu.errorIconImageInvalid" };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, errorKey: "userMenu.errorIconImageTooLarge" };
  }

  try {
    const image = await loadImage(file);
    const width = image.width;
    const height = image.height;

    if (width < MIN_PX || height < MIN_PX) {
      return { ok: false, errorKey: "userMenu.errorIconImageDimensions" };
    }

    const aspect = Math.max(width, height) / Math.min(width, height);
    if (aspect > MAX_ASPECT_RATIO) {
      return { ok: false, errorKey: "userMenu.errorIconImageDimensions" };
    }

    const scale = Math.min(1, OUTPUT_MAX_PX / Math.max(width, height));
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return { ok: false, errorKey: "userMenu.errorIconImageInvalid" };
    }

    context.drawImage(image, 0, 0, outputWidth, outputHeight);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      return { ok: false, errorKey: "userMenu.errorIconImageTooLarge" };
    }

    return { ok: true, dataUrl };
  } catch {
    return { ok: false, errorKey: "userMenu.errorIconImageInvalid" };
  }
}
