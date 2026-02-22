import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: city } = await supabaseService
    .from("cities")
    .select("id, slot_number, name")
    .eq("id", id)
    .not("slot_number", "is", null)
    .single();

  if (!city) return NextResponse.json({ error: "ไม่พบ slot นี้" }, { status: 404 });

  const slotNum = city.slot_number as number;

  await supabaseService
    .from("cities")
    .update({
      name: `ช่อง ${slotNum}`,
      passcode: "",
      is_registered: false,
      resources_released: false,
      unique_asset: "",
    })
    .eq("id", id);

  await supabaseService.from("city_resources").delete().eq("city_id", id);

  await supabaseService.from("logs").insert({
    message: `ครูรีเซ็ตช่องที่ ${slotNum} (${city.name as string}) สำหรับนักเรียนกลุ่มใหม่`,
    city_id: null,
  });

  return NextResponse.json({ ok: true });
}
