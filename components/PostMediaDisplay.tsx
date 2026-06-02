"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { parseVideoLink } from "@/lib/posts/media";

type PostMediaDisplayProps = {
  images?: string[];
  videoUrl?: string;
  compact?: boolean;
};

export default function PostMediaDisplay({
  images = [],
  videoUrl,
  compact = false,
}: PostMediaDisplayProps) {
  const { t } = useLocale();
  const video = videoUrl ? parseVideoLink(videoUrl) : null;

  if (images.length === 0 && !video) {
    return null;
  }

  const visibleImages = compact ? images.slice(0, 1) : images;
  const extraCount = compact && images.length > 1 ? images.length - 1 : 0;

  return (
    <div className={compact ? "mt-3" : "mt-4 space-y-4"}>
      {visibleImages.length > 0 && (
        <div
          className={`relative grid gap-2 ${
            compact || visibleImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {visibleImages.map((image, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${index}-${image.slice(0, 24)}`}
              src={image}
              alt=""
              className={`w-full rounded-xl object-cover ring-1 ring-black/[0.06] ${
                compact ? "max-h-64 sm:max-h-80" : "max-h-[28rem] sm:max-h-[32rem]"
              }`}
            />
          ))}
          {extraCount > 0 ? (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              +{extraCount}
            </span>
          ) : null}
        </div>
      )}

      {video && (
        <div className="overflow-hidden rounded-xl ring-1 ring-black/[0.06]">
          {video.embedUrl ? (
            <div
              className={`relative w-full bg-black ${
                compact ? "aspect-[16/10] max-h-64 sm:max-h-80" : "aspect-video max-h-[28rem]"
              }`}
            >
              <iframe
                src={video.embedUrl}
                title={t("post.videoPlayer")}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#F0F2F5] px-4 py-4 text-base font-semibold text-[#06C755] transition active:scale-[0.99]"
            >
              <span className="text-2xl">▶️</span>
              <span className="break-all">{t("post.openVideoLink")}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
