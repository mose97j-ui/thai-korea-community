"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  socialPlaceBoardRowClassName,
  socialPlaceFeedColumnClassName,
  socialPlaceSidebarColumnClassName,
  socialPostFeedWrapClassName,
} from "@/components/PageShell";
import { useEffect, useMemo, useState } from "react";
import PlaceBoardSidebar from "@/components/PlaceBoardSidebar";
import KakaoMapView, { getPostMapLabel } from "@/components/KakaoMapView";
import PostCard from "@/components/PostCard";
import {
  Card,
  pillButtonClassName,
  pillSecondaryButtonClassName,
  postFeedClassName,
  primaryButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { canWritePosts } from "@/lib/auth/moderation";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import {
  buildAddressTree,
  buildAddressTreeWithGeocode,
  filterAddressTreeForSearch,
  filterPostsByAddressSearch,
  filterPostsByAddressSelection,
  findBestTreeKeyInAddressTree,
  formatAddressSelectionLabel,
  parseKoreanAddress,
  selectionFromTreeKey,
  type AddressSearchClassification,
  type AddressTreeNode,
  type AddressTreeSelection,
} from "@/lib/posts/addressParse";
import { isPlaceBasedCategory } from "@/lib/posts/formTemplates";
import { fetchGeocode } from "@/lib/maps/clientGeocode";
import { filterPostsForViewer } from "@/lib/posts/visibility";
import {
  getPostsByCategory,
  getPostsBySubCategory,
  POSTS_CHANGE_EVENT,
} from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";

type CategoryBoardProps = {
  categoryId: string;
  subId?: string;
  writeHref: string;
};

export default function CategoryBoard({
  categoryId,
  subId,
  writeHref,
}: CategoryBoardProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const writeAllowed = !user || canWritePosts(user);
  const placeBased = isPlaceBasedCategory(categoryId);
  const [sourcePosts, setSourcePosts] = useState<Post[]>([]);
  const [addressTree, setAddressTree] = useState<AddressTreeNode[]>([]);
  const [selectedTreeKey, setSelectedTreeKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchClassification, setSearchClassification] =
    useState<AddressSearchClassification | null>(null);
  const [isResolvingSearch, setIsResolvingSearch] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [isEnriching, setIsEnriching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1);
    window.addEventListener(POSTS_CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(POSTS_CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    const addressParam = searchParams.get("address")?.trim();
    if (addressParam) {
      setSearchQuery(addressParam);
    }
  }, [searchParams]);

  useDebouncedEffect(
    () => {
      const query = searchQuery.trim();
      if (!query) {
        setSearchClassification(null);
        setIsResolvingSearch(false);
        setMapCenter(undefined);
        return;
      }

      setIsResolvingSearch(true);

      void fetchGeocode(query).then((geocode) => {
        setIsResolvingSearch(false);

        if (geocode) {
          setSearchClassification({
            parts: geocode.parsed,
            displayAddress: geocode.displayAddress,
            roadAddress: geocode.roadAddress,
            jibunAddress: geocode.jibunAddress,
          });

          if (geocode.lat && geocode.lng) {
            setMapCenter({ lat: geocode.lat, lng: geocode.lng });
          }

          const treeKey = findBestTreeKeyInAddressTree(addressTree, geocode.parsed);
          if (treeKey) {
            setSelectedTreeKey(treeKey);
          }
          return;
        }

        const local = parseKoreanAddress(query);
        setSearchClassification({ parts: local });
        const treeKey = findBestTreeKeyInAddressTree(addressTree, local);
        if (treeKey) {
          setSelectedTreeKey(treeKey);
        }
      });
    },
    [searchQuery, addressTree],
    350
  );

  useEffect(() => {
    if (!placeBased) {
      const posts = subId
        ? filterPostsForViewer(getPostsBySubCategory(categoryId, subId), user?.id)
        : [];
      setSourcePosts(posts);
      setAddressTree([]);
      setSelectedTreeKey(null);
      setSearchQuery("");
      return;
    }

    const posts = filterPostsForViewer(
      subId ? getPostsBySubCategory(categoryId, subId) : getPostsByCategory(categoryId),
      user?.id
    );
    setSourcePosts(posts);
    setAddressTree(
      buildAddressTree(posts, t("post.noAddress"), t("post.addressUnclassified"))
    );

    let cancelled = false;
    setIsEnriching(true);
    void buildAddressTreeWithGeocode(
      posts,
      t("post.noAddress"),
      t("post.addressUnclassified")
    ).then((tree) => {
      if (!cancelled) {
        setAddressTree(tree);
        setIsEnriching(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId, subId, t, placeBased, refreshKey, user?.id]);

  const addressSelection = useMemo<AddressTreeSelection>(
    () => (selectedTreeKey ? selectionFromTreeKey(selectedTreeKey) : null),
    [selectedTreeKey]
  );

  const visiblePosts = useMemo(() => {
    if (!placeBased) {
      return sourcePosts;
    }

    let posts = filterPostsByAddressSelection(sourcePosts, addressSelection);
    posts = filterPostsByAddressSearch(posts, searchQuery);
    return posts;
  }, [placeBased, sourcePosts, addressSelection, searchQuery]);

  const mapMarkers = useMemo(
    () =>
      visiblePosts.map((post) => ({
        id: post.id,
        lat: post.mapLat,
        lng: post.mapLng,
        title: post.storeName || post.title,
        subtitle: getPostMapLabel(post),
        content: post.content.slice(0, 100),
        address: post.addressKey || post.address,
      })),
    [visiblePosts]
  );

  const sidebarAddressTree = useMemo(() => {
    if (!searchQuery.trim() || !searchClassification) {
      return addressTree;
    }
    return filterAddressTreeForSearch(addressTree, searchClassification.parts);
  }, [addressTree, searchQuery, searchClassification]);

  const totalCount = placeBased ? sourcePosts.length : sourcePosts.length;

  const selectionLabel = formatAddressSelectionLabel(
    addressSelection,
    t("post.noAddress")
  );

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("post-")) {
      return;
    }
    setSelectedTreeKey(null);
    setSearchQuery("");
  }, [categoryId, subId]);

  useEffect(() => {
    const scrollToHashPost = () => {
      const hash = window.location.hash.slice(1);
      if (!hash.startsWith("post-")) {
        return;
      }
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    };

    scrollToHashPost();
    window.addEventListener("hashchange", scrollToHashPost);
    return () => window.removeEventListener("hashchange", scrollToHashPost);
  }, [visiblePosts, refreshKey]);

  const renderPosts = (posts: Post[]) =>
    posts.map((post) => (
      <div key={post.id} id={`post-${post.id}`} className="scroll-mt-28">
        <PostCard post={post} linkToDetail />
      </div>
    ));

  const writeControl = user ? (
    writeAllowed ? (
      <Link href={writeHref} className={pillButtonClassName}>
        {t("post.write")}
      </Link>
    ) : (
      <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-100">
        {t("moderation.scopeWrite")}
      </span>
    )
  ) : (
    <Link
      href={`/login?next=${encodeURIComponent(writeHref)}`}
      className={pillSecondaryButtonClassName}
    >
      {t("post.loginToWrite")}
    </Link>
  );

  if (totalCount === 0 && !placeBased) {
    return (
      <>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            {t("post.count").replace("{count}", String(totalCount))}
          </p>
          {writeControl}
        </div>
        <Card className="py-12 text-center">
          <p className="text-4xl">📝</p>
          <p className="mt-3 text-base text-gray-500">{t("post.empty")}</p>
          {user && writeAllowed && (
            <Link href={writeHref} className={`mt-4 ${pillButtonClassName}`}>
              {t("post.writeFirst")}
            </Link>
          )}
        </Card>
        {user && writeAllowed && (
          <FloatingWriteButton writeHref={writeHref} label={t("post.write")} />
        )}
      </>
    );
  }

  if (placeBased) {
    return (
      <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            {t("post.count").replace("{count}", String(totalCount))}
            {visiblePosts.length !== totalCount && (
              <span className="ml-2 text-[#06C755]">
                · {t("post.filteredCount").replace("{count}", String(visiblePosts.length))}
              </span>
            )}
          </p>
          {writeControl}
        </div>

        <div className={socialPlaceBoardRowClassName}>
          <div className={socialPlaceSidebarColumnClassName}>
            <PlaceBoardSidebar
              categoryId={categoryId}
              addressTree={sidebarAddressTree}
              selectedTreeKey={selectedTreeKey}
              onTreeSelect={setSelectedTreeKey}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchClassification={searchClassification}
              isResolvingSearch={isResolvingSearch}
              totalPosts={totalCount}
              isEnriching={isEnriching}
            />
          </div>

          <div className={`${socialPostFeedWrapClassName} ${socialPlaceFeedColumnClassName}`}>
            {totalCount === 0 ? (
              <Card className="w-full py-12 text-center">
                <p className="text-4xl">📝</p>
                <p className="mt-3 text-base text-gray-500">{t("post.empty")}</p>
                {user && writeAllowed && (
                  <Link href={writeHref} className={`mt-4 ${pillButtonClassName}`}>
                    {t("post.writeFirst")}
                  </Link>
                )}
              </Card>
            ) : visiblePosts.length === 0 ? (
              <Card className="w-full py-10 text-center">
                <p className="text-3xl">🔍</p>
                <p className="mt-3 text-base font-semibold text-gray-900">
                  {searchQuery.trim()
                    ? t("post.noAddressSearchResults")
                    : t("post.emptyAddress")}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {t("post.addressBrowseHint")}
                </p>
              </Card>
            ) : (
              <div className="w-full">
                {(addressSelection || searchQuery.trim()) && (
                  <Card className="mb-[var(--social-feed-gap)] border-t-[3px] border-t-[#06C755] !py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#06C755]">
                      {searchQuery.trim()
                        ? t("post.addressSearchResult")
                        : t("post.selectedAddress")}
                    </p>
                    <p className="mt-1 text-lg font-bold leading-snug text-gray-900">
                      {searchQuery.trim() ? (
                        <>
                          🔍{" "}
                          {searchClassification?.displayAddress || searchQuery.trim()}
                        </>
                      ) : (
                        <>📍 {selectionLabel}</>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {t("post.addressCount").replace(
                        "{count}",
                        String(visiblePosts.length)
                      )}
                    </p>
                  </Card>
                )}

                {mapMarkers.length > 0 ? (
                  <div className="mb-[var(--social-feed-gap)]">
                    <KakaoMapView
                      markers={mapMarkers}
                      center={mapCenter}
                      onMarkerClick={(markerId) => {
                        document.getElementById(`post-${markerId}`)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    />
                  </div>
                ) : null}

                <div className={postFeedClassName}>{renderPosts(visiblePosts)}</div>
              </div>
            )}
          </div>
        </div>

        {user && writeAllowed && (
          <FloatingWriteButton writeHref={writeHref} label={t("post.write")} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {t("post.count").replace("{count}", String(sourcePosts.length))}
        </p>
        {writeControl}
      </div>

      {sourcePosts.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-4xl">📝</p>
          <p className="mt-3 text-base text-gray-500">{t("post.empty")}</p>
          {user && writeAllowed && (
            <Link href={writeHref} className={`mt-4 ${pillButtonClassName}`}>
              {t("post.writeFirst")}
            </Link>
          )}
        </Card>
      ) : (
        <div className={socialPostFeedWrapClassName}>
          <div className={postFeedClassName}>{renderPosts(sourcePosts)}</div>
        </div>
      )}

      {user && writeAllowed && (
        <FloatingWriteButton writeHref={writeHref} label={t("post.write")} />
      )}
    </>
  );
}

function FloatingWriteButton({
  writeHref,
  label,
}: {
  writeHref: string;
  label: string;
}) {
  return (
    <Link
      href={writeHref}
      className={`social-fab-center flex items-center gap-2 shadow-lg ring-4 ring-[#06C755]/20 ${primaryButtonClassName} rounded-full px-8 py-4`}
    >
      <span>✏️</span>
      <span>{label}</span>
    </Link>
  );
}
