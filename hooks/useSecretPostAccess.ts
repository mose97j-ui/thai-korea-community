"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import {
  isPostUnlocked,
  isSecretPost,
  unlockSecretPost,
} from "@/lib/posts/secret";
import type { Post } from "@/lib/posts/types";

export function useSecretPostAccess(post: Post, viewerId?: string | null) {
  const { user } = useAuth();
  const { hasOperatorPrivileges } = useOperatorView();
  const secret = isSecretPost(post);
  const operator = hasOperatorPrivileges;
  const [unlocked, setUnlocked] = useState(() =>
    secret ? isPostUnlocked(post.id) : true
  );

  useEffect(() => {
    setUnlocked(secret ? isPostUnlocked(post.id) : true);
  }, [post.id, secret]);

  const canView =
    !secret ||
    operator ||
    Boolean(viewerId && post.authorId === viewerId) ||
    unlocked;

  const unlock = useCallback(
    async (password: string) => {
      const ok = await unlockSecretPost(post, password);
      if (ok) {
        setUnlocked(true);
      }
      return ok;
    },
    [post]
  );

  return {
    isSecret: secret,
    canView,
    isAuthor: Boolean(viewerId && post.authorId === viewerId),
    unlock,
  };
}
