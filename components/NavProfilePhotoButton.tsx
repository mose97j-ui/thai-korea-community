"use client";

import { useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { readProfileImage } from "@/lib/auth/profileImage";
import type { User } from "@/lib/auth/types";

export default function NavProfilePhotoButton({ user }: { user: User }) {
  const { t, te } = useLocale();
  const { updateProfileImage } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || isUpdating) {
      return;
    }

    setFeedback(null);
    setIsUpdating(true);

    const result = await readProfileImage(file);
    if (!result.ok) {
      setFeedback({ type: "error", text: te(result.errorKey) });
      setIsUpdating(false);
      return;
    }

    const saved = updateProfileImage(result.dataUrl);
    setIsUpdating(false);

    if (!saved.ok) {
      setFeedback({ type: "error", text: te(saved.errorKey) });
      return;
    }

    setFeedback({ type: "ok", text: t("mypage.profilePhotoSaved") });
    window.setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUpdating}
        aria-label={t("nav.changeProfilePhoto")}
        className="group relative w-full max-w-[4.5rem] shrink-0 rounded-none transition active:scale-[0.98] disabled:opacity-70"
      >
        <UserAvatar user={user} size="nav" shape="sharp" className="mx-auto" />
        <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-black/0 pb-1 transition group-hover:bg-black/35">
          <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
            {isUpdating ? t("common.loading") : "📷"}
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {feedback ? (
        <p
          className={`max-w-full text-center text-[10px] leading-snug ${
            feedback.type === "ok" ? "text-[#06C755]" : "text-red-500"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
