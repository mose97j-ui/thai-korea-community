"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import HomeQuickWritePanel from "@/components/HomeQuickWritePanel";
import HomeSidebar from "@/components/HomeSidebar";
import HomeMobileBoardStrip from "@/components/HomeMobileBoardStrip";
import HomeMobileDiscoverPanel from "@/components/HomeMobileDiscoverPanel";
import PremiumPaywall from "@/components/PremiumPaywall";
import OperatorMenuAdminPanel, {
  OperatorMenuTileControls,
  OperatorSubCategoryAddForm,
  OperatorSubCategoryTileControls,
  OperatorSubEditForm,
  toggleOperatorCategoryHidden,
} from "@/components/OperatorMenuAdminPanel";
import SortableTileGrid, { SortableDragHandle, type SortableDragHandleProps } from "@/components/SortableTileGrid";
import CollapsibleSection from "@/components/home/CollapsibleSection";
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
import { useOperatorMenuIdleAutoSave } from "@/hooks/useOperatorMenuIdleAutoSave";
import { isUserCategoryId } from "@/lib/categories/userMenus";
import MenuIcon from "@/components/MenuIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { isAdminUser, isOperatorUser } from "@/lib/auth/operator";
import { categoryListSignature } from "@/lib/categories/categoryListSignature";
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
import {
  createDefaultHomeSectionOpens,
  isAllHomeSectionsOpen,
  setAllHomeSectionsOpen,
  type HomeSectionCollapseState,
} from "@/lib/home/sectionCollapse";
import { siteNameClass } from "@/lib/i18n/typography";
import {
  SYMBOL_ARROW_RIGHT,
  SYMBOL_BOARD,
  SYMBOL_LOCK,
  SYMBOL_STAR_OFF,
  SYMBOL_STAR_ON,
} from "@/lib/ui/symbols";

export default function HomeContent() {
  const { user } = useAuth();
  const { t, pick } = useLocale();
  const { showOperatorUI } = useOperatorView();
  const canUseIdeaShare = isOperatorUser(user) || isAdminUser(user);
  const { operatorCategories, operatorCategoriesForEdit, refreshOperatorMenus } =
    useOperatorMenus();
  const { hasAccess: hasPremiumAccess } = usePremiumAccess();
  const { favorites, toggle, isFavorite } = useCategoryFavorites(user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [subManageError, setSubManageError] = useState("");
  const [menuEditMode, setMenuEditMode] = useState(false);
  const [subMenuEditMode, setSubMenuEditMode] = useState(false);
  const [menuAutoSavedAt, setMenuAutoSavedAt] = useState<string | null>(null);
  const [writeCategoryId, setWriteCategoryId] = useState("reviews");
  const [writeSubId, setWriteSubId] = useState("reviews-0");
  const [statsVersion, setStatsVersion] = useState(0);
  const [sectionOpens, setSectionOpens] = useState(createDefaultHomeSectionOpens);
  const panelRef = useRef<HTMLDivElement>(null);

  const patchHomeSection = useCallback(
    <K extends keyof HomeSectionCollapseState>(key: K, open: boolean) => {
      setSectionOpens((prev) => ({ ...prev, [key]: open }));
    },
    []
  );

  const allMenusExpanded = isAllHomeSectionsOpen(sectionOpens);

  const toggleAllHomeMenus = useCallback(() => {
    setSectionOpens(setAllHomeSectionsOpen(!allMenusExpanded));
  }, [allMenusExpanded]);

  const menuItems = showOperatorUI ? operatorCategoriesForEdit : operatorCategories;
  const menuListSignature = categoryListSignature(menuItems);

  const selectedCategory = useMemo(
    () => (selectedId ? getHomeCategoryById(selectedId) : null),
    [selectedId, menuListSignature]
  );
  const subItems = useMemo(
    () => {
      if (!selectedId) {
        return [];
      }
      const visible = getCategorySubItems(selectedId, showOperatorUI);
      if (visible.length > 0) {
        return visible;
      }
      // Safety fallback: if all subcategories were hidden accidentally, still allow opening.
      return getCategorySubItems(selectedId, true);
    },
    [selectedId, showOperatorUI, menuListSignature]
  );

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
    (menuEditMode || subMenuEditMode) &&
    showOperatorUI &&
    Boolean(selectedId) &&
    !isUserCategoryId(selectedId ?? "");

  const renderSubTile = (
    item: (typeof subItems)[number],
    hidden: boolean,
    dragHandleProps?: SortableDragHandleProps
  ) => {
    const showSubQuickEditButton =
      showOperatorUI &&
      (menuEditMode || subMenuEditMode) &&
      Boolean(selectedId) &&
      !isUserCategoryId(selectedId ?? "");
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
        <div className="relative h-full">
          {showSubQuickEditButton ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setEditingSubId((current) => (current === item.id ? null : item.id));
              }}
              className="absolute left-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs shadow-sm ring-1 ring-black/[0.08]"
              aria-label={t("operatorMenu.editSubcategory")}
            >
              ✏️
            </button>
          ) : null}
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
        </div>
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
    const tintClass = item.tint.toLowerCase();
    const toneClass = tintClass.includes("amber")
      ? "bg-gradient-to-b from-amber-50/95 to-white ring-1 ring-amber-200/70"
      : tintClass.includes("sky")
        ? "bg-gradient-to-b from-sky-50/95 to-white ring-1 ring-sky-200/70"
        : tintClass.includes("rose") || tintClass.includes("pink")
          ? "bg-gradient-to-b from-rose-50/95 to-white ring-1 ring-rose-200/70"
          : tintClass.includes("violet") || tintClass.includes("purple")
            ? "bg-gradient-to-b from-violet-50/95 to-white ring-1 ring-violet-200/70"
            : tintClass.includes("slate") || tintClass.includes("gray")
              ? "bg-gradient-to-b from-slate-50/95 to-white ring-1 ring-slate-200/70"
              : tintClass.includes("green")
                ? "bg-gradient-to-b from-emerald-50/95 to-white ring-1 ring-emerald-200/70"
                : "bg-gradient-to-b from-gray-50/95 to-white ring-1 ring-gray-200/70";

    return (
      <div className="relative">
        {showOperatorUI && menuEditMode ? (
          <OperatorMenuTileControls
            categoryId={item.id}
            onEdit={() => {
              setSelectedId(item.id);
              setEditingCategoryId(item.id);
            }}
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
          className={`social-menu-tile-btn group flex w-full flex-col items-center rounded-2xl px-1 py-2 transition active:scale-[0.96] sm:px-1.5 sm:py-3.5 lg:py-4 ${
            hidden
              ? "bg-gray-100 opacity-60 ring-1 ring-dashed ring-gray-300"
              : active
                ? "bg-[#06C755]/12 ring-2 ring-[#06C755]/40"
                : item.premium
                  ? "bg-gradient-to-b from-amber-50/80 to-white ring-1 ring-amber-200/70 hover:bg-amber-50/60"
                  : `${toneClass} hover:brightness-[0.99]`
          }`}
        >
          {lockedPremium ? (
            <span
              className="absolute left-2 top-2 rounded-md bg-gray-900/80 px-1.5 py-0.5 text-xs font-bold text-amber-200"
              aria-hidden
            >
              {SYMBOL_LOCK}
            </span>
          ) : null}
          <div
            className={`social-menu-tile-icon mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] sm:mb-3 sm:h-20 sm:w-20 sm:rounded-[22px] ${item.tint} shadow-sm ring-1 ring-black/[0.04]`}
          >
            <MenuIcon
              icon={item.icon}
              emojiClassName="text-[1.75rem] sm:text-[35px]"
              imageClassName="h-full w-full object-cover"
            />
          </div>
          <p
            className={`social-menu-tile-label text-ui-chip line-clamp-2 w-full px-0.5 font-semibold ${
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
          className={`social-menu-tile-star absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:bg-white/90 ${
            starred ? "text-amber-400" : "text-gray-300 hover:text-amber-300"
          }`}
        >
          {starred ? SYMBOL_STAR_ON : SYMBOL_STAR_OFF}
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!showOperatorUI && menuEditMode) {
      cancelOperatorMenuEditSession();
      setMenuEditMode(false);
      setSubMenuEditMode(false);
      setEditingCategoryId(null);
      setEditingSubId(null);
      setSubManageError("");
      refreshOperatorMenus();
    }
    if (!showOperatorUI && subMenuEditMode) {
      cancelOperatorMenuEditSession();
      setSubMenuEditMode(false);
      setEditingSubId(null);
      setSubManageError("");
      refreshOperatorMenus();
    }
  }, [showOperatorUI, menuEditMode, subMenuEditMode, refreshOperatorMenus]);

  useEffect(() => {
    setEditingSubId(null);
    setSubManageError("");
  }, [selectedId]);

  const handleStartMenuEdit = useCallback(() => {
    if (subMenuEditMode) {
      setSubMenuEditMode(false);
      setMenuEditMode(true);
      setMenuAutoSavedAt(null);
      refreshOperatorMenus();
      return;
    }
    beginOperatorMenuEditSession();
    setMenuEditMode(true);
    setMenuAutoSavedAt(null);
    refreshOperatorMenus();
  }, [subMenuEditMode, refreshOperatorMenus]);

  const handleSaveMenuEdit = useCallback(() => {
    commitOperatorMenuEditSession();
    setMenuEditMode(false);
    setSubMenuEditMode(false);
    setMenuAutoSavedAt(null);
    setEditingCategoryId(null);
    setEditingSubId(null);
    setSubManageError("");
    refreshOperatorMenus();
  }, [refreshOperatorMenus]);

  const handleCancelMenuEdit = useCallback(() => {
    cancelOperatorMenuEditSession();
    setMenuEditMode(false);
    setSubMenuEditMode(false);
    setMenuAutoSavedAt(null);
    setEditingCategoryId(null);
    setEditingSubId(null);
    setSubManageError("");
    refreshOperatorMenus();
  }, [refreshOperatorMenus]);

  const handleStartSubMenuEdit = useCallback(() => {
    if (!selectedId || isUserCategoryId(selectedId) || menuEditMode || subMenuEditMode) {
      return;
    }
    beginOperatorMenuEditSession();
    setSubMenuEditMode(true);
    setEditingSubId(null);
    setSubManageError("");
    setMenuAutoSavedAt(null);
    refreshOperatorMenus();
  }, [selectedId, menuEditMode, subMenuEditMode, refreshOperatorMenus]);

  const handleSaveSubMenuEdit = useCallback(() => {
    if (!subMenuEditMode || menuEditMode) {
      return;
    }
    commitOperatorMenuEditSession();
    setSubMenuEditMode(false);
    setEditingSubId(null);
    setSubManageError("");
    setMenuAutoSavedAt(null);
    refreshOperatorMenus();
  }, [subMenuEditMode, menuEditMode, refreshOperatorMenus]);

  const handleCancelSubMenuEdit = useCallback(() => {
    if (!subMenuEditMode || menuEditMode) {
      return;
    }
    cancelOperatorMenuEditSession();
    setSubMenuEditMode(false);
    setEditingSubId(null);
    setSubManageError("");
    setMenuAutoSavedAt(null);
    refreshOperatorMenus();
  }, [subMenuEditMode, menuEditMode, refreshOperatorMenus]);

  const handleMenuIdleAutoSave = useCallback(() => {
    setMenuAutoSavedAt(new Date().toISOString());
    refreshOperatorMenus();
  }, [refreshOperatorMenus]);

  useOperatorMenuIdleAutoSave(
    (menuEditMode || subMenuEditMode) && showOperatorUI,
    handleMenuIdleAutoSave,
    menuListSignature
  );

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
    const visibleSubs = getCategorySubItems(id);
    const subs = visibleSubs.length > 0 ? visibleSubs : getCategorySubItems(id, true);
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

  const userMenuProps = useMemo(
    () => ({
      selectedId,
      onSelect: handleCategorySelect,
      onCreated: (id: string) => {
        setWriteCategoryId(id);
        const subs = getCategorySubItems(id);
        if (subs[0]) {
          setWriteSubId(subs[0].id);
        }
      },
      open: sectionOpens.userMenus,
      onOpenChange: (open: boolean) => patchHomeSection("userMenus", open),
    }),
    [selectedId, handleCategorySelect, sectionOpens.userMenus, patchHomeSection]
  );

  const sidebarSectionOpens = useMemo(
    () => ({
      favorites: sectionOpens.favorites,
      popular: sectionOpens.popular,
      popularPosts: sectionOpens.popularPosts,
      hotBoard: sectionOpens.hotBoard,
    }),
    [
      sectionOpens.favorites,
      sectionOpens.popular,
      sectionOpens.popularPosts,
      sectionOpens.hotBoard,
    ]
  );

  const handleSidebarSectionOpenChange = (
    key: keyof typeof sidebarSectionOpens,
    open: boolean
  ) => {
    patchHomeSection(key, open);
  };

  const showMemberMenus = false;
  const showMemberOnlySections = false;

  return (
    <div className={socialPageStackSidebarClassName}>
      <HomeSidebar
        favoriteIds={favorites}
        popular={popular}
        popularPosts={popularPosts}
        hotPosts={hotPosts}
        selectedId={selectedId}
        onSelect={handleCategorySelect}
        sectionOpens={sidebarSectionOpens}
        onSectionOpenChange={handleSidebarSectionOpenChange}
      />

      <div className={socialMainColumnClassName}>
        <header className="social-mobile-home-header lg:hidden">
          <div className="social-mobile-home-header__bar">
            <Link
              href="/"
              aria-label={t("nav.home")}
              className="shrink-0 rounded-2xl transition active:scale-[0.97]"
            >
              <Image
                src="/logo.png"
                alt="Thai Korea Community"
                width={40}
                height={40}
                className="h-10 w-10 rounded-2xl object-cover ring-1 ring-black/5"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className={`${siteNameClass} truncate text-base font-bold`}>
                Thai Korea Community
              </p>
              <p className="text-ui-caption mt-0.5 line-clamp-1">{t("welcome.subtitle")}</p>
            </div>
          </div>
          <div className="social-mobile-home-header__search">
            {canUseIdeaShare ? (
              <div className="mb-2 flex justify-end">
                <Link href="/c/ideas/ideas-0" className={pillSecondaryButtonClassName}>
                  💡 {t("home.ideaShare")}
                </Link>
              </div>
            ) : null}
            <GlobalSearchBar className="mb-0" />
          </div>
        </header>

        <div className="mb-3 hidden flex-col gap-3 lg:flex xl:flex-row xl:items-end">
          <div className="social-home-brand-row">
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
            <div className="social-home-brand-title">
              <h1 className={`${siteNameClass} text-2xl lg:text-3xl`}>Thai Korea Community</h1>
              <p className="text-ui-caption mt-2.5">{t("welcome.subtitle")}</p>
            </div>
          </div>
          <div className="w-full xl:min-w-[min(100%,28rem)] xl:flex-1">
            {canUseIdeaShare ? (
              <div className="mb-2 flex justify-end">
                <Link href="/c/ideas/ideas-0" className={pillSecondaryButtonClassName}>
                  💡 {t("home.ideaShare")}
                </Link>
              </div>
            ) : null}
            <GlobalSearchBar className="mb-0 w-full" />
          </div>
        </div>

        {showMemberOnlySections ? (
          <>
            <HomeMobileBoardStrip
              favoriteIds={favorites}
              popular={popular}
              selectedId={selectedId}
              onSelect={handleCategorySelect}
              open={sectionOpens.mobileStrip}
              onOpenChange={(open) => patchHomeSection("mobileStrip", open)}
            />

            <HomeMobileDiscoverPanel
              favoriteIds={favorites}
              popular={popular}
              popularPosts={popularPosts}
              hotPosts={hotPosts}
              selectedId={selectedId}
              onSelect={handleCategorySelect}
              open={sectionOpens.mobileDiscover}
              onOpenChange={(open) => patchHomeSection("mobileDiscover", open)}
              sectionOpens={sidebarSectionOpens}
              onSectionOpenChange={handleSidebarSectionOpenChange}
            />

            <HomeQuickWritePanel
              categoryId={writeCategoryId}
              subId={writeSubId}
              onCategoryChange={handleWriteCategoryChange}
            />
          </>
        ) : null}

        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={toggleAllHomeMenus}
            className={pillSecondaryButtonClassName}
          >
            {allMenusExpanded ? t("home.collapseAllMenus") : t("home.expandAllMenus")}
          </button>
        </div>

            <section className="social-surface social-home-menu-card mb-3 rounded-2xl ring-1 ring-black/[0.06]">
              <div className="px-4 pt-4">
                <SectionLabel>{t("common.menu")}</SectionLabel>
              </div>
              <div className="px-2 pb-3 pt-1 sm:px-3">
                {showOperatorUI ? (
                  <OperatorMenuAdminPanel
                    editingCategoryId={editingCategoryId}
                    menuEditMode={menuEditMode}
                    menuAutoSavedAt={menuAutoSavedAt}
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
            </section>

            <div ref={panelRef} className="mt-4 scroll-mt-8 lg:mt-6">
              {selectedCategory ? (
                isPremiumCategoryId(selectedCategory.id) && !hasPremiumAccess ? (
                  <>
                    <PremiumPaywall variant="inline" />
                    {showMemberMenus ? <UserMenusSection {...userMenuProps} /> : null}
                  </>
                ) : (
                <CollapsibleSection
                  className="social-home-category-panel rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.05]"
                  title={pick(selectedCategory.label)}
                  description={t("home.subcategories")}
                  open={sectionOpens.subPanel}
                  onOpenChange={(open) => patchHomeSection("subPanel", open)}
                  headerExtra={
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
                        : `${t("home.viewAll")} ${SYMBOL_ARROW_RIGHT}`}
                    </Link>
                  }
                  bodyClassName="space-y-4"
                >
                  <div className="flex items-center gap-2.5 lg:gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl lg:h-14 lg:w-14 lg:rounded-[18px] ${selectedCategory.tint} ring-1 ring-black/[0.04]`}
                    >
                      <MenuIcon icon={selectedCategory.icon} emojiClassName="text-2xl lg:text-3xl" />
                    </div>
                    <p className="text-ui-caption">{t("home.scrollHint")}</p>
                  </div>

                  {showOperatorUI && selectedId && !isUserCategoryId(selectedId) && !menuEditMode ? (
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-ui-title text-sm text-amber-900">
                            {t("operatorMenu.editSubcategory")}
                          </p>
                          <p className="text-ui-caption mt-1 text-amber-800/90">
                            {subMenuEditMode
                              ? t("operatorMenu.unsavedEditHint")
                              : t("operatorMenu.editModeHint")}
                          </p>
                          {subMenuEditMode && menuAutoSavedAt ? (
                            <p className="text-ui-caption mt-1 font-medium text-[#06C755]">
                              {t("operatorMenu.autoSaved")} ·{" "}
                              {new Date(menuAutoSavedAt).toLocaleTimeString()}
                            </p>
                          ) : null}
                        </div>
                        {subMenuEditMode ? (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleSaveSubMenuEdit}
                              className={primaryButtonClassName}
                            >
                              {t("operatorMenu.saveAll")}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelSubMenuEdit}
                              className={pillSecondaryButtonClassName}
                            >
                              {t("operatorMenu.cancelEdit")}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStartSubMenuEdit}
                            className={primaryButtonClassName}
                          >
                            {t("operatorMenu.startEdit")}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

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
                        onAutoSaved={refreshOperatorMenus}
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

                  {showMemberMenus ? <UserMenusSection embedded {...userMenuProps} /> : null}
                </CollapsibleSection>
                )
              ) : (
                <>
                  <Card className="py-12 text-center text-lg text-gray-500">
                    {t("home.pickCategory")}
                  </Card>
                  {showMemberMenus ? <UserMenusSection {...userMenuProps} /> : null}
                </>
              )}
            </div>

        {showMemberOnlySections ? (
          <Link
            href="/board"
            className={`social-page-bottom-safe mt-4 flex w-full items-center justify-center gap-2 lg:mt-5 ${primaryButtonClassName}`}
          >
            <span aria-hidden>{SYMBOL_BOARD}</span>
            <span>{t("home.board")}</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
