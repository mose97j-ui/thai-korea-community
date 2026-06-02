import { NextResponse } from "next/server";
import { geocodeLocally, searchAddressesWithKakao } from "@/lib/maps/kakaoGeocode";
import { normalizeAddressKey } from "@/lib/posts/address";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const normalized = normalizeAddressKey(query);

  if (normalized.length < 2) {
    return NextResponse.json({ ok: true, suggestions: [] });
  }

  const suggestions = await searchAddressesWithKakao(normalized);

  if (suggestions.length > 0) {
    return NextResponse.json({ ok: true, suggestions });
  }

  const local = geocodeLocally(normalized);
  if (local.displayAddress) {
    return NextResponse.json({
      ok: true,
      suggestions: [
        {
          label: local.displayAddress,
          roadAddress: local.roadAddress,
          jibunAddress: local.jibunAddress,
          displayAddress: local.displayAddress,
          lat: local.lat,
          lng: local.lng,
          parsed: local.parsed,
        },
      ],
    });
  }

  return NextResponse.json({ ok: true, suggestions: [] });
}
