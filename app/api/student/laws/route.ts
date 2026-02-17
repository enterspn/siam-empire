import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.city_id === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("laws")
    .select("id, title, description, bonus_type, bonus_value, status, created_at")
    .eq("city_id", session.city_id)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []).sort((a, b) => {
    const order = { approved: 0, pending: 1, rejected: 2 };
    return (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1);
  });

  return NextResponse.json({ laws: list });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.city_id === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = (body.title ?? "").trim();
    const description = (body.description ?? "").trim();
    const bonusType = body.bonus_type;
    const bonusValue = body.bonus_value;

    if (!title) {
      return NextResponse.json({ error: "กรุณากรอกชื่อกฎหมาย" }, { status: 400 });
    }

    if (bonusType !== "attack_pct" && bonusType !== "defense_pct") {
      return NextResponse.json({ error: "กรุณาเลือกผลเชิงกล: โจมตี % หรือ ป้องกัน %" }, { status: 400 });
    }

    const val = Number(bonusValue);
    if (Number.isNaN(val) || val < 0 || val > 100) {
      return NextResponse.json({ error: "ค่าโบนัสต้องเป็นตัวเลข 0–100" }, { status: 400 });
    }

    const { error: insertErr } = await supabaseService.from("laws").insert({
      city_id: session.city_id,
      title,
      description: description || title,
      bonus_type: bonusType,
      bonus_value: Math.round(val),
      status: "pending",
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
