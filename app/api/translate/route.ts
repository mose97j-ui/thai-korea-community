import { NextResponse } from "next/server";

const MAX_CHUNK = 450;

type TranslateBody = {
  text?: string;
  from?: string;
  to?: string;
};

async function translateChunk(
  text: string,
  from: string,
  to: string
): Promise<string> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${from}|${to}`);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Translation provider unavailable");
  }

  const data = (await response.json()) as {
    responseStatus?: number;
    responseDetails?: string;
    responseData?: { translatedText?: string };
  };

  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || "Translation failed");
  }

  return data.responseData.translatedText;
}

async function translateLongText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (text.length <= MAX_CHUNK) {
    return translateChunk(text, from, to);
  }

  const parts: string[] = [];
  let buffer = "";

  for (const line of text.split("\n")) {
    const next = buffer ? `${buffer}\n${line}` : line;
    if (next.length > MAX_CHUNK && buffer) {
      parts.push(buffer);
      buffer = line;
      continue;
    }
    buffer = next;
  }

  if (buffer) {
    parts.push(buffer);
  }

  const translatedParts: string[] = [];
  for (const part of parts) {
    if (!part.trim()) {
      translatedParts.push(part);
      continue;
    }

    if (part.length <= MAX_CHUNK) {
      translatedParts.push(await translateChunk(part, from, to));
      continue;
    }

    let chunk = "";
    for (const word of part.split(/(\s+)/)) {
      const next = chunk + word;
      if (next.length > MAX_CHUNK && chunk.trim()) {
        translatedParts.push(await translateChunk(chunk, from, to));
        chunk = word;
      } else {
        chunk = next;
      }
    }
    if (chunk) {
      translatedParts.push(await translateChunk(chunk, from, to));
    }
  }

  return translatedParts.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateBody;
    const text = body.text ?? "";
    const from = body.from === "ko" ? "ko" : body.from === "th" ? "th" : null;
    const to = body.to === "ko" ? "ko" : body.to === "th" ? "th" : null;

    if (!from || !to || from === to) {
      return NextResponse.json({ translated: text });
    }

    if (!text.trim()) {
      return NextResponse.json({ translated: text });
    }

    const translated = await translateLongText(text, from, to);
    return NextResponse.json({ translated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
