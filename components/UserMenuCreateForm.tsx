"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MenuAddCategoryForm from "@/components/MenuAddCategoryForm";
import { MenuSubFields, updateSubDraftIcon } from "@/components/MenuFormFields";
import {
  Card,
  inputClassName,
  pillSecondaryButtonClassName,
  primaryButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useUserMenus } from "@/hooks/useUserMenus";
import MenuIcon from "@/components/MenuIcon";
import { DEFAULT_SUB_DESCRIPTION_TH } from "@/lib/categories/menuIconMatch";
import {
  createUserCategory,
  createUserSubCategory,
  deleteUserCategory,
  getUserCategoriesByCreator,
  userCategoryToItem,
  type StoredUserCategory,
} from "@/lib/categories/userMenus";

type UserMenuCreateFormProps = {
  onCreated?: (categoryId: string) => void;
};

export default function UserMenuCreateForm({ onCreated }: UserMenuCreateFormProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const { userCategories, refreshUserMenus } = useUserMenus();
  const myMenus = useMemo(
    () => (user ? getUserCategoriesByCreator(user.id) : []),
    [user, userCategories]
  );

  if (!user) {
    return (
      <Card className="text-center">
        <p className="text-ui-body text-sm">{t("userMenu.loginRequired")}</p>
        <Link href="/login" className={`mt-3 inline-flex ${pillSecondaryButtonClassName}`}>
          {t("welcome.login")}
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {success ? (
        <p className="rounded-xl bg-[#06C755]/10 px-3 py-2 text-sm font-medium text-[#06C755]">
          {success}
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full ${pillSecondaryButtonClassName}`}
        >
          + {t("home.createUserMenu")}
        </button>
      ) : (
        <MenuAddCategoryForm
          sectionLabelKey="home.createUserMenu"
          allowIconImage
          submitLabelKey="userMenu.submit"
          onCancel={() => setOpen(false)}
          onSubmit={(payload) => {
            const result = createUserCategory({
              creatorId: user.id,
              creatorNickname: user.nickname || user.name,
              label: payload.label,
              icon: payload.icon,
              tint: payload.tint,
              formTemplate: payload.formTemplate,
              iconImagePolicyAccepted: payload.iconImagePolicyAccepted,
              subcategories: payload.subcategories,
            });
            if (!result.ok) {
              return result;
            }
            setSuccess(t("userMenu.created"));
            setOpen(false);
            refreshUserMenus();
            onCreated?.(result.categoryId);
            window.setTimeout(() => setSuccess(""), 2500);
            return { ok: true as const };
          }}
        />
      )}

      {myMenus.length > 0 ? (
        <div className="space-y-2">
          {myMenus.map((menu) => (
            <MyMenuRow
              key={menu.id}
              menu={menu}
              userId={user.id}
              onChange={() => {
                refreshUserMenus();
                setSuccess(t("userMenu.deleted"));
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MyMenuRow({
  menu,
  userId,
  onChange,
}: {
  menu: StoredUserCategory;
  userId: string;
  onChange: () => void;
}) {
  const { t, pick } = useLocale();
  const item = userCategoryToItem(menu);
  const [showAddSub, setShowAddSub] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(DEFAULT_SUB_DESCRIPTION_TH);
  const [icon, setIcon] = useState("📌");
  const [iconManual, setIconManual] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = () => {
    const result = deleteUserCategory(menu.id, userId);
    if (!result.ok) {
      setError(t(result.errorKey));
      return;
    }
    onChange();
  };

  const handleAddSub = () => {
    setError("");
    const result = createUserSubCategory({
      categoryId: menu.id,
      creatorId: userId,
      title,
      description,
      icon,
      tint: menu.tint,
    });
    if (!result.ok) {
      setError(t(result.errorKey));
      return;
    }
    setTitle("");
    setDescription(DEFAULT_SUB_DESCRIPTION_TH);
    setIcon("📌");
    setIconManual(false);
    setShowAddSub(false);
    onChange();
  };

  return (
    <Card className="!py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={item.href} className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg ${menu.tint}`}
          >
            <MenuIcon icon={menu.icon} emojiClassName="text-lg" />
          </span>
          <span className="text-ui-title truncate text-sm">{pick(menu.label)}</span>
        </Link>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setShowAddSub((value) => !value)}
            className={pillSecondaryButtonClassName}
          >
            + {t("home.addUserSubcategory")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-ui-btn rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-200"
          >
            {t("userMenu.delete")}
          </button>
        </div>
      </div>
      {showAddSub ? (
        <div className="mt-3 space-y-3 border-t border-black/[0.06] pt-3">
          <MenuSubFields
            title={title}
            description={description}
            icon={icon}
            iconManual={iconManual}
            onTitleChange={(value) => {
              setTitle(value);
              const nextIcon = updateSubDraftIcon(value, iconManual);
              if (nextIcon) {
                setIcon(nextIcon);
              }
            }}
            onDescriptionChange={setDescription}
            onIconChange={(value) => {
              setIconManual(true);
              setIcon(value);
            }}
          />
          <button type="button" onClick={handleAddSub} className={primaryButtonClassName}>
            {t("userMenu.addSubSubmit")}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </Card>
  );
}
