export interface Role {
  id: string;
  name: string;
  designation: string;
  department: string;
  reports_to: string | null;
  created_at: string;
  reports_to_role?: Role;
}

export interface DoARule {
  id: string;
  domain: string;
  action_type: string;
  min_threshold: number;
  max_threshold: number | null;
  approving_role_id: string;
  cosign_role_id: string | null;
  notes: string | null;
  created_at: string;
  approving_role?: Role;
  cosign_role?: Role;
}

export interface DecisionRequest {
  id: string;
  title: string;
  description: string | null;
  domain: string;
  action_type: string;
  value: number | null;
  submitted_by_role_id: string;
  status: "pending" | "approved" | "rejected";
  routed_to_role_id: string | null;
  cosign_role_id: string | null;
  agent_reasoning: string | null;
  created_at: string;
  submitted_by_role?: Role;
  routed_to_role?: Role;
  cosign_role?: Role;
}

export interface ApprovalLog {
  id: string;
  decision_id: string;
  actor_role_id: string;
  action: "routed" | "approved" | "rejected" | "escalated";
  notes: string | null;
  created_at: string;
  actor_role?: Role;
  decision?: DecisionRequest;
}

export interface AgentRoutingResult {
  approving_role_id: string;
  cosign_role_id: string | null;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}
