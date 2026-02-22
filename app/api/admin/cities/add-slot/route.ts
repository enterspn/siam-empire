import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // หาช่องที่มีอยู่แล้วทั้งหมด
  const { data: slots, error: fetchErr } = await supabaseService
    .from("cities")
    .select("slot_number")
    .not("slot_number", "is", null);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  // หาหมายเลขช่องถัดไป (max + 1)
  let maxSlot = 0;
  if (slots && slots.length > 0) {
    maxSlot = Math.max(...slots.map((s) => s.slot_number as number));
  }
  const nextSlot = maxSlot + 1;

  // สร้างเมืองใหม่เป็นช่องถัดไป
  const { data: newCity, error: insertErr } = await supabaseService
    .from("cities")
    .insert({
      name: `ช่อง ${nextSlot}`,
      group_code: `slot-${nextSlot}-${Date.now()}`, // unique group code
      slot_number: nextSlot,
      is_registered: false,
      resources_released: false,
      passcode: "",
      unique_asset: "",
    })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // บันทึก log
  await supabaseService.from("logs").insert({
    message: `ครูเพิ่มช่องลงทะเบียนใหม่ (ช่องที่ ${nextSlot})`,
    city_id: null,
  });

  return NextResponse.json({ ok: true, city: newCity });
}
