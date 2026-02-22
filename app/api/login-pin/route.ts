import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const passcode = (body.passcode ?? "").trim();
    const cityRole = body.cityRole as "lord" | "city_dept" | "palace_dept" | "chronicler" | undefined;

    if (!/^\d{4}$/.test(passcode)) {
      return NextResponse.json({ error: "กรุณากรอกรหัส PIN 4 หลัก" }, { status: 400 });
    }
    if (!cityRole || !["lord", "city_dept", "palace_dept", "chronicler"].includes(cityRole)) {
      return NextResponse.json({ error: "กรุณาเลือกบทบาท" }, { status: 400 });
    }

    const { data: city, error } = await supabaseService
      .from("cities")
      .select("id, name, is_registered, resources_released")
      .eq("passcode", passcode)
      .eq("is_registered", true)
      .single();

    if (error || !city) {
      return NextResponse.json({ error: "ไม่พบรหัส PIN นี้ กรุณาลองใหม่" }, { status: 404 });
    }

    await setSession({ city_id: city.id, city_name: city.name, role: "student", city_role: cityRole });
    return NextResponse.json({ ok: true, cityName: city.name, resourcesReleased: city.resources_released });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
