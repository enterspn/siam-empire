"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#fdf5e6] px-4 py-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full rounded-2xl border border-amber-300 bg-white/90 p-6 shadow-lg text-center">
        <p className="text-amber-800 font-semibold mb-2">เกิดข้อผิดพลาด</p>
        <p className="text-sm text-gray-700 mb-4">
          {error.message || "ลองรีเฟรชหน้าหรือกลับไปหน้าหลัก"}
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={reset}
            className="rounded-xl bg-amber-600 px-4 py-2 text-white font-medium hover:bg-amber-700"
          >
            ลองอีกครั้ง
          </button>
          <Link
            href="/"
            className="rounded-xl border border-amber-600 px-4 py-2 text-amber-800 font-medium hover:bg-amber-50"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}
