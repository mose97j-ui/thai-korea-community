"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { geocodeWithKakaoClient, useKakaoMaps } from "@/hooks/useKakaoMaps";
import { fetchGeocode } from "@/lib/maps/clientGeocode";
import { buildDisplayAddress } from "@/lib/maps/formatAddress";

export type KakaoMapMarker = {
  id: string;
  lat?: number;
  lng?: number;
  title: string;
  subtitle?: string;
  content?: string;
  address?: string;
};

type KakaoMapViewProps = {
  markers: KakaoMapMarker[];
  center?: { lat: number; lng: number };
  level?: number;
  className?: string;
  heightClassName?: string;
  onMarkerClick?: (markerId: string) => void;
};

type ResolvedMarker = KakaoMapMarker & { lat: number; lng: number };

export default function KakaoMapView({
  markers,
  center,
  level = 5,
  className = "",
  heightClassName = "h-72 sm:h-80",
  onMarkerClick,
}: KakaoMapViewProps) {
  const { t } = useLocale();
  const { ready, error } = useKakaoMaps();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRefs = useRef<unknown[]>([]);
  const infoWindowRef = useRef<unknown>(null);

  const markerKey = useMemo(
    () =>
      markers
        .map((marker) => `${marker.id}:${marker.lat ?? ""}:${marker.lng ?? ""}:${marker.address ?? ""}`)
        .join("|"),
    [markers]
  );

  useEffect(() => {
    if (!ready || !mapRef.current) {
      return;
    }

    let cancelled = false;

    async function initMap() {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const kakao = (window as any).kakao;
      if (!kakao?.maps || !mapRef.current) {
        return;
      }

      const resolved: ResolvedMarker[] = [];
      for (const marker of markers) {
        if (marker.lat != null && marker.lng != null) {
          resolved.push({ ...marker, lat: marker.lat, lng: marker.lng });
          continue;
        }

        if (!marker.address?.trim()) {
          continue;
        }

        const server = await fetchGeocode(marker.address);
        if (server?.lat && server.lng) {
          resolved.push({ ...marker, lat: server.lat, lng: server.lng });
          continue;
        }

        const client = await geocodeWithKakaoClient(marker.address);
        if (client) {
          resolved.push({ ...marker, lat: client.lat, lng: client.lng });
        }
      }

      if (cancelled || !mapRef.current) {
        return;
      }

      markerRefs.current.forEach((marker) => {
        (marker as { setMap?: (map: unknown | null) => void }).setMap?.(null);
      });
      markerRefs.current = [];

      const fallbackCenter =
        center ??
        (resolved[0]
          ? { lat: resolved[0].lat, lng: resolved[0].lng }
          : { lat: 37.5665, lng: 126.978 });

      const map =
        mapInstanceRef.current ??
        new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(fallbackCenter.lat, fallbackCenter.lng),
          level,
        });

      mapInstanceRef.current = map;
      (map as { setCenter: (c: unknown) => void }).setCenter(
        new kakao.maps.LatLng(fallbackCenter.lat, fallbackCenter.lng)
      );
      (map as { setLevel: (l: number) => void }).setLevel?.(level);

      for (const marker of resolved) {
        const position = new kakao.maps.LatLng(marker.lat, marker.lng);
        const mapMarker = new kakao.maps.Marker({ position, map });
        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:10px;min-width:180px;line-height:1.5;">
            <strong>${marker.title}</strong>
            ${marker.subtitle ? `<div style="margin-top:4px;color:#666;">${marker.subtitle}</div>` : ""}
            ${marker.content ? `<div style="margin-top:6px;">${marker.content}</div>` : ""}
          </div>`,
        });

        kakao.maps.event.addListener(mapMarker, "click", () => {
          if (infoWindowRef.current) {
            (infoWindowRef.current as { close: () => void }).close();
          }
          infoWindow.open(map, mapMarker);
          infoWindowRef.current = infoWindow;
          onMarkerClick?.(marker.id);
        });

        markerRefs.current.push(mapMarker);
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }

    void initMap();

    return () => {
      cancelled = true;
    };
  }, [ready, markerKey, center, level, markers, onMarkerClick]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500 ${heightClassName} ${className}`}
      >
        {t("map.loadFailed")}
      </div>
    );
  }

  return (
    <div className={className}>
      {!ready ? (
        <div
          className={`flex items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500 ${heightClassName}`}
        >
          {t("map.loading")}
        </div>
      ) : null}
      <div
        ref={mapRef}
        className={`${heightClassName} w-full overflow-hidden rounded-2xl ${ready ? "" : "hidden"}`}
      />
    </div>
  );
}

export function getPostMapLabel(post: {
  displayAddress?: string;
  roadAddress?: string;
  jibunAddress?: string;
  address?: string;
}): string {
  return (
    post.displayAddress ||
    buildDisplayAddress({
      roadAddress: post.roadAddress,
      jibunAddress: post.jibunAddress,
      fallback: post.address,
    }) ||
    post.address ||
    ""
  );
}
