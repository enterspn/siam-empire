import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const allowed = ["current_phase", "is_trade_active", "is_war_active", "war_reparation_percent"];
    const updates: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const { error } = await supabaseService
      .from("settings")
      .update(updates)
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log phase changes
    const changes = Object.entries(updates)
      .map(([k, v]) => `${k} → ${v}`)
      .join(", ");

    await supabaseService.from("logs").insert({
      message: `Admin changed settings: ${changes}`,
      city_id: null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
