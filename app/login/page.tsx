"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [groupCode, setGroupCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="siam-shell">
      <section className="siam-card">
        <h1 className="siam-title">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-ink/75">
          นักเรียนกรอกรหัสกลุ่มเมืองของคุณ (ตัวอย่าง: city1)
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-ink" htmlFor="groupCode">
            รหัสกลุ่ม
          </label>
          <input
            id="groupCode"
            name="groupCode"
            placeholder="city1"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
            className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 outline-none ring-crimson/40 focus:ring"
          />

          {error && (
            <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !groupCode.trim()}
            className="siam-button w-full disabled:opacity-50"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </section>
    </main>
  );
}
