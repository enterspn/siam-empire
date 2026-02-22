"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminLogFeed } from "@/components/admin-log-feed";

type Trade = {
  id: string;
  offer_amount: number;
  request_amount: number | null;
  status: string;
  note: string | null;
  created_at: string;
  from_city: { name: string } | null;
  to_city: { name: string } | null;
  offer_rt: { label: string; icon: string } | null;
  request_rt: { label: string; icon: string } | null;
};

type War = {
  id: string;
  attack_power: number;
  defense_power: number;
  status: string;
  result: string | null;
  resolution_note: string | null;
  created_at: string;
  attacker_city: { name: string } | null;
  defender_city: { name: string } | null;
};

type CityResource = { resource_type_id: string; amount: number; id: string; label: string; icon: string | null; key: string };
type City = {
  id: string;
  name: string;
  group_code: string;
  description: string;
  laws: string;
  materials: string;
  culture: string;
  leader_name: string;
  defense_score: number;
  stability_score: number;
  negotiation_goal?: string;
  is_registered?: boolean;
  resources_released?: boolean;
  unique_asset?: string;
  slot_number?: number | null;
  assigned_products?: { id: string; label: string; icon: string | null; key: string }[];
  resources?: CityResource[];
  created_at: string;
};

const UNIQUE_ASSETS = ["ตราพระราชสีห์", "ยาสมุนไพร", "ไม้สัก", "เครื่องเทศ", "หยก", "ดีบุก", "อัญมณี", "ผ้าไหม"];

type ResourceType = {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  war_effect: string | null;
  war_multiplier: number;
};

type GlobalMission = {
  id: string;
  title: string;
  description: string;
  target_resource_type: string;
  target_amount: number;
  current_amount: number;
  is_active: boolean;
  created_at: string;
};

type Law = {
  id: string;
  title: string;
  description: string;
  bonus_type: string | null;
  bonus_value: number | null;
  status: string;
  created_at: string;
  city: { name: string } | null;
};

function ResourceTypeRow({
  rt,
  onSave,
  saving,
}: {
  rt: ResourceType;
  onSave: (rt: ResourceType, warEffect: string | null, warMultiplier: number) => void;
  saving: boolean;
}) {
  const [warEffect, setWarEffect] = useState(rt.war_effect ?? "");
  const [multiplier, setMultiplier] = useState(String(rt.war_multiplier ?? 1));
  useEffect(() => {
    setWarEffect(rt.war_effect ?? "");
    setMultiplier(String(rt.war_multiplier ?? 1));
  }, [rt.war_effect, rt.war_multiplier]);

  const handleSave = () => {
    const n = Number(multiplier);
    if (Number.isNaN(n) || n < 0) return;
    onSave(rt, warEffect === "" ? null : warEffect, n);
  };

  return (
    <tr className="border-b border-gold/20">
      <td className="py-2 pr-2">
        <span className="mr-1">{rt.icon ?? "📦"}</span>
        {rt.label}
      </td>
      <td className="py-2 pr-2">
        <select
          value={warEffect}
          onChange={(e) => setWarEffect(e.target.value)}
          className="rounded border border-gold/40 bg-white/80 px-2 py-1 text-sm"
        >
          <option value="">ไม่ใช้</option>
          <option value="attack">โจมตี</option>
          <option value="defense">ป้องกัน</option>
        </select>
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          min="0"
          step="0.1"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
          className="w-20 rounded border border-gold/40 bg-white/80 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-crimson px-2 py-1 text-xs font-medium text-parchment disabled:opacity-50"
        >
          {saving ? "..." : "บันทึก"}
        </button>
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [wars, setWars] = useState<War[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"cities" | "trades" | "wars" | "resources" | "laws" | "phase" | "missions" | "log">("cities");
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [resourceSaving, setResourceSaving] = useState<string | null>(null);
  const [laws, setLaws] = useState<Law[]>([]);
  const [lawActionLoading, setLawActionLoading] = useState<string | null>(null);
  const [globalMissions, setGlobalMissions] = useState<GlobalMission[]>([]);
  const [gmTitle, setGmTitle] = useState("");
  const [gmDesc, setGmDesc] = useState("");
  const [gmResourceType, setGmResourceType] = useState("");
  const [gmTargetAmount, setGmTargetAmount] = useState("500");
  const [gmLoading, setGmLoading] = useState(false);
  const [gmError, setGmError] = useState("");

  const [cities, setCities] = useState<City[]>([]);
  const [newCityName, setNewCityName] = useState("");
  const [newCityCode, setNewCityCode] = useState("");
  const [cityError, setCityError] = useState("");
  const [cityLoading, setCityLoading] = useState(false);

  const [settings, setSettings] = useState<{
    current_phase: string;
    is_trade_active: boolean;
    is_war_active: boolean;
    war_reparation_percent?: number;
  } | null>(null);
  const [cityGoalSaving, setCityGoalSaving] = useState<string | null>(null);
  const [cityProductsSaving, setCityProductsSaving] = useState<string | null>(null);
  const [cityGoalDraft, setCityGoalDraft] = useState<Record<string, string>>({});
  const [cityProductsDraft, setCityProductsDraft] = useState<Record<string, [string, string]>>({});
  const [cityResourcesDraft, setCityResourcesDraft] = useState<Record<string, Record<string, string>>>({});
  const [cityResourcesSaving, setCityResourcesSaving] = useState<string | null>(null);
  const [reparationPercent, setReparationPercent] = useState(10);
  const [showGroupCodes, setShowGroupCodes] = useState(false);
  const [uniqueAssetDraft, setUniqueAssetDraft] = useState<Record<string, string>>({});
  const [releaseSaving, setReleaseSaving] = useState<string | null>(null);
  const [resetSlotSaving, setResetSlotSaving] = useState<string | null>(null);
  const [resetAllSaving, setResetAllSaving] = useState(false);

  const loadData = useCallback(async () => {
    const noCache = { cache: "no-store" as RequestCache };
    const [tradesRes, warsRes, settingsRes, citiesRes, rtRes, lawsRes, gmRes] = await Promise.all([
      fetch("/api/admin/trades", noCache).then((r) => r.json()),
      fetch("/api/admin/wars", noCache).then((r) => r.json()),
      fetch("/api/admin/settings", noCache).then((r) => r.json()),
      fetch("/api/admin/cities", noCache).then((r) => r.json()),
      fetch("/api/admin/resource-types", noCache).then((r) => r.json()),
      fetch("/api/admin/laws", noCache).then((r) => r.json()),
      fetch("/api/admin/global-missions", noCache).then((r) => r.json()),
    ]);
    setTrades(tradesRes.trades ?? []);
    setWars(warsRes.wars ?? []);
    setSettings(settingsRes.settings ?? null);
    setGlobalMissions(gmRes.missions ?? []);

    let citiesList = citiesRes.cities ?? [];
    if (citiesRes.error) {
      const listRes = await fetch("/api/admin/cities/list", noCache).then((r) => r.json());
      const raw = listRes.cities ?? [];
      citiesList = raw.map((c: { id: string; name: string; group_code: string }) => ({
        ...c,
        description: "",
        laws: "",
        materials: "",
        culture: "",
        leader_name: "",
        defense_score: 0,
        stability_score: 0,
        negotiation_goal: "",
        assigned_products: [],
        resources: [],
        created_at: new Date().toISOString(),
      }));
    }
    setCities(citiesList);

    setResourceTypes(rtRes.resourceTypes ?? []);
    setLaws(lawsRes.laws ?? []);
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  useEffect(() => {
    if (settings?.war_reparation_percent !== undefined) setReparationPercent(settings.war_reparation_percent);
  }, [settings?.war_reparation_percent]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/login-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      setAuthed(true);
    } catch {
      setLoginError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleTradeReview(tradeId: string, action: "approved" | "rejected") {
    setActionLoading(tradeId);
    await fetch(`/api/admin/trades/${tradeId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadData();
    setActionLoading(null);
  }

  async function handleWarReview(warId: string, action: "approved" | "rejected" | "resolved", result?: string, note?: string) {
    setActionLoading(warId);
    await fetch(`/api/admin/wars/${warId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, result, resolution_note: note }),
    });
    await loadData();
    setActionLoading(null);
  }

  async function handlePhaseToggle(field: string, value: boolean | string) {
    await fetch("/api/admin/settings/phase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    await loadData();
  }

  async function handleCreateCity(e: React.FormEvent) {
    e.preventDefault();
    setCityError("");
    setCityLoading(true);
    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCityName, group_code: newCityCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCityError(data.error ?? "สร้างเมืองไม่สำเร็จ");
        return;
      }
      setNewCityName("");
      setNewCityCode("");
      setTab("cities");
      const newCity = data.city as { id: string; name: string; group_code: string };
      setCities((prev) => [
        ...prev,
        {
          id: newCity.id,
          name: newCity.name,
          group_code: newCity.group_code,
          description: "",
          laws: "",
          materials: "",
          culture: "",
          leader_name: "",
          defense_score: 0,
          stability_score: 0,
          negotiation_goal: "",
          assigned_products: [],
          resources: [],
          created_at: new Date().toISOString(),
        },
      ]);
      await loadData();
    } catch {
      setCityError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setCityLoading(false);
    }
  }

  async function handleDeleteCity(cityId: string) {
    if (!confirm("ต้องการลบเมืองนี้หรือไม่? ข้อมูลทั้งหมดจะถูกลบ")) return;
    setActionLoading(cityId);
    await fetch(`/api/admin/cities/${cityId}`, { method: "DELETE" });
    await loadData();
    setActionLoading(null);
  }

  async function handleResourceTypeUpdate(rt: ResourceType, warEffect: string | null, warMultiplier: number) {
    setResourceSaving(rt.id);
    await fetch("/api/admin/resource-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rt.id, war_effect: warEffect || null, war_multiplier: warMultiplier }),
    });
    await loadData();
    setResourceSaving(null);
  }

  async function handleLawReview(lawId: string, action: "approved" | "rejected") {
    setLawActionLoading(lawId);
    await fetch(`/api/admin/laws/${lawId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadData();
    setLawActionLoading(null);
  }

  async function handleSaveNegotiationGoal(cityId: string) {
    const goal = cityGoalDraft[cityId] ?? "";
    setCityGoalSaving(cityId);
    await fetch(`/api/admin/cities/${cityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negotiation_goal: goal }),
    });
    await loadData();
    setCityGoalSaving(null);
  }

  async function handleSaveAssignedProducts(cityId: string) {
    const [id1, id2] = cityProductsDraft[cityId] ?? ["", ""];
    if (!id1 || !id2 || id1 === id2) return;
    setCityProductsSaving(cityId);
    await fetch(`/api/admin/cities/${cityId}/assigned-products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_type_ids: [id1, id2] }),
    });
    await loadData();
    setCityProductsSaving(null);
  }

  useEffect(() => {
    const goal: Record<string, string> = {};
    const products: Record<string, [string, string]> = {};
    const res: Record<string, Record<string, string>> = {};
    cities.forEach((c) => {
      if (c.negotiation_goal !== undefined) goal[c.id] = c.negotiation_goal ?? "";
      const ap = c.assigned_products ?? [];
      if (ap.length >= 2) products[c.id] = [ap[0].id, ap[1].id];
      else if (ap.length === 1) products[c.id] = [ap[0].id, ""];
      else products[c.id] = ["", ""];
      const resourcesList = c.resources ?? [];
      res[c.id] = {};
      resourcesList.forEach((r) => {
        res[c.id][r.resource_type_id] = String(r.amount);
      });
    });
    const ua: Record<string, string> = {};
    cities.forEach((c) => { ua[c.id] = c.unique_asset ?? ""; });
    setCityGoalDraft((prev) => ({ ...prev, ...goal }));
    setCityProductsDraft((prev) => ({ ...prev, ...products }));
    setCityResourcesDraft((prev) => ({ ...prev, ...res }));
    setUniqueAssetDraft((prev) => ({ ...prev, ...ua }));
  }, [cities]);

  function getCityResourceAmount(cityId: string, resourceTypeId: string): string {
    if (cityResourcesDraft[cityId]?.[resourceTypeId] !== undefined) return cityResourcesDraft[cityId][resourceTypeId];
    const c = cities.find((x) => x.id === cityId);
    const r = c?.resources?.find((x) => x.resource_type_id === resourceTypeId);
    return r != null ? String(r.amount) : "0";
  }

  function setCityResourceAmount(cityId: string, resourceTypeId: string, value: string) {
    setCityResourcesDraft((prev) => ({
      ...prev,
      [cityId]: { ...(prev[cityId] ?? {}), [resourceTypeId]: value },
    }));
  }

  async function handleSaveCityResources(cityId: string) {
    const amounts = cityResourcesDraft[cityId] ?? {};
    const payload: Record<string, number> = {};
    resourceTypes.forEach((rt) => {
      const v = Math.max(0, Math.floor(Number(amounts[rt.id]) || 0));
      payload[rt.id] = v;
    });
    setCityResourcesSaving(cityId);
    await fetch(`/api/admin/cities/${cityId}/resources`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resources: payload }),
    });
    await loadData();
    setCityResourcesSaving(null);
  }

  async function handleCreateGlobalMission(e: React.FormEvent) {
    e.preventDefault();
    setGmError("");
    setGmLoading(true);
    try {
      const res = await fetch("/api/admin/global-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: gmTitle, description: gmDesc, targetResourceType: gmResourceType, targetAmount: Number(gmTargetAmount) }),
      });
      const data = await res.json();
      if (!res.ok) { setGmError(data.error ?? "สร้างไม่สำเร็จ"); return; }
      setGmTitle(""); setGmDesc(""); setGmResourceType(""); setGmTargetAmount("500");
      await loadData();
    } catch { setGmError("เกิดข้อผิดพลาด"); }
    finally { setGmLoading(false); }
  }

  async function handleToggleGlobalMission(id: string, activate: boolean) {
    await fetch(`/api/admin/global-missions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: activate }),
    });
    await loadData();
  }

  async function handleResetAllSlots() {
    if (!confirm("รีเซ็ตช่องลงทะเบียนทั้งหมด? นักเรียนทุกกลุ่มจะต้องลงทะเบียนใหม่ในคาบหน้า")) return;
    setResetAllSaving(true);
    await fetch("/api/admin/reset-slots", { method: "POST" });
    await loadData();
    setResetAllSaving(false);
  }

  async function handleResetSlot(cityId: string) {
    if (!confirm("รีเซ็ตช่องนี้? นักเรียนกลุ่มนี้จะถูกล้างออก และช่องจะว่างสำหรับกลุ่มใหม่")) return;
    setResetSlotSaving(cityId);
    await fetch(`/api/admin/cities/${cityId}/reset-slot`, { method: "POST" });
    await loadData();
    setResetSlotSaving(null);
  }

  async function handleDeleteGlobalMission(id: string) {
    if (!confirm("ลบภารกิจนี้?")) return;
    await fetch(`/api/admin/global-missions/${id}`, { method: "DELETE" });
    await loadData();
  }

  async function handleReleaseResources(cityId: string) {
    const amounts = cityResourcesDraft[cityId] ?? {};
    const payload: Record<string, number> = {};
    resourceTypes.forEach((rt) => {
      payload[rt.id] = Math.max(0, Math.floor(Number(amounts[rt.id]) || 0));
    });
    setReleaseSaving(cityId);
    await fetch(`/api/admin/cities/${cityId}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resources: payload, uniqueAsset: uniqueAssetDraft[cityId] ?? "" }),
    });
    await loadData();
    setReleaseSaving(null);
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  if (!authed) {
    return (
      <main className="siam-shell">
        <section className="siam-card">
          <h1 className="siam-title">เข้าสู่ระบบครู</h1>
          <form className="mt-4 space-y-3" onSubmit={handleLogin}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ชื่อผู้ใช้"
              className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 outline-none ring-crimson/40 focus:ring"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 outline-none ring-crimson/40 focus:ring"
            />
            {loginError && (
              <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">{loginError}</p>
            )}
            <button type="submit" disabled={loginLoading} className="siam-button w-full disabled:opacity-50">
              {loginLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const pendingTrades = trades.filter((t) => t.status === "pending");
  const resolvedTrades = trades.filter((t) => t.status !== "pending");
  const pendingWars = wars.filter((w) => w.status === "pending");
  const resolvedWars = wars.filter((w) => w.status !== "pending");

  return (
    <main className="siam-shell space-y-3">
      <section className="siam-card flex items-center justify-between">
        <h1 className="siam-title">แผงควบคุมครู</h1>
        <button onClick={handleLogout} className="rounded-lg border border-crimson/30 px-3 py-1 text-xs font-medium text-crimson hover:bg-crimson/10">
          ออกจากระบบ
        </button>
      </section>

      {/* เมืองทั้งหมด – ขึ้นบนหน้าจอว่ามีเมืองอะไรบ้าง + ลบได้ | รหัสซ่อนด้วยลูกตา ครูกดแสดงเมื่อจะขึ้นจอ */}
      <section className="siam-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-crimson">เมืองทั้งหมด ({cities.length})</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowGroupCodes((v) => !v)}
              className="flex items-center gap-1 rounded border border-gold/40 bg-white/80 px-2 py-1 text-xs text-ink/70 hover:bg-gold/10"
              title={showGroupCodes ? "ซ่อนรหัสกลุ่ม" : "แสดงรหัสกลุ่ม"}
            >
              {showGroupCodes ? "🙈 ซ่อนรหัส" : "👁️ แสดงรหัส"}
            </button>
            <button
              type="button"
              onClick={handleResetAllSlots}
              disabled={resetAllSaving}
              className="flex items-center gap-1 rounded border border-amber-500 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              title="รีเซ็ตทุกช่องเพื่อเตรียมรับนักเรียนคาบใหม่"
            >
              {resetAllSaving ? "กำลังรีเซ็ต..." : "🔄 รีเซ็ตทุกช่อง (คาบใหม่)"}
            </button>
          </div>
        </div>
        {cities.length === 0 ? (
          <p className="text-sm text-ink/50">ยังไม่มีเมือง — ไปที่แท็บ เมือง เพื่อสร้างเมืองใหม่</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <li key={c.id} className="flex items-center gap-1 rounded-lg border border-gold/40 bg-parchment/50 px-3 py-1.5">
                <span className="font-medium text-ink">{c.name}</span>
                <span className="text-xs text-ink/50">({showGroupCodes ? c.group_code : "••••"})</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCity(c.id)}
                  disabled={actionLoading === c.id}
                  className="ml-1 rounded border border-crimson/40 px-1.5 py-0.5 text-xs text-crimson hover:bg-crimson/10 disabled:opacity-50"
                  title="ลบเมือง"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2">
        {(["cities", "missions", "trades", "wars", "resources", "laws", "phase", "log"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === t ? "bg-crimson text-parchment" : "border border-gold/40 bg-parchment text-crimson"}`}
          >
            {t === "cities" ? `เมือง (${cities.length})` : t === "missions" ? `🌏 ภารกิจร่วม (${globalMissions.length})` : t === "trades" ? `ค้าขาย (${pendingTrades.length})` : t === "wars" ? `สงคราม (${pendingWars.length})` : t === "resources" ? "📦 ทรัพยากร" : t === "laws" ? `กฎหมาย (${laws.filter((l) => l.status === "pending").length})` : t === "log" ? "💬 ล็อกแชท" : "ช่วงเวลา"}
          </button>
        ))}
      </nav>

      {/* Cities Tab */}
      {tab === "cities" && (
        <section className="space-y-3">
          <form onSubmit={handleCreateCity} className="siam-card space-y-3">
            <h2 className="text-sm font-bold text-crimson">สร้างเมืองใหม่</h2>
            <input
              type="text"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="ชื่อเมือง เช่น สุโขทัย"
              className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
            <input
              type="text"
              value={newCityCode}
              onChange={(e) => setNewCityCode(e.target.value)}
              placeholder="รหัสกลุ่ม เช่น group1"
              className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
            {cityError && (
              <p className="rounded-lg bg-crimson/10 px-3 py-2 text-xs font-medium text-crimson">{cityError}</p>
            )}
            <button type="submit" disabled={cityLoading} className="siam-button w-full text-sm disabled:opacity-50">
              {cityLoading ? "กำลังสร้าง..." : "สร้างเมือง"}
            </button>
          </form>

          {cities.length === 0 && <p className="siam-card text-sm text-ink/50">ยังไม่มีเมือง กรุณาสร้างเมืองใหม่</p>}
          {cities.map((c) => (
            <article key={c.id} className="siam-card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-crimson">{c.name}</p>
                    {c.slot_number != null && (
                      <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-xs text-ink/60">ช่องที่ {c.slot_number}</span>
                    )}
                    {c.is_registered && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">ลงทะเบียนแล้ว</span>
                    )}
                  </div>
                  <p className="text-xs text-ink/60">รหัสกลุ่ม: <span className="font-mono font-bold text-ink">{showGroupCodes ? c.group_code : "••••"}</span></p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {c.slot_number != null && c.is_registered && (
                    <button
                      onClick={() => handleResetSlot(c.id)}
                      disabled={resetSlotSaving === c.id}
                      className="rounded border border-amber-500 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                      title="ล้างข้อมูลกลุ่มนี้เพื่อให้กลุ่มใหม่ลงทะเบียน"
                    >
                      {resetSlotSaving === c.id ? "..." : "🔄 รีเซ็ต"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCity(c.id)}
                    disabled={actionLoading === c.id}
                    className="rounded-lg border border-crimson/30 px-2 py-0.5 text-xs text-crimson hover:bg-crimson/10 disabled:opacity-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>
              {/* เป้าหมายการเจรจา – สิ่งที่นักเรียนต้องไปเจรจาก่อน ถ้าไม่ได้ให้ประกาศสงครามได้ */}
              <div>
                <p className="mb-1 text-xs font-semibold text-ink">เป้าหมายการเจรจา (ถ้าไม่ได้ สามารถประกาศสงครามได้)</p>
                <textarea
                  value={cityGoalDraft[c.id] ?? c.negotiation_goal ?? ""}
                  onChange={(e) => setCityGoalDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="เช่น ต้องได้ข้าวจากอีกกลุ่มหนึ่ง หรือ ต้องเจรจาค้าขายกับทุกกลุ่มก่อน"
                  rows={2}
                  className="w-full rounded-lg border border-gold/40 bg-white/80 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleSaveNegotiationGoal(c.id)}
                  disabled={cityGoalSaving === c.id}
                  className="mt-1 rounded bg-crimson/80 px-2 py-1 text-xs text-parchment disabled:opacity-50"
                >
                  {cityGoalSaving === c.id ? "..." : "บันทึกเป้าหมาย"}
                </button>
              </div>
              {/* สินค้าที่ครูกำหนดให้กลุ่มนี้ (2 อย่าง) */}
              <div>
                <p className="mb-1 text-xs font-semibold text-ink">สินค้าที่กลุ่มนี้มี (เลือก 2 อย่าง)</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={cityProductsDraft[c.id]?.[0] ?? ""}
                    onChange={(e) => setCityProductsDraft((prev) => ({ ...prev, [c.id]: [e.target.value, prev[c.id]?.[1] ?? ""] }))}
                    className="rounded border border-gold/40 bg-white/80 px-2 py-1 text-sm"
                  >
                    <option value="">-- สินค้าที่ 1 --</option>
                    {resourceTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>{rt.icon ?? ""} {rt.label}</option>
                    ))}
                  </select>
                  <select
                    value={cityProductsDraft[c.id]?.[1] ?? ""}
                    onChange={(e) => setCityProductsDraft((prev) => ({ ...prev, [c.id]: [prev[c.id]?.[0] ?? "", e.target.value] }))}
                    className="rounded border border-gold/40 bg-white/80 px-2 py-1 text-sm"
                  >
                    <option value="">-- สินค้าที่ 2 --</option>
                    {resourceTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>{rt.icon ?? ""} {rt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveAssignedProducts(c.id)}
                    disabled={cityProductsSaving === c.id || !cityProductsDraft[c.id]?.[0] || !cityProductsDraft[c.id]?.[1] || cityProductsDraft[c.id]?.[0] === cityProductsDraft[c.id]?.[1]}
                    className="rounded bg-crimson/80 px-2 py-1 text-xs text-parchment disabled:opacity-50"
                  >
                    {cityProductsSaving === c.id ? "..." : "บันทึกสินค้า"}
                  </button>
                </div>
                {(c.assigned_products?.length ?? 0) >= 2 && (
                  <p className="mt-1 text-xs text-ink/50">
                    ปัจจุบัน: {c.assigned_products!.map((p) => `${p.icon ?? ""} ${p.label}`).join(", ")}
                  </p>
                )}
              </div>
              {/* ทรัพยากรที่ครูกำหนดให้นักเรียนกลุ่มนี้มี */}
              <div>
                <p className="mb-1 text-xs font-semibold text-ink">ทรัพยากรที่กลุ่มนี้มี (ครูกำหนดจำนวนเอง)</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {resourceTypes.map((rt) => (
                    <div key={rt.id} className="flex items-center gap-1">
                      <span className="text-sm">{rt.icon ?? "📦"}</span>
                      <label className="sr-only">{rt.label}</label>
                      <input
                        type="number"
                        min="0"
                        value={getCityResourceAmount(c.id, rt.id)}
                        onChange={(e) => setCityResourceAmount(c.id, rt.id, e.target.value)}
                        className="w-16 rounded border border-gold/40 bg-white/80 px-1 py-0.5 text-sm"
                      />
                      <span className="text-xs text-ink/60">{rt.label}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSaveCityResources(c.id)}
                    disabled={cityResourcesSaving === c.id}
                    className="rounded bg-crimson/80 px-2 py-1 text-xs text-parchment disabled:opacity-50"
                  >
                    {cityResourcesSaving === c.id ? "..." : "บันทึกทรัพยากร"}
                  </button>
                </div>
              </div>
              {/* Unique Asset + Release Resources */}
              <div className={`rounded-xl border-2 p-3 ${c.resources_released ? "border-green-400 bg-green-50" : "border-crimson/30 bg-crimson/5"}`}>
                <p className="mb-2 text-xs font-bold text-crimson">
                  {c.resources_released ? "✅ ปล่อยทรัพยากรแล้ว" : "🔒 ยังไม่ได้ปล่อยทรัพยากร"}
                </p>
                {!c.resources_released && (
                  <>
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-semibold text-ink">สินทรัพย์พิเศษ</p>
                      <select
                        value={uniqueAssetDraft[c.id] ?? ""}
                        onChange={(e) => setUniqueAssetDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        className="w-full rounded border border-gold/40 bg-white/80 px-2 py-1.5 text-sm"
                      >
                        <option value="">-- เลือกสินทรัพย์พิเศษ --</option>
                        {UNIQUE_ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReleaseResources(c.id)}
                      disabled={releaseSaving === c.id}
                      className="w-full rounded-xl bg-crimson py-2 text-sm font-bold text-parchment hover:bg-crimson/90 disabled:opacity-50"
                    >
                      {releaseSaving === c.id ? "กำลังปล่อย..." : "🚀 Release Resources"}
                    </button>
                  </>
                )}
                {c.resources_released && c.unique_asset && (
                  <p className="text-xs text-green-800">สินทรัพย์พิเศษ: <strong>{c.unique_asset}</strong></p>
                )}
              </div>
              {c.leader_name && <p className="text-xs text-ink/70">ผู้นำ: {c.leader_name}</p>}
              {c.description && <p className="text-xs text-ink/60">คำอธิบาย: {c.description}</p>}
              <div className="flex gap-3 text-xs text-ink/50">
                <span>ป้องกัน: {c.defense_score}</span>
                <span>เสถียรภาพ: {c.stability_score}</span>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Global Missions Tab */}
      {tab === "missions" && (
        <section className="space-y-3">
          <form onSubmit={handleCreateGlobalMission} className="siam-card space-y-3">
            <h2 className="text-sm font-bold text-crimson">🌏 สร้างภารกิจร่วมใหม่</h2>
            <input
              value={gmTitle} onChange={(e) => setGmTitle(e.target.value)}
              placeholder="ชื่อภารกิจ เช่น พระราชโองการ: รวมพลทหาร"
              className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none"
            />
            <textarea
              value={gmDesc} onChange={(e) => setGmDesc(e.target.value)}
              placeholder="คำอธิบายภารกิจ (ไม่บังคับ)"
              rows={2}
              className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <select
                value={gmResourceType} onChange={(e) => setGmResourceType(e.target.value)}
                className="flex-1 rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm"
              >
                <option value="">เลือกทรัพยากร</option>
                {resourceTypes.map((rt) => (
                  <option key={rt.key} value={rt.key}>{rt.icon ?? ""} {rt.label}</option>
                ))}
              </select>
              <input
                type="number" min="1" value={gmTargetAmount} onChange={(e) => setGmTargetAmount(e.target.value)}
                placeholder="เป้าหมาย"
                className="w-28 rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm"
              />
            </div>
            {gmError && <p className="text-xs text-crimson">{gmError}</p>}
            <button type="submit" disabled={gmLoading || !gmTitle.trim() || !gmResourceType}
              className="siam-button w-full text-sm disabled:opacity-50">
              {gmLoading ? "กำลังสร้าง..." : "สร้างภารกิจ"}
            </button>
          </form>

          {globalMissions.length === 0 && (
            <p className="siam-card text-sm text-ink/50">ยังไม่มีภารกิจร่วม</p>
          )}
          {globalMissions.map((m) => {
            const pct = Math.min(100, Math.round((m.current_amount / m.target_amount) * 100));
            return (
              <article key={m.id} className={`siam-card space-y-2 border-2 ${m.is_active ? "border-gold" : "border-transparent"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-crimson">{m.title}</p>
                    {m.description && <p className="text-xs text-ink/60">{m.description}</p>}
                    <p className="text-xs text-ink/70">ทรัพยากร: {m.target_resource_type} | เป้า: {m.current_amount}/{m.target_amount}</p>
                  </div>
                  {m.is_active && <span className="rounded-full bg-gold/30 px-2 py-0.5 text-xs font-bold text-amber-800">ใช้งาน</span>}
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gold/20">
                  <div className="h-full rounded-full bg-crimson transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2">
                  {!m.is_active ? (
                    <button onClick={() => handleToggleGlobalMission(m.id, true)}
                      className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white">
                      เปิดใช้งาน
                    </button>
                  ) : (
                    <button onClick={() => handleToggleGlobalMission(m.id, false)}
                      className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                      ปิดใช้งาน
                    </button>
                  )}
                  <button onClick={() => handleDeleteGlobalMission(m.id)}
                    className="rounded-lg border border-crimson/40 px-3 py-1 text-xs text-crimson">
                    ลบ
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Log / Chat Tab */}
      {tab === "log" && (
        <section className="siam-card space-y-3">
          <h2 className="text-sm font-bold text-crimson">💬 ล็อกกิจกรรม (Real-time)</h2>
          <p className="text-xs text-ink/50">อัปเดตอัตโนมัติเมื่อมีการค้าขาย, สงคราม, หรือกิจกรรมใหม่</p>
          <AdminLogFeed />
        </section>
      )}

      {/* Trade Tab */}
      {tab === "trades" && (
        <section className="space-y-2">
          {pendingTrades.length === 0 && <p className="siam-card text-sm text-ink/50">ไม่มีคำขอค้าขายที่รอดำเนินการ</p>}
          {pendingTrades.map((t) => (
            <article key={t.id} className="siam-card space-y-2">
              <p className="text-sm">
                <strong>{t.from_city?.name}</strong> → <strong>{t.to_city?.name}</strong>
              </p>
              <p className="text-sm">
                เสนอ: {t.offer_rt?.icon} {t.offer_amount} {t.offer_rt?.label}
                {t.request_rt && <> | ต้องการ: {t.request_rt.icon} {t.request_amount} {t.request_rt.label}</>}
              </p>
              {t.note && <p className="text-xs text-ink/60">หมายเหตุ: {t.note}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => handleTradeReview(t.id, "approved")}
                  disabled={actionLoading === t.id}
                  className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleTradeReview(t.id, "rejected")}
                  disabled={actionLoading === t.id}
                  className="rounded-lg bg-crimson px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  ปฏิเสธ
                </button>
              </div>
            </article>
          ))}
          {resolvedTrades.length > 0 && (
            <details className="siam-card">
              <summary className="cursor-pointer text-sm font-semibold text-ink/70">ประวัติ ({resolvedTrades.length})</summary>
              <div className="mt-2 space-y-1">
                {resolvedTrades.map((t) => (
                  <p key={t.id} className="text-xs text-ink/60">
                    {t.from_city?.name} → {t.to_city?.name} | {t.offer_rt?.icon} {t.offer_amount} |{" "}
                    <span className={t.status === "approved" ? "text-green-700" : "text-crimson"}>{t.status}</span>
                  </p>
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      {/* Resources Tab */}
      {tab === "resources" && (
        <section className="siam-card space-y-3">
          <h2 className="text-sm font-bold text-crimson">📦 ทรัพยากร – ผลต่อสงครามและตัวคูณ</h2>
          <p className="text-xs text-ink/60">ตั้งค่า &quot;ผลต่อสงคราม&quot; (โจมตี/ป้องกัน) และ &quot;ตัวคูณ&quot; สำหรับคำนวณแต้มในสงคราม</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gold/40">
                  <th className="py-2 pr-2">ทรัพยากร</th>
                  <th className="py-2 pr-2">ผลต่อสงคราม</th>
                  <th className="py-2 pr-2">ตัวคูณ</th>
                  <th className="py-2">บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {resourceTypes.map((rt) => (
                  <ResourceTypeRow
                    key={rt.id}
                    rt={rt}
                    onSave={handleResourceTypeUpdate}
                    saving={resourceSaving === rt.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {resourceTypes.length === 0 && <p className="text-sm text-ink/50">ยังไม่มีประเภททรัพยากร</p>}
        </section>
      )}

      {/* Laws Tab */}
      {tab === "laws" && (
        <section className="space-y-2">
          {laws.filter((l) => l.status === "pending").length === 0 && (
            <p className="siam-card text-sm text-ink/50">ไม่มีกฎหมายที่รออนุมัติ</p>
          )}
          {laws
            .filter((l) => l.status === "pending")
            .map((l) => (
              <article key={l.id} className="siam-card space-y-2">
                <p className="text-sm font-bold text-crimson">{l.title}</p>
                <p className="text-xs text-ink/70">เมือง: {(l.city as { name?: string })?.name ?? "-"}</p>
                {l.description && <p className="text-xs text-ink/60">{l.description}</p>}
                <p className="text-xs text-ink/60">
                  ผลเชิงกล: {l.bonus_type === "attack_pct" ? "โจมตี" : "ป้องกัน"} +{l.bonus_value ?? 0}%
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLawReview(l.id, "approved")}
                    disabled={lawActionLoading === l.id}
                    className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => handleLawReview(l.id, "rejected")}
                    disabled={lawActionLoading === l.id}
                    className="rounded-lg bg-crimson px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </article>
            ))}
          {laws.filter((l) => l.status !== "pending").length > 0 && (
            <details className="siam-card">
              <summary className="cursor-pointer text-sm font-semibold text-ink/70">
                ประวัติกฎหมาย ({laws.filter((l) => l.status !== "pending").length})
              </summary>
              <div className="mt-2 space-y-1">
                {laws
                  .filter((l) => l.status !== "pending")
                  .map((l) => (
                    <p key={l.id} className="text-xs text-ink/60">
                      {(l.city as { name?: string })?.name} – {l.title} |{" "}
                      <span className={l.status === "approved" ? "text-green-700" : "text-crimson"}>{l.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}</span>
                    </p>
                  ))}
              </div>
            </details>
          )}
        </section>
      )}

      {/* War Tab */}
      {tab === "wars" && (
        <section className="space-y-2">
          {pendingWars.length === 0 && <p className="siam-card text-sm text-ink/50">ไม่มีคำขอสงครามที่รอดำเนินการ</p>}
          {pendingWars.map((w) => (
            <article key={w.id} className="siam-card space-y-2">
              <p className="text-sm">
                <strong>{w.attacker_city?.name}</strong> (โจมตี: {w.attack_power}) vs <strong>{w.defender_city?.name}</strong> (ป้องกัน: {w.defense_power})
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleWarReview(w.id, "resolved", w.attack_power > w.defense_power ? "attacker_win" : w.defense_power > w.attack_power ? "defender_win" : "draw")}
                  disabled={actionLoading === w.id}
                  className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  ตัดสิน (อัตโนมัติ)
                </button>
                <button
                  onClick={() => handleWarReview(w.id, "rejected")}
                  disabled={actionLoading === w.id}
                  className="rounded-lg bg-crimson px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  ปฏิเสธ
                </button>
              </div>
            </article>
          ))}
          {resolvedWars.length > 0 && (
            <details className="siam-card">
              <summary className="cursor-pointer text-sm font-semibold text-ink/70">ประวัติ ({resolvedWars.length})</summary>
              <div className="mt-2 space-y-1">
                {resolvedWars.map((w) => (
                  <p key={w.id} className="text-xs text-ink/60">
                    {w.attacker_city?.name} vs {w.defender_city?.name} |{" "}
                    <span className={w.status === "resolved" ? "text-green-700" : "text-crimson"}>{w.result ?? w.status}</span>
                  </p>
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      {/* Phase Tab */}
      {tab === "phase" && settings && (
        <section className="siam-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ช่วงเวลาปัจจุบัน</span>
            <button
              onClick={() => handlePhaseToggle("current_phase", settings.current_phase === "peace" ? "war" : "peace")}
              className={`rounded-full px-4 py-1 text-sm font-bold ${settings.current_phase === "peace" ? "bg-green-100 text-green-800" : "bg-crimson/20 text-crimson"}`}
            >
              {settings.current_phase === "peace" ? "☮️ สันติภาพ" : "⚔️ สงคราม"}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ระบบค้าขาย</span>
            <button
              onClick={() => handlePhaseToggle("is_trade_active", !settings.is_trade_active)}
              className={`rounded-full px-4 py-1 text-sm font-bold ${settings.is_trade_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"}`}
            >
              {settings.is_trade_active ? "เปิด" : "ปิด"}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ระบบสงคราม</span>
            <button
              onClick={() => handlePhaseToggle("is_war_active", !settings.is_war_active)}
              className={`rounded-full px-4 py-1 text-sm font-bold ${settings.is_war_active ? "bg-crimson/20 text-crimson" : "bg-gray-200 text-gray-500"}`}
            >
              {settings.is_war_active ? "เปิด" : "ปิด"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">เปอร์เซ็นต์ที่ฝ่ายแพ้เสียให้ฝ่ายชนะ (ทรัพยากร)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={reparationPercent}
                onChange={(e) => setReparationPercent(Number(e.target.value) || 0)}
                className="w-16 rounded border border-gold/40 px-2 py-1 text-sm"
              />
              <span className="text-sm">%</span>
              <button
                onClick={() => handlePhaseToggle("war_reparation_percent", String(reparationPercent))}
                className="rounded bg-crimson/80 px-2 py-1 text-xs text-parchment"
              >
                บันทึก
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
