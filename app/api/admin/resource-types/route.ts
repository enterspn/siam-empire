import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("resource_types")
    .select("id, key, label, icon, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    war_effect: row.war_effect ?? null,
    war_multiplier: row.war_multiplier ?? 1,
  }));
  return NextResponse.json({ resourceTypes: list });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, war_effect, war_multiplier } = body;

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ id ทรัพยากร" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (war_effect !== undefined) {
      if (war_effect === "" || war_effect === null) updates.war_effect = null;
      else if (war_effect === "attack" || war_effect === "defense") updates.war_effect = war_effect;
      else return NextResponse.json({ error: "war_effect ต้องเป็น attack หรือ defense" }, { status: 400 });
    }
    if (war_multiplier !== undefined) {
      const n = Number(war_multiplier);
      if (Number.isNaN(n) || n < 0) return NextResponse.json({ error: "ตัวคูณต้องเป็นตัวเลขไม่ต่ำกว่า 0" }, { status: 400 });
      updates.war_multiplier = n;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
    }

    const { error: updateErr } = await supabaseService
      .from("resource_types")
      .update(updates)
      .eq("id", id);

    if (updateErr) {
      if (updateErr.message?.includes("column") && updateErr.message?.includes("does not exist")) {
        return NextResponse.json({ error: "ระบบยังไม่รองรับการตั้งค่านี้ กรุณารัน migration ใน Supabase ก่อน" }, { status: 501 });
      }
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
