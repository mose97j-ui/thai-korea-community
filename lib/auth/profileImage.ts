import type { AuthErrorKey } from "./errors";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const OUTPUT_MAX_PX = 320;
const JPEG_QUALITY = 0.82;

export type ProfileImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; errorKey: AuthErrorKey };

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

export async function readProfileImage(file: File): Promise<ProfileImageResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, errorKey: "PROFILE_INVALID" };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, errorKey: "PROFILE_TOO_LARGE" };
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
      return { ok: false, errorKey: "PROFILE_INVALID" };
    }

    context.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    if (dataUrl.length > 400_000) {
      return { ok: false, errorKey: "PROFILE_TOO_LARGE" };
    }

    return { ok: true, dataUrl };
  } catch {
    return { ok: false, errorKey: "PROFILE_INVALID" };
  }
}

export function getUserNickname(user: {
  nickname?: string;
  name: string;
}): string {
  return user.nickname?.trim() || user.name;
}
