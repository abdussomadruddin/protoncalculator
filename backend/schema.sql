-- Dedicated Car Loan MY project only. All data is private to the server API.
create table public.car_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 100),
  message text not null check (length(message) between 1 and 1500),
  link_url text check (link_url is null or link_url like 'https://%'),
  link_label text check (length(link_label) <= 50),
  active boolean not null default true,
  push_started_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index car_one_active_announcement on public.car_announcements ((active)) where active;
create table public.car_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint_hash text unique not null,
  token_hash text not null,
  subscription jsonb not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.car_push_deliveries (
  announcement_id uuid references public.car_announcements(id),
  subscription_id uuid references public.car_push_subscriptions(id),
  state text not null check (state in ('processing', 'sent', 'failed')),
  error_code text,
  updated_at timestamptz not null default now(),
  primary key (announcement_id, subscription_id)
);
alter table public.car_announcements enable row level security;
alter table public.car_push_subscriptions enable row level security;
alter table public.car_push_deliveries enable row level security;
revoke all on public.car_announcements, public.car_push_subscriptions, public.car_push_deliveries from anon, authenticated;
grant all on public.car_announcements, public.car_push_subscriptions, public.car_push_deliveries to service_role;

create function public.car_register_subscription(endpoint_hash text, token_hash text, push_subscription jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(730019);
  if exists (select 1 from public.car_push_subscriptions s where s.endpoint_hash = car_register_subscription.endpoint_hash and s.token_hash <> car_register_subscription.token_hash) then return false; end if;
  if (select count(*) from public.car_push_subscriptions where enabled) >= 10000 and not exists (select 1 from public.car_push_subscriptions s where s.endpoint_hash = car_register_subscription.endpoint_hash) then return false; end if;
  insert into public.car_push_subscriptions as s(endpoint_hash, token_hash, subscription)
  values (car_register_subscription.endpoint_hash, car_register_subscription.token_hash, push_subscription)
  on conflict on constraint car_push_subscriptions_endpoint_hash_key do update set subscription = excluded.subscription, enabled = true, updated_at = now();
  return true;
end;
$$;
create function public.car_publish_announcement(announcement_title text, announcement_message text, announcement_link text, announcement_label text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  perform pg_advisory_xact_lock(730020);
  update public.car_announcements set active = false where active;
  insert into public.car_announcements(title, message, link_url, link_label) values (announcement_title, announcement_message, announcement_link, announcement_label) returning to_jsonb(car_announcements.*) into result;
  return result;
end;
$$;
create function public.car_claim_deliveries(announcement_id uuid)
returns table (subscription_id uuid, subscription jsonb) language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(730021);
  update public.car_announcements set push_started_at = coalesce(push_started_at, now()) where id = car_claim_deliveries.announcement_id and active;
  return query with candidates as (
    select s.id from public.car_push_subscriptions s
    left join public.car_push_deliveries d on d.subscription_id = s.id and d.announcement_id = car_claim_deliveries.announcement_id
    where s.enabled and (d.subscription_id is null or (d.state = 'processing' and d.updated_at < now() - interval '5 minutes'))
      and s.created_at <= (select a.push_started_at from public.car_announcements a where a.id = car_claim_deliveries.announcement_id and a.active)
    order by s.created_at limit 20
  ), claimed as (
    insert into public.car_push_deliveries as d(announcement_id, subscription_id, state)
    select car_claim_deliveries.announcement_id, c.id, 'processing' from candidates c
    on conflict on constraint car_push_deliveries_pkey do update set state = 'processing', updated_at = now()
    returning d.subscription_id
  ) select s.id, s.subscription from public.car_push_subscriptions s join claimed c on c.subscription_id = s.id;
end;
$$;
create function public.car_delivery_summary(announcement_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select jsonb_build_object('sent', count(*) filter(where state = 'sent'), 'failed', count(*) filter(where state = 'failed'), 'processing', count(*) filter(where state = 'processing'))
  from public.car_push_deliveries d where d.announcement_id = car_delivery_summary.announcement_id;
$$;
revoke all on function public.car_register_subscription(text,text,jsonb), public.car_publish_announcement(text,text,text,text), public.car_claim_deliveries(uuid), public.car_delivery_summary(uuid) from public, anon, authenticated;
grant execute on function public.car_register_subscription(text,text,jsonb), public.car_publish_announcement(text,text,text,text), public.car_claim_deliveries(uuid), public.car_delivery_summary(uuid) to service_role;
