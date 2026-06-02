import type { DirectMessage } from "./types";

export function formatMessagePreview(
  message: DirectMessage,
  labels: { photo: string; video: string; empty: string }
): string {
  const parts: string[] = [];

  if (message.images?.length) {
    parts.push(labels.photo);
  }
  if (message.videoUrl?.trim()) {
    parts.push(labels.video);
  }
  if (message.content.trim()) {
    parts.push(message.content.trim());
  }

  if (parts.length === 0) {
    return labels.empty;
  }

  const preview = parts.join(" · ");
  return preview.length > 80 ? `${preview.slice(0, 80)}…` : preview;
}
