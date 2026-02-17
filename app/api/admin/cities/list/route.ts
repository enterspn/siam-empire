import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

/**
 * รายชื่อเมืองแบบย่อ (เฉพาะ id, name, group_code) ใช้เมื่อ API หลัก /api/admin/cities ผิดพลาด
 * เพื่อให้หน้าครูยังโชว์ว่ามีเมืองไหนบ้างและลบได้
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("cities")
    .select("id, name, group_code")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cities: data ?? [] });
}
