import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const missionId: string = body.missionId ?? "";
    const amount = Math.max(1, Math.floor(Number(body.amount) || 0));

    if (!missionId) return NextResponse.json({ error: "ไม่พบภารกิจ" }, { status: 400 });
    if (amount < 1) return NextResponse.json({ error: "จำนวนต้องมากกว่า 0" }, { status: 400 });

    const { data: mission, error: mErr } = await supabaseService
      .from("global_missions")
      .select("id, target_resource_type, target_amount, current_amount, is_active")
      .eq("id", missionId)
      .eq("is_active", true)
      .single();

    if (mErr || !mission) {
      return NextResponse.json({ error: "ไม่พบภารกิจที่กำลังใช้งาน" }, { status: 404 });
    }

    const resourceType = mission.target_resource_type as string;

    const { data: rtRow } = await supabaseService
      .from("resource_types")
      .select("id")
      .eq("key", resourceType)
      .single();

    if (!rtRow) return NextResponse.json({ error: `ไม่พบทรัพยากร ${resourceType}` }, { status: 404 });

    const { data: cityResource } = await supabaseService
      .from("city_resources")
      .select("id, amount")
      .eq("city_id", session.city_id)
      .eq("resource_type_id", rtRow.id)
      .single();

    const currentCityAmount = cityResource?.amount ?? 0;
    if (currentCityAmount < amount) {
      return NextResponse.json({ error: `ทรัพยากรไม่พอ (มีอยู่ ${currentCityAmount})` }, { status: 400 });
    }

    const remaining = Math.max(0, (mission.target_amount as number) - (mission.current_amount as number));
    const actualDonate = Math.min(amount, remaining);
    if (actualDonate === 0) {
      return NextResponse.json({ error: "ภารกิจเต็มแล้ว ไม่ต้องบริจาคเพิ่ม" }, { status: 400 });
    }

    await supabaseService
      .from("city_resources")
      .update({ amount: currentCityAmount - actualDonate })
      .eq("city_id", session.city_id)
      .eq("resource_type_id", rtRow.id);

    await supabaseService
      .from("global_missions")
      .update({ current_amount: (mission.current_amount as number) + actualDonate })
      .eq("id", missionId);

    return NextResponse.json({ ok: true, donated: actualDonate, newCityAmount: currentCityAmount - actualDonate });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
