# Governance POC — Build Plan

## What We're Building

A working prototype of a **Corporate Governance Decision Routing System** with an AI agent at its core.

### Must-Have: Agent 2 — Decision Routing Agent
A decision routing system where someone submits a request (e.g. "approve $300K contract"), the AI agent reads the Delegation of Authority (DoA) matrix, identifies the correct approver, and routes it — with full audit trail.

### Stretch Goal: Agent 4 — Meeting & Committee Agent
Paste raw meeting notes, agent extracts action items and produces draft minutes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Roles   │  │   DoA    │  │ Submit   │  │   Approvals   │  │
│  │  Page    │  │  Matrix  │  │Decision  │  │    Inbox      │  │
│  │          │  │  Page    │  │  Page    │  │  + Audit Log  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
└───────┼─────────────┼─────────────┼────────────────┼───────────┘
        │             │             │                │
        └─────────────┴──────┬──────┘                │
                             │ Next.js API Routes    │
┌────────────────────────────▼──────────────────────▼───────────┐
│                      NEXT.JS BACKEND                           │
│                                                                │
│  /api/roles         /api/doa          /api/decisions           │
│  GET, POST          GET, POST         GET, POST                │
│                                                                │
│                  ┌─────────────────────┐                       │
│                  │   ROUTING AGENT     │                       │
│                  │                     │                       │
│                  │  1. Read request    │                       │
│                  │  2. Fetch DoA rules │                       │
│                  │  3. Claude decides  │                       │
│                  │     → who approves  │                       │
│                  │     → why           │                       │
│                  │     → any co-sign   │                       │
│                  │  4. Write routing   │                       │
│                  └──────────┬──────────┘                       │
│                             │ Claude API                       │
└─────────────────────────────┼──────────────────────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │         CLAUDE claude-sonnet-4-6          │
              │   (Tool use: query_doa_matrix)  │
              └───────────────┬────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│                        SUPABASE                                 │
│                                                                 │
│   roles          doa_matrix        decision_requests            │
│   ──────         ──────────        ─────────────────            │
│   id             id                id                           │
│   name           domain            title                        │
│   designation    action_type       domain                       │
│   department     min_threshold     action_type                  │
│   reports_to     max_threshold     value                        │
│                  approving_role    description                   │
│                  cosign_role       status                        │
│                                   routed_to_role                │
│                                   agent_reasoning               │
│                                                                 │
│                              approval_logs                      │
│                              ─────────────                      │
│                              decision_id                        │
│                              actor_role                         │
│                              action (approved/rejected)         │
│                              notes                              │
│                              timestamp                          │
└────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Full-stack in one repo, API routes + UI |
| Database + Hosting | **Supabase** | Instant Postgres + easy setup |
| AI Agent | **Claude API** (`claude-sonnet-4-6`) | Best reasoning for routing logic |
| UI Components | **shadcn/ui + Tailwind** | Fast, professional UI out of the box |
| Language | **TypeScript** | Type safety across frontend and backend |

---

## Database Schema

Run this in the **Supabase SQL Editor**:

```sql
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null,
  department text not null,
  reports_to uuid references roles(id),
  created_at timestamptz default now()
);

create table doa_matrix (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  action_type text not null,
  min_threshold numeric default 0,
  max_threshold numeric,           -- null = no upper limit
  approving_role_id uuid references roles(id),
  cosign_role_id uuid references roles(id),
  notes text,
  created_at timestamptz default now()
);

create table decision_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  domain text not null,
  action_type text not null,
  value numeric,
  submitted_by_role_id uuid references roles(id),
  status text default 'pending',   -- pending, approved, rejected
  routed_to_role_id uuid references roles(id),
  cosign_role_id uuid references roles(id),
  agent_reasoning text,
  created_at timestamptz default now()
);

create table approval_logs (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references decision_requests(id),
  actor_role_id uuid references roles(id),
  action text not null,            -- routed, approved, rejected, escalated
  notes text,
  created_at timestamptz default now()
);
```

---

## PRD — Project Requirements Document

### Scope
Single web app. No login/auth for POC — role-based selection via dropdown is sufficient. Must be demo-ready in 2.5 hours.

---

### Page 1 — Roles (`/roles`)
- Table listing all roles (Name, Designation, Department, Reports To)
- "Add Role" form: Name, Designation, Department, Reports To (dropdown of existing roles)
- No edit/delete needed for POC

### Page 2 — DoA Matrix (`/doa`)
- Table listing all DoA rules (Domain, Action, Thresholds, Approving Role, Co-sign)
- "Add Rule" form: Domain, Action Type, Min Threshold, Max Threshold, Approving Role (dropdown), Co-sign Role (optional), Notes
- Pre-seeded with 8 example rules on setup

### Page 3 — Submit Decision (`/submit`)
- Form fields: Title, Description, Domain (dropdown), Action Type (text), Value ($), Submitted By (role dropdown)
- On submit → calls `/api/decisions` → agent runs → routing result shown immediately on page
- Result card displays: "Routed to: [Role]", "Co-sign required: [Role or None]", "Agent Reasoning: [explanation]"

### Page 4 — Approvals Inbox (`/approvals`)
- Table of all decisions: Title, Domain, Value, Submitted By, Routed To, Status, Submitted At
- Click any row → opens decision detail page
- Decision detail: full description, agent reasoning, Approve / Reject buttons + optional notes field
- Audit log table at the bottom showing all actions across all decisions

### Page 5 (Stretch) — Meetings (`/meetings`)
- Large textarea: paste raw meeting notes
- "Extract Action Items" button
- Agent returns: structured action items (owner role, due date, description) + summary paragraph
- Display as formatted cards

---

## The Agent Logic

### Flow for `POST /api/decisions`

```
1. Receive: { title, description, domain, action_type, value, submitted_by_role_id }
2. Fetch all DoA rules for this domain from DB
3. Fetch all roles from DB
4. Call Claude with:
     - The decision details
     - The full DoA matrix as context
     - All role names
     - System prompt (see below)
5. Claude returns JSON:
     {
       "approving_role_id": "...",
       "cosign_role_id": "..." | null,
       "reasoning": "...",
       "confidence": "high" | "medium" | "low"
     }
6. Save decision record with routing result
7. Write to approval_logs: action = "routed"
8. Return full decision object to frontend
```

### Claude System Prompt

```
You are a governance routing agent for a corporate organization.
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
```

---

## Seed Data

### Roles to Create
| Name | Designation | Department | Reports To |
|---|---|---|---|
| Alice Chen | CEO | Leadership | — |
| Bob Kumar | CFO | Finance | CEO |
| Carol Osei | COO | Operations | CEO |
| David Park | Regional MD | Operations | COO |
| Emma Torres | Regional Finance Manager | Finance | CFO |

### DoA Rules to Create
| Domain | Action | Min | Max | Approver | Co-sign |
|---|---|---|---|---|---|
| Finance | Approve Expense | 0 | 10,000 | Regional Finance Manager | — |
| Finance | Approve Expense | 10,000 | 100,000 | Regional MD | — |
| Finance | Approve Expense | 100,000 | 500,000 | CFO | — |
| Finance | Approve Expense | 500,000 | ∞ | CEO | CFO |
| Finance | Sign Contract | 0 | 200,000 | Regional MD | Regional Finance Manager |
| Finance | Sign Contract | 200,000 | 1,000,000 | COO | CFO |
| Finance | Sign Contract | 1,000,000 | ∞ | CEO | — |
| HR | Hire | 0 | ∞ | Regional MD | — |

---

## Team Split — Parallel Tracks

> **Total time: 2.5 hours**

### All (0:00 → 0:15) — Project Setup

```bash
npx create-next-app@latest governance-poc --typescript --tailwind --app
cd governance-poc
npx shadcn@latest init
npm install @supabase/supabase-js @anthropic-ai/sdk
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
ANTHROPIC_API_KEY=your_anthropic_key
```

Run the SQL schema in Supabase. Insert seed data.

---

### Track A — Backend (Person 1) `0:15 → 1:15`

Files to build:
- `lib/supabase.ts` — Supabase client setup
- `lib/agent.ts` — Claude routing agent function
- `app/api/roles/route.ts` — GET (list) + POST (create)
- `app/api/doa/route.ts` — GET (list) + POST (create)
- `app/api/decisions/route.ts` — GET (list) + POST (submit + trigger agent)
- `app/api/decisions/[id]/approve/route.ts` — POST (approve or reject)

From 1:15 onward: help resolve integration issues across tracks.

---

### Track B — Roles + DoA Pages (Person 2) `0:15 → 1:30`

Files to build:
- `components/DataTable.tsx` — reusable shadcn table component
- `app/roles/page.tsx` — roles table + add role form
- `app/doa/page.tsx` — DoA matrix table + add rule form
- `components/Navbar.tsx` — navigation links to all pages

From 1:30 onward: polish layout, add loading states, fix spacing.

---

### Track C — Submit + Approvals Pages (Person 3) `0:15 → 1:30`

Files to build:
- `app/submit/page.tsx` — decision form + routing result card
- `app/approvals/page.tsx` — all decisions table with status badges
- `app/approvals/[id]/page.tsx` — decision detail, approve/reject, audit log

From 1:30 onward: wire up approve/reject to API, test full flow.

---

### Track D — Agent + Stretch (Person 4) `0:15 → 1:30`

Files to build:
- `lib/agent.ts` — Claude API call, prompt, JSON parsing, error handling
- Test in isolation with hardcoded inputs before wiring up

**If ahead of schedule:**
- `app/meetings/page.tsx` — paste notes textarea + results display
- `app/api/meetings/route.ts` — agent call to extract action items

From 1:30 onward: wire agent into POST /api/decisions, handle edge cases.

---

### All (1:30 → 2:00) — Integration & Testing

- Person 1 + Person 4: test full decision submission → routing → approval flow end to end
- Person 2 + Person 3: fix any UI/UX issues, ensure all pages load correctly

### All (2:00 → 2:30) — Polish + Demo Prep

- Fix any broken flows
- Ensure seed data is in
- Rehearse demo script (see below)

---

## Integration Checklist

Before declaring done, verify:

- [ ] Can add a new role at `/roles`
- [ ] Can add a new DoA rule at `/doa`
- [ ] Submitting a decision at `/submit` triggers the agent and shows routing result
- [ ] Routed decision appears in `/approvals`
- [ ] Can approve or reject a decision from the detail page
- [ ] Audit log shows the full chain: submitted → routed → approved/rejected
- [ ] Agent correctly routes a $340K Finance/Approve Expense to CFO (not Regional MD)
- [ ] Agent correctly routes a $50K Finance/Approve Expense to Regional MD

---

## Demo Script (3 minutes)

1. **`/roles`** — "Here's our org structure: CEO, CFO, COO, Regional MD, Regional Finance Manager"
2. **`/doa`** — "Here's the Delegation of Authority matrix — who can approve what up to which amount"
3. **`/submit`** — Fill in: "Vendor payment approval", Finance, Approve Expense, $340,000, submitted by Regional MD
4. Hit Submit — agent routes it to **CFO**, explains it exceeds the Regional MD threshold of $100K
5. **`/approvals`** — CFO approves it, adds a note
6. Audit log — shows full chain: submitted by Regional MD → routed to CFO by agent → approved by CFO

**The point:** No one had to know the rules. The agent read the DoA and made the correct call instantly. Every step is on record.

---

## What Makes This Valuable

- The agent handles **ambiguous cases** — not just exact matches. If a rule doesn't exist, it routes to the nearest higher authority and explains why.
- Every decision has an **immutable audit trail** — who submitted, who the agent routed to, who approved, when.
- The DoA matrix is **live** — change a rule and the next decision routes differently, immediately.
- The whole thing is **pluggable** — swap the seed data for any company's real org and rules, and it works for them out of the box.
