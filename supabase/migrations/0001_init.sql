-- Bundla: multi-tenant foundation
-- Run this in the Supabase project "Bundla": SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent where practical).

create extension if not exists pgcrypto;

-- ── Organizations (one per customer, with a shared monthly quota) ──────────
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  monthly_quota int  not null default 500,
  created_at    timestamptz not null default now()
);

-- ── Profiles (1:1 with auth.users) ─────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  org_id            uuid references public.organizations(id) on delete set null,
  role              text not null default 'member' check (role in ('admin','member')),
  is_platform_admin boolean not null default false,
  email             text,
  full_name         text,
  created_at        timestamptz not null default now()
);

-- ── Invitations (invite-gated onboarding, any email domain) ────────────────
create table if not exists public.invitations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  email      text not null,
  role       text not null default 'member' check (role in ('admin','member')),
  token      text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references public.profiles(id) on delete set null,
  status     text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);
create index if not exists invitations_email_idx on public.invitations (lower(email));
create index if not exists invitations_org_idx   on public.invitations (org_id);

-- ── Usage (fast counter for enforcement + event log for analytics) ─────────
create table if not exists public.usage_counters (
  org_id uuid not null references public.organizations(id) on delete cascade,
  period text not null,                  -- 'YYYY-MM'
  used   int  not null default 0,
  primary key (org_id, period)
);

create table if not exists public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  credits    int  not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_org_idx on public.usage_events (org_id, created_at);

-- ── Auto-create a bare profile when an auth user is created ────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Helper functions (used by RLS policies) ────────────────────────────────
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_org_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.invitations   enable row level security;
alter table public.usage_counters enable row level security;
alter table public.usage_events  enable row level security;

drop policy if exists org_select    on public.organizations;
drop policy if exists org_admin_all on public.organizations;
create policy org_select on public.organizations for select
  using (id = public.current_org_id() or public.is_platform_admin());
create policy org_admin_all on public.organizations for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists profiles_select       on public.profiles;
drop policy if exists profiles_update_self  on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or org_id = public.current_org_id() or public.is_platform_admin());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists invitations_select on public.invitations;
drop policy if exists invitations_write  on public.invitations;
create policy invitations_select on public.invitations for select
  using (org_id = public.current_org_id() or public.is_platform_admin());
create policy invitations_write on public.invitations for all
  using ((org_id = public.current_org_id() and public.is_org_admin()) or public.is_platform_admin())
  with check ((org_id = public.current_org_id() and public.is_org_admin()) or public.is_platform_admin());

drop policy if exists usage_counters_select on public.usage_counters;
create policy usage_counters_select on public.usage_counters for select
  using (org_id = public.current_org_id() or public.is_platform_admin());

drop policy if exists usage_events_select on public.usage_events;
create policy usage_events_select on public.usage_events for select
  using (org_id = public.current_org_id() or public.is_platform_admin());

-- ── Atomic credit consumption (call with the USER's session, not service role)
-- Derives the org from auth.uid() so a user can only spend their own org's quota.
create or replace function public.consume_credit()
returns table (allowed boolean, used int, quota int)
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid := public.current_org_id();
  v_period text := to_char(now(), 'YYYY-MM');
  v_quota  int;
  v_used   int;
begin
  if v_org is null then
    return query select false, 0, 0; return;
  end if;

  select o.monthly_quota into v_quota from public.organizations o where o.id = v_org;

  insert into public.usage_counters (org_id, period, used)
  values (v_org, v_period, 0)
  on conflict (org_id, period) do nothing;

  select uc.used into v_used from public.usage_counters uc
   where uc.org_id = v_org and uc.period = v_period for update;

  if v_used >= v_quota then
    return query select false, v_used, v_quota; return;
  end if;

  update public.usage_counters uc set used = uc.used + 1
   where uc.org_id = v_org and uc.period = v_period;

  insert into public.usage_events (org_id, user_id) values (v_org, auth.uid());

  return query select true, v_used + 1, v_quota;
end;
$$;

-- Refund a credit if the downstream call failed after consuming.
create or replace function public.refund_credit()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid := public.current_org_id();
  v_period text := to_char(now(), 'YYYY-MM');
begin
  if v_org is null then return; end if;
  update public.usage_counters set used = greatest(0, used - 1)
   where org_id = v_org and period = v_period;
end;
$$;

revoke all on function public.consume_credit() from anon;
revoke all on function public.refund_credit() from anon;
