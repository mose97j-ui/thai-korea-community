export type SupportCategory = "board" | "feature" | "qa" | "other";

export type SupportStatus = "open" | "answered" | "closed";

export type SupportMessage = {
  id: string;
  authorId: string;
  authorNickname: string;
  authorProfileImage?: string;
  isOperator: boolean;
  content: string;
  createdAt: string;
};

export type SupportRequest = {
  id: string;
  userId: string;
  userNickname: string;
  userProfileImage?: string;
  userGmail: string;
  category: SupportCategory;
  title: string;
  status: SupportStatus;
  messages: SupportMessage[];
  unreadByUser: boolean;
  unreadByOperator: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportInput = {
  content: string;
  locale?: "ko" | "th";
};

export const SUPPORT_CHANGE_EVENT = "tkc-support-change";
