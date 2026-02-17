import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username ?? "").trim();
    const password = (body.password ?? "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 },
      );
    }

    // Verify username + password in one query using crypt()
    const { data: admin, error } = await supabaseService
      .rpc("login_admin", {
        input_username: username,
        input_password: password,
      });

    if (error || !admin || admin.length === 0) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    const adminRow = Array.isArray(admin) ? admin[0] : admin;

    await setSession({
      city_id: "admin",
      city_name: adminRow.display_name || username,
      role: "admin",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
