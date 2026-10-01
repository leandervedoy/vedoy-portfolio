-- Schema applied to the existing Vedoy Supabase project on 2026-10-01.
-- Existing projects and vedoy_profiles tables are prerequisites.
begin;
revoke update on public.vedoy_profiles from anon, authenticated;
grant update (display_name) on public.vedoy_profiles to authenticated;

create or replace function public.is_vedoy_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vedoy_profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_vedoy_admin() from public;
grant execute on function public.is_vedoy_admin() to authenticated;

drop policy if exists admins_read_all_projects on public.projects;
create policy admins_read_all_projects on public.projects for select to authenticated using ((select public.is_vedoy_admin()));
drop policy if exists admins_insert_projects on public.projects;
create policy admins_insert_projects on public.projects for insert to authenticated with check ((select public.is_vedoy_admin()));
drop policy if exists admins_update_projects on public.projects;
create policy admins_update_projects on public.projects for update to authenticated using ((select public.is_vedoy_admin())) with check ((select public.is_vedoy_admin()));
drop policy if exists admins_delete_projects on public.projects;
create policy admins_delete_projects on public.projects for delete to authenticated using ((select public.is_vedoy_admin()));
alter table public.projects add column if not exists external_url text check (external_url is null or external_url ~ '^https://[^[:space:]]+$');

create table if not exists public.vedoy_economy_entries (
 id bigint generated always as identity primary key,
 kind text not null check (kind in ('income','expense')),
 amount_minor bigint not null check (amount_minor >= 0),
 currency text not null default 'NOK' check (currency ~ '^[A-Z]{3}$'),
 label text not null check (char_length(label) between 2 and 180),
 source text not null default 'manual',
 occurred_on date not null default current_date,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.vedoy_economy_entries enable row level security;
drop policy if exists vedoy_admin_read_economy on public.vedoy_economy_entries;
create policy vedoy_admin_read_economy on public.vedoy_economy_entries for select to authenticated using ((select public.is_vedoy_admin()));
drop policy if exists vedoy_admin_insert_economy on public.vedoy_economy_entries;
create policy vedoy_admin_insert_economy on public.vedoy_economy_entries for insert to authenticated with check ((select public.is_vedoy_admin()) and created_by = (select auth.uid()));
drop policy if exists vedoy_admin_update_economy on public.vedoy_economy_entries;
create policy vedoy_admin_update_economy on public.vedoy_economy_entries for update to authenticated using ((select public.is_vedoy_admin())) with check ((select public.is_vedoy_admin()));
drop policy if exists vedoy_admin_delete_economy on public.vedoy_economy_entries;
create policy vedoy_admin_delete_economy on public.vedoy_economy_entries for delete to authenticated using ((select public.is_vedoy_admin()));

create table if not exists public.vedoy_economy_snapshots (
 id bigint generated always as identity primary key,
 provider text not null,
 account_name text not null,
 period_start date not null,
 period_end date not null,
 currency text not null check (currency ~ '^[A-Z]{3}$'),
 total_sales_minor bigint not null,
 orders_count integer not null check (orders_count >= 0),
 fetched_at timestamptz not null default now(),
 import_method text not null default 'connector_snapshot',
 unique(provider,account_name,period_start,period_end)
);
alter table public.vedoy_economy_snapshots enable row level security;
drop policy if exists admins_read_economy_snapshots on public.vedoy_economy_snapshots;
create policy admins_read_economy_snapshots on public.vedoy_economy_snapshots for select to authenticated using ((select public.is_vedoy_admin()));
commit;
