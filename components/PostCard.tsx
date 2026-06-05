"use client";

import { useMemo } from "react";
import Link from "next/link";
import OperatorPostAuthorInfo from "@/components/OperatorPostAuthorInfo";
import PostAuthorActions from "@/components/PostAuthorActions";
import PostEngagement from "@/components/PostEngagement";
import PostMediaDisplay from "@/components/PostMediaDisplay";
import PlaceReviewDisplay from "@/components/PlaceReviewDisplay";
import SecretPostGate from "@/components/SecretPostGate";
import UserAvatar from "@/components/UserAvatar";
import { Card } from "@/components/ui";
import { siteNameClass } from "@/lib/i18n/typography";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { useCategoryRegistryVersion } from "@/contexts/CategoryRegistryContext";
import { useLocalizedPost } from "@/hooks/useLocalizedPost";
import { useSecretPostAccess } from "@/hooks/useSecretPostAccess";
import {
  getHomeCategoryById,
  getSubCategoryItem,
} from "@/lib/categories/registry";
import { formatPostDate } from "@/lib/posts/format";
import { getPostFormTemplate } from "@/lib/posts/formTemplates";
import { isReviewsCategory } from "@/lib/posts/placeReview";
import type { Post } from "@/lib/posts/types";
import type { User } from "@/lib/auth/types";

type PostCardProps = {
  post: Post;
  linkToDetail?: boolean;
  isDetailPage?: boolean;
  justPublished?: boolean;
};

export default function PostCard({
  post,
  linkToDetail = false,
  isDetailPage = false,
  justPublished = false,
}: PostCardProps) {
  const { pick, t, locale } = useLocale();
  const { user } = useAuth();
  const { showOperatorUI } = useOperatorView();
  const { display, isTranslating, isTranslatedView, translationError } =
    useLocalizedPost(post);
  const { isSecret, canView, unlock } = useSecretPostAccess(post, user?.id);
  const menuVersion = useCategoryRegistryVersion();
  const category = useMemo(
    () => getHomeCategoryById(post.categoryId),
    [post.categoryId, menuVersion]
  );
  const subItem = useMemo(
    () => getSubCategoryItem(post.categoryId, post.subId),
    [post.categoryId, post.subId, menuVersion]
  );
  const formTemplate = getPostFormTemplate(post.categoryId);
  const isPlacePost = formTemplate.id === "place";
  const showPlaceReview = isReviewsCategory(post.categoryId) && post.placeReview;
  const isFeedPreview = linkToDetail && !isDetailPage;
  const feedContentMinHeight = `${formTemplate.contentArea.feedMinHeightRem}rem`;
  const detailContentMinHeight = `${formTemplate.contentArea.detailMinHeightRem}rem`;

  const author: User = {
    id: post.authorId,
    name: post.authorNickname,
    nickname: post.authorNickname,
    profileImage: post.authorProfileImage,
    birthDate: "2000-01-01",
    hometown: "",
    gmail: "",
    koreanPhone: "",
    personalCode: "",
    password: "",
    createdAt: post.createdAt,
  };

  const titleText = display.storeName || display.title;
  const isAuthor = Boolean(user && user.id === post.authorId);
  const hasSecondaryTitle =
    Boolean(display.title && display.storeName && display.title !== display.storeName);

  const publishedRingClass = justPublished
    ? "post-card--just-published ring-2 ring-[#06C755]/50"
    : "";

  if (isFeedPreview) {
    return (
      <Card className={`!overflow-hidden !p-0 ${publishedRingClass}`}>
        <div className="social-post-header !pb-3">
          <div className="flex flex-wrap items-start gap-3">
            <UserAvatar user={author} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-ui-title text-sm">{post.authorNickname}</p>
                <span className="text-ui-caption">·</span>
                <p className="text-ui-caption">{formatPostDate(post.createdAt, locale)}</p>
              </div>
              {subItem ? (
                <p
                  className={`text-ui-chip mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/[0.06] ${subItem.tint} text-[#050505]`}
                >
                  {subItem.icon} {pick(subItem.title)}
                </p>
              ) : null}
            </div>
            {justPublished ? (
              <span className="shrink-0 rounded-full bg-[#06C755] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                {t("post.publishedBadge")}
              </span>
            ) : null}
            {isSecret ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                🔒
              </span>
            ) : null}
            {post.isHiddenByAuthor && isAuthor ? (
              <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-300">
                {t("post.hiddenBadge")}
              </span>
            ) : null}
            {isAuthor && user ? (
              <PostAuthorActions
                post={post}
                userId={user.id}
                compact
                onDeleted={() => undefined}
                className="w-full basis-full sm:ml-auto sm:w-auto sm:basis-auto"
              />
            ) : null}
          </div>
        </div>

        <div className="social-divider-full" />

        <div className="social-post-body !pt-3">
          <Link
            href={`/p/${post.id}`}
            className="text-ui-title block text-xl leading-snug hover:text-[#06C755] sm:text-2xl lg:text-[1.625rem]"
          >
            {titleText}
          </Link>

          {canView && isPlacePost && display.address ? (
            <div className="social-zone social-zone--green mt-3 flex items-start gap-2 px-3 py-2.5 text-sm">
              <span aria-hidden>📍</span>
              <span className="text-ui-body min-w-0 flex-1 text-[#050505]">{display.address}</span>
            </div>
          ) : null}

          {canView && showPlaceReview ? (
            <PlaceReviewDisplay
              categoryId={post.categoryId}
              subId={post.subId}
              placeReview={post.placeReview!}
              compact
            />
          ) : null}

          {!canView ? (
            <p className="text-ui-caption mt-3">{t("post.secretPreview")}</p>
          ) : (
            <>
              {isTranslating && (
                <p className="text-ui-caption mt-3">{t("post.translating")}</p>
              )}
              {translationError && (
                <p className="text-ui-caption mt-3 text-amber-600">
                  {t("post.translationFailed")}
                </p>
              )}
              {canView && isTranslatedView && !isTranslating && !translationError && (
                <span className="mt-3 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                  {t("post.autoTranslated")}
                </span>
              )}
              {hasSecondaryTitle ? (
                <p className="text-ui-body mt-2 font-medium text-[#050505]">{display.title}</p>
              ) : null}
              <div
                className="social-post-content"
                style={{ minHeight: feedContentMinHeight }}
              >
                {display.content ? (
                  <p className="text-ui-body mt-3 line-clamp-6 whitespace-pre-wrap sm:line-clamp-5 lg:line-clamp-none">
                    {display.content}
                  </p>
                ) : null}
              </div>
              <PostMediaDisplay
                images={post.images}
                videoUrl={post.videoUrl}
                compact
              />
              {showOperatorUI && post.purchaseAgency ? (
                <div className="mt-3 rounded-xl border border-[#06C755]/20 bg-[#06C755]/5 p-3 text-sm">
                  <p className="font-semibold text-[#06C755]">{t("post.purchaseOperatorOnlyTitle")}</p>
                  {post.purchaseAgency.bankAccount ? (
                    <p className="mt-1 text-gray-700">
                      {t("post.purchaseBankAccount")}: {post.purchaseAgency.bankAccount}
                    </p>
                  ) : null}
                  {post.purchaseAgency.phoneNumber ? (
                    <p className="text-gray-700">
                      {t("post.purchasePhoneNumber")}: {post.purchaseAgency.phoneNumber}
                    </p>
                  ) : null}
                  {post.purchaseAgency.receiverAddress ? (
                    <p className="text-gray-700">
                      {t("post.purchaseReceiverAddress")}: {post.purchaseAgency.receiverAddress}
                    </p>
                  ) : null}
                  {post.purchaseAgency.inferredItems?.length ? (
                    <p className="text-gray-700">
                      {t("post.purchaseInferredItems")}:{" "}
                      {post.purchaseAgency.inferredItems.join(", ")}
                    </p>
                  ) : null}
                  {post.purchaseAgency.inferenceSummary ? (
                    <p className="text-gray-700">
                      {t("post.purchaseInferenceSummary")}: {post.purchaseAgency.inferenceSummary}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>

        {!canView ? (
          <div className="px-4 pb-4 sm:px-5">
            <SecretPostGate onUnlock={unlock} />
          </div>
        ) : (
          <PostEngagement post={post} isDetailPage={false} />
        )}

        <div className="px-4 sm:px-5">
          <OperatorPostAuthorInfo
            post={post}
            showModeration
            defaultExpanded={false}
          />
        </div>
      </Card>
    );
  }

  const badgeRow = (
    <div className="flex flex-wrap items-center gap-2">
      {isSecret && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
          🔒 {t("post.secretBadge")}
        </span>
      )}
      {post.isHiddenByAuthor && isAuthor && (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-300">
          {t("post.hiddenBadge")}
        </span>
      )}
      {canView && isTranslatedView && !isTranslating && !translationError && (
        <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
          {t("post.autoTranslated")}
        </span>
      )}
      {(category || subItem) && (
        <p className="text-ui-chip inline-flex max-w-full rounded-full bg-[#F0F2F5] px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-black/[0.06] sm:text-sm">
          {category ? pick(category.label) : post.categoryId}
          {subItem ? ` · ${pick(subItem.title)}` : ""}
        </p>
      )}
    </div>
  );

  const titleBlock = isDetailPage ? (
    badgeRow
  ) : (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {linkToDetail ? (
          <Link
            href={`/p/${post.id}`}
            className="text-ui-title hover:text-[#06C755]"
          >
            {titleText}
          </Link>
        ) : (
          <p className="text-ui-title">{titleText}</p>
        )}
        {isSecret && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
            🔒 {t("post.secretBadge")}
          </span>
        )}
        {canView && isTranslatedView && !isTranslating && !translationError && (
          <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
            {t("post.autoTranslated")}
          </span>
        )}
      </div>
      {(category || subItem) && canView && (
        <p className="text-ui-chip mt-2 inline-flex max-w-full rounded-full bg-[#F0F2F5] px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-black/[0.06] sm:text-sm">
          {category ? pick(category.label) : post.categoryId}
          {subItem ? ` · ${pick(subItem.title)}` : ""}
        </p>
      )}
    </div>
  );

  return (
    <Card className={`!overflow-hidden !p-0 ${publishedRingClass}`}>
      <div className="social-post-header">
        <div className="mb-4 flex items-start gap-3">
          <UserAvatar user={author} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-ui-title text-sm sm:text-base">{post.authorNickname}</p>
              <span className="text-ui-caption">·</span>
              <p className="text-ui-caption">{formatPostDate(post.createdAt, locale)}</p>
            </div>
            {subItem ? (
              <p
                className={`text-ui-chip mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/[0.06] sm:text-sm ${subItem.tint} text-[#050505]`}
              >
                {subItem.icon} {pick(subItem.title)}
              </p>
            ) : null}
          </div>
        </div>

        {isDetailPage && (
          <h1 className={`${siteNameClass} mb-3 text-2xl sm:text-3xl lg:text-4xl`}>
            {titleText}
          </h1>
        )}
        {titleBlock}
        {canView ? (
          isPlacePost && display.address ? (
            <div className="social-zone social-zone--green mt-3 flex items-start gap-2 px-3 py-2.5 text-sm sm:text-base">
              <span aria-hidden>📍</span>
              <span className="text-ui-body min-w-0 flex-1 text-[#050505]">{display.address}</span>
            </div>
          ) : display.address ? (
            <p className="text-ui-caption mt-2 sm:text-sm">📍 {display.address}</p>
          ) : null
        ) : (
          <p className="text-ui-caption mt-2">{t("post.secretPreview")}</p>
        )}
        {canView && showPlaceReview ? (
          <PlaceReviewDisplay
            categoryId={post.categoryId}
            subId={post.subId}
            placeReview={post.placeReview!}
          />
        ) : null}
        {isDetailPage && isAuthor && user ? (
          <PostAuthorActions post={post} userId={user.id} className="mt-3" />
        ) : null}
        {!isDetailPage && isAuthor && user ? (
          <PostAuthorActions
            post={post}
            userId={user.id}
            compact
            onDeleted={() => undefined}
            className="mt-3"
          />
        ) : null}
      </div>

      <div className="social-divider-full" />

      <div className="px-[var(--social-content-px)]">
        <OperatorPostAuthorInfo
          post={post}
          showModeration
          defaultExpanded={false}
        />
      </div>

      {!canView ? (
        <div className="px-[var(--social-content-px)] pb-4">
          <SecretPostGate onUnlock={unlock} />
        </div>
      ) : (
        <>
          <div className="social-post-body">
            {isTranslating && (
              <p className="text-ui-caption mb-2">{t("post.translating")}</p>
            )}

            {translationError && (
              <p className="text-ui-caption mb-2 text-amber-600">
                {t("post.translationFailed")}
              </p>
            )}

            {hasSecondaryTitle ? (
              <h2 className="text-ui-title text-lg sm:text-xl">{display.title}</h2>
            ) : null}
            <div
              className="social-post-content"
              style={{ minHeight: detailContentMinHeight }}
            >
              {display.content ? (
                <p className="text-ui-body mt-3 whitespace-pre-wrap text-[#050505] sm:text-base lg:text-[1.0625rem]">
                  {display.content}
                </p>
              ) : null}
            </div>

            <PostMediaDisplay images={post.images} videoUrl={post.videoUrl} />
            {showOperatorUI && post.purchaseAgency ? (
              <div className="mt-4 rounded-xl border border-[#06C755]/20 bg-[#06C755]/5 p-4 text-sm">
                <p className="font-semibold text-[#06C755]">{t("post.purchaseOperatorOnlyTitle")}</p>
                {post.purchaseAgency.bankAccount ? (
                  <p className="mt-1 text-gray-700">
                    {t("post.purchaseBankAccount")}: {post.purchaseAgency.bankAccount}
                  </p>
                ) : null}
                {post.purchaseAgency.phoneNumber ? (
                  <p className="text-gray-700">
                    {t("post.purchasePhoneNumber")}: {post.purchaseAgency.phoneNumber}
                  </p>
                ) : null}
                {post.purchaseAgency.receiverAddress ? (
                  <p className="text-gray-700">
                    {t("post.purchaseReceiverAddress")}: {post.purchaseAgency.receiverAddress}
                  </p>
                ) : null}
                {post.purchaseAgency.sourceLinks?.length ? (
                  <p className="text-gray-700">
                    {t("post.purchaseSourceLinks")}: {post.purchaseAgency.sourceLinks.join(", ")}
                  </p>
                ) : null}
                {post.purchaseAgency.inferredItems?.length ? (
                  <p className="text-gray-700">
                    {t("post.purchaseInferredItems")}:{" "}
                    {post.purchaseAgency.inferredItems.join(", ")}
                  </p>
                ) : null}
                {post.purchaseAgency.inferenceSummary ? (
                  <p className="text-gray-700">
                    {t("post.purchaseInferenceSummary")}: {post.purchaseAgency.inferenceSummary}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <PostEngagement post={post} isDetailPage={isDetailPage} />
        </>
      )}
    </Card>
  );
}
