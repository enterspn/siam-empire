"use client";

import { useEffect, useState } from "react";

type City = { id: string; name: string };
type ApprovedLaw = { id: string; title: string; description: string; bonus_type: string | null; bonus_value: number | null };

export default function EnvoyPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [cityName, setCityName] = useState("");
  const [lawsText, setLawsText] = useState("");
  const [approvedLaws, setApprovedLaws] = useState<ApprovedLaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/other-cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities ?? []))
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (!selectedCityId) {
      setCityName("");
      setLawsText("");
      setApprovedLaws([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    fetch(`/api/student/city-laws/${selectedCityId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setCityName("");
          setLawsText("");
          setApprovedLaws([]);
        } else {
          setCityName(d.city?.name ?? "");
          setLawsText(d.city?.laws ?? "");
          setApprovedLaws(d.approvedLaws ?? []);
        }
      })
      .catch(() => {
        setError("โหลดกฎหมายไม่สำเร็จ");
        setCityName("");
        setLawsText("");
        setApprovedLaws([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCityId]);

  return (
    <section className="siam-card space-y-4">
      <h1 className="siam-title">ทูต – ดูกฎหมายเมืองอื่น</h1>
      <p className="text-sm text-ink/75">
        เลือกเมืองที่ต้องการไปเจรจาหรือทำความเข้าใจข้อบังคับ แล้วเปิดอ่านกฎหมายของเมืองนั้นก่อนไป
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">เลือกเมืองที่จะไป</label>
        <select
          value={selectedCityId}
          onChange={(e) => setSelectedCityId(e.target.value)}
          className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 outline-none ring-crimson/40 focus:ring"
        >
          <option value="">-- เลือกเมือง --</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson">{error}</p>
      )}

      {loading && selectedCityId && (
        <p className="text-sm text-ink/50">กำลังโหลดกฎหมาย...</p>
      )}

      {!loading && selectedCityId && cityName && (
        <div className="space-y-4 rounded-xl border border-gold/40 bg-gold/5 p-4">
          <h2 className="text-lg font-bold text-crimson">กฎหมายและข้อบังคับของเมือง {cityName}</h2>

          {lawsText ? (
            <div>
              <p className="mb-1 text-xs font-semibold text-ink/70">กฎหมาย / ข้อบังคับของเมือง</p>
              <div className="whitespace-pre-wrap rounded-lg border border-gold/30 bg-white/80 p-3 text-sm text-ink">
                {lawsText}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink/50">เมืองนี้ยังไม่ได้กรอกกฎหมาย (ข้อความ)</p>
          )}

          {approvedLaws.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-ink/70">กฎหมายที่มีผลเชิงกล (โจมตี/ป้องกัน % ที่อนุมัติแล้ว)</p>
              <ul className="space-y-2">
                {approvedLaws.map((l) => (
                  <li key={l.id} className="rounded-lg border border-green-200 bg-green-50/80 p-2">
                    <p className="font-medium text-ink">{l.title}</p>
                    {l.description && <p className="text-xs text-ink/60">{l.description}</p>}
                    <p className="text-xs text-ink/50">
                      โบนัส: {l.bonus_type === "attack_pct" ? "โจมตี" : "ป้องกัน"} +{l.bonus_value ?? 0}%
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!selectedCityId && cities.length > 0 && (
        <p className="text-sm text-ink/50">เลือกเมืองด้านบนเพื่อเปิดอ่านกฎหมาย</p>
      )}
      {cities.length === 0 && (
        <p className="text-sm text-ink/50">ยังไม่มีเมืองอื่นในระบบ</p>
      )}
    </section>
  );
}
