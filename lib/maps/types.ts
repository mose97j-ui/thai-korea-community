import type { ParsedAddressParts } from "@/lib/posts/addressParse";

export type GeocodeResult = {
  query: string;
  lat: number;
  lng: number;
  roadAddress: string;
  jibunAddress: string;
  displayAddress: string;
  parsed: ParsedAddressParts;
  source: "kakao" | "local";
};

export type AddressSuggestion = {
  label: string;
  roadAddress: string;
  jibunAddress: string;
  displayAddress: string;
  lat: number;
  lng: number;
  parsed: ParsedAddressParts;
};
