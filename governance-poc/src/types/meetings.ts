export interface Meeting {
  id: string;
  title: string;
  committee_name: string | null;
  raw_notes: string | null;
  transcript: string | null;
  summary: string | null;
  status: "processing" | "done";
  created_at: string;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  description: string;
  assigned_role_id: string | null;
  assigned_role_name: string | null;
  due_date: string | null;
  priority: "high" | "medium" | "low" | null;
  status: "open" | "done";
  created_at: string;
}

export interface Resolution {
  id: string;
  meeting_id: string;
  description: string;
  passed: boolean;
  created_at: string;
}

export interface MeetingInsights {
  summary: string;
  action_items: {
    description: string;
    assigned_role: string | null;
    due_date: string | null;
    priority: "high" | "medium" | "low";
  }[];
  resolutions: {
    description: string;
    passed: boolean;
  }[];
  key_decisions: string[];
}
