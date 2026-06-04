"use client";

import { useRef, useState } from "react";
import PostMediaDisplay from "@/components/PostMediaDisplay";
import {
  compactSecondaryButtonClassName,
  ErrorMessage,
  inputClassName,
  primaryButtonClassName,
} from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import {
  MAX_POST_IMAGES,
  readPostImage,
  validateVideoUrl,
  type PostMediaErrorKey,
} from "@/lib/posts/media";
import type { MessageSendMode } from "@/lib/social/types";

export type MessageComposerPayload = {
  content: string;
  sendMode: MessageSendMode;
  images: string[];
  videoUrl: string;
};

type MessageComposerProps = {
  onSend: (payload: MessageComposerPayload) => void | Promise<void>;
  disabled?: boolean;
  compact?: boolean;
  showIdentityToggle?: boolean;
  defaultSendMode?: MessageSendMode;
  placeholder?: string;
  relatedPostTitle?: string;
};

const mediaErrorKeys: Record<PostMediaErrorKey, string> = {
  POST_IMAGE_INVALID: "post.errorImageInvalid",
  POST_IMAGE_TOO_LARGE: "post.errorImageTooLarge",
  POST_IMAGE_LIMIT: "post.errorImageLimit",
};

export default function MessageComposer({
  onSend,
  disabled = false,
  compact = false,
  showIdentityToggle = true,
  defaultSendMode = "nickname",
  placeholder,
  relatedPostTitle,
}: MessageComposerProps) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [sendMode, setSendMode] = useState<MessageSendMode>(defaultSendMode);
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setMediaError("");
    let nextImages = [...images];

    for (const file of Array.from(files)) {
      if (nextImages.length >= MAX_POST_IMAGES) {
        setMediaError(t("post.errorImageLimit"));
        break;
      }

      const result = await readPostImage(file, nextImages.length);
      if (!result.ok) {
        setMediaError(t(mediaErrorKeys[result.errorKey] as "post.errorImageInvalid"));
        continue;
      }
      nextImages = [...nextImages, result.dataUrl];
    }

    setImages(nextImages);
    setShowMedia(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled || isSending) {
      return;
    }

    const trimmedVideo = videoUrl.trim();
    const hasText = content.trim().length > 0;
    const hasMedia = images.length > 0 || Boolean(trimmedVideo);

    if (!hasText && !hasMedia) {
      setSubmitError(t("social.messageEmpty"));
      return;
    }

    if (trimmedVideo && !validateVideoUrl(trimmedVideo)) {
      setSubmitError(t("post.errorVideoLink"));
      return;
    }

    setSubmitError("");
    setIsSending(true);

    try {
      await onSend({
        content: content.trim(),
        sendMode,
        images,
        videoUrl: trimmedVideo,
      });
      setContent("");
      setImages([]);
      setVideoUrl("");
      setShowMedia(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className={`border-t border-gray-200 bg-white ${
        compact ? "px-3 py-3" : "px-4 py-4"
      }`}
    >
      {relatedPostTitle ? (
        <p className="mb-3 rounded-xl bg-[#F0F2F5] px-3 py-2 text-sm text-gray-600 ring-1 ring-black/[0.04]">
          {t("social.relatedPost")}: {relatedPostTitle}
        </p>
      ) : null}

      {showIdentityToggle ? (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setSendMode("nickname")}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              sendMode === "nickname"
                ? "bg-[#06C755] text-white"
                : "bg-[#F0F2F5] text-gray-700 ring-1 ring-black/[0.06]"
            }`}
          >
            {t("social.sendAsNickname")}
          </button>
          <button
            type="button"
            onClick={() => setSendMode("anonymous")}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              sendMode === "anonymous"
                ? "bg-gray-900 text-white"
                : "bg-[#F0F2F5] text-gray-700 ring-1 ring-black/[0.06]"
            }`}
          >
            {t("social.sendAsAnonymous")}
          </button>
        </div>
      ) : null}

      {(showMedia || images.length > 0 || videoUrl) && (
        <div className="mb-3 space-y-3 rounded-xl bg-[#F0F2F5] p-3 ring-1 ring-black/[0.06]">
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={`${index}-${image.slice(0, 20)}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover ring-1 ring-black/[0.06]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((current) => current.filter((_, i) => i !== index))
                    }
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                    aria-label={t("post.removePhoto")}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            type="url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder={t("post.videoLinkPlaceholder")}
            className={inputClassName}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || images.length >= MAX_POST_IMAGES}
            className={compactSecondaryButtonClassName}
            aria-label={t("post.addPhoto")}
          >
            📷
          </button>
          <button
            type="button"
            onClick={() => setShowMedia((value) => !value)}
            disabled={disabled}
            className={compactSecondaryButtonClassName}
            aria-label={t("post.videoLink")}
          >
            ▶️
          </button>
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={placeholder ?? t("social.messagePlaceholder")}
          rows={compact ? 2 : 3}
          maxLength={1000}
          disabled={disabled || isSending}
          className={`min-w-0 flex-1 resize-none !bg-white !text-[#050505] ${inputClassName}`}
        />

        <button
          type="submit"
          disabled={disabled || isSending}
          className={`shrink-0 self-end ${primaryButtonClassName} !px-4 !py-3 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isSending ? t("common.loading") : t("social.send")}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {mediaError ? <div className="mt-2"><ErrorMessage message={mediaError} /></div> : null}
      {submitError ? <div className="mt-2"><ErrorMessage message={submitError} /></div> : null}

      {sendMode === "anonymous" ? (
        <p className="mt-2 text-xs text-gray-500">{t("social.anonymousHint")}</p>
      ) : null}
    </form>
  );
}
