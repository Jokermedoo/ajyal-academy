-- Enable RLS and deny anon access (service_role bypasses RLS).
-- Run after schema.sql + migrations 002/003.

alter table if exists settings enable row level security;
alter table if exists subjects enable row level security;
alter table if exists activities enable row level security;
alter table if exists gallery enable row level security;
alter table if exists courses enable row level security;
alter table if exists users enable row level security;
alter table if exists navigation enable row level security;
alter table if exists site_sections enable row level security;
alter table if exists pages enable row level security;
alter table if exists media enable row level security;
alter table if exists enrollments enable row level security;
alter table if exists orders enable row level security;
alter table if exists payment_events enable row level security;
alter table if exists audit_log enable row level security;

-- No policies are created on purpose: only service_role (server) can access.
-- The public website reads data through the Express API, never directly from Supabase.
