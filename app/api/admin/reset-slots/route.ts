import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: slots, error: fetchErr } = await supabaseService
    .from("cities")
    .select("id, slot_number")
    .not("slot_number", "is", null);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const ids = (slots ?? []).map((s) => s.id as string);
  if (ids.length === 0) return NextResponse.json({ ok: true, reset: 0 });

  for (let i = 0; i < ids.length; i++) {
    const slot = (slots ?? [])[i];
    const slotNum = slot.slot_number as number;
    await supabaseService
      .from("cities")
      .update({
        name: `ช่อง ${slotNum}`,
        passcode: "",
        is_registered: false,
        resources_released: false,
        unique_asset: "",
      })
      .eq("id", ids[i]);

    await supabaseService
      .from("city_resources")
      .delete()
      .eq("city_id", ids[i]);
  }

  await supabaseService.from("logs").insert({
    message: `ครูรีเซ็ต ${ids.length} ช่องลงทะเบียนสำหรับคาบใหม่`,
    city_id: null,
  });

  return NextResponse.json({ ok: true, reset: ids.length });
}
