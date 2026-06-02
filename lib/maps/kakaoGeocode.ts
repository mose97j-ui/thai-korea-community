import { normalizeAddressKey } from "@/lib/posts/address";
import {
  parseKoreanAddress,
  parseKoreanAddressFromGeocode,
  type ParsedAddressParts,
} from "@/lib/posts/addressParse";
import { buildDisplayAddress } from "./formatAddress";
import type { AddressSuggestion, GeocodeResult } from "./types";

type KakaoAddressDocument = {
  address?: {
    address_name?: string;
    region_1depth_name?: string;
    region_2depth_name?: string;
    region_3depth_name?: string;
    x?: string;
    y?: string;
  };
  road_address?: {
    address_name?: string;
    region_1depth_name?: string;
    region_2depth_name?: string;
    region_3depth_name?: string;
    x?: string;
    y?: string;
  };
};

export const KAKAO_REST_KEY =
  process.env.KAKAO_REST_API_KEY ||
  process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ||
  process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ||
  "";

function hasKakaoRestKey(): boolean {
  return Boolean(KAKAO_REST_KEY && !KAKAO_REST_KEY.startsWith("YOUR_"));
}

function parseKakaoDocument(document: KakaoAddressDocument): {
  roadAddress: string;
  jibunAddress: string;
  lat: number;
  lng: number;
  parsed: ParsedAddressParts;
} | null {
  const road = document.road_address;
  const jibun = document.address;
  const source = road ?? jibun;
  if (!source) {
    return null;
  }

  const lat = Number(source.y ?? road?.y ?? jibun?.y);
  const lng = Number(source.x ?? road?.x ?? jibun?.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const roadAddress = road?.address_name?.trim() ?? "";
  const jibunAddress = jibun?.address_name?.trim() ?? "";
  const parsed =
    parseKoreanAddressFromGeocode({
      region1: source.region_1depth_name,
      region2: source.region_2depth_name,
      region3: source.region_3depth_name,
      addressName: source.address_name,
    }) ??
    parseKoreanAddress(
      [source.region_1depth_name, source.region_2depth_name, source.region_3depth_name, source.address_name]
        .filter(Boolean)
        .join(" ")
    );

  return { roadAddress, jibunAddress, lat, lng, parsed };
}

function toGeocodeResult(query: string, document: KakaoAddressDocument): GeocodeResult | null {
  const parsed = parseKakaoDocument(document);
  if (!parsed) {
    return null;
  }

  const displayAddress = buildDisplayAddress({
    roadAddress: parsed.roadAddress,
    jibunAddress: parsed.jibunAddress,
    fallback: parsed.parsed.label || query,
  });

  return {
    query,
    lat: parsed.lat,
    lng: parsed.lng,
    roadAddress: parsed.roadAddress,
    jibunAddress: parsed.jibunAddress,
    displayAddress,
    parsed: parsed.parsed,
    source: "kakao",
  };
}

export async function geocodeWithKakao(query: string): Promise<GeocodeResult | null> {
  if (!hasKakaoRestKey()) {
    return null;
  }

  const normalized = normalizeAddressKey(query);
  if (!normalized) {
    return null;
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(normalized)}&size=1`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
      },
      next: { revalidate: 86400 },
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    documents?: KakaoAddressDocument[];
  };

  const document = payload.documents?.[0];
  if (!document) {
    return null;
  }

  return toGeocodeResult(normalized, document);
}

export async function searchAddressesWithKakao(
  query: string,
  limit = 5
): Promise<AddressSuggestion[]> {
  if (!hasKakaoRestKey()) {
    return [];
  }

  const normalized = normalizeAddressKey(query);
  if (!normalized) {
    return [];
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(normalized)}&size=${limit}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
      },
      next: { revalidate: 86400 },
    }
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    documents?: KakaoAddressDocument[];
  };

  return (payload.documents ?? [])
    .map((document) => {
      const result = toGeocodeResult(normalized, document);
      if (!result) {
        return null;
      }

      return {
        label: result.displayAddress,
        roadAddress: result.roadAddress,
        jibunAddress: result.jibunAddress,
        displayAddress: result.displayAddress,
        lat: result.lat,
        lng: result.lng,
        parsed: result.parsed,
      } satisfies AddressSuggestion;
    })
    .filter((item): item is AddressSuggestion => item !== null);
}

export function geocodeLocally(query: string): GeocodeResult {
  const normalized = normalizeAddressKey(query);
  const parsed = parseKoreanAddress(normalized);
  return {
    query: normalized,
    lat: 0,
    lng: 0,
    roadAddress: "",
    jibunAddress: "",
    displayAddress: parsed.label || normalized,
    parsed,
    source: "local",
  };
}

export async function resolveGeocode(query: string): Promise<GeocodeResult> {
  const kakao = await geocodeWithKakao(query);
  if (kakao) {
    return kakao;
  }
  return geocodeLocally(query);
}
