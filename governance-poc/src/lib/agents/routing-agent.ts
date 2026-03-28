import OpenAI from "openai";
import type { Role, DoARule, AgentRoutingResult } from "@/types/decisions";

const client = new OpenAI({
  baseURL: "https://api.tokenfactory.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

const SYSTEM_PROMPT = `You are a governance routing agent for a corporate organization.
Given a decision request and a Delegation of Authority (DoA) matrix,
your job is to identify which role should approve this request.

Rules:
- Match domain and action_type first
- Then apply threshold logic to the value
- If no exact match exists, find the closest applicable rule and explain why
- If ambiguous, route to the higher authority and explain
- Return ONLY valid JSON matching this exact schema:
  {
    "approving_role_id": string,
    "cosign_role_id": string | null,
    "reasoning": string,
    "confidence": "high" | "medium" | "low"
  }

Do not include any other text or markdown formatting. Only output the JSON object.`;

interface DecisionInput {
  title: string;
  description: string | null;
  domain: string;
  action_type: string;
  value: number | null;
  submitted_by_role_id: string;
}

export async function routeDecision(
  decision: DecisionInput,
  doaRules: DoARule[],
  roles: Role[]
): Promise<AgentRoutingResult> {
  const rolesContext = roles
    .map(
      (r) =>
        `- ${r.name} (ID: ${r.id}), Designation: ${r.designation}, Department: ${r.department}, Reports To: ${r.reports_to || "N/A"}`
    )
    .join("\n");

  const doaContext = doaRules
    .map((rule) => {
      const approver = roles.find((r) => r.id === rule.approving_role_id);
      const cosigner = rule.cosign_role_id
        ? roles.find((r) => r.id === rule.cosign_role_id)
        : null;
      return `- Domain: ${rule.domain}, Action: ${rule.action_type}, Threshold: $${rule.min_threshold} - ${rule.max_threshold !== null ? `$${rule.max_threshold}` : "No limit"}, Approver: ${approver?.name || "Unknown"} (ID: ${rule.approving_role_id}), Co-sign: ${cosigner ? `${cosigner.name} (ID: ${rule.cosign_role_id})` : "None"}`;
    })
    .join("\n");

  const submitter = roles.find((r) => r.id === decision.submitted_by_role_id);

  const userMessage = `Please route the following decision request:

Title: ${decision.title}
Description: ${decision.description || "N/A"}
Domain: ${decision.domain}
Action Type: ${decision.action_type}
Value: ${decision.value !== null ? `$${decision.value.toLocaleString()}` : "N/A"}
Submitted By: ${submitter?.name || "Unknown"} (${submitter?.designation || "Unknown"})

Available Roles:
${rolesContext}

Delegation of Authority Matrix:
${doaContext}

Based on the DoA matrix, determine which role should approve this request and whether a co-sign is required.`;

  const response = await client.chat.completions.create({
    model: "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No text response from model");
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in model response");
  }

  const result: AgentRoutingResult = JSON.parse(jsonMatch[0]);

  if (!result.approving_role_id || !result.reasoning || !result.confidence) {
    throw new Error("Invalid agent response structure");
  }

  return result;
}
