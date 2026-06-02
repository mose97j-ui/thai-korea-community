"use client";

import { useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { ErrorMessage, secondaryButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { readProfileImage } from "@/lib/auth/profileImage";
import type { User } from "@/lib/auth/types";

type ProfilePhotoFieldProps = {
  value: string;
  onChange: (dataUrl: string) => void;
  previewUser?: Pick<User, "name" | "nickname" | "role">;
  shape?: "round" | "square";
};

export default function ProfilePhotoField({
  value,
  onChange,
  previewUser,
  shape = "round",
}: ProfilePhotoFieldProps) {
  const { t, te } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const preview: User = {
    id: "preview",
    name: previewUser?.name || t("signup.nickname"),
    nickname: previewUser?.nickname?.trim() || previewUser?.name || t("signup.nickname"),
    birthDate: "2000-01-01",
    hometown: "",
    gmail: "",
    koreanPhone: "",
    personalCode: "",
    password: "",
    profileImage: value || undefined,
    role: previewUser?.role,
    createdAt: new Date().toISOString(),
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setError("");
    const result = await readProfileImage(file);
    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }
    onChange(result.dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#F0F2F5] p-5 ring-1 ring-black/[0.06]">
        <UserAvatar user={preview} size="lg" shape={shape} />
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={secondaryButtonClassName}
        >
          {value ? t("signup.profileChange") : t("signup.profileSelect")}
        </button>
        <p className="text-center text-sm text-gray-500">{t("signup.profileHint")}</p>
      </div>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
