import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseService
    .from("global_missions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ missions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const title = (body.title ?? "").trim();
    const description = (body.description ?? "").trim();
    const targetResourceType = (body.targetResourceType ?? "").trim();
    const targetAmount = Math.max(1, Number(body.targetAmount) || 0);

    if (!title) return NextResponse.json({ error: "กรุณากรอกชื่อภารกิจ" }, { status: 400 });
    if (!targetResourceType) return NextResponse.json({ error: "กรุณาเลือกทรัพยากร" }, { status: 400 });

    const { data, error } = await supabaseService
      .from("global_missions")
      .insert({ title, description, target_resource_type: targetResourceType, target_amount: targetAmount, current_amount: 0, is_active: false })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ mission: data });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
