export type NotificationType = "comment" | "like" | "message" | "support";

export type MessageSendMode = "nickname" | "anonymous";

export type PostLike = {
  postId: string;
  userId: string;
  createdAt: string;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  authorNickname: string;
  authorProfileImage?: string;
  content: string;
  createdAt: string;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  sendMode?: MessageSendMode;
  senderDisplayName?: string;
  images?: string[];
  videoUrl?: string;
  relatedPostId?: string;
  readAt?: string;
  createdAt: string;
};

export type MessageBlock = {
  blockerId: string;
  blockedId: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  actorNickname: string;
  postId?: string;
  commentId?: string;
  messageId?: string;
  supportId?: string;
  preview: string;
  read: boolean;
  createdAt: string;
};

export type ConversationPreview = {
  conversationId: string;
  peerId: string;
  peerNickname: string;
  peerProfileImage?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type HotPostItem = {
  postId: string;
  title: string;
  likeCount: number;
  commentCount: number;
  hotScore: number;
  categoryId: string;
  subId: string;
  isSecret?: boolean;
};

export const HOT_POST_MIN_SCORE = 3;
export const SOCIAL_CHANGE_EVENT = "tkc-social-change";
