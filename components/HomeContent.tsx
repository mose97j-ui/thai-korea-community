"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import HomeQuickWritePanel from "@/components/HomeQuickWritePanel";
import HomeSidebar from "@/components/HomeSidebar";
import PremiumPaywall from "@/components/PremiumPaywall";
import OperatorMenuAdminPanel, {
  OperatorMenuTileControls,
  OperatorSubCategoryAddForm,
  OperatorSubCategoryTileControls,
  OperatorSubEditForm,
  toggleOperatorCategoryHidden,
} from "@/components/OperatorMenuAdminPanel";
import SortableTileGrid, { SortableDragHandle, type SortableDragHandleProps } from "@/components/SortableTileGrid";
import UserMenusSection from "@/components/UserMenusSection";
import { Card, SectionLabel, TopicCard, pillSecondaryButtonClassName, primaryButtonClassName } from "@/components/ui";
import {
  socialMainColumnClassName,
  socialMenuGridClassName,
  socialPageStackSidebarClassName,
} from "@/components/PageShell";
import {
  getCategorySubItems,
  getHomeCategoryById,
  isCategoryHidden,
  isPremiumCategoryId,
} from "@/lib/categories/registry";
import {
  beginOperatorMenuEditSession,
  cancelOperatorMenuEditSession,
  commitOperatorMenuEditSession,
  isSubCategoryHidden,
  setCategoryGroupOrder,
  setSubCategoryGroupOrder,
} from "@/lib/categories/operatorMenus";
import { isUserCategoryId } from "@/lib/categories/userMenus";
import MenuIcon from "@/components/MenuIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { useOperatorMenus } from "@/hooks/useOperatorMenus";
import { useCategoryFavorites } from "@/hooks/useCategoryFavorites";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import {
  getCategoryOverviewHref,
} from "@/lib/i18n/content";
import type { CategoryItem } from "@/lib/i18n/content";
import { getPopularCategories } from "@/lib/posts/stats";
import { getAllPosts, POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import { filterPublicPosts } from "@/lib/posts/visibility";
import { getHotPosts, getPopularPosts } from "@/lib/social/hot";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";
import { siteNameClass } from "@/lib/i18n/typography";

export default function HomeContent() {
  const { user } = useAuth();
  const { t, pick } = useLocale();
  const { showOperatorUI } = useOperatorView();
  const { operatorCategories, operatorCategoriesForEdit, refreshOperatorMenus } =
    useOperatorMenus();
  const { hasAccess: hasPremiumAccess } = usePremiumAccess();
  const { favorites, toggle, isFavorite } = useCategoryFavorites(user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [subManageError, setSubManageError] = useState("");
  const [menuEditMode, setMenuEditMode] = useState(false);
  const [writeCategoryId, setWriteCategoryId] = useState("reviews");
  const [writeSubId, setWriteSubId] = useState("reviews-0");
  const [statsVersion, setStatsVersion] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedCategory = selectedId ? getHomeCategoryById(selectedId) : null;
  const subItems = selectedId ? getCategorySubItems(selectedId, showOperatorUI) : [];
  const menuItems = showOperatorUI ? operatorCategoriesForEdit : operatorCategories;

  const popular = useMemo(
    () => getPopularCategories(6),
    [statsVersion]
  );

  const popularPosts = useMemo(
    () => getPopularPosts(filterPublicPosts(getAllPosts()), 6),
    [statsVersion]
  );

  const hotPosts = useMemo(
    () => getHotPosts(filterPublicPosts(getAllPosts()), 6),
    [statsVersion]
  );

  const menuGridClassName = socialMenuGridClassName;

  const { visibleMenuItems, hiddenMenuItems } = useMemo(() => {
    if (!showOperatorUI) {
      return { visibleMenuItems: menuItems, hiddenMenuItems: [] as CategoryItem[] };
    }
    return {
      visibleMenuItems: menuItems.filter((item) => !isCategoryHidden(item.id)),
      hiddenMenuItems: menuItems.filter((item) => isCategoryHidden(item.id)),
    };
  }, [menuItems, showOperatorUI]);

  const { visibleSubItems, hiddenSubItems } = useMemo(() => {
    if (!showOperatorUI) {
      return { visibleSubItems: subItems, hiddenSubItems: [] as typeof subItems };
    }
    return {
      visibleSubItems: subItems.filter((item) => !isSubCategoryHidden(item.id)),
      hiddenSubItems: subItems.filter((item) => isSubCategoryHidden(item.id)),
    };
  }, [subItems, showOperatorUI]);

  const canManageSubs =
    menuEditMode && showOperatorUI && Boolean(selectedId) && !isUserCategoryId(selectedId ?? "");

  const renderSubTile = (
    item: (typeof subItems)[number],
    hidden: boolean,
    dragHandleProps?: SortableDragHandleProps
  ) => {
    const card = (
      <TopicCard
        icon={item.icon}
        title={pick(item.title)}
        description={pick(item.description)}
        tint={item.tint}
      />
    );

    if (!canManageSubs) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={`block h-full ${hidden ? "opacity-70 [&_.text-ui-title]:underline [&_.text-ui-title]:decoration-gray-400 [&_.text-ui-title]:underline-offset-2" : ""}`}
        >
          {hidden ? (
            <div className="h-full rounded-2xl ring-1 ring-dashed ring-gray-300">{card}</div>
          ) : (
            card
          )}
        </Link>
      );
    }

    return (
      <div className="relative h-full">
        <OperatorSubCategoryTileControls
          subId={item.id}
          hidden={hidden}
          onEdit={() => setEditingSubId((current) => (current === item.id ? null : item.id))}
          onSaved={refreshOperatorMenus}
          onError={setSubManageError}
        />
        <SortableDragHandle
          dragHandleProps={dragHandleProps}
          className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2"
        />
        <Link
          href={item.href}
          className={`block h-full ${hidden ? "opacity-70 [&_.text-ui-title]:underline [&_.text-ui-title]:decoration-gray-400 [&_.text-ui-title]:underline-offset-2" : ""}`}
        >
          {hidden ? (
            <div className="h-full rounded-2xl ring-1 ring-dashed ring-gray-300">{card}</div>
          ) : (
            card
          )}
        </Link>
      </div>
    );
  };

  const renderMenuTile = (
    item: CategoryItem,
    hidden: boolean,
    dragHandleProps?: SortableDragHandleProps
  ) => {
    const active = selectedId === item.id;
    const starred = isFavorite(item.id);
    const lockedPremium = item.premium && !hasPremiumAccess;

    return (
      <div className="relative">
        {showOperatorUI && menuEditMode ? (
          <OperatorMenuTileControls
            categoryId={item.id}
            onEdit={() => setEditingCategoryId(item.id)}
            onToggleHidden={() =>
              toggleOperatorCategoryHidden(item.id, refreshOperatorMenus)
            }
          />
        ) : null}
        <SortableDragHandle
          dragHandleProps={dragHandleProps}
          className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2"
        />
        <button
          type="button"
          onClick={() => handleCategorySelect(item.id)}
          className={`group flex w-full flex-col items-center rounded-2xl px-1.5 py-3.5 transition active:scale-[0.96] sm:py-4 ${
            hidden
              ? "bg-gray-100 opacity-60 ring-1 ring-dashed ring-gray-300"
              : active
                ? "bg-[#06C755]/12 ring-2 ring-[#06C755]/40"
                : item.premium
                  ? "bg-gradient-to-b from-amber-50/80 to-white ring-1 ring-amber-200/70 hover:bg-amber-50/60"
                  : "hover:bg-[#F0F2F5]/80 ring-1 ring-transparent"
          }`}
        >
          {lockedPremium ? (
            <span className="absolute left-2 top-2 rounded-md bg-gray-900/80 px-1.5 py-0.5 text-xs font-bold text-amber-200">
              🔒
            </span>
          ) : null}
          <div
            className={`mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] sm:mb-3 sm:h-20 sm:w-20 sm:rounded-[22px] ${item.tint} shadow-sm ring-1 ring-black/[0.04]`}
          >
            <MenuIcon
              icon={item.icon}
              emojiClassName="text-[1.75rem] sm:text-[35px]"
              imageClassName="h-full w-full object-cover"
            />
          </div>
          <p
            className={`text-ui-chip line-clamp-2 w-full px-0.5 font-semibold ${
              hidden
                ? "text-gray-500 underline decoration-gray-400 underline-offset-2"
                : active
                  ? "text-[#06C755]"
                  : "text-[#050505]"
            }`}
          >
            {pick(item.label)}
          </p>
        </button>
        <button
          type="button"
          onClick={() => toggle(item.id)}
          aria-label={starred ? t("home.removeFavorite") : t("home.addFavorite")}
          className={`absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:bg-white/90 ${
            starred ? "text-amber-400" : "text-gray-300 hover:text-amber-300"
          }`}
        >
          {starred ? "★" : "☆"}
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!showOperatorUI && menuEditMode) {
      cancelOperatorMenuEditSession();
      setMenuEditMode(false);
      setEditingCategoryId(null);
      setEditingSubId(null);
      setSubManageError("");
      refreshOperatorMenus();
    }
  }, [showOperatorUI, menuEditMode, refreshOperatorMenus]);

  useEffect(() => {
    setEditingSubId(null);
    setSubManageError("");
  }, [selectedId]);

  const handleStartMenuEdit = useCallback(() => {
    beginOperatorMenuEditSession();
    setMenuEditMode(true);
    refreshOperatorMenus();
  }, [refreshOperatorMenus]);

  const handleSaveMenuEdit = useCallback(() => {
    commitOperatorMenuEditSession();
    setMenuEditMode(false);
    setEditingCategoryId(null);
    setEditingSubId(null);
    setSubManageError("");
    refreshOperatorMenus();
  }, [refreshOperatorMenus]);

  const handleCancelMenuEdit = useCallback(() => {
    cancelOperatorMenuEditSession();
    setMenuEditMode(false);
    setEditingCategoryId(null);
    setEditingSubId(null);
    setSubManageError("");
    refreshOperatorMenus();
  }, [refreshOperatorMenus]);

  const handleReorderVisibleMenus = useCallback(
    (newGroupOrder: string[]) => {
      setCategoryGroupOrder(
        visibleMenuItems.map((item) => item.id),
        newGroupOrder
      );
      refreshOperatorMenus();
    },
    [visibleMenuItems, refreshOperatorMenus]
  );

  const handleReorderHiddenMenus = useCallback(
    (newGroupOrder: string[]) => {
      setCategoryGroupOrder(
        hiddenMenuItems.map((item) => item.id),
        newGroupOrder
      );
      refreshOperatorMenus();
    },
    [hiddenMenuItems, refreshOperatorMenus]
  );

  const handleReorderVisibleSubs = useCallback(
    (newGroupOrder: string[]) => {
      if (!selectedId) {
        return;
      }
      setSubCategoryGroupOrder(
        selectedId,
        visibleSubItems.map((item) => item.id),
        newGroupOrder
      );
      refreshOperatorMenus();
    },
    [selectedId, visibleSubItems, refreshOperatorMenus]
  );

  const handleReorderHiddenSubs = useCallback(
    (newGroupOrder: string[]) => {
      if (!selectedId) {
        return;
      }
      setSubCategoryGroupOrder(
        selectedId,
        hiddenSubItems.map((item) => item.id),
        newGroupOrder
      );
      refreshOperatorMenus();
    },
    [selectedId, hiddenSubItems, refreshOperatorMenus]
  );

  useEffect(() => {
    const refreshStats = () => setStatsVersion((version) => version + 1);
    refreshStats();
    window.addEventListener("focus", refreshStats);
    window.addEventListener(SOCIAL_CHANGE_EVENT, refreshStats);
    window.addEventListener(POSTS_CHANGE_EVENT, refreshStats);
    return () => {
      window.removeEventListener("focus", refreshStats);
      window.removeEventListener(SOCIAL_CHANGE_EVENT, refreshStats);
      window.removeEventListener(POSTS_CHANGE_EVENT, refreshStats);
    };
  }, []);

  const handleCategorySelect = useCallback((id: string) => {
    setSelectedId(id);
    const subs = getCategorySubItems(id);
    if (subs[0]) {
      setWriteCategoryId(id);
      setWriteSubId(subs[0].id);
    }
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleWriteCategoryChange = useCallback((categoryId: string, subId: string) => {
    setWriteCategoryId(categoryId);
    setWriteSubId(subId);
    setSelectedId(categoryId);
  }, []);

  const editingSubItem = editingSubId
    ? subItems.find((item) => item.id === editingSubId) ?? null
    : null;

  const userMenuProps = {
    selectedId,
    onSelect: handleCategorySelect,
    onCreated: (id: string) => {
      setWriteCategoryId(id);
      const subs = getCategorySubItems(id);
      if (subs[0]) {
        setWriteSubId(subs[0].id);
      }
    },
  };

  return (
    <div className={socialPageStackSidebarClassName}>
      <HomeSidebar
        favoriteIds={favorites}
        popular={popular}
        popularPosts={popularPosts}
        hotPosts={hotPosts}
        selectedId={selectedId}
        onSelect={handleCategorySelect}
      />

      <div className={socialMainColumnClassName}>
        <div className="mb-3 flex flex-row items-end gap-2">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href="/"
              aria-label={t("nav.home")}
              className="shrink-0 rounded-[30px] transition active:scale-[0.97]"
            >
              <Image
                src="/logo.png"
                alt="Thai Korea Community"
                width={88}
                height={88}
                className="h-[110px] w-[110px] rounded-[30px] object-cover shadow-sm ring-1 ring-black/5"
              />
            </Link>
            <div className="min-w-0">
              <h1 className={`${siteNameClass} text-2xl sm:text-3xl`}>Thai Korea Community</h1>
              <p className="text-ui-caption mt-2 sm:mt-2.5">{t("welcome.subtitle")}</p>
            </div>
          </div>
          <GlobalSearchBar className="mb-0 xl:min-w-[min(100%,28rem)] xl:flex-1" />
        </div>

        <HomeQuickWritePanel
          categoryId={writeCategoryId}
          subId={writeSubId}
          onCategoryChange={handleWriteCategoryChange}
        />

        <div className="social-surface mb-3">
          <p className="menu-label">{t("common.menu")}</p>

          {showOperatorUI ? (
            <OperatorMenuAdminPanel
              editingCategoryId={editingCategoryId}
              menuEditMode={menuEditMode}
              onClose={() => setEditingCategoryId(null)}
              onSaved={refreshOperatorMenus}
              onStartEdit={handleStartMenuEdit}
              onSaveEdit={handleSaveMenuEdit}
              onCancelEdit={handleCancelMenuEdit}
            />
          ) : null}

          {menuEditMode ? (
            <SortableTileGrid
              items={visibleMenuItems}
              enabled
              className={menuGridClassName}
              dragLabel={t("operatorMenu.dragToReorder")}
              onReorder={handleReorderVisibleMenus}
              renderItem={(item, { dragHandleProps }) =>
                renderMenuTile(item, false, dragHandleProps)
              }
            />
          ) : (
            <div className={menuGridClassName}>
              {visibleMenuItems.map((item) => renderMenuTile(item, false))}
            </div>
          )}

          {hiddenMenuItems.length > 0 ? (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="menu-label mb-3 text-gray-500">
                {t("operatorMenu.hiddenBadge")}
              </p>
              {menuEditMode ? (
                <SortableTileGrid
                  items={hiddenMenuItems}
                  enabled
                  className={menuGridClassName}
                  dragLabel={t("operatorMenu.dragToReorder")}
                  onReorder={handleReorderHiddenMenus}
                  renderItem={(item, { dragHandleProps }) =>
                    renderMenuTile(item, true, dragHandleProps)
                  }
                />
              ) : (
                <div className={menuGridClassName}>
                  {hiddenMenuItems.map((item) => renderMenuTile(item, true))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div ref={panelRef} className="mt-6 scroll-mt-8">
          {selectedCategory ? (
            isPremiumCategoryId(selectedCategory.id) && !hasPremiumAccess ? (
              <>
                <PremiumPaywall variant="inline" />
                <UserMenusSection {...userMenuProps} />
              </>
            ) : (
            <Card>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] ${selectedCategory.tint} ring-1 ring-black/[0.04]`}
                  >
                    <MenuIcon icon={selectedCategory.icon} emojiClassName="text-3xl" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-ui-title text-lg sm:text-xl">
                      {pick(selectedCategory.label)}
                    </h2>
                    <p className="text-ui-caption mt-1">{t("home.scrollHint")}</p>
                  </div>
                </div>
                <Link
                  href={
                    isPremiumCategoryId(selectedCategory.id) && !hasPremiumAccess
                      ? "/premium"
                      : getCategoryOverviewHref(selectedCategory.id)
                  }
                  className={pillSecondaryButtonClassName}
                >
                  {isPremiumCategoryId(selectedCategory.id) && !hasPremiumAccess
                    ? t("premium.viewPlans")
                    : `${t("home.viewAll")} ›`}
                </Link>
              </div>

              <SectionLabel>{t("home.subcategories")}</SectionLabel>

              {canManageSubs && selectedId ? (
                <OperatorSubCategoryAddForm
                  categoryId={selectedId}
                  onSaved={refreshOperatorMenus}
                  onError={setSubManageError}
                />
              ) : null}

              {subManageError ? (
                <p className="mb-3 text-sm text-red-500">{subManageError}</p>
              ) : null}

              {editingSubItem && selectedId ? (
                <div className="mb-4">
                  <OperatorSubEditForm
                    categoryId={selectedId}
                    subItem={editingSubItem}
                    onSaved={() => {
                      setEditingSubId(null);
                      setSubManageError("");
                      refreshOperatorMenus();
                    }}
                    onCancel={() => {
                      setEditingSubId(null);
                      setSubManageError("");
                    }}
                  />
                </div>
              ) : null}

              {canManageSubs ? (
                <SortableTileGrid
                  items={visibleSubItems}
                  enabled
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  dragLabel={t("operatorMenu.dragToReorder")}
                  onReorder={handleReorderVisibleSubs}
                  renderItem={(item, { dragHandleProps }) =>
                    renderSubTile(item, false, dragHandleProps)
                  }
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visibleSubItems.map((item) => renderSubTile(item, false))}
                </div>
              )}

              {hiddenSubItems.length > 0 ? (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="menu-label mb-3 text-gray-500">
                    {t("operatorMenu.hiddenBadge")}
                  </p>
                  {canManageSubs ? (
                    <SortableTileGrid
                      items={hiddenSubItems}
                      enabled
                      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                      dragLabel={t("operatorMenu.dragToReorder")}
                      onReorder={handleReorderHiddenSubs}
                      renderItem={(item, { dragHandleProps }) =>
                        renderSubTile(item, true, dragHandleProps)
                      }
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {hiddenSubItems.map((item) => renderSubTile(item, true))}
                    </div>
                  )}
                </div>
              ) : null}

              <UserMenusSection embedded {...userMenuProps} />
            </Card>
            )
          ) : (
            <>
              <Card className="py-12 text-center text-lg text-gray-500">
                {t("home.pickCategory")}
              </Card>
              <UserMenusSection {...userMenuProps} />
            </>
          )}
        </div>

        <Link
          href="/board"
          className={`mt-5 flex w-full items-center justify-center gap-2 ${primaryButtonClassName}`}
        >
          <span>📋</span>
          <span>{t("home.board")}</span>
        </Link>
      </div>
    </div>
  );
}
