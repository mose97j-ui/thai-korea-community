import { NextResponse } from "next/server";
import { geocodeLocally, geocodeWithKakao } from "@/lib/maps/kakaoGeocode";
import { normalizeAddressKey } from "@/lib/posts/address";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const normalized = normalizeAddressKey(query);

  if (!normalized) {
    return NextResponse.json(
      { ok: false, error: "missing_query" },
      { status: 400 }
    );
  }

  const geocode = (await geocodeWithKakao(normalized)) ?? geocodeLocally(normalized);

  return NextResponse.json({
    ok: true,
    geocode,
    parsed: geocode.parsed,
    source: geocode.source,
  });
}
