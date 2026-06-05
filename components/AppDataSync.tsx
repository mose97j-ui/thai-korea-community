"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { useMemberRegistrySync } from "@/hooks/useMemberRegistrySync";
import { useOperatorMemberSync } from "@/hooks/useOperatorMemberSync";
import { useOperatorMenuRegistrySync } from "@/hooks/useOperatorMenuRegistrySync";
import { useDirectMessageSync } from "@/hooks/useDirectMessageSync";
import { useSupportSync } from "@/hooks/useSupportSync";
import { useSessionMemberBackfill } from "@/hooks/useSessionMemberBackfill";
import { useSessionSocialBackfill } from "@/hooks/useSessionSocialBackfill";
import { usePostSync } from "@/hooks/usePostSync";
import { isAuthLayoutPath } from "@/lib/routes/auth";

/** Keeps operator menus and member directory in sync across mobile/desktop tabs. */
export default function AppDataSync() {
  const pathname = usePathname();
  const { user, isReady } = useAuth();
  const { showOperatorUI } = useOperatorView();
  const onAuthScreen = isAuthLayoutPath(pathname);

  useOperatorMenuRegistrySync(!onAuthScreen);
  const syncMembers = isReady && Boolean(user) && !onAuthScreen;

  useSessionMemberBackfill(syncMembers, user);
  useSessionSocialBackfill(syncMembers, user);
  useMemberRegistrySync({
    enabled: syncMembers && !showOperatorUI,
  });
  useOperatorMemberSync(showOperatorUI && syncMembers);
  useDirectMessageSync(syncMembers, user);
  useSupportSync(syncMembers, user);
  usePostSync(syncMembers, user);

  return null;
}
