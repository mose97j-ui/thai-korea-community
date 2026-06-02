"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import KakaoMapView from "@/components/KakaoMapView";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/PostCard";
import { Card, SectionLabel, TopicCard, postFeedClassName, topicGridClassName } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { getHomeCategoryById, isPremiumCategoryId } from "@/lib/categories/registry";
import {
  classifyAddressToCategories,
  groupPostsByCategoryForAddress,
  getAddressMatchedPosts,
} from "@/lib/maps/addressClassify";
import { fetchGeocode } from "@/lib/maps/clientGeocode";
import type { GeocodeResult } from "@/lib/maps/types";
import { validateKoreanAddress } from "@/lib/posts/address";
import {
  groupPostsByCategory,
  searchAll,
  type SearchCategoryHit,
} from "@/lib/posts/search";
import { POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import { filterPostsForViewer } from "@/lib/posts/visibility";

export default function SearchResultsContent() {
  const { t, pick } = useLocale();
  const { user } = useAuth();
  const { hasAccess: hasPremiumAccess } = usePremiumAccess();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [refreshKey, setRefreshKey] = useState(0);
  const [geocode, setGeocode] = useState<GeocodeResult | null>(null);
  const [classifying, setClassifying] = useState(false);

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
    if (!query || !validateKoreanAddress(query)) {
      setGeocode(null);
      return;
    }

    let active = true;
    setClassifying(true);

    void fetchGeocode(query)
      .then((result) => {
        if (active) {
          setGeocode(result);
        }
      })
      .finally(() => {
        if (active) {
          setClassifying(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query, refreshKey]);

  const results = useMemo(
    () =>
      searchAll(query, {
        includePremium: hasPremiumAccess,
        viewerId: user?.id,
      }),
    [query, hasPremiumAccess, refreshKey, user?.id]
  );

  const groupedPosts = useMemo(
    () => groupPostsByCategory(results.posts),
    [results.posts]
  );

  const showAddressSection = Boolean(geocode && validateKoreanAddress(query));
  const addressCategories = useMemo(
    () => (geocode ? classifyAddressToCategories(geocode) : []),
    [geocode]
  );
  const addressPostsByCategory = useMemo(() => {
    if (!geocode) {
      return [];
    }
    const posts = filterPostsForViewer(getAddressMatchedPosts(geocode), user?.id);
    return groupPostsByCategoryForAddress(posts, geocode);
  }, [geocode, refreshKey, user?.id]);

  const mergedCategories = useMemo(() => {
    if (!showAddressSection) {
      return results.categories;
    }

    const seen = new Set<string>();
    const merged: SearchCategoryHit[] = [];

    for (const hit of [...addressCategories, ...results.categories]) {
      const key =
        hit.kind === "category"
          ? `category:${hit.categoryId}`
          : `sub:${hit.categoryId}:${hit.subId}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(hit);
    }

    return merged;
  }, [addressCategories, results.categories, showAddressSection]);

  const totalCount =
    mergedCategories.length +
    results.posts.length +
    (showAddressSection
      ? addressPostsByCategory.reduce((sum, group) => sum + group.posts.length, 0)
      : 0);

  const hasQuery = query.length > 0;

  const renderCategoryHit = (hit: SearchCategoryHit) => {
    const category = getHomeCategoryById(hit.categoryId);
    const lockedPremium =
      hit.categoryId && isPremiumCategoryId(hit.categoryId) && !hasPremiumAccess;
    const title = pick({ ko: hit.labelKo, th: hit.labelTh });
    const description =
      hit.kind === "subcategory" && hit.descriptionKo && hit.descriptionTh
        ? pick({ ko: hit.descriptionKo, th: hit.descriptionTh })
        : category
          ? pick(category.label)
          : "";

    const href = lockedPremium ? "/premium" : hit.href;

    return (
      <Link key={`${hit.kind}-${hit.categoryId}-${hit.subId ?? "root"}`} href={href}>
        <TopicCard
          icon={hit.icon}
          title={title}
          description={
            hit.kind === "subcategory" && category
              ? `${pick(category.label)} · ${description}`
              : description || title
          }
          tint={hit.tint}
        />
      </Link>
    );
  };

  return (
    <>
      <PageHeader compact title={t("search.title")} backHref="/" backLabel={t("common.backHome")} />

      <GlobalSearchBar initialQuery={query} className="mb-3" autoFocus={!hasQuery} />

      {!hasQuery ? (
        <Card className="py-12 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-4 text-lg font-semibold text-gray-900">{t("search.hint")}</p>
          <p className="mt-2 text-base text-gray-500">{t("search.emptyQuery")}</p>
        </Card>
      ) : (
        <>
          <Card className="mb-3 border-l-4 border-l-[#06C755]">
            <p className="text-sm font-semibold text-[#06C755]">
              {t("search.queryLabel").replace("{query}", query)}
            </p>
            <p className="mt-1 text-base text-gray-600">
              {t("search.totalCount").replace("{count}", String(totalCount))}
              {results.posts.length > 0
                ? ` · ${t("search.postCount").replace("{count}", String(results.posts.length))}`
                : ""}
              {mergedCategories.length > 0
                ? ` · ${t("search.categoryCount").replace(
                    "{count}",
                    String(mergedCategories.length)
                  )}`
                : ""}
            </p>
          </Card>

          {showAddressSection && geocode ? (
            <Card className="mb-3 space-y-4">
              <div>
                <SectionLabel>{t("search.addressClassifyTitle")}</SectionLabel>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {geocode.displayAddress}
                </p>
                {geocode.jibunAddress &&
                geocode.roadAddress &&
                geocode.jibunAddress !== geocode.roadAddress ? (
                  <p className="mt-1 text-sm text-gray-500">
                    {t("map.jibunLabel")}: {geocode.jibunAddress}
                  </p>
                ) : null}
                {classifying ? (
                  <p className="mt-2 text-sm text-gray-500">{t("map.resolving")}</p>
                ) : null}
              </div>

              {geocode.lat && geocode.lng ? (
                <KakaoMapView
                  center={{ lat: geocode.lat, lng: geocode.lng }}
                  markers={[
                    {
                      id: "search-center",
                      lat: geocode.lat,
                      lng: geocode.lng,
                      title: geocode.displayAddress,
                    },
                  ]}
                />
              ) : null}
            </Card>
          ) : null}

          {totalCount === 0 ? (
            <Card className="py-12 text-center">
              <p className="text-4xl">😕</p>
              <p className="mt-4 text-lg font-semibold text-gray-900">
                {t("search.noResults")}
              </p>
              <p className="mt-2 text-base text-gray-500">{t("search.noResultsHint")}</p>
            </Card>
          ) : (
            <div className="space-y-8">
              {mergedCategories.length > 0 && (
                <section>
                  <SectionLabel>
                    {showAddressSection
                      ? t("search.addressCategoriesSection")
                      : t("search.categoriesSection")}{" "}
                    ({mergedCategories.length})
                  </SectionLabel>
                  <div className={topicGridClassName}>
                    {mergedCategories.map(renderCategoryHit)}
                  </div>
                </section>
              )}

              {showAddressSection && addressPostsByCategory.length > 0 ? (
                <section>
                  <SectionLabel>{t("search.addressPostsSection")}</SectionLabel>
                  {addressPostsByCategory.map(({ categoryId, posts }) => {
                    const category = getHomeCategoryById(categoryId);
                    return (
                      <div key={`address-${categoryId}`} className="mb-3">
                        <p className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
                          <span>{category?.icon}</span>
                          <span>{category ? pick(category.label) : categoryId}</span>
                          <span className="text-sm font-normal text-gray-500">
                            ({posts.length})
                          </span>
                        </p>
                        <div className={postFeedClassName}>
                          {posts.map((post) => (
                            <div key={post.id} id={`post-${post.id}`} className="scroll-mt-28">
                              <PostCard post={post} linkToDetail />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              ) : null}

              {results.posts.length > 0 && (
                <section>
                  <SectionLabel>
                    {t("search.postsSection")} ({results.posts.length})
                  </SectionLabel>

                  {groupedPosts.map(({ categoryId, posts }) => {
                    const category = getHomeCategoryById(categoryId);

                    return (
                      <div key={categoryId} className="mb-3">
                        <p className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
                          <span>{category?.icon}</span>
                          <span>{category ? pick(category.label) : categoryId}</span>
                          <span className="text-sm font-normal text-gray-500">
                            ({posts.length})
                          </span>
                        </p>
                        <div className={postFeedClassName}>
                          {posts.map((post) => (
                            <div key={post.id} id={`post-${post.id}`} className="scroll-mt-28">
                              <PostCard post={post} linkToDetail />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
