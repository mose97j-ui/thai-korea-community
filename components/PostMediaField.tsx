"use client";

import { useRef, useState } from "react";
import { ErrorMessage, postFormPanelClassName, secondaryButtonClassName, inputClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import {
  MAX_POST_IMAGES,
  readPostImage,
  type PostMediaErrorKey,
} from "@/lib/posts/media";

type PostMediaFieldProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
};

const mediaErrorKeys: Record<PostMediaErrorKey, string> = {
  POST_IMAGE_INVALID: "post.errorImageInvalid",
  POST_IMAGE_TOO_LARGE: "post.errorImageTooLarge",
  POST_IMAGE_LIMIT: "post.errorImageLimit",
};

export default function PostMediaField({
  images,
  onImagesChange,
  videoUrl,
  onVideoUrlChange,
}: PostMediaFieldProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setError("");
    let nextImages = [...images];

    for (const file of Array.from(files)) {
      if (nextImages.length >= MAX_POST_IMAGES) {
        setError(t("post.errorImageLimit"));
        break;
      }

      const result = await readPostImage(file, nextImages.length);
      if (!result.ok) {
        setError(t(mediaErrorKeys[result.errorKey] as "post.errorImageInvalid"));
        continue;
      }
      nextImages = [...nextImages, result.dataUrl];
    }

    onImagesChange(nextImages);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-4 ${postFormPanelClassName}`}>
      <div>
        <p className="mb-3 text-base font-semibold text-gray-900">{t("post.photos")}</p>
        {images.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <div key={`${index}-${image.slice(0, 24)}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover ring-1 ring-black/[0.06]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                  aria-label={t("post.removePhoto")}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={images.length >= MAX_POST_IMAGES}
          className={secondaryButtonClassName}
        >
          {t("post.addPhoto")}
        </button>
        <p className="mt-2 text-sm text-gray-500">
          {t("post.photoHint").replace("{count}", String(MAX_POST_IMAGES))}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-base font-semibold text-gray-900">
          {t("post.videoLink")}
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(event) => onVideoUrlChange(event.target.value)}
          placeholder={t("post.videoLinkPlaceholder")}
          className={inputClassName}
        />
        <p className="mt-2 text-sm text-gray-500">{t("post.videoLinkHint")}</p>
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
