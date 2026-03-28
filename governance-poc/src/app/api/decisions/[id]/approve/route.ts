import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, actor_role_id, notes } = body;

  if (!action || !actor_role_id) {
    return NextResponse.json(
      { error: "action and actor_role_id are required" },
      { status: 400 }
    );
  }

  if (!["approved", "rejected"].includes(action)) {
    return NextResponse.json(
      { error: "action must be 'approved' or 'rejected'" },
      { status: 400 }
    );
  }

  const { data: decision, error: fetchError } = await supabaseAdmin
    .from("decision_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !decision) {
    return NextResponse.json(
      { error: "Decision not found" },
      { status: 404 }
    );
  }

  if (decision.status !== "pending") {
    return NextResponse.json(
      { error: "Decision has already been processed" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("decision_requests")
    .update({ status: action })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: logError } = await supabaseAdmin
    .from("approval_logs")
    .insert({
      decision_id: id,
      actor_role_id,
      action,
      notes: notes || null,
    });

  if (logError) {
    console.error("Failed to write approval log:", logError);
  }

  const { data: updated } = await supabaseAdmin
    .from("decision_requests")
    .select("*")
    .eq("id", id)
    .single();

  return NextResponse.json(updated);
}
