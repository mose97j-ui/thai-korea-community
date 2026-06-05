"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCategoryRegistryVersion } from "@/contexts/CategoryRegistryContext";
import PostLinkImportField from "@/components/PostLinkImportField";
import PostMediaField from "@/components/PostMediaField";
import KakaoAddressField, { type KakaoAddressValue } from "@/components/KakaoAddressField";
import PlaceReviewFormFields, {
  createInitialReviewRatings,
} from "@/components/PlaceReviewFormFields";
import ModerationNotice from "@/components/ModerationNotice";
import {
  Card,
  ErrorMessage,
  FormField,
  SubmitButton,
  inputClassName,
  postFormPanelClassName,
  postFormTextareaClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import {
  getHomeCategoryById,
  getSubCategoryItem,
} from "@/lib/categories/registry";
import { getUserNickname } from "@/lib/auth/profileImage";
import { canWritePosts } from "@/lib/auth/moderation";
import { validatePostContent } from "@/lib/moderation/autoModeration";
import { validateKoreanAddress } from "@/lib/posts/address";
import { fetchGeocode } from "@/lib/maps/clientGeocode";
import { getPostFormTemplate } from "@/lib/posts/formTemplates";
import type { LinkImportDraft } from "@/lib/posts/linkExtract";
import { validateVideoUrl } from "@/lib/posts/media";
import {
  buildPlaceReviewData,
  getPlaceReviewSchema,
  isReviewsCategory,
  ratingsRecordFromPost,
  type PlaceReviewPriceLevel,
  type PlaceReviewRatingKey,
} from "@/lib/posts/placeReview";
import {
  clearPostDraft,
  getPostDraft,
  savePostDraft,
} from "@/lib/posts/drafts";
import { hashSecretPassword, validateSecretPassword } from "@/lib/posts/secret";
import { setPostPublishFlash } from "@/lib/posts/publishFlash";
import {
  createPostWithTranslation,
  getPostById,
  getPostSourceFields,
  updatePostWithTranslation,
} from "@/lib/posts/storage";

type CategoryPostFormProps = {
  categoryId: string;
  subId: string;
  postId?: string;
  compact?: boolean;
  showHeader?: boolean;
  embedded?: boolean;
  onSuccess?: (result: { categoryId: string; subId: string; postId?: string }) => void;
};

export default function CategoryPostForm({
  categoryId,
  subId,
  postId,
  compact = false,
  showHeader = true,
  embedded = false,
  onSuccess,
}: CategoryPostFormProps) {
  const router = useRouter();
  const { t, pick, locale } = useLocale();
  const { user } = useAuth();
  const menuVersion = useCategoryRegistryVersion();
  const template = getPostFormTemplate(categoryId);
  const category = useMemo(
    () => getHomeCategoryById(categoryId),
    [categoryId, menuVersion]
  );
  const subItem = useMemo(
    () => getSubCategoryItem(categoryId, subId),
    [categoryId, subId, menuVersion]
  );

  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [address, setAddress] = useState("");
  const [addressMeta, setAddressMeta] = useState<KakaoAddressValue | null>(null);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [secretPassword, setSecretPassword] = useState("");
  const [secretPasswordConfirm, setSecretPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(!postId);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftKeyRef = useRef<string | null>(null);
  const showPlaceReview = isReviewsCategory(categoryId);
  const reviewSchema = getPlaceReviewSchema(categoryId, subId);
  const [reviewRatings, setReviewRatings] = useState<Record<PlaceReviewRatingKey, number>>(
    () => createInitialReviewRatings(categoryId, subId)
  );
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [priceLevel, setPriceLevel] = useState<PlaceReviewPriceLevel | "">("");
  const [priceNote, setPriceNote] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [sourceLinksText, setSourceLinksText] = useState("");
  const [inferredItemsText, setInferredItemsText] = useState("");
  const [inferenceSummary, setInferenceSummary] = useState("");
  const isPurchaseAgency = template.id === "purchaseAgency";

  const isEditMode = Boolean(postId);
  const contentMinHeightPx = compact
    ? template.contentArea.formMinHeightCompactPx
    : template.contentArea.formMinHeightPx;

  useEffect(() => {
    if (!postId) {
      setLoaded(true);
      return;
    }

    const existing = getPostById(postId);
    if (!existing) {
      setLoaded(true);
      return;
    }

    const fields = getPostSourceFields(existing);
    setPrimary(fields.storeName);
    setSecondary(fields.title !== fields.storeName ? fields.title : "");
    setAddress(fields.address);
    setAddressMeta(null);
    setContent(fields.content);
    setImages(existing.images ?? []);
    setVideoUrl(existing.videoUrl ?? "");
    setIsSecret(existing.isSecret ?? false);
    if (existing.placeReview && reviewSchema) {
      setReviewRatings(ratingsRecordFromPost(existing.placeReview, reviewSchema));
      setPricePerPerson(existing.placeReview.pricePerPerson ?? "");
      setPriceLevel(existing.placeReview.priceLevel ?? "");
      setPriceNote(existing.placeReview.priceNote ?? "");
    }
    setBankAccount(existing.purchaseAgency?.bankAccount ?? "");
    setPhoneNumber(existing.purchaseAgency?.phoneNumber ?? "");
    setReceiverAddress(existing.purchaseAgency?.receiverAddress ?? "");
    setSourceLinksText((existing.purchaseAgency?.sourceLinks ?? []).join("\n"));
    setInferredItemsText((existing.purchaseAgency?.inferredItems ?? []).join(", "));
    setInferenceSummary(existing.purchaseAgency?.inferenceSummary ?? "");
    setLoaded(true);
  }, [postId, reviewSchema]);

  useEffect(() => {
    if (!user || !loaded) {
      return;
    }

    const draftKey = `${user.id}:${categoryId}:${subId}:${postId ?? "new"}`;
    if (draftKeyRef.current === draftKey) {
      return;
    }
    draftKeyRef.current = draftKey;

    const draft = getPostDraft(user.id, categoryId, subId, postId);
    if (!draft) {
      setDraftRestored(false);
      setAutoSavedAt(null);
      if (!isEditMode) {
        setPrimary("");
        setSecondary("");
        setAddress("");
        setContent("");
        setImages([]);
        setVideoUrl("");
        setIsSecret(false);
        setReviewRatings(createInitialReviewRatings(categoryId, subId));
        setPricePerPerson("");
        setPriceLevel("");
        setPriceNote("");
        setBankAccount("");
        setPhoneNumber("");
        setReceiverAddress("");
        setSourceLinksText("");
        setInferredItemsText("");
        setInferenceSummary("");
      }
      return;
    }

    setPrimary(draft.primary);
    setSecondary(draft.secondary);
    setAddress(draft.address);
    setContent(draft.content);
    setImages(draft.images);
    setVideoUrl(draft.videoUrl);
    setIsSecret(draft.isSecret);
    if (draft.reviewRatingsJson) {
      try {
        setReviewRatings(JSON.parse(draft.reviewRatingsJson) as Record<PlaceReviewRatingKey, number>);
      } catch {
        setReviewRatings(createInitialReviewRatings(categoryId, subId));
      }
    }
    setPricePerPerson(draft.pricePerPerson ?? "");
    setPriceLevel((draft.priceLevel as PlaceReviewPriceLevel) ?? "");
    setPriceNote(draft.priceNote ?? "");
    setBankAccount(draft.bankAccount ?? "");
    setPhoneNumber(draft.phoneNumber ?? "");
    setReceiverAddress(draft.receiverAddress ?? "");
    setSourceLinksText(draft.sourceLinksText ?? "");
    setInferredItemsText(draft.inferredItemsText ?? "");
    setInferenceSummary(draft.inferenceSummary ?? "");

    setDraftRestored(true);
    setAutoSavedAt(draft.updatedAt);
  }, [user, loaded, categoryId, subId, postId, isEditMode]);

  useDebouncedEffect(
    () => {
      if (!user || !loaded) {
        return;
      }
      savePostDraft(user.id, categoryId, subId, postId, {
        primary,
        secondary,
        address,
        content,
        images,
        videoUrl,
        isSecret,
        reviewRatingsJson: showPlaceReview ? JSON.stringify(reviewRatings) : undefined,
        pricePerPerson: showPlaceReview ? pricePerPerson : undefined,
        priceLevel: showPlaceReview ? priceLevel : undefined,
        priceNote: showPlaceReview ? priceNote : undefined,
        bankAccount: isPurchaseAgency ? bankAccount : undefined,
        phoneNumber: isPurchaseAgency ? phoneNumber : undefined,
        receiverAddress: isPurchaseAgency ? receiverAddress : undefined,
        sourceLinksText: isPurchaseAgency ? sourceLinksText : undefined,
        inferredItemsText: isPurchaseAgency ? inferredItemsText : undefined,
        inferenceSummary: isPurchaseAgency ? inferenceSummary : undefined,
      });
      setAutoSavedAt(new Date().toISOString());
    },
    [
      user,
      loaded,
      categoryId,
      subId,
      postId,
      primary,
      secondary,
      address,
      content,
      images,
      videoUrl,
      isSecret,
      showPlaceReview,
      reviewRatings,
      pricePerPerson,
      priceLevel,
      priceNote,
      isPurchaseAgency,
      bankAccount,
      phoneNumber,
      receiverAddress,
      sourceLinksText,
      inferredItemsText,
      inferenceSummary,
    ],
    700
  );

  if (!user || !category || !subItem) {
    return null;
  }

  if (!loaded) {
    return (
      <Card className="py-10 text-center text-sm text-gray-500">
        {t("common.loading")}
      </Card>
    );
  }

  const writeBlocked = !canWritePosts(user);

  const handleImported = (draft: LinkImportDraft) => {
    if (draft.storeName) {
      setPrimary(draft.storeName);
    }
    if (draft.address) {
      setAddress(draft.address);
    }
    if (draft.title) {
      setSecondary(draft.title);
    }
    if (draft.content) {
      setContent(draft.content);
    }
    if (draft.videoUrl) {
      setVideoUrl(draft.videoUrl);
    }
    setSourceLinksText((prev) =>
      [prev, draft.sourceUrl].filter(Boolean).join("\n")
    );
    if (draft.inferredItems?.length) {
      setInferredItemsText(draft.inferredItems.join(", "));
    }
    if (draft.inferenceSummary) {
      setInferenceSummary(draft.inferenceSummary);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (writeBlocked) {
      setError(t("moderation.blockWrite"));
      return;
    }

    if (template.primary.required && !primary.trim()) {
      setError(t(template.errorPrimaryKey));
      return;
    }

    if (template.address?.required) {
      if (!address.trim()) {
        setError(t(template.errorAddressKey ?? "post.errorAddress"));
        return;
      }
      if (!validateKoreanAddress(address)) {
        setError(t(template.errorAddressKey ?? "post.errorAddress"));
        return;
      }
    } else if (address.trim() && !validateKoreanAddress(address)) {
      setError(t("post.errorAddress"));
      return;
    }

    if (template.content.required && !content.trim()) {
      setError(t("post.errorContent"));
      return;
    }

    let placeReview = undefined;
    if (showPlaceReview && reviewSchema) {
      placeReview =
        buildPlaceReviewData({
          schema: reviewSchema,
          ratings: reviewRatings,
          pricePerPerson,
          priceLevel: priceLevel || undefined,
          priceNote,
        }) ?? undefined;

      if (!placeReview) {
        setError(t("review.errorRatingsRequired"));
        return;
      }
    }

    if (template.showMedia && !validateVideoUrl(videoUrl)) {
      setError(t("post.errorVideoLink"));
      return;
    }

    if (isSecret) {
      if (isEditMode && !secretPassword && !secretPasswordConfirm) {
        // Keep existing secret password when editing without changing it.
      } else {
        if (!validateSecretPassword(secretPassword)) {
          setError(t("post.errorSecretPassword"));
          return;
        }
        if (secretPassword !== secretPasswordConfirm) {
          setError(t("post.errorSecretPasswordConfirm"));
          return;
        }
      }
    }

    const storeName = primary.trim();
    const postTitle = template.showSecondaryTitle
      ? secondary.trim() || storeName
      : storeName;
    const postAddress = address.trim();
    const purchaseAgency = isPurchaseAgency
      ? {
          bankAccount: bankAccount.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          receiverAddress: receiverAddress.trim() || undefined,
          sourceLinks: sourceLinksText
            .split(/\n|,/)
            .map((item) => item.trim())
            .filter(Boolean),
          inferredItems: inferredItemsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          inferenceSummary: inferenceSummary.trim() || undefined,
        }
      : undefined;

    let resolvedAddress = addressMeta;
    if (postAddress && template.address) {
      if (!resolvedAddress || resolvedAddress.address !== postAddress) {
        const geocode = await fetchGeocode(postAddress);
        if (geocode) {
          resolvedAddress = {
            address: geocode.displayAddress || postAddress,
            roadAddress: geocode.roadAddress,
            jibunAddress: geocode.jibunAddress,
            displayAddress: geocode.displayAddress,
            mapLat: geocode.lat || undefined,
            mapLng: geocode.lng || undefined,
          };
        }
      }
    }

    const validation = validatePostContent(user, {
      storeName,
      title: postTitle,
      content,
      address: resolvedAddress?.displayAddress || postAddress,
    });
    if (!validation.ok) {
      if (validation.autoRestricted) {
        setError(t("report.errorAutoRestricted"));
      } else {
        setError(
          validation.error === "CONTENT_FILTERED_SEVERE"
            ? t("report.errorFilteredSevere")
            : t("report.errorFiltered")
        );
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const secretPasswordHash =
        isSecret && secretPassword
          ? await hashSecretPassword(secretPassword)
          : undefined;

      const payload = {
        storeName,
        address: resolvedAddress?.displayAddress || postAddress,
        roadAddress: resolvedAddress?.roadAddress,
        jibunAddress: resolvedAddress?.jibunAddress,
        displayAddress: resolvedAddress?.displayAddress,
        mapLat: resolvedAddress?.mapLat,
        mapLng: resolvedAddress?.mapLng,
        placeReview,
        purchaseAgency,
        title: postTitle,
        content,
        images: template.showMedia ? images : [],
        videoUrl: template.showMedia ? videoUrl.trim() || undefined : undefined,
        sourceLocale: locale,
        isSecret,
        secretPasswordHash,
      };

      if (isEditMode && postId) {
        const existing = getPostById(postId);
        if (!existing || existing.authorId !== user.id) {
          setError(t("post.notAuthor"));
          return;
        }

        await updatePostWithTranslation(postId, payload);
        clearPostDraft(user.id, categoryId, subId, postId);

        if (onSuccess) {
          onSuccess({ categoryId, subId, postId });
        } else {
          router.push(`/p/${postId}`);
        }
      } else {
        const created = await createPostWithTranslation({
          categoryId,
          subId,
          authorId: user.id,
          authorNickname: getUserNickname(user),
          authorProfileImage: user.profileImage,
          ...payload,
        });
        clearPostDraft(user.id, categoryId, subId);

        setPostPublishFlash({
          postId: created.id,
          categoryId,
          subId,
          title: created.title || created.storeName,
          isSecret: Boolean(created.isSecret),
        });

        if (onSuccess) {
          onSuccess({ categoryId, subId, postId: created.id });
        } else {
          router.push(`/c/${categoryId}/${subId}#post-${created.id}`);
        }
      }
    } catch {
      setError(t("post.translationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {template.showLinkImport && (
        <PostLinkImportField
          defaultCategoryId={categoryId}
          defaultSubId={subId}
          onImported={handleImported}
        />
      )}

      {showHeader && (
        <div className="rounded-2xl border border-[#06C755]/20 bg-[#06C755]/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#06C755]">
            {isEditMode ? t("post.editTitle") : t("post.writingIn")}
          </p>
          <p className="mt-1 text-base font-bold text-gray-900">
            {pick(category.label)} · {pick(subItem.title)}
          </p>
          <p className="mt-1 text-sm text-gray-500">{t(template.hintKey)}</p>
          {draftRestored ? (
            <p className="mt-2 text-xs font-medium text-[#06C755]">{t("post.draftRestored")}</p>
          ) : null}
          {autoSavedAt ? (
            <p className="mt-1 text-xs text-gray-500">
              {t("post.autoSaved")} · {new Date(autoSavedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>
      )}

      {!showHeader && autoSavedAt ? (
        <p className="text-xs text-gray-500">
          {t("post.autoSaved")} · {new Date(autoSavedAt).toLocaleTimeString()}
        </p>
      ) : null}

      <FormField label={t(template.primary.labelKey)}>
        <input
          type="text"
          value={primary}
          onChange={(event) => setPrimary(event.target.value)}
          placeholder={t(template.primary.placeholderKey)}
          maxLength={80}
          className={inputClassName}
          required={template.primary.required}
        />
      </FormField>

      {template.showSecondaryTitle && template.secondary && (
        <FormField label={t(template.secondary.labelKey)}>
          <input
            type="text"
            value={secondary}
            onChange={(event) => setSecondary(event.target.value)}
            placeholder={t(template.secondary.placeholderKey)}
            maxLength={80}
            className={inputClassName}
          />
        </FormField>
      )}

      {template.address && (
        <KakaoAddressField
          value={address}
          onChange={(value) => {
            setAddress(value);
            setAddressMeta(null);
          }}
          onResolved={setAddressMeta}
          label={t(template.address.labelKey)}
          required={template.address.required}
          placeholder={t(template.address.placeholderKey)}
        />
      )}

      {showPlaceReview && reviewSchema ? (
        <PlaceReviewFormFields
          categoryId={categoryId}
          subId={subId}
          ratings={reviewRatings}
          onRatingChange={(key, score) =>
            setReviewRatings((current) => ({ ...current, [key]: score }))
          }
          pricePerPerson={pricePerPerson}
          onPricePerPersonChange={setPricePerPerson}
          priceLevel={priceLevel}
          onPriceLevelChange={setPriceLevel}
          priceNote={priceNote}
          onPriceNoteChange={setPriceNote}
        />
      ) : null}

      {isPurchaseAgency ? (
        <div className="space-y-4 rounded-2xl border border-[#06C755]/20 bg-[#06C755]/5 p-4">
          <p className="text-sm font-semibold text-[#06C755]">{t("post.purchaseAgencyInfoTitle")}</p>
          <FormField label={t("post.purchaseBankAccount")}>
            <input
              type="text"
              value={bankAccount}
              onChange={(event) => setBankAccount(event.target.value)}
              placeholder={t("post.purchaseBankAccountPlaceholder")}
              maxLength={120}
              className={inputClassName}
            />
          </FormField>
          <FormField label={t("post.purchasePhoneNumber")}>
            <input
              type="text"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder={t("post.purchasePhoneNumberPlaceholder")}
              maxLength={40}
              className={inputClassName}
            />
          </FormField>
          <FormField label={t("post.purchaseReceiverAddress")}>
            <textarea
              value={receiverAddress}
              onChange={(event) => setReceiverAddress(event.target.value)}
              placeholder={t("post.purchaseReceiverAddressPlaceholder")}
              rows={2}
              className={postFormTextareaClassName}
            />
          </FormField>
          <FormField label={t("post.purchaseSourceLinks")}>
            <textarea
              value={sourceLinksText}
              onChange={(event) => setSourceLinksText(event.target.value)}
              placeholder={t("post.purchaseSourceLinksPlaceholder")}
              rows={2}
              className={postFormTextareaClassName}
            />
          </FormField>
          <FormField label={t("post.purchaseInferredItems")}>
            <input
              type="text"
              value={inferredItemsText}
              onChange={(event) => setInferredItemsText(event.target.value)}
              placeholder={t("post.purchaseInferredItemsPlaceholder")}
              className={inputClassName}
            />
          </FormField>
          <FormField label={t("post.purchaseInferenceSummary")}>
            <textarea
              value={inferenceSummary}
              onChange={(event) => setInferenceSummary(event.target.value)}
              placeholder={t("post.purchaseInferenceSummaryPlaceholder")}
              rows={2}
              className={postFormTextareaClassName}
            />
          </FormField>
          <p className="text-xs text-gray-600">{t("post.purchaseOperatorOnlyHint")}</p>
        </div>
      ) : null}

      <FormField label={t(template.content.labelKey)}>
        <div className={postFormPanelClassName}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t(template.content.placeholderKey)}
            rows={compact ? 6 : 10}
            maxLength={3000}
            style={{ minHeight: contentMinHeightPx }}
            className={postFormTextareaClassName}
            required={template.content.required}
          />
        </div>
      </FormField>

      {template.showMedia &&
        (compact ? (
          <details className="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-700">
              📷 {t("post.media")}
            </summary>
            <div className="mt-3">
              <PostMediaField
                images={images}
                onImagesChange={setImages}
                videoUrl={videoUrl}
                onVideoUrlChange={setVideoUrl}
              />
            </div>
          </details>
        ) : (
          <FormField label={t("post.media")}>
            <PostMediaField
              images={images}
              onImagesChange={setImages}
              videoUrl={videoUrl}
              onVideoUrlChange={setVideoUrl}
            />
          </FormField>
        ))}

      {!compact && (
        <div className="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(event) => {
                setIsSecret(event.target.checked);
                if (!event.target.checked) {
                  setSecretPassword("");
                  setSecretPasswordConfirm("");
                }
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#06C755] focus:ring-[#06C755]"
            />
            <span>
              <span className="block text-base font-semibold text-gray-900">
                🔒 {t("post.secretToggle")}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-gray-500">
                {t("post.secretHint")}
              </span>
            </span>
          </label>

          {isSecret && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {isEditMode ? (
                <p className="col-span-full text-sm text-gray-500">
                  {t("post.secretEditHint")}
                </p>
              ) : null}
              <FormField label={t("post.secretPassword")}>
                <input
                  type="password"
                  value={secretPassword}
                  onChange={(event) => setSecretPassword(event.target.value)}
                  placeholder={t("post.secretPasswordPlaceholder")}
                  maxLength={20}
                  autoComplete="new-password"
                  className={inputClassName}
                  required={!isEditMode}
                />
              </FormField>
              <FormField label={t("post.secretPasswordConfirm")}>
                <input
                  type="password"
                  value={secretPasswordConfirm}
                  onChange={(event) =>
                    setSecretPasswordConfirm(event.target.value)
                  }
                  placeholder={t("post.secretPasswordPlaceholder")}
                  maxLength={20}
                  autoComplete="new-password"
                  className={inputClassName}
                  required={!isEditMode}
                />
              </FormField>
            </div>
          )}
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <SubmitButton disabled={isSubmitting}>
        {isSubmitting
          ? t("post.translating")
          : isEditMode
            ? t("post.saveEdit")
            : t("post.submit")}
      </SubmitButton>
    </form>
  );

  return (
    <>
      {writeBlocked && <ModerationNotice user={user} className="mb-4" />}
      {embedded ? (
        <div className={writeBlocked ? "pointer-events-none opacity-50" : undefined}>
          {formBody}
        </div>
      ) : (
        <Card className={writeBlocked ? "pointer-events-none opacity-50" : undefined}>
          {formBody}
        </Card>
      )}
    </>
  );
}
