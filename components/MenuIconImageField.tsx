"use client";

import { useRef, useState } from "react";
import MenuIcon from "@/components/MenuIcon";
import { ErrorMessage, pillSecondaryButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { isMenuIconImage } from "@/lib/categories/menuIcon";
import { readMenuIconImage } from "@/lib/categories/menuIconImage";

type MenuIconImageFieldProps = {
  icon: string;
  tint: string;
  policyAccepted: boolean;
  onPolicyAcceptedChange: (value: boolean) => void;
  onIconChange: (value: string) => void;
  onUseAutoEmoji: () => void;
};

export default function MenuIconImageField({
  icon,
  tint,
  policyAccepted,
  onPolicyAcceptedChange,
  onIconChange,
  onUseAutoEmoji,
}: MenuIconImageFieldProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const usingImage = isMenuIconImage(icon);

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setError("");
    if (!policyAccepted) {
      setError(t("userMenu.errorIconImagePolicy"));
      return;
    }

    const result = await readMenuIconImage(file);
    if (!result.ok) {
      setError(t(result.errorKey));
      return;
    }

    onIconChange(result.dataUrl);
  };

  return (
    <div className="space-y-3 rounded-xl bg-[#F0F2F5] p-4 ring-1 ring-black/[0.06]">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] text-3xl ${tint} ring-1 ring-black/[0.08]`}
        >
          <MenuIcon icon={icon} emojiClassName="text-3xl" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-ui-caption">{t("userMenu.iconImageHint")}</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={pillSecondaryButtonClassName}
            >
              {usingImage ? t("userMenu.iconImageChange") : t("userMenu.iconImageUpload")}
            </button>
            {usingImage ? (
              <button
                type="button"
                onClick={onUseAutoEmoji}
                className={pillSecondaryButtonClassName}
              >
                {t("userMenu.iconImageRemove")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={policyAccepted}
          onChange={(event) => onPolicyAcceptedChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
        />
        <span>{t("userMenu.iconImagePolicy")}</span>
      </label>

      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}
