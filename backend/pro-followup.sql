begin;
create table if not exists public.car_agent_followup_push (
  day date not null,
  subscription_id uuid not null references public.car_push_subscriptions(id) on delete cascade,
  state text not null default 'processing' check(state in ('processing','sent','failed')),
  created_at timestamptz not null default now(),
  primary key(day,subscription_id)
);
alter table public.car_agent_followup_push enable row level security;
revoke all on public.car_agent_followup_push from public,anon,authenticated;
grant select,insert,update on public.car_agent_followup_push to service_role;
create or replace function public.car_claim_followup_push()
returns table(subscription_id uuid,subscription jsonb,case_count bigint)
language sql security definer set search_path='' as $$
  with eligible as (
    select d.subscription_id,s.subscription,count(c.id) as case_count
    from public.car_agent_devices d
    join public.car_push_subscriptions s on s.id=d.subscription_id and s.enabled
    join auth.users u on u.id=d.owner_id
    join public.car_agent_cases c on c.owner_id=d.owner_id
    where c.status not in ('Rejected','Delivered','Cancelled')
      and c.activity_at<=now()-interval '72 hours'
      and coalesce(u.raw_app_meta_data->>'pro_disabled','false')<>'true'
      and u.email_confirmed_at is not null
      and (now() at time zone 'Asia/Kuala_Lumpur')::time >= time '08:00'
      and (now() at time zone 'Asia/Kuala_Lumpur')::time < time '08:10'
      and now()<timestamptz '2027-01-01 00:00:00+08'
      and not exists(select 1 from public.car_agent_followup_push p
        where p.subscription_id=d.subscription_id
        and p.day=(now() at time zone 'Asia/Kuala_Lumpur')::date)
    group by d.subscription_id,s.subscription
    order by d.subscription_id limit 30
  ), claims as (
    insert into public.car_agent_followup_push(day,subscription_id)
    select (now() at time zone 'Asia/Kuala_Lumpur')::date,e.subscription_id from eligible e
    on conflict do nothing returning subscription_id
  )
  select e.subscription_id,e.subscription,e.case_count from eligible e
  join claims c on c.subscription_id=e.subscription_id;
$$;
revoke all on function public.car_claim_followup_push() from public,anon,authenticated;
grant execute on function public.car_claim_followup_push() to service_role;
commit;
