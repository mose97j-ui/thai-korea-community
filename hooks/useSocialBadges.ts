"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUnreadMessageCount } from "@/lib/social/messages";
import { getUnreadNotificationCount } from "@/lib/social/notifications";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";

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
    setUnreadMessages(getUnreadMessageCount(user.id));
    setUnreadNotifications(getUnreadNotificationCount(user.id));
  }, [user]);

  useEffect(() => {
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return { unreadMessages, unreadNotifications, refresh };
}
