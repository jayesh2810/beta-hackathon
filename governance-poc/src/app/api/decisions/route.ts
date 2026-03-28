import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { routeDecision } from "@/lib/agents/routing-agent";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("decision_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, domain, action_type, value, submitted_by_role_id } = body;

  if (!title || !domain || !action_type || !submitted_by_role_id) {
    return NextResponse.json(
      { error: "title, domain, action_type, and submitted_by_role_id are required" },
      { status: 400 }
    );
  }

  const [rolesResult, doaResult] = await Promise.all([
    supabaseAdmin.from("roles").select("*"),
    supabaseAdmin.from("doa_matrix").select("*"),
  ]);

  if (rolesResult.error || doaResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch roles or DoA matrix" },
      { status: 500 }
    );
  }

  let agentResult;
  try {
    agentResult = await routeDecision(
      { title, description, domain, action_type, value, submitted_by_role_id },
      doaResult.data,
      rolesResult.data
    );
  } catch (err) {
    console.error("Agent routing error:", err);
    return NextResponse.json(
      { error: "AI agent failed to route the decision" },
      { status: 500 }
    );
  }

  const { data: decision, error: insertError } = await supabaseAdmin
    .from("decision_requests")
    .insert({
      title,
      description: description || null,
      domain,
      action_type,
      value: value || null,
      submitted_by_role_id,
      status: "pending",
      routed_to_role_id: agentResult.approving_role_id,
      cosign_role_id: agentResult.cosign_role_id,
      agent_reasoning: agentResult.reasoning,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabaseAdmin.from("approval_logs").insert({
    decision_id: decision.id,
    actor_role_id: submitted_by_role_id,
    action: "routed",
    notes: `Agent routed with ${agentResult.confidence} confidence: ${agentResult.reasoning}`,
  });

  return NextResponse.json(decision, { status: 201 });
}
