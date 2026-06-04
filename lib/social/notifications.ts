import { emitSocialChange } from "./events";
import type { Notification, NotificationType } from "./types";

const NOTIFICATIONS_KEY = "tkc_notifications";

function readNotifications(): Notification[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? (JSON.parse(raw) as Notification[]) : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: Notification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  actorId: string;
  actorNickname: string;
  preview: string;
  postId?: string;
  commentId?: string;
  messageId?: string;
  supportId?: string;
};

export function createNotification(input: CreateNotificationInput): Notification {
  if (input.userId === input.actorId) {
    return {
      id: "",
      userId: input.userId,
      type: input.type,
      actorId: input.actorId,
      actorNickname: input.actorNickname,
      preview: input.preview,
      postId: input.postId,
      commentId: input.commentId,
      messageId: input.messageId,
      supportId: input.supportId,
      read: true,
      createdAt: new Date().toISOString(),
    };
  }

  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    actorId: input.actorId,
    actorNickname: input.actorNickname.trim(),
    preview: input.preview.trim(),
    postId: input.postId,
    commentId: input.commentId,
    messageId: input.messageId,
    supportId: input.supportId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const notifications = readNotifications();
  notifications.unshift(notification);
  writeNotifications(notifications.slice(0, 200));
  emitSocialChange();
  return notification;
}

export function getNotifications(userId: string): Notification[] {
  return readNotifications()
    .filter((notification) => notification.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getUnreadNotificationCount(userId: string): number {
  return readNotifications().filter(
    (notification) => notification.userId === userId && !notification.read
  ).length;
}

export function markNotificationRead(notificationId: string, userId: string): void {
  const notifications = readNotifications();
  const target = notifications.find(
    (notification) =>
      notification.id === notificationId && notification.userId === userId
  );
  if (!target || target.read) {
    return;
  }
  target.read = true;
  writeNotifications(notifications);
  emitSocialChange();
}

export function markAllNotificationsRead(userId: string): void {
  const notifications = readNotifications();
  let changed = false;
  for (const notification of notifications) {
    if (notification.userId === userId && !notification.read) {
      notification.read = true;
      changed = true;
    }
  }
  if (changed) {
    writeNotifications(notifications);
    emitSocialChange();
  }
}

export function getNotificationHref(notification: Notification): string {
  if (notification.type === "message") {
    return `/messages/${notification.actorId}`;
  }
  if (notification.type === "support" && notification.supportId) {
    return `/support/${notification.supportId}`;
  }
  if (notification.postId) {
    return `/p/${notification.postId}`;
  }
  return "/notifications";
}
