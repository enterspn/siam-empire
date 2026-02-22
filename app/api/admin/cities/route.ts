import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await getCitiesList();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, hint: "ถ้าเกี่ยวกับ column หรือ table ไม่มี ให้รันไฟล์ supabase/รันไฟล์นี้ใน_Supabase_SQL_Editor.sql ใน Supabase SQL Editor" },
      { status: 500 },
    );
  }
}

async function getCitiesList() {
  const citiesResult = await supabaseService
    .from("cities")
    .select("id, name, group_code, description, laws, materials, culture, leader_name, defense_score, stability_score, negotiation_goal, is_registered, resources_released, unique_asset, slot_number, created_at")
    .order("created_at", { ascending: true });

  let cities: Record<string, unknown>[];
  if (citiesResult.error) {
    const fallback = await supabaseService
      .from("cities")
      .select("id, name, group_code, description, laws, materials, culture, leader_name, defense_score, stability_score, is_registered, resources_released, unique_asset, slot_number, created_at")
      .order("created_at", { ascending: true });
    if (fallback.error) {
      throw new Error(fallback.error.message);
    }
    cities = (fallback.data ?? []).map((c) => ({ ...c, negotiation_goal: "" }));
  } else {
    cities = (citiesResult.data ?? []).map((c) => ({ ...c, negotiation_goal: (c as Record<string, unknown>).negotiation_goal ?? "" }));
  }
  const cityIds = cities.map((c) => c.id as string);

  let assignedData: unknown[] = [];
  if (cityIds.length > 0) {
    try {
      const assigned = await supabaseService
        .from("city_assigned_products")
        .select("city_id, resource_type_id, resource_types(id, label, icon, key)")
        .in("city_id", cityIds);
      if (!assigned.error) assignedData = assigned.data ?? [];
    } catch {
      assignedData = [];
    }
  }

  const byCity = new Map<string, { id: string; label: string; icon: string | null; key: string }[]>();
  for (const row of assignedData) {
    const r = row as { city_id: string; resource_types?: { id: string; label: string; icon: string | null; key: string } | null };
    const rt = r.resource_types;
    if (!rt) continue;
    const list = byCity.get(r.city_id) ?? [];
    list.push({ id: rt.id, label: rt.label, icon: rt.icon, key: rt.key });
    byCity.set(r.city_id, list);
  }

  let resourcesData: unknown[] = [];
  if (cityIds.length > 0) {
    try {
      const res = await supabaseService
        .from("city_resources")
        .select("city_id, resource_type_id, amount, resource_types(id, label, icon, key)")
        .in("city_id", cityIds);
      if (!res.error) resourcesData = res.data ?? [];
    } catch {
      resourcesData = [];
    }
  }

  const resourcesByCity = new Map<string, { resource_type_id: string; amount: number; id: string; label: string; icon: string | null; key: string }[]>();
  for (const row of resourcesData) {
    const r = row as { city_id: string; resource_type_id: string; amount: number; resource_types?: { id: string; label: string; icon: string | null; key: string } };
    const rt = r.resource_types;
    if (!rt) continue;
    const list = resourcesByCity.get(r.city_id) ?? [];
    list.push({ resource_type_id: r.resource_type_id, amount: r.amount, id: rt.id, label: rt.label, icon: rt.icon, key: rt.key });
    resourcesByCity.set(r.city_id, list);
  }

  const citiesWithProducts = cities.map((c) => ({
    ...c,
    assigned_products: byCity.get(c.id as string) ?? [],
    resources: resourcesByCity.get(c.id as string) ?? [],
  }));

  return NextResponse.json({ cities: citiesWithProducts });
}


export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = (body.name ?? "").trim();
    const groupCode = (body.group_code ?? "").trim().toLowerCase();

    if (!name || !groupCode) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อเมืองและรหัสกลุ่ม" },
        { status: 400 },
      );
    }

    // Create city
    const { data: city, error: insertErr } = await supabaseService
      .from("cities")
      .insert({ name, group_code: groupCode })
      .select("id, name, group_code")
      .single();

    if (insertErr) {
      if (insertErr.message.includes("duplicate")) {
        return NextResponse.json(
          { error: "ชื่อเมืองหรือรหัสกลุ่มซ้ำ กรุณาใช้ชื่ออื่น" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Auto-create default resources for the new city
    const { data: resourceTypes } = await supabaseService
      .from("resource_types")
      .select("id")
      .eq("is_active", true);

    if (resourceTypes && resourceTypes.length > 0) {
      const rows = resourceTypes.map((rt) => ({
        city_id: city.id,
        resource_type_id: rt.id,
        amount: 100,
      }));
      await supabaseService.from("city_resources").insert(rows);
    }

    await supabaseService.from("logs").insert({
      message: `ครูสร้างเมือง "${name}" — รหัสกลุ่มสำหรับเข้าสู่ระบบ: ${groupCode} (กลุ่มอื่นใช้รหัสนี้เพื่อเข้าเล่น)`,
      city_id: city.id,
    });

    return NextResponse.json({ ok: true, city });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
