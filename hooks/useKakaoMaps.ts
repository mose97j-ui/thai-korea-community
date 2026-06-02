"use client";

import { useEffect, useState } from "react";

const KAKAO_MAP_KEY =
  process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "YOUR_KAKAO_MAP_KEY";

let scriptPromise: Promise<void> | null = null;

function loadKakaoMapsScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("browser_only"));
  }

  const w = window as Window & { kakao?: { maps?: unknown } };
  if (w.kakao?.maps) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-maps="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("kakao_load_failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_MAP_KEY)}&libraries=services`;
    script.async = true;
    script.dataset.kakaoMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("kakao_load_failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function useKakaoMaps() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadKakaoMapsScript()
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setError("kakao_load_failed");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { ready, error, appKey: KAKAO_MAP_KEY };
}

export async function geocodeWithKakaoClient(
  query: string
): Promise<{ lat: number; lng: number; roadAddress?: string; jibunAddress?: string } | null> {
  await loadKakaoMapsScript();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const kakao = (window as any).kakao;
  if (!kakao?.maps?.services) {
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (result: any, status: any) => {
      if (status !== kakao.maps.services.Status.OK || !result?.length) {
        resolve(null);
        return;
      }

      const item = result[0];
      resolve({
        lat: Number(item.y),
        lng: Number(item.x),
        roadAddress: item.road_address?.address_name,
        jibunAddress: item.address?.address_name,
      });
    });
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
