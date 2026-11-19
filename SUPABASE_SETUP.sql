-- V30: run once in Supabase SQL Editor, as project owner.
-- This is a demo event inbox, not a payment, delivery or reservation backend.
begin;
create table if not exists public.skycat_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.skycat_admins enable row level security;
revoke all on public.skycat_admins from public, anon, authenticated;

create or replace function public.skycat_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.skycat_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.skycat_is_admin() from public, anon, authenticated;
grant execute on function public.skycat_is_admin() to authenticated;

create table if not exists public.skycat_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('cafe','goods','reservation','inquiry')),
  event_ref text not null check (char_length(event_ref) between 1 and 150),
  reference text not null check (char_length(reference) between 1 and 100),
  details text not null check (char_length(details) between 1 and 12000),
  total_krw text not null check (char_length(total_krw) between 1 and 50),
  language text not null check (language in ('ko','en','ja')),
  status text not null default 'received' check (status in ('received','processing','completed','cancelled')),
  created_at timestamptz not null default now(),
  unique(kind,event_ref)
);
create index if not exists skycat_events_created_idx on public.skycat_events(created_at desc);
alter table public.skycat_events enable row level security;
revoke all on public.skycat_events from public, anon, authenticated;
grant select on public.skycat_events to authenticated;
grant update(status) on public.skycat_events to authenticated;
drop policy if exists skycat_admin_select on public.skycat_events;
create policy skycat_admin_select on public.skycat_events for select to authenticated
using ((select public.skycat_is_admin()));
drop policy if exists skycat_admin_update on public.skycat_events;
create policy skycat_admin_update on public.skycat_events for update to authenticated
using ((select public.skycat_is_admin())) with check ((select public.skycat_is_admin()));

-- Public intake is strictly write-only: no access to existing records, user IDs,
-- timestamps, statuses, or administrator data. Inputs are demo data only.
create or replace function public.skycat_submit_event(p_kind text,p_event_ref text,p_reference text,p_details text,p_total_krw text,p_language text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_kind is null or p_kind not in ('cafe','goods','reservation','inquiry')
     or p_event_ref is null or char_length(p_event_ref) not between 1 and 150
     or p_reference is null or char_length(p_reference) not between 1 and 100
     or p_details is null or char_length(p_details) not between 1 and 12000
     or p_total_krw is null or char_length(p_total_krw) not between 1 and 50
     or p_language is null or p_language not in ('ko','en','ja')
     or (p_kind = 'inquiry' and char_length(p_details) > 500)
  then raise exception 'Invalid demo event'; end if;
  -- Limit global intake volume for the demo; not a substitute for CAPTCHA/per-IP limits.
  perform pg_catalog.pg_advisory_xact_lock(302906);
  if (select count(*) from public.skycat_events where created_at > now() - interval '1 minute') >= 60
  then raise exception 'Demo intake temporarily limited'; end if;
  insert into public.skycat_events(kind,event_ref,reference,details,total_krw,language)
  values(p_kind,p_event_ref,p_reference,p_details,p_total_krw,p_language)
  on conflict(kind,event_ref) do nothing;
end;
$$;
revoke all on function public.skycat_submit_event(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.skycat_submit_event(text,text,text,text,text,text) to anon, authenticated;
commit;

-- After creating the administrator in Authentication > Users, copy that user's UID.
-- Run the following separately with the actual UID; do not put passwords in SQL.
-- insert into public.skycat_admins(user_id) values ('YOUR-ADMIN-USER-UUID') on conflict do nothing;
