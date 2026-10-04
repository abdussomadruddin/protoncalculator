begin;
alter table public.car_agent_cases add column agent_deleted_at timestamptz;
alter table public.car_agent_appointments add column agent_deleted_at timestamptz;
create function public.car_agent_hide_guard() returns trigger language plpgsql set search_path='' as $$
begin
  if TG_OP='INSERT' then new.agent_deleted_at:=null;
  elsif old.agent_deleted_at is not null then
    if new is distinct from old then raise exception 'Hidden record is immutable'; end if;
  elsif new.agent_deleted_at is not null then
    new:=old; new.agent_deleted_at:=now();
  end if;
  return new;
end $$;
create trigger car_a_hide_guard before insert or update on public.car_agent_cases for each row execute function public.car_agent_hide_guard();
create trigger car_a_hide_guard before insert or update on public.car_agent_appointments for each row execute function public.car_agent_hide_guard();
revoke all on function public.car_agent_hide_guard() from public,anon,authenticated;
-- Retain owner SELECT for realtime UPDATE delivery; app reads filter hidden rows.
-- Prevent hidden rows from being edited or restored, including direct REST writes.
create or replace function public.car_agent_claim_reminders()
returns table(appointment_id uuid,revision integer,offset_hours integer,subscription_id uuid,subscription jsonb,type text,starts_at timestamptz)
language sql security invoker set search_path='' as $$
  with candidates as (
    select a.id,a.revision,o.hours,s.id subscription_id,s.subscription,a.type,a.starts_at
    from public.car_agent_appointments a
    cross join (values(72),(24),(4),(1)) o(hours)
    join public.car_agent_devices d on d.owner_id=a.owner_id
    join public.car_push_subscriptions s on s.id=d.subscription_id and s.enabled
    left join public.car_agent_reminders r on r.appointment_id=a.id and r.revision=a.revision and r.offset_hours=o.hours and r.subscription_id=s.id
    where a.agent_deleted_at is null and a.status='Scheduled' and a.starts_at>now()
      and now()>=a.starts_at-make_interval(hours=>o.hours)
      and now()<a.starts_at-make_interval(hours=>o.hours)+interval '10 minutes'
      and (r.appointment_id is null or (r.state='processing' and r.updated_at<now()-interval '2 minutes'))
    order by a.starts_at,o.hours limit 30
  ), claimed as (
    insert into public.car_agent_reminders as r(appointment_id,revision,offset_hours,subscription_id,state)
    select c.id,c.revision,c.hours,c.subscription_id,'processing' from candidates c
    on conflict on constraint car_agent_reminders_pkey do update set updated_at=now()
      where r.state='processing' and r.updated_at<now()-interval '2 minutes'
    returning r.*
  ) select c.id,c.revision,c.hours,c.subscription_id,c.subscription,c.type,c.starts_at
    from candidates c join claimed r on r.appointment_id=c.id and r.revision=c.revision and r.offset_hours=c.hours and r.subscription_id=c.subscription_id;
$$;
create or replace function public.car_claim_followup_push()
returns table(subscription_id uuid,subscription jsonb,case_count bigint)
language sql security definer set search_path='' as $$
  with eligible as (
    select d.subscription_id,s.subscription,count(c.id) as case_count
    from public.car_agent_devices d
    join public.car_push_subscriptions s on s.id=d.subscription_id and s.enabled
    join auth.users u on u.id=d.owner_id
    join public.car_agent_cases c on c.owner_id=d.owner_id
    where c.agent_deleted_at is null and c.status not in ('Rejected','Delivered','Cancelled')
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
commit;
