"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-crimson/30 px-3 py-1 text-xs font-medium text-crimson transition hover:bg-crimson/10"
    >
      ออกจากระบบ
    </button>
  );
}
