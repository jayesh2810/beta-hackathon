-- ============================================
-- Governance POC — Database Schema + Seed Data
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create tables

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null,
  department text not null,
  reports_to uuid references roles(id),
  created_at timestamptz default now()
);

create table if not exists doa_matrix (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  action_type text not null,
  min_threshold numeric default 0,
  max_threshold numeric,
  approving_role_id uuid references roles(id),
  cosign_role_id uuid references roles(id),
  notes text,
  created_at timestamptz default now()
);

create table if not exists decision_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  domain text not null,
  action_type text not null,
  value numeric,
  submitted_by_role_id uuid references roles(id),
  status text default 'pending',
  routed_to_role_id uuid references roles(id),
  cosign_role_id uuid references roles(id),
  agent_reasoning text,
  created_at timestamptz default now()
);

create table if not exists approval_logs (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references decision_requests(id),
  actor_role_id uuid references roles(id),
  action text not null,
  notes text,
  created_at timestamptz default now()
);

-- Meetings tables (Agent 4 — Meeting & Committee Agent)

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  committee_name text,
  raw_notes text,
  transcript text,
  summary text,
  status text default 'processing',
  created_at timestamptz default now()
);

create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id),
  description text not null,
  assigned_role_id uuid,
  assigned_role_name text,
  due_date date,
  priority text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists resolutions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id),
  description text not null,
  passed boolean default true,
  created_at timestamptz default now()
);

-- 2. Seed Roles (insert in order so reports_to references work)

-- CEO first (no reports_to)
insert into roles (id, name, designation, department, reports_to) values
  ('00000000-0000-0000-0000-000000000001', 'Alice Chen', 'CEO', 'Leadership', null);

-- CFO and COO report to CEO
insert into roles (id, name, designation, department, reports_to) values
  ('00000000-0000-0000-0000-000000000002', 'Bob Kumar', 'CFO', 'Finance', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'Carol Osei', 'COO', 'Operations', '00000000-0000-0000-0000-000000000001');

-- Regional MD reports to COO
insert into roles (id, name, designation, department, reports_to) values
  ('00000000-0000-0000-0000-000000000004', 'David Park', 'Regional MD', 'Operations', '00000000-0000-0000-0000-000000000003');

-- Regional Finance Manager reports to CFO
insert into roles (id, name, designation, department, reports_to) values
  ('00000000-0000-0000-0000-000000000005', 'Emma Torres', 'Regional Finance Manager', 'Finance', '00000000-0000-0000-0000-000000000002');

-- 3. Seed DoA Matrix

insert into doa_matrix (domain, action_type, min_threshold, max_threshold, approving_role_id, cosign_role_id, notes) values
  ('Finance', 'Approve Expense', 0, 10000, '00000000-0000-0000-0000-000000000005', null, 'Up to $10K — Regional Finance Manager'),
  ('Finance', 'Approve Expense', 10000, 100000, '00000000-0000-0000-0000-000000000004', null, '$10K–$100K — Regional MD'),
  ('Finance', 'Approve Expense', 100000, 500000, '00000000-0000-0000-0000-000000000002', null, '$100K–$500K — CFO'),
  ('Finance', 'Approve Expense', 500000, null, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '$500K+ — CEO with CFO co-sign'),
  ('Finance', 'Sign Contract', 0, 200000, '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Up to $200K — Regional MD with Regional Finance Manager co-sign'),
  ('Finance', 'Sign Contract', 200000, 1000000, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '$200K–$1M — COO with CFO co-sign'),
  ('Finance', 'Sign Contract', 1000000, null, '00000000-0000-0000-0000-000000000001', null, '$1M+ — CEO'),
  ('HR', 'Hire', 0, null, '00000000-0000-0000-0000-000000000004', null, 'All hiring — Regional MD');
