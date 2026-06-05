import type { MessageKey } from "@/lib/i18n/messages";
import { getUserCategoryById, isUserCategoryId } from "@/lib/categories/userMenus";
import {
  getOperatorCategoryById,
  isOperatorCategoryId,
} from "@/lib/categories/operatorMenus";
import type { PostFormTemplateId } from "@/lib/posts/formTemplateTypes";

export type { PostFormTemplateId } from "@/lib/posts/formTemplateTypes";

export type PostFormFieldConfig = {
  labelKey: MessageKey;
  placeholderKey: MessageKey;
  hintKey?: MessageKey;
  required: boolean;
};

export type PostFormTemplate = {
  id: PostFormTemplateId;
  hintKey: MessageKey;
  showLinkImport: boolean;
  showMedia: boolean;
  showSecondaryTitle: boolean;
  groupByAddress: boolean;
  primary: PostFormFieldConfig;
  secondary?: PostFormFieldConfig;
  address?: PostFormFieldConfig;
  content: PostFormFieldConfig;
  /** Display min heights (feed/detail) + write-form floor (form only). */
  contentArea: {
    formMinHeightPx: number;
    formMinHeightCompactPx: number;
    feedMinHeightRem: number;
    detailMinHeightRem: number;
  };
  errorPrimaryKey: MessageKey;
  errorAddressKey?: MessageKey;
};

const placeTemplate: PostFormTemplate = {
  id: "place",
  hintKey: "post.writeHintPlace",
  showLinkImport: true,
  showMedia: true,
  showSecondaryTitle: true,
  groupByAddress: true,
  primary: {
    labelKey: "post.storeName",
    placeholderKey: "post.storeNamePlaceholder",
    required: true,
  },
  secondary: {
    labelKey: "post.titleOptional",
    placeholderKey: "post.titlePlaceholder",
    required: false,
  },
  address: {
    labelKey: "post.address",
    placeholderKey: "post.addressPlaceholder",
    hintKey: "post.addressHint",
    required: true,
  },
  content: {
    labelKey: "post.content",
    placeholderKey: "post.contentPlaceholder",
    required: true,
  },
  contentArea: {
    formMinHeightPx: 300,
    formMinHeightCompactPx: 180,
    feedMinHeightRem: 22.5,
    detailMinHeightRem: 30,
  },
  errorPrimaryKey: "post.errorStoreName",
  errorAddressKey: "post.errorAddress",
};

const jobTemplate: PostFormTemplate = {
  id: "job",
  hintKey: "post.writeHintJob",
  showLinkImport: false,
  showMedia: true,
  showSecondaryTitle: true,
  groupByAddress: false,
  primary: {
    labelKey: "post.formJobTitle",
    placeholderKey: "post.formJobTitlePlaceholder",
    required: true,
  },
  secondary: {
    labelKey: "post.formCompany",
    placeholderKey: "post.formCompanyPlaceholder",
    required: false,
  },
  address: {
    labelKey: "post.formWorkLocation",
    placeholderKey: "post.formWorkLocationPlaceholder",
    hintKey: "post.formWorkLocationHint",
    required: true,
  },
  content: {
    labelKey: "post.formJobContent",
    placeholderKey: "post.formJobContentPlaceholder",
    required: true,
  },
  contentArea: {
    formMinHeightPx: 280,
    formMinHeightCompactPx: 168,
    feedMinHeightRem: 21,
    detailMinHeightRem: 27,
  },
  errorPrimaryKey: "post.errorJobTitle",
  errorAddressKey: "post.errorWorkLocation",
};

const articleTemplate: PostFormTemplate = {
  id: "article",
  hintKey: "post.writeHintArticle",
  showLinkImport: false,
  showMedia: true,
  showSecondaryTitle: false,
  groupByAddress: false,
  primary: {
    labelKey: "post.formPostTitle",
    placeholderKey: "post.formPostTitlePlaceholder",
    required: true,
  },
  content: {
    labelKey: "post.content",
    placeholderKey: "post.formArticleContentPlaceholder",
    required: true,
  },
  contentArea: {
    formMinHeightPx: 260,
    formMinHeightCompactPx: 156,
    feedMinHeightRem: 19.5,
    detailMinHeightRem: 25.5,
  },
  errorPrimaryKey: "post.errorPostTitle",
};

const purchaseAgencyTemplate: PostFormTemplate = {
  id: "purchaseAgency",
  hintKey: "post.writeHintPurchaseAgency",
  showLinkImport: true,
  showMedia: true,
  showSecondaryTitle: true,
  groupByAddress: false,
  primary: {
    labelKey: "post.formPurchaseTitle",
    placeholderKey: "post.formPurchaseTitlePlaceholder",
    required: true,
  },
  secondary: {
    labelKey: "post.titleOptional",
    placeholderKey: "post.titlePlaceholder",
    required: false,
  },
  address: {
    labelKey: "post.purchaseDeliveryAddressLabel",
    placeholderKey: "post.purchaseReceiverAddressPlaceholder",
    hintKey: "post.purchaseDeliveryAddressSecretHint",
    required: true,
  },
  content: {
    labelKey: "post.formPurchaseContent",
    placeholderKey: "post.formPurchaseContentPlaceholder",
    required: true,
  },
  contentArea: {
    formMinHeightPx: 320,
    formMinHeightCompactPx: 200,
    feedMinHeightRem: 21,
    detailMinHeightRem: 28,
  },
  errorPrimaryKey: "post.errorPostTitle",
};

const templateByCategory: Record<string, PostFormTemplateId> = {
  info: "article",
  notices: "article",
  jobs: "job",
  purchase: "purchaseAgency",
};

const templates: Record<PostFormTemplateId, PostFormTemplate> = {
  place: placeTemplate,
  job: jobTemplate,
  article: articleTemplate,
  purchaseAgency: purchaseAgencyTemplate,
};

export function getPostFormTemplate(categoryId: string): PostFormTemplate {
  if (isUserCategoryId(categoryId)) {
    const userCategory = getUserCategoryById(categoryId);
    if (userCategory) {
      return templates[userCategory.formTemplate];
    }
  }
  if (isOperatorCategoryId(categoryId)) {
    const operatorCategory = getOperatorCategoryById(categoryId);
    if (operatorCategory) {
      return templates[operatorCategory.formTemplate];
    }
  }
  const templateId = templateByCategory[categoryId] ?? "place";
  return templates[templateId];
}

export function isPlaceBasedCategory(categoryId: string): boolean {
  return getPostFormTemplate(categoryId).groupByAddress;
}
