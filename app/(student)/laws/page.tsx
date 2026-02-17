"use client";

import { useEffect, useState } from "react";

export default function LawsPage() {
  const [laws, setLaws] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/student/city-info")
      .then((r) => r.json())
      .then((d) => {
        if (d.city?.laws != null) setLaws(d.city.laws);
      })
      .catch(() => setMessage({ type: "err", text: "โหลดข้อมูลไม่สำเร็จ" }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/student/city-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laws: laws.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "บันทึกไม่สำเร็จ" });
        return;
      }
      setMessage({ type: "ok", text: "บันทึกกฎหมายแล้ว — ทูตของเมืองอื่นจะเห็นเมื่อมาเลือกเมืองคุณในหน้าทูต" });
      setTimeout(() => setMessage(null), 5000);
    } catch {
      setMessage({ type: "err", text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="siam-card">
        <p className="text-sm text-ink/60">กำลังโหลด...</p>
      </section>
    );
  }

  return (
    <section className="siam-card space-y-4">
      <h1 className="siam-title">📜 กฎหมายของเมือง</h1>
      <p className="text-sm text-ink/75">
        พิมพ์กฎหมายหรือข้อบังคับของเมืองของคุณไว้ที่นี่ เมื่อบันทึกแล้ว <strong>ทูตของเมืองอื่นจะเห็นข้อความนี้</strong> เมื่อไปที่หน้าทูตแล้วเลือกเมืองคุณ
      </p>

      <form onSubmit={handleSave} className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-ink">กฎหมาย / ข้อบังคับของเมือง</span>
          <textarea
            value={laws}
            onChange={(e) => setLaws(e.target.value)}
            placeholder="เช่น ห้ามนำอาวุธเข้าเมือง, การค้าต้องมีใบอนุญาต..."
            rows={8}
            className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
          />
        </label>

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === "ok" ? "bg-green-100 text-green-800" : "bg-crimson/10 text-crimson"
            }`}
          >
            {message.text}
          </p>
        )}

        <button type="submit" disabled={saving} className="siam-button w-full disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "บันทึกกฎหมาย"}
        </button>
      </form>
    </section>
  );
}
