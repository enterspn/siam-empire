"use client";

import { useEffect, useState } from "react";

type City = { id: string; name: string };
type ResourceType = { id: string; key: string; label: string; icon: string };

export default function TradePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [toCityId, setToCityId] = useState("");
  const [offerResourceTypeId, setOfferResourceTypeId] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [requestResourceTypeId, setRequestResourceTypeId] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/student/trade-options")
      .then((r) => r.json())
      .then((d) => {
        setCities(d.cities ?? []);
        setResourceTypes(d.resourceTypes ?? []);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toCityId,
          offerResourceTypeId,
          offerAmount: Number(offerAmount),
          requestResourceTypeId: requestResourceTypeId || null,
          requestAmount: requestAmount ? Number(requestAmount) : null,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }

      setSuccess("ส่งคำขอค้าขายสำเร็จ! รอครูอนุมัติ");
      setToCityId("");
      setOfferResourceTypeId("");
      setOfferAmount("");
      setRequestResourceTypeId("");
      setRequestAmount("");
      setNote("");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 outline-none ring-crimson/40 focus:ring";

  return (
    <section className="siam-card">
      <h1 className="siam-title">คำขอค้าขาย</h1>
      <p className="mt-1 text-sm text-ink/75">ส่งทรัพยากรไปยังเมืองอื่น รอครูอนุมัติ</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">เมืองปลายทาง</label>
          <select value={toCityId} onChange={(e) => setToCityId(e.target.value)} className={inputClass} required>
            <option value="">-- เลือกเมือง --</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">ทรัพยากรที่เสนอ</label>
          <select value={offerResourceTypeId} onChange={(e) => setOfferResourceTypeId(e.target.value)} className={inputClass} required>
            <option value="">-- เลือกทรัพยากร --</option>
            {resourceTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.icon} {rt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">จำนวนที่เสนอ</label>
          <input type="number" min="1" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className={inputClass} placeholder="จำนวน" required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">ทรัพยากรที่ต้องการ (ไม่บังคับ)</label>
          <select value={requestResourceTypeId} onChange={(e) => setRequestResourceTypeId(e.target.value)} className={inputClass}>
            <option value="">-- ไม่ระบุ --</option>
            {resourceTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.icon} {rt.label}</option>
            ))}
          </select>
        </div>

        {requestResourceTypeId && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">จำนวนที่ต้องการ</label>
            <input type="number" min="1" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className={inputClass} placeholder="จำนวน" />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">หมายเหตุ (ไม่บังคับ)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="หมายเหตุ" />
        </div>

        {error && (
          <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">{success}</p>
        )}

        <button type="submit" disabled={loading} className="siam-button w-full disabled:opacity-50">
          {loading ? "กำลังส่ง..." : "ส่งคำขอค้าขาย"}
        </button>
      </form>
    </section>
  );
}
