"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell, { socialPostFeedWrapClassName } from "@/components/PageShell";
import PostCard from "@/components/PostCard";
import { Card } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getHomeCategoryById, getSubCategoryItem } from "@/lib/categories/registry";
import { getPostById, POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import { isPostVisibleToViewer } from "@/lib/posts/visibility";
import type { Post } from "@/lib/posts/types";

type PostDetailPageProps = {
  params: Promise<{ postId: string }>;
};

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { t, pick } = useLocale();
  const { user } = useAuth();
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

  if (post === undefined) {
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

  if (!isPostVisibleToViewer(post, user?.id)) {
    notFound();
  }

  const category = getHomeCategoryById(post.categoryId);
  const subItem = getSubCategoryItem(post.categoryId, post.subId);
  const headerTitle = [category ? pick(category.label) : null, subItem ? pick(subItem.title) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell maxWidth="full">
      <PageHeader
        compact
        title={headerTitle || t("post.detailTitle")}
        backHref={`/c/${post.categoryId}/${post.subId}`}
        backLabel={t("post.backToBoard")}
      />
      <div className={socialPostFeedWrapClassName}>
        <PostCard post={post} isDetailPage />
      </div>
    </PageShell>
  );
}
