import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { defenderCityId, resources: resourcesPayload } = body as {
      defenderCityId?: string;
      resources?: Record<string, number>;
    };

    if (!defenderCityId) {
      return NextResponse.json(
        { error: "กรุณาเลือกเมืองเป้าหมาย" },
        { status: 400 },
      );
    }

    if (defenderCityId === session.city_id) {
      return NextResponse.json(
        { error: "ไม่สามารถโจมตีเมืองตัวเองได้" },
        { status: 400 },
      );
    }

    const resources = typeof resourcesPayload === "object" && resourcesPayload !== null
      ? resourcesPayload
      : {};
    const resourceTypeIds = Object.keys(resources).filter((id) => id && Number(resources[id]) > 0);

    if (resourceTypeIds.length === 0) {
      return NextResponse.json(
        { error: "กรุณาเลือกจำนวนทรัพยากรที่จะส่งเข้ารบอย่างน้อย 1 ชนิด" },
        { status: 400 },
      );
    }

    const { data: settings } = await supabaseService
      .from("settings")
      .select("is_war_active")
      .eq("id", 1)
      .single();

    if (!settings?.is_war_active) {
      return NextResponse.json(
        { error: "ระบบสงครามปิดอยู่ในขณะนี้" },
        { status: 403 },
      );
    }

    const { data: resourceTypes } = await supabaseService
      .from("resource_types")
      .select("id, war_effect, war_multiplier")
      .in("id", resourceTypeIds);

    const attackTypes = (resourceTypes ?? []).filter((rt) => rt.war_effect === "attack");
    if (attackTypes.length === 0) {
      return NextResponse.json(
        { error: "ทรัพยากรที่ส่งต้องเป็นชนิด \"โจมตี\" (ตั้งค่าในแท็บทรัพยากรของครู)" },
        { status: 400 },
      );
    }

    for (const rtId of resourceTypeIds) {
      const amount = Number(resources[rtId]) || 0;
      if (amount <= 0) continue;
      const { data: cr } = await supabaseService
        .from("city_resources")
        .select("amount")
        .eq("city_id", session.city_id)
        .eq("resource_type_id", rtId)
        .single();
      if (!cr || cr.amount < amount) {
        return NextResponse.json(
          { error: "ทรัพยากรไม่เพียงพอสำหรับจำนวนที่ส่ง" },
          { status: 400 },
        );
      }
    }

    let attackPower = 0;
    for (const rt of attackTypes) {
      const amount = Number(resources[rt.id]) || 0;
      const mult = Number(rt.war_multiplier) || 0;
      attackPower += amount * mult;
    }

    const { data: defenseTypes } = await supabaseService
      .from("resource_types")
      .select("id, war_multiplier")
      .eq("war_effect", "defense");

    const { data: defenderResources } = await supabaseService
      .from("city_resources")
      .select("resource_type_id, amount")
      .eq("city_id", defenderCityId);

    let defensePower = 0;
    const defMap = new Map(
      (defenderResources ?? []).map((r) => [r.resource_type_id, r.amount as number]),
    );
    for (const dt of defenseTypes ?? []) {
      const amount = defMap.get(dt.id) ?? 0;
      defensePower += amount * (Number(dt.war_multiplier) || 0);
    }

    const { data: attackerLaws } = await supabaseService
      .from("laws")
      .select("bonus_type, bonus_value")
      .eq("city_id", session.city_id)
      .eq("status", "approved");
    const attackBonusPct = (attackerLaws ?? [])
      .filter((l) => l.bonus_type === "attack_pct")
      .reduce((s, l) => s + (Number(l.bonus_value) || 0), 0);

    const { data: defenderLaws } = await supabaseService
      .from("laws")
      .select("bonus_type, bonus_value")
      .eq("city_id", defenderCityId)
      .eq("status", "approved");
    const defenseBonusPct = (defenderLaws ?? [])
      .filter((l) => l.bonus_type === "defense_pct")
      .reduce((s, l) => s + (Number(l.bonus_value) || 0), 0);

    attackPower = Math.round(attackPower * (1 + attackBonusPct / 100));
    defensePower = Math.round(defensePower * (1 + defenseBonusPct / 100));

    const { data: warRow, error: insertWarErr } = await supabaseService
      .from("wars")
      .insert({
        attacker_city_id: session.city_id,
        defender_city_id: defenderCityId,
        attack_power: attackPower,
        defense_power: defensePower,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertWarErr || !warRow) {
      return NextResponse.json({ error: insertWarErr?.message ?? "สร้างคำขอสงครามไม่สำเร็จ" }, { status: 500 });
    }

    const warResourceRows = resourceTypeIds
      .map((rtId) => ({ war_id: warRow.id, resource_type_id: rtId, amount: Number(resources[rtId]) || 0 }))
      .filter((r) => r.amount > 0);
    if (warResourceRows.length > 0) {
      await supabaseService.from("war_resources").insert(warResourceRows);
    }

    return NextResponse.json({ ok: true, attackPower, defensePower });
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
