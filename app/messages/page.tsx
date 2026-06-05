"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function MessagesPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();

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
