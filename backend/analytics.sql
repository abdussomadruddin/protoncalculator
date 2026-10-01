-- Additive setup for existing projects; only the server service role may read/write.
begin;
create table if not exists public.car_device_activity (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  phone_app_seen_at timestamptz,
  permission text not null check (permission in ('granted', 'denied', 'default', 'unsupported'))
);
create table if not exists public.car_visits (
  token_hash text not null references public.car_device_activity(token_hash),
  session_hash text not null check (session_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  primary key (token_hash, session_hash)
);
create index if not exists car_visits_created_at on public.car_visits(created_at);
alter table public.car_device_activity enable row level security;
alter table public.car_visits enable row level security;
revoke all on public.car_device_activity, public.car_visits from public, anon, authenticated;
grant all on public.car_device_activity, public.car_visits to service_role;

create or replace function public.car_record_activity(device_hash text, visit_hash text, phone_app boolean, notification_permission text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(device_hash, 730022));
  insert into public.car_device_activity as d(token_hash, phone_app_seen_at, permission)
  values (device_hash, case when phone_app then now() end, notification_permission)
  on conflict (token_hash) do update set last_seen = now(),
    phone_app_seen_at = coalesce(d.phone_app_seen_at, excluded.phone_app_seen_at), permission = excluded.permission;
  if visit_hash is not null and not exists (
    select 1 from public.car_visits where token_hash = device_hash and created_at > now() - interval '30 minutes'
  ) then
    insert into public.car_visits(token_hash, session_hash) values (device_hash, visit_hash) on conflict do nothing;
  end if;
  return true;
end;
$$;

create or replace function public.car_admin_stats()
returns jsonb language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'startedAt', (select min(first_seen) from public.car_device_activity),
    'asOf', now(),
    'traffic', (select jsonb_agg(jsonb_build_object('days', days, 'visits', visits, 'devices', devices) order by days)
      from (select p.days, count(v.token_hash) as visits, count(distinct v.token_hash) as devices
        from (values (1), (7), (30)) as p(days)
        left join public.car_visits v on v.created_at >= now() - make_interval(days => p.days)
        group by p.days) as periods),
    'notifications', (select count(distinct s.token_hash) from public.car_push_subscriptions s
      left join public.car_device_activity d on d.token_hash = s.token_hash
      where s.enabled and (d.token_hash is null or d.permission = 'granted')),
    'phoneApps', (select count(*) from public.car_device_activity where phone_app_seen_at is not null),
    'phoneAppsWithNotifications', (select count(*) from public.car_device_activity d
      where d.phone_app_seen_at is not null and d.permission = 'granted'
      and exists (select 1 from public.car_push_subscriptions s where s.token_hash = d.token_hash and s.enabled))
  );
$$;
revoke all on function public.car_record_activity(text,text,boolean,text), public.car_admin_stats() from public, anon, authenticated;
grant execute on function public.car_record_activity(text,text,boolean,text), public.car_admin_stats() to service_role;
commit;
