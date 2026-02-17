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
    const action: string = body.action; // "approved" | "rejected"

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch trade
    const { data: trade, error } = await supabaseService
      .from("trades")
      .select("*, from_city:cities!trades_from_city_id_fkey(name), to_city:cities!trades_to_city_id_fkey(name), resource_type:resource_types!trades_offer_resource_type_id_fkey(label)")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (error || !trade) {
      return NextResponse.json({ error: "Trade not found or already reviewed" }, { status: 404 });
    }

    // Update trade status
    const { error: updateErr } = await supabaseService
      .from("trades")
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If approved, transfer resources
    if (action === "approved") {
      // Deduct from sender
      const { data: senderResource } = await supabaseService
        .from("city_resources")
        .select("id, amount")
        .eq("city_id", trade.from_city_id)
        .eq("resource_type_id", trade.offer_resource_type_id)
        .single();

      if (senderResource) {
        await supabaseService
          .from("city_resources")
          .update({ amount: Math.max(0, senderResource.amount - trade.offer_amount) })
          .eq("id", senderResource.id);
      }

      // Add to receiver
      const { data: receiverResource } = await supabaseService
        .from("city_resources")
        .select("id, amount")
        .eq("city_id", trade.to_city_id)
        .eq("resource_type_id", trade.offer_resource_type_id)
        .single();

      if (receiverResource) {
        await supabaseService
          .from("city_resources")
          .update({ amount: receiverResource.amount + trade.offer_amount })
          .eq("id", receiverResource.id);
      } else {
        await supabaseService.from("city_resources").insert({
          city_id: trade.to_city_id,
          resource_type_id: trade.offer_resource_type_id,
          amount: trade.offer_amount,
        });
      }

      // Log the event
      const fromName = (trade.from_city as Record<string, string>)?.name ?? "Unknown";
      const toName = (trade.to_city as Record<string, string>)?.name ?? "Unknown";
      const rtLabel = (trade.resource_type as Record<string, string>)?.label ?? "resource";

      await supabaseService.from("logs").insert({
        message: `${fromName} traded ${trade.offer_amount} ${rtLabel} to ${toName}`,
        city_id: trade.from_city_id,
      });
    }

    if (action === "rejected") {
      const fromName = (trade.from_city as Record<string, string>)?.name ?? "Unknown";
      await supabaseService.from("logs").insert({
        message: `Trade request from ${fromName} was rejected`,
        city_id: trade.from_city_id,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
