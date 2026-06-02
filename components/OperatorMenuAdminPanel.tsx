"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomeSubItem } from "@/lib/i18n/content";
import {
  Card,
  pillSecondaryButtonClassName,
  primaryButtonClassName,
} from "@/components/ui";
import MenuAddCategoryForm from "@/components/MenuAddCategoryForm";
import {
  MenuCategoryFields,
  MenuSubFields,
  shouldAutoSuggestMenuIcon,
} from "@/components/MenuFormFields";
import { useLocale } from "@/contexts/LocaleContext";
import { isMenuIconImage } from "@/lib/categories/menuIcon";
import { DEFAULT_SUB_DESCRIPTION_TH, suggestMenuIcon, suggestMenuIconForTemplate } from "@/lib/categories/menuIconMatch";
import {
  createOperatorCategory,
  createOperatorSubCategory,
  deleteOperatorCategory,
  deleteSubCategory,
  getCategoryOverride,
  getOperatorCategoryById,
  getOperatorSubCategoryById,
  getSubCategoryOverride,
  isBuiltInCategoryId,
  isCategoryHidden,
  isOperatorCategoryId,
  resetBuiltInCategoryOverride,
  setCategoryHidden,
  setSubCategoryHidden,
  updateBuiltInCategory,
  updateOperatorCategory,
  updateSubCategory,
} from "@/lib/categories/operatorMenus";
import { homeCategories, homeCategoryItems } from "@/lib/i18n/content";
import type { PostFormTemplateId } from "@/lib/posts/formTemplateTypes";

export function OperatorSubCategoryTileControls({
  subId,
  hidden,
  onEdit,
  onSaved,
  onError,
}: {
  subId: string;
  hidden: boolean;
  onEdit: () => void;
  onSaved: () => void;
  onError?: (message: string) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="absolute left-1 top-1 z-10 flex flex-col gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onEdit();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs shadow-sm ring-1 ring-black/[0.08]"
        aria-label={t("operatorMenu.editSubcategory")}
      >
        ✏️
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          const result = setSubCategoryHidden(subId, !hidden);
          if (result.ok) {
            onSaved();
          } else if (onError) {
            onError(t(result.errorKey));
          }
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs shadow-sm ring-1 ring-black/[0.08]"
        aria-label={hidden ? t("operatorMenu.showSubcategory") : t("operatorMenu.hideSubcategory")}
      >
        {hidden ? "👁" : "🙈"}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          const result = deleteSubCategory(subId);
          if (!result.ok) {
            onError?.(t(result.errorKey));
            return;
          }
          onSaved();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs text-rose-600 shadow-sm ring-1 ring-black/[0.08]"
        aria-label={t("operatorMenu.deleteSubcategory")}
      >
        ✕
      </button>
    </div>
  );
}

type OperatorMenuAdminPanelProps = {
  editingCategoryId: string | null;
  menuEditMode: boolean;
  onClose: () => void;
  onSaved: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
};

export function OperatorMenuTileControls({
  categoryId,
  onEdit,
  onToggleHidden,
}: {
  categoryId: string;
  onEdit: () => void;
  onToggleHidden: () => void;
}) {
  const { t } = useLocale();
  const hidden = isCategoryHidden(categoryId);

  return (
    <div className="absolute left-1 top-1 z-10 flex flex-col gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs shadow-sm ring-1 ring-black/[0.08]"
        aria-label={t("operatorMenu.editCategory")}
      >
        ✏️
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleHidden();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs shadow-sm ring-1 ring-black/[0.08]"
        aria-label={hidden ? t("operatorMenu.showCategory") : t("operatorMenu.hideCategory")}
      >
        {hidden ? "👁" : "🙈"}
      </button>
    </div>
  );
}

export default function OperatorMenuAdminPanel({
  editingCategoryId,
  menuEditMode,
  onClose,
  onSaved,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: OperatorMenuAdminPanelProps) {
  const { t } = useLocale();
  const [addOpen, setAddOpen] = useState(false);
  const [message, setMessage] = useState("");

  const editingCategory = useMemo(
    () =>
      editingCategoryId
        ? homeCategories.find((item) => item.id === editingCategoryId) ??
          getOperatorCategoryById(editingCategoryId)
        : null,
    [editingCategoryId]
  );

  return (
    <div className="mb-3 space-y-3">
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-ui-title text-sm text-amber-900">{t("operatorMenu.manageTitle")}</p>
            <p className="text-ui-caption mt-1 text-amber-800/90">
              {menuEditMode ? t("operatorMenu.unsavedEditHint") : t("operatorMenu.editModeHint")}
            </p>
          </div>
          {menuEditMode ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={onSaveEdit} className={primaryButtonClassName}>
                {t("operatorMenu.saveAll")}
              </button>
              <button type="button" onClick={onCancelEdit} className={pillSecondaryButtonClassName}>
                {t("operatorMenu.cancelEdit")}
              </button>
            </div>
          ) : (
            <button type="button" onClick={onStartEdit} className={primaryButtonClassName}>
              {t("operatorMenu.startEdit")}
            </button>
          )}
        </div>
      </div>

      {!menuEditMode ? null : (
        <>
          {message ? (
            <p className="rounded-xl bg-[#06C755]/10 px-3 py-2 text-sm font-medium text-[#06C755]">
              {message}
            </p>
          ) : null}

          {!addOpen ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className={`w-full ${pillSecondaryButtonClassName}`}
            >
              + {t("operatorMenu.addCategory")}
            </button>
          ) : (
            <MenuAddCategoryForm
              sectionLabelKey="operatorMenu.addCategory"
              showPremium
              allowIconImage
              submitLabelKey="operatorMenu.createCategory"
              onCancel={() => setAddOpen(false)}
              onSubmit={(payload) => {
                const result = createOperatorCategory({
                  label: payload.label,
                  icon: payload.icon,
                  tint: payload.tint,
                  formTemplate: payload.formTemplate,
                  premium: payload.premium,
                  iconImagePolicyAccepted: payload.iconImagePolicyAccepted,
                  subcategories: payload.subcategories,
                });
                if (!result.ok) {
                  return result;
                }
                setAddOpen(false);
                setMessage(t("operatorMenu.pendingSaveHint"));
                onSaved();
                window.setTimeout(() => setMessage(""), 2500);
                return { ok: true as const };
              }}
            />
          )}

          {editingCategoryId && editingCategory ? (
            <OperatorCategoryEditForm
              categoryId={editingCategoryId}
              onClose={onClose}
              onSaved={() => {
                setMessage(t("operatorMenu.pendingSaveHint"));
                onSaved();
                window.setTimeout(() => setMessage(""), 2500);
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function OperatorCategoryEditForm({
  categoryId,
  onClose,
  onSaved,
}: {
  categoryId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, pick } = useLocale();
  const [error, setError] = useState("");
  const builtIn = isBuiltInCategoryId(categoryId);
  const operatorCat = getOperatorCategoryById(categoryId);
  const override = getCategoryOverride(categoryId);
  const base = homeCategories.find((item) => item.id === categoryId);

  const source = builtIn
    ? {
        label: override?.label?.th ?? base!.label.th,
        icon: override?.icon ?? base!.icon,
        tint: override?.tint ?? base!.tint,
        premium: override?.premium ?? base!.premium ?? false,
        formTemplate: "place" as PostFormTemplateId,
      }
    : {
        label: operatorCat!.label.th,
        icon: operatorCat!.icon,
        tint: operatorCat!.tint,
        premium: operatorCat!.premium ?? false,
        formTemplate: operatorCat!.formTemplate,
      };

  const [label, setLabel] = useState(source.label);
  const [icon, setIcon] = useState(source.icon);
  const [iconManual, setIconManual] = useState(true);
  const [iconImagePolicyAccepted, setIconImagePolicyAccepted] = useState(() =>
    isMenuIconImage(source.icon)
  );
  const [tint, setTint] = useState<string>(source.tint);
  const [premium, setPremium] = useState(source.premium);
  const [formTemplate, setFormTemplate] = useState(source.formTemplate);

  useEffect(() => {
    setLabel(source.label);
    setIcon(source.icon);
    setIconManual(true);
    setIconImagePolicyAccepted(isMenuIconImage(source.icon));
    setTint(source.tint);
    setPremium(source.premium);
    setFormTemplate(source.formTemplate);
  }, [categoryId, source.label, source.icon, source.tint, source.premium, source.formTemplate]);

  const persistCategory = () => {
    const result = builtIn
      ? updateBuiltInCategory({
          categoryId,
          label,
          icon,
          tint,
          premium,
          iconImagePolicyAccepted,
        })
      : updateOperatorCategory(categoryId, {
          label,
          icon,
          tint,
          premium,
          formTemplate,
          iconImagePolicyAccepted,
        });
    if (!result.ok) {
      setError(t(result.errorKey));
      return false;
    }
    setError("");
    return true;
  };

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-ui-title text-base">{t("operatorMenu.editCategory")}</h3>
        <p className="text-ui-caption mt-1">{pick({ th: source.label, ko: source.label })}</p>
      </div>
      <MenuCategoryFields
        label={label}
        icon={icon}
        tint={tint}
        premium={premium}
        formTemplate={formTemplate}
        showTemplate={!builtIn}
        showPremium
        allowIconImage
        iconManual={iconManual}
        iconImagePolicyAccepted={iconImagePolicyAccepted}
        onLabelChange={(value) => {
          setLabel(value);
          if (shouldAutoSuggestMenuIcon(icon, iconManual)) {
            const suggested = suggestMenuIconForTemplate(formTemplate, value);
            setIcon(suggested.icon);
            setTint(suggested.tint);
          }
        }}
        onIconChange={(value) => {
          setIconManual(true);
          setIcon(value);
        }}
        onIconImagePolicyAcceptedChange={setIconImagePolicyAccepted}
        onUseAutoEmoji={() => {
          setIconManual(false);
          setIconImagePolicyAccepted(false);
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

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => persistCategory() && onSaved()}
          className={primaryButtonClassName}
        >
          {t("operatorMenu.saveChanges")}
        </button>
        {builtIn ? (
          <button
            type="button"
            onClick={() => {
              const result = resetBuiltInCategoryOverride(categoryId);
              if (result.ok) {
                onSaved();
                onClose();
              }
            }}
            className={pillSecondaryButtonClassName}
          >
            {t("operatorMenu.resetOverride")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const result = deleteOperatorCategory(categoryId);
              if (!result.ok) {
                setError(t(result.errorKey));
                return;
              }
              onSaved();
              onClose();
            }}
            className="text-ui-btn rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200"
          >
            {t("operatorMenu.deleteCategory")}
          </button>
        )}
        <button type="button" onClick={onClose} className={pillSecondaryButtonClassName}>
          {t("home.quickWriteClose")}
        </button>
      </div>
    </Card>
  );
}

export function OperatorSubCategoryAddForm({
  categoryId,
  onSaved,
  onError,
}: {
  categoryId: string;
  onSaved: () => void;
  onError?: (message: string) => void;
}) {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(DEFAULT_SUB_DESCRIPTION_TH);
  const [icon, setIcon] = useState("📌");
  const [iconManual, setIconManual] = useState(false);

  const handleAdd = () => {
    setError("");
    const result = createOperatorSubCategory({
      categoryId,
      title,
      description,
      icon,
    });
    if (!result.ok) {
      const message = t(result.errorKey);
      setError(message);
      onError?.(message);
      return;
    }
    setTitle("");
    setDescription(DEFAULT_SUB_DESCRIPTION_TH);
    setIcon("📌");
    setIconManual(false);
    setAddOpen(false);
    setError("");
    onSaved();
  };

  return (
    <div className="mb-4">
      {!addOpen ? (
        <button type="button" onClick={() => setAddOpen(true)} className={pillSecondaryButtonClassName}>
          + {t("operatorMenu.addSubcategory")}
        </button>
      ) : (
        <div className="space-y-3 rounded-xl bg-[#F0F2F5] p-4 ring-1 ring-black/[0.06]">
          <MenuSubFields
            title={title}
            description={description}
            icon={icon}
            iconManual={iconManual}
            onTitleChange={(value) => {
              setTitle(value);
              if (!iconManual) {
                setIcon(suggestMenuIcon(value).icon);
              }
            }}
            onDescriptionChange={setDescription}
            onIconChange={(value) => {
              setIconManual(true);
              setIcon(value);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleAdd} className={primaryButtonClassName}>
              {t("userMenu.addSubSubmit")}
            </button>
            <button type="button" onClick={() => setAddOpen(false)} className={pillSecondaryButtonClassName}>
              {t("home.quickWriteClose")}
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

export function OperatorSubEditForm({
  categoryId,
  subItem,
  onSaved,
  onCancel,
}: {
  categoryId: string;
  subItem: HomeSubItem;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const override = getSubCategoryOverride(subItem.id);
  const added = getOperatorSubCategoryById(subItem.id);
  const base = homeCategoryItems[categoryId]?.find((item) => item.id === subItem.id);

  const [title, setTitle] = useState(
    added?.title.th ?? override?.title?.th ?? base?.title.th ?? subItem.title.th
  );
  const [description, setDescription] = useState(
    added?.description.th ??
      override?.description?.th ??
      base?.description.th ??
      subItem.description.th
  );
  const [icon, setIcon] = useState(
    added?.icon ?? override?.icon ?? base?.icon ?? subItem.icon
  );
  const [iconManual, setIconManual] = useState(true);

  const persistSub = () => {
    const result = updateSubCategory({
      categoryId,
      subId: subItem.id,
      title,
      description,
      icon,
      tint: subItem.tint,
    });
    if (!result.ok) {
      setError(t(result.errorKey));
      return false;
    }
    setError("");
    return true;
  };

  return (
    <div className="mt-3 space-y-3 border-t border-black/[0.06] pt-3">
      <MenuSubFields
        title={title}
        description={description}
        icon={icon}
        iconManual={iconManual}
        onTitleChange={(value) => {
          setTitle(value);
          if (!iconManual) {
            setIcon(suggestMenuIcon(value).icon);
          }
        }}
        onDescriptionChange={setDescription}
        onIconChange={(value) => {
          setIconManual(true);
          setIcon(value);
        }}
      />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => persistSub() && onSaved()} className={primaryButtonClassName}>
          {t("operatorMenu.saveChanges")}
        </button>
        <button type="button" onClick={onCancel} className={pillSecondaryButtonClassName}>
          {t("home.quickWriteClose")}
        </button>
      </div>
    </div>
  );
}

export function toggleOperatorCategoryHidden(categoryId: string, onSaved: () => void) {
  const hidden = isCategoryHidden(categoryId);
  const result = setCategoryHidden(categoryId, !hidden);
  if (result.ok) {
    onSaved();
  }
}
