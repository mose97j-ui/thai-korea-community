export type PostDraft = {
  primary: string;
  secondary: string;
  address: string;
  content: string;
  images: string[];
  videoUrl: string;
  isSecret: boolean;
  reviewRatingsJson?: string;
  pricePerPerson?: string;
  priceLevel?: string;
  priceNote?: string;
  bankAccount?: string;
  phoneNumber?: string;
  receiverAddress?: string;
  sourceLinksText?: string;
  inferredItemsText?: string;
  inferenceSummary?: string;
  updatedAt: string;
};

const DRAFTS_KEY = "tkc_post_drafts";

type DraftStore = Record<string, PostDraft>;

function readStore(): DraftStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as DraftStore;
  } catch {
    return {};
  }
}

function writeStore(store: DraftStore): void {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(store));
}

export function getPostDraftKey(
  userId: string,
  categoryId: string,
  subId: string,
  postId?: string
): string {
  if (postId) {
    return `${userId}:edit:${postId}`;
  }
  return `${userId}:${categoryId}:${subId}`;
}

export function getPostDraft(
  userId: string,
  categoryId: string,
  subId: string,
  postId?: string
): PostDraft | null {
  const key = getPostDraftKey(userId, categoryId, subId, postId);
  return readStore()[key] ?? null;
}

export function savePostDraft(
  userId: string,
  categoryId: string,
  subId: string,
  postId: string | undefined,
  draft: Omit<PostDraft, "updatedAt">
): void {
  const hasContent =
    draft.primary.trim() ||
    draft.secondary.trim() ||
    draft.address.trim() ||
    draft.content.trim() ||
    draft.images.length > 0 ||
    draft.videoUrl.trim() ||
    draft.reviewRatingsJson?.trim() ||
    draft.pricePerPerson?.trim() ||
    draft.priceNote?.trim() ||
    draft.bankAccount?.trim() ||
    draft.phoneNumber?.trim() ||
    draft.receiverAddress?.trim() ||
    draft.sourceLinksText?.trim() ||
    draft.inferredItemsText?.trim() ||
    draft.inferenceSummary?.trim();

  const key = getPostDraftKey(userId, categoryId, subId, postId);
  const store = readStore();

  if (!hasContent) {
    delete store[key];
    writeStore(store);
    return;
  }

  store[key] = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

export function clearPostDraft(
  userId: string,
  categoryId: string,
  subId: string,
  postId?: string
): void {
  const key = getPostDraftKey(userId, categoryId, subId, postId);
  const store = readStore();
  delete store[key];
  writeStore(store);
}
