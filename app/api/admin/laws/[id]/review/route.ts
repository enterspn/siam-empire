import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const action = body.action;

    if (action !== "approved" && action !== "rejected") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { error: updateErr } = await supabaseService
      .from("laws")
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending");

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
