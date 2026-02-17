import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

async function transferWarReparations(loserCityId: string, winnerCityId: string) {
  const { data: settings } = await supabaseService.from("settings").select("war_reparation_percent").eq("id", 1).single();
  const percent = Math.min(100, Math.max(0, Number(settings?.war_reparation_percent) || 10));

  const { data: loserResources } = await supabaseService
    .from("city_resources")
    .select("id, resource_type_id, amount")
    .eq("city_id", loserCityId);

  if (!loserResources?.length) return;

  for (const row of loserResources) {
    const amount = row.amount as number;
    const take = Math.floor((amount * percent) / 100);
    if (take <= 0) continue;

    const newLoserAmount = Math.max(0, amount - take);
    await supabaseService.from("city_resources").update({ amount: newLoserAmount }).eq("id", row.id);

    const { data: winnerRow } = await supabaseService
      .from("city_resources")
      .select("id, amount")
      .eq("city_id", winnerCityId)
      .eq("resource_type_id", row.resource_type_id)
      .single();

    if (winnerRow) {
      await supabaseService
        .from("city_resources")
        .update({ amount: (winnerRow.amount as number) + take })
        .eq("id", winnerRow.id);
    } else {
      await supabaseService.from("city_resources").insert({
        city_id: winnerCityId,
        resource_type_id: row.resource_type_id,
        amount: take,
      });
    }
  }
}

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
    const action: string = body.action; // "resolved" | "rejected"
    const result: string | null = body.result ?? null;
    const resolutionNote: string | null = body.resolution_note ?? null;

    if (!["resolved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch war
    const { data: war, error: fetchErr } = await supabaseService
      .from("wars")
      .select("*, attacker:cities!wars_attacker_city_id_fkey(name), defender:cities!wars_defender_city_id_fkey(name)")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (fetchErr || !war) {
      return NextResponse.json({ error: "War not found or already reviewed" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status: action,
      reviewed_at: new Date().toISOString(),
    };

    if (action === "resolved") {
      updateData.result = result;
      updateData.resolution_note = resolutionNote;
    }

    const { error: updateErr } = await supabaseService
      .from("wars")
      .update(updateData)
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Deduct attacker's war resources (sent to battle) regardless of result
    if (action === "resolved") {
      const { data: warResources } = await supabaseService
        .from("war_resources")
        .select("resource_type_id, amount")
        .eq("war_id", id);
      if (warResources && warResources.length > 0) {
        for (const wr of warResources) {
          const { data: cr } = await supabaseService
            .from("city_resources")
            .select("id, amount")
            .eq("city_id", war.attacker_city_id)
            .eq("resource_type_id", wr.resource_type_id)
            .single();
          if (cr) {
            const newAmount = Math.max(0, (cr.amount as number) - (wr.amount as number));
            await supabaseService
              .from("city_resources")
              .update({ amount: newAmount })
              .eq("id", cr.id);
          }
        }
      }
    }

    // Apply war effects if resolved
    if (action === "resolved" && result) {
      const attackerName = (war.attacker as Record<string, string>)?.name ?? "Unknown";
      const defenderName = (war.defender as Record<string, string>)?.name ?? "Unknown";

      if (result === "attacker_win") {
        const winnerId = war.attacker_city_id;
        const loserId = war.defender_city_id;
        const { data: atkCity } = await supabaseService.from("cities").select("stability_score").eq("id", war.attacker_city_id).single();
        if (atkCity) await supabaseService.from("cities").update({ stability_score: atkCity.stability_score + 5 }).eq("id", war.attacker_city_id);
        const { data: defCity } = await supabaseService.from("cities").select("stability_score").eq("id", war.defender_city_id).single();
        if (defCity) await supabaseService.from("cities").update({ stability_score: Math.max(0, defCity.stability_score - 5) }).eq("id", war.defender_city_id);
        await transferWarReparations(loserId, winnerId);
        await supabaseService.from("logs").insert({
          message: `${attackerName} won the war against ${defenderName}! ฝ่ายแพ้เสียทรัพยากรให้ฝ่ายชนะ`,
          city_id: war.attacker_city_id,
        });
      } else if (result === "defender_win") {
        const winnerId = war.defender_city_id;
        const loserId = war.attacker_city_id;
        const { data: defCity2 } = await supabaseService.from("cities").select("defense_score").eq("id", war.defender_city_id).single();
        if (defCity2) await supabaseService.from("cities").update({ defense_score: defCity2.defense_score + 5 }).eq("id", war.defender_city_id);
        await transferWarReparations(loserId, winnerId);
        await supabaseService.from("logs").insert({
          message: `${defenderName} successfully defended against ${attackerName}! ฝ่ายแพ้เสียทรัพยากรให้ฝ่ายชนะ`,
          city_id: war.defender_city_id,
        });
      } else {
        await supabaseService.from("logs").insert({
          message: `War between ${attackerName} and ${defenderName} ended in a draw`,
          city_id: war.attacker_city_id,
        });
      }
    }

    if (action === "rejected") {
      const attackerName = (war.attacker as Record<string, string>)?.name ?? "Unknown";
      await supabaseService.from("logs").insert({
        message: `War request from ${attackerName} was rejected`,
        city_id: war.attacker_city_id,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
