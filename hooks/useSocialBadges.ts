"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resolveNotificationUserId } from "@/lib/social/notificationRecipient";
import { getUnreadMessageCount } from "@/lib/social/messages";
import { MESSAGES_SYNC_EVENT } from "@/lib/social/messageSync";
import { getUnreadNotificationCount } from "@/lib/social/notifications";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";
import { SUPPORT_SYNC_EVENT } from "@/lib/support/supportSync";

export function useSocialBadges() {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }
    setUnreadMessages(getUnreadMessageCount(user.id, user.gmail));
    setUnreadNotifications(
      getUnreadNotificationCount(resolveNotificationUserId(user))
    );
  }, [user]);

  useEffect(() => {
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    window.addEventListener(MESSAGES_SYNC_EVENT, refresh);
    window.addEventListener(SUPPORT_CHANGE_EVENT, refresh);
    window.addEventListener(SUPPORT_SYNC_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
      window.removeEventListener(MESSAGES_SYNC_EVENT, refresh);
      window.removeEventListener(SUPPORT_CHANGE_EVENT, refresh);
      window.removeEventListener(SUPPORT_SYNC_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return { unreadMessages, unreadNotifications, refresh };
}
