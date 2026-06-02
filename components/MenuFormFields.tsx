"use client";

import { inputClassName } from "@/components/ui";
import MenuIcon from "@/components/MenuIcon";
import MenuIconImageField from "@/components/MenuIconImageField";
import { useLocale } from "@/contexts/LocaleContext";
import { isMenuIconImage } from "@/lib/categories/menuIcon";
import { DEFAULT_SUB_DESCRIPTION_TH, suggestMenuIcon } from "@/lib/categories/menuIconMatch";
import { MENU_TINT_PRESETS } from "@/lib/categories/tintPresets";
import type { PostFormTemplateId } from "@/lib/posts/formTemplateTypes";

export const MENU_TEMPLATE_OPTIONS: {
  id: PostFormTemplateId;
  labelKey: "userMenu.templateArticle" | "userMenu.templatePlace" | "userMenu.templateJob";
}[] = [
  { id: "article", labelKey: "userMenu.templateArticle" },
  { id: "place", labelKey: "userMenu.templatePlace" },
  { id: "job", labelKey: "userMenu.templateJob" },
];

export type MenuSubDraft = {
  key: string;
  title: string;
  description: string;
  iconManual: boolean;
  icon: string;
};

export function newMenuSubDraft(): MenuSubDraft {
  return {
    key: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: "",
    description: DEFAULT_SUB_DESCRIPTION_TH,
    iconManual: false,
    icon: "📌",
  };
}

export function MenuCategoryFields({
  label,
  icon,
  tint,
  premium,
  formTemplate,
  showTemplate,
  showPremium,
  allowIconImage,
  iconManual,
  iconImagePolicyAccepted,
  onLabelChange,
  onIconChange,
  onIconImagePolicyAcceptedChange,
  onUseAutoEmoji,
  onTintChange,
  onPremiumChange,
  onFormTemplateChange,
}: {
  label: string;
  icon: string;
  tint: string;
  premium: boolean;
  formTemplate: PostFormTemplateId;
  showTemplate?: boolean;
  showPremium?: boolean;
  allowIconImage?: boolean;
  iconManual?: boolean;
  iconImagePolicyAccepted?: boolean;
  onLabelChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onIconImagePolicyAcceptedChange?: (value: boolean) => void;
  onUseAutoEmoji?: () => void;
  onTintChange: (value: string) => void;
  onPremiumChange: (value: boolean) => void;
  onFormTemplateChange: (value: PostFormTemplateId) => void;
}) {
  const { t } = useLocale();
  const usingImage = isMenuIconImage(icon);
  const showAutoBadge = !iconManual && !usingImage;

  return (
    <>
      <label className="block space-y-1">
        <span className="text-ui-caption">{t("operatorMenu.labelThOnly")}</span>
        <input value={label} onChange={(e) => onLabelChange(e.target.value)} className={inputClassName} />
      </label>

      <div className={`grid gap-3 ${showTemplate ? "sm:grid-cols-2" : ""}`}>
        <label className="block space-y-1">
          <span className="text-ui-caption">
            {t("userMenu.icon")}{" "}
            {showAutoBadge ? (
              <span className="text-[#06C755]">({t("operatorMenu.iconAuto")})</span>
            ) : null}
          </span>
          {usingImage ? (
            <p className="rounded-xl bg-white px-3 py-2.5 text-sm text-gray-600 ring-1 ring-black/[0.06]">
              {t("userMenu.iconImageActive")}
            </p>
          ) : (
            <input
              value={icon}
              onChange={(e) => onIconChange(e.target.value)}
              maxLength={8}
              className={inputClassName}
            />
          )}
        </label>
        {showTemplate ? (
          <label className="block space-y-1">
            <span className="text-ui-caption">{t("userMenu.formTemplate")}</span>
            <select
              value={formTemplate}
              onChange={(e) => onFormTemplateChange(e.target.value as PostFormTemplateId)}
              className={inputClassName}
            >
              {MENU_TEMPLATE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {allowIconImage && onIconImagePolicyAcceptedChange && onUseAutoEmoji ? (
        <MenuIconImageField
          icon={icon}
          tint={tint}
          policyAccepted={Boolean(iconImagePolicyAccepted)}
          onPolicyAcceptedChange={onIconImagePolicyAcceptedChange}
          onIconChange={onIconChange}
          onUseAutoEmoji={onUseAutoEmoji}
        />
      ) : null}

      <div>
        <span className="text-ui-caption">{t("userMenu.tint")}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {MENU_TINT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onTintChange(preset.className)}
              className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-lg ring-1 ring-black/[0.08] ${preset.className} ${
                tint === preset.className ? "ring-2 ring-[#06C755]" : ""
              }`}
            >
              <MenuIcon icon={icon} emojiClassName="text-lg" imageClassName="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      {showPremium ? (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={premium}
            onChange={(e) => onPremiumChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t("operatorMenu.premiumToggle")}
        </label>
      ) : null}
    </>
  );
}

export function MenuSubFields({
  title,
  description,
  icon,
  iconManual,
  onTitleChange,
  onDescriptionChange,
  onIconChange,
}: {
  title: string;
  description: string;
  icon: string;
  iconManual?: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
}) {
  const { t } = useLocale();

  return (
    <>
      <label className="block space-y-1">
        <span className="text-ui-caption">{t("operatorMenu.subTitleThOnly")}</span>
        <input value={title} onChange={(e) => onTitleChange(e.target.value)} className={inputClassName} />
      </label>
      <label className="block space-y-1">
        <span className="text-ui-caption">{t("operatorMenu.subDescThOnly")}</span>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={2}
          className={`${inputClassName} !rounded-xl`}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-ui-caption">
          {t("userMenu.icon")}{" "}
          {iconManual === false ? (
            <span className="text-[#06C755]">({t("operatorMenu.iconAuto")})</span>
          ) : null}
        </span>
        <input
          value={icon}
          onChange={(e) => onIconChange(e.target.value)}
          maxLength={8}
          className={inputClassName}
        />
      </label>
    </>
  );
}

export function updateSubDraftIcon(title: string, iconManual: boolean): string | undefined {
  if (iconManual) {
    return undefined;
  }
  return suggestMenuIcon(title).icon;
}

export function shouldAutoSuggestMenuIcon(icon: string, iconManual: boolean): boolean {
  return !iconManual && !isMenuIconImage(icon);
}
