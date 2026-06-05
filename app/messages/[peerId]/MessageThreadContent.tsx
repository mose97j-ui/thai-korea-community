"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

type MessageThreadContentProps = {
  params: Promise<{ peerId: string }>;
};

export default function MessageThreadContent({ params }: MessageThreadContentProps) {
  const router = useRouter();
  const { user, isReady } = useAuth();

  useEffect(() => {
    void params;
  }, [params]);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login?next=%2Fsupport");
      return;
    }
    if (isReady && user) {
      router.replace("/support");
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return null;
  }
  return null;
}
