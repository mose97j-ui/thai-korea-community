"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-[#eef0f3] p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-xl font-bold text-gray-900">화면을 불러오지 못했습니다</h1>
          <p className="mt-2 text-sm text-gray-600">
            새로고침하거나 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-[#06C755] px-6 py-3 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
