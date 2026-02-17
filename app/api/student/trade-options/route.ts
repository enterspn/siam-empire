import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [citiesRes, rtRes] = await Promise.all([
    supabaseService.from("cities").select("id, name").neq("id", session.city_id).order("name"),
    supabaseService.from("resource_types").select("id, key, label, icon").eq("is_active", true).order("sort_order"),
  ]);

  return NextResponse.json({
    cities: citiesRes.data ?? [],
    resourceTypes: rtRes.data ?? [],
  });
}
