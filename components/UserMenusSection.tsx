"use client";

import MenuIcon from "@/components/MenuIcon";
import { useLocale } from "@/contexts/LocaleContext";
import { useUserMenus } from "@/hooks/useUserMenus";
import UserMenuCreateForm from "@/components/UserMenuCreateForm";

type UserMenusSectionProps = {
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  onCreated?: (categoryId: string) => void;
  /** 세부카테고리 카드 안에 붙일 때 */
  embedded?: boolean;
};

export default function UserMenusSection({
  selectedId,
  onSelect,
  onCreated,
  embedded = false,
}: UserMenusSectionProps) {
  const { t, pick } = useLocale();
  const { userCategories } = useUserMenus();

  const handleCreated = (categoryId: string) => {
    onSelect(categoryId);
    onCreated?.(categoryId);
  };

  return (
    <div
      className={
        embedded
          ? "mt-5 border-t border-gray-200 pt-5"
          : "social-surface mb-3 mt-4"
      }
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="menu-label !mb-0">{t("home.userMenus")}</p>
        <span className="text-ui-caption">{t("home.userMenusHint")}</span>
      </div>

      {userCategories.length > 0 ? (
        <div className="social-menu-grid mb-3">
          {userCategories.map((menu) => {
            const active = selectedId === menu.id;
            return (
              <div key={menu.id} className="relative">
                <button
                  type="button"
                  onClick={() => onSelect(menu.id)}
                  className={`group flex w-full flex-col items-center rounded-2xl px-1.5 py-3.5 transition active:scale-[0.96] sm:py-4 ${
                    active
                      ? "bg-[#06C755]/12 ring-2 ring-[#06C755]/40"
                      : "hover:bg-[#F0F2F5]/80 ring-1 ring-transparent"
                  }`}
                >
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-[#65676B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t("home.userMenuBadge")}
                  </span>
                  <div
                    className={`mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] sm:mb-3 sm:h-20 sm:w-20 sm:rounded-[22px] ${menu.tint} shadow-sm ring-1 ring-black/[0.04]`}
                  >
                    <MenuIcon
                      icon={menu.icon}
                      emojiClassName="text-[1.75rem] sm:text-[35px]"
                      imageClassName="h-full w-full object-cover"
                    />
                  </div>
                  <p
                    className={`text-ui-chip line-clamp-2 w-full px-0.5 font-semibold ${
                      active ? "text-[#06C755]" : "text-[#050505]"
                    }`}
                  >
                    {pick(menu.label)}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-ui-body mb-3 text-sm">{t("home.userMenusEmpty")}</p>
      )}

      <UserMenuCreateForm onCreated={handleCreated} />
    </div>
  );
}
