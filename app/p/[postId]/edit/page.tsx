"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryPostForm from "@/components/CategoryPostForm";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { Card } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getPostById, POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";

type PostEditPageProps = {
  params: Promise<{ postId: string }>;
};

export default function PostEditPage({ params }: PostEditPageProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { user, isReady } = useAuth();
  const [postId, setPostId] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    void params.then((route) => setPostId(route.postId));
  }, [params]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    const refresh = () => setPost(getPostById(postId));
    refresh();
    window.addEventListener(POSTS_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(POSTS_CHANGE_EVENT, refresh);
  }, [postId]);

  useEffect(() => {
    if (!isReady || !postId) {
      return;
    }
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/p/${postId}/edit`)}`);
    }
  }, [isReady, user, postId, router]);

  if (!isReady || post === undefined) {
    return (
      <PageShell>
        <Card className="py-10 text-center text-base text-gray-500">
          {t("common.loading")}
        </Card>
      </PageShell>
    );
  }

  if (!post) {
    notFound();
  }

  if (!user) {
    return null;
  }

  if (post.authorId !== user.id) {
    notFound();
  }

  return (
    <PageShell maxWidth="full">
      <PageHeader
        compact
        title={t("post.editTitle")}
        backHref={`/p/${post.id}`}
        backLabel={t("post.backToPost")}
      />
      <CategoryPostForm
        categoryId={post.categoryId}
        subId={post.subId}
        postId={post.id}
      />
    </PageShell>
  );
}
