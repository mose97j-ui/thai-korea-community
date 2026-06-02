"use client";

import { useState } from "react";
import {
  Card,
  SectionLabel,
  pillSecondaryButtonClassName,
  primaryButtonClassName,
} from "@/components/ui";
import {
  MenuCategoryFields,
  MenuSubFields,
  newMenuSubDraft,
  shouldAutoSuggestMenuIcon,
  type MenuSubDraft,
  updateSubDraftIcon,
} from "@/components/MenuFormFields";
import { useLocale } from "@/contexts/LocaleContext";
import { isMenuIconImage } from "@/lib/categories/menuIcon";
import { suggestMenuIconForTemplate } from "@/lib/categories/menuIconMatch";
import { MENU_TINT_PRESETS } from "@/lib/categories/tintPresets";
import type { MessageKey } from "@/lib/i18n/messages";
import type { PostFormTemplateId } from "@/lib/posts/formTemplateTypes";

export type MenuAddCategoryPayload = {
  label: string;
  icon: string;
  tint: string;
  formTemplate: PostFormTemplateId;
  premium: boolean;
  iconImagePolicyAccepted: boolean;
  subcategories: { title: string; description: string; icon: string }[];
};

type MenuAddCategoryFormProps = {
  sectionLabelKey: MessageKey;
  showPremium?: boolean;
  allowIconImage?: boolean;
  submitLabelKey: MessageKey;
  onCancel: () => void;
  onSubmit: (payload: MenuAddCategoryPayload) => { ok: true } | { ok: false; errorKey: MessageKey };
};

export default function MenuAddCategoryForm({
  sectionLabelKey,
  showPremium = false,
  allowIconImage = false,
  submitLabelKey,
  onCancel,
  onSubmit,
}: MenuAddCategoryFormProps) {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📌");
  const [iconManual, setIconManual] = useState(false);
  const [iconImagePolicyAccepted, setIconImagePolicyAccepted] = useState(false);
  const [tint, setTint] = useState<string>(MENU_TINT_PRESETS[0].className);
  const [formTemplate, setFormTemplate] = useState<PostFormTemplateId>("article");
  const [premium, setPremium] = useState(false);
  const [subs, setSubs] = useState<MenuSubDraft[]>([newMenuSubDraft()]);

  const applySuggestedIcon = (text: string, manual: boolean, currentIcon: string) => {
    if (!shouldAutoSuggestMenuIcon(currentIcon, manual)) {
      return;
    }
    const suggested = suggestMenuIconForTemplate(formTemplate, text);
    setIcon(suggested.icon);
    setTint(suggested.tint);
  };

  const handleSubmit = () => {
    setError("");
    if (isMenuIconImage(icon) && allowIconImage && !iconImagePolicyAccepted) {
      setError(t("userMenu.errorIconImagePolicy"));
      return;
    }
    const result = onSubmit({
      label,
      icon,
      tint,
      formTemplate,
      premium,
      iconImagePolicyAccepted,
      subcategories: subs
        .filter((sub) => sub.title.trim())
        .map((sub) => ({
          title: sub.title,
          description: sub.description,
          icon: sub.icon,
        })),
    });
    if (!result.ok) {
      setError(t(result.errorKey));
    }
  };

  return (
    <Card className="space-y-4">
      <SectionLabel>{t(sectionLabelKey)}</SectionLabel>
      <MenuCategoryFields
        label={label}
        icon={icon}
        tint={tint}
        premium={premium}
        formTemplate={formTemplate}
        showTemplate
        showPremium={showPremium}
        allowIconImage={allowIconImage}
        iconManual={iconManual}
        iconImagePolicyAccepted={iconImagePolicyAccepted}
        onLabelChange={(value) => {
          setLabel(value);
          applySuggestedIcon(value, iconManual, icon);
        }}
        onIconChange={(value) => {
          if (isMenuIconImage(value)) {
            setIconManual(true);
            setIcon(value);
            return;
          }
          setIconManual(true);
          setIcon(value);
        }}
        onIconImagePolicyAcceptedChange={setIconImagePolicyAccepted}
        onUseAutoEmoji={() => {
          setIconManual(false);
          const suggested = suggestMenuIconForTemplate(formTemplate, label);
          setIcon(suggested.icon);
          setTint(suggested.tint);
        }}
        onTintChange={setTint}
        onPremiumChange={setPremium}
        onFormTemplateChange={(value) => {
          setFormTemplate(value);
          if (shouldAutoSuggestMenuIcon(icon, iconManual)) {
            const suggested = suggestMenuIconForTemplate(value, label);
            setIcon(suggested.icon);
            setTint(suggested.tint);
          }
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <SectionLabel>{t("operatorMenu.subListTitle")}</SectionLabel>
        <span className="text-ui-caption">
          {t("operatorMenu.subCount").replace(
            "{count}",
            String(subs.filter((sub) => sub.title.trim()).length)
          )}
        </span>
      </div>
      <p className="text-ui-caption -mt-2">{t("operatorMenu.subListHint")}</p>

      <div className="space-y-3">
        {subs.map((sub, index) => (
          <div key={sub.key} className="rounded-xl bg-[#F0F2F5] p-4 ring-1 ring-black/[0.06]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-ui-caption font-semibold">
                {t("operatorMenu.subItemLabel").replace("{index}", String(index + 1))}
              </span>
              {subs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setSubs((rows) => rows.filter((row) => row.key !== sub.key))}
                  className="text-xs font-semibold text-rose-600"
                >
                  {t("operatorMenu.removeSubRow")}
                </button>
              ) : null}
            </div>
            <MenuSubFields
              title={sub.title}
              description={sub.description}
              icon={sub.icon}
              iconManual={sub.iconManual}
              onTitleChange={(value) => {
                setSubs((rows) =>
                  rows.map((row) => {
                    if (row.key !== sub.key) {
                      return row;
                    }
                    const nextIcon = updateSubDraftIcon(value, row.iconManual);
                    return {
                      ...row,
                      title: value,
                      ...(nextIcon ? { icon: nextIcon } : {}),
                    };
                  })
                );
              }}
              onDescriptionChange={(value) =>
                setSubs((rows) =>
                  rows.map((row) => (row.key === sub.key ? { ...row, description: value } : row))
                )
              }
              onIconChange={(value) =>
                setSubs((rows) =>
                  rows.map((row) =>
                    row.key === sub.key ? { ...row, icon: value, iconManual: true } : row
                  )
                )
              }
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSubs((rows) => [...rows, newMenuSubDraft()])}
        className={pillSecondaryButtonClassName}
      >
        + {t("operatorMenu.addSubRow")}
      </button>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleSubmit} className={primaryButtonClassName}>
          {t(submitLabelKey)}
        </button>
        <button type="button" onClick={onCancel} className={pillSecondaryButtonClassName}>
          {t("home.quickWriteClose")}
        </button>
      </div>
    </Card>
  );
}
