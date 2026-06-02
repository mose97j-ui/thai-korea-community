import type { Locale } from "@/lib/i18n/types";
import type { PostLocalizedText } from "@/lib/posts/types";

export async function translateText(
  text: string,
  from: Locale,
  to: Locale
): Promise<string> {
  if (!text.trim() || from === to) {
    return text;
  }

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from, to }),
  });

  const data = (await response.json()) as {
    translated?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Translation failed");
  }

  return data.translated ?? text;
}

export async function translatePostFields(
  fields: PostLocalizedText,
  from: Locale,
  to: Locale
): Promise<PostLocalizedText> {
  const [storeName, title, content, address] = await Promise.all([
    translateText(fields.storeName, from, to),
    translateText(fields.title, from, to),
    translateText(fields.content, from, to),
    translateText(fields.address, from, to),
  ]);

  return { storeName, title, content, address };
}
