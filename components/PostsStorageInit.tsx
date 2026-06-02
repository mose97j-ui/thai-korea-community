"use client";

import { useEffect } from "react";
import { runPostMigrations } from "@/lib/posts/migrations";

export default function PostsStorageInit() {
  useEffect(() => {
    runPostMigrations();
  }, []);

  return null;
}
