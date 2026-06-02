import type { GeocodeResult } from "@/lib/maps/types";
import type { ParsedAddressParts } from "@/lib/posts/addressParse";

export async function fetchGeocode(query: string): Promise<GeocodeResult | null> {
  const normalized = query.trim();
  if (!normalized) {
    return null;
  }

  try {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(normalized)}`);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      ok?: boolean;
      geocode?: GeocodeResult;
      parsed?: ParsedAddressParts;
    };

    if (data.ok && data.geocode) {
      return data.geocode;
    }

    if (data.ok && data.parsed) {
      return {
        query: normalized,
        lat: 0,
        lng: 0,
        roadAddress: "",
        jibunAddress: "",
        displayAddress: data.parsed.label || normalized,
        parsed: data.parsed,
        source: "local",
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function fetchAddressSuggestions(query: string) {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/address-search?q=${encodeURIComponent(normalized)}`
    );
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      ok?: boolean;
      suggestions?: Array<{
        label: string;
        roadAddress: string;
        jibunAddress: string;
        displayAddress: string;
        lat: number;
        lng: number;
      }>;
    };

    return data.ok ? (data.suggestions ?? []) : [];
  } catch {
    return [];
  }
}
