import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slotNumber = Number(body.slotNumber);
    const cityName = (body.cityName ?? "").trim();
    const passcode = (body.passcode ?? "").trim();
    const cityRole = body.cityRole as "lord" | "city_dept" | "palace_dept" | "chronicler" | undefined;

    if (!cityName || cityName.length < 2) {
      return NextResponse.json({ error: "กรุณากรอกชื่อเมือง (อย่างน้อย 2 ตัวอักษร)" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(passcode)) {
      return NextResponse.json({ error: "รหัส PIN ต้องเป็นตัวเลข 4 หลัก" }, { status: 400 });
    }
    if (!cityRole || !["lord", "city_dept", "palace_dept", "chronicler"].includes(cityRole)) {
      return NextResponse.json({ error: "กรุณาเลือกบทบาท" }, { status: 400 });
    }
    if (slotNumber < 1 || slotNumber > 5) {
      return NextResponse.json({ error: "ช่องไม่ถูกต้อง" }, { status: 400 });
    }

    const { data: pinExists } = await supabaseService
      .from("cities")
      .select("id")
      .eq("passcode", passcode)
      .not("passcode", "eq", "")
      .maybeSingle();

    if (pinExists) {
      return NextResponse.json({ error: "รหัส PIN นี้ถูกใช้ไปแล้ว กรุณาเลือก PIN อื่น" }, { status: 409 });
    }

    const { data: slot, error } = await supabaseService
      .from("cities")
      .update({ name: cityName, passcode, is_registered: true })
      .eq("slot_number", slotNumber)
      .eq("is_registered", false)
      .select("id, name")
      .single();

    if (error || !slot) {
      return NextResponse.json({ error: "ช่องนี้ถูกลงทะเบียนไปแล้ว" }, { status: 409 });
    }

    await setSession({ city_id: slot.id, city_name: slot.name, role: "student", city_role: cityRole });
    return NextResponse.json({ ok: true, cityName: slot.name });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
