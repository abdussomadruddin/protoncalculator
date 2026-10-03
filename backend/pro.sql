begin;
create table public.car_agent_cases (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(length(name) between 1 and 100),
  phone text not null check(phone ~ '^\+601[0-9]{8,9}$'),
  brand text not null, model text not null, variant text not null,
  color text not null default '',
  status text not null check(status in ('Document collected','More document needed','Submission','Rejected','LOU received','Pending sign agreement','Pending allocation','Registered','Prepare delivery','Delivered','Cancelled')),
  remark text not null default '' check(length(remark) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activity_at timestamptz not null default now(),
  unique(id,owner_id)
);
create index car_agent_cases_owner on public.car_agent_cases(owner_id,activity_at);
create table public.car_agent_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  owner_id uuid not null,
  status text not null, remark text not null,
  created_at timestamptz not null default now(),
  foreign key(case_id,owner_id) references public.car_agent_cases(id,owner_id) on delete cascade
);
create index car_agent_events_owner on public.car_agent_case_events(owner_id,case_id,created_at);
create table public.car_agent_appointments (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid,
  name text not null check(length(name) between 1 and 100),
  phone text not null check(phone ~ '^\+601[0-9]{8,9}$'),
  type text not null check(type in ('Test Drive','Delivery')),
  starts_at timestamptz not null,
  location text not null default '' check(length(location)<=300),
  notes text not null default '' check(length(notes)<=2000),
  status text not null default 'Scheduled' check(status in ('Scheduled','Completed','Cancelled')),
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(case_id,owner_id) references public.car_agent_cases(id,owner_id)
);
create index car_agent_appointments_owner on public.car_agent_appointments(owner_id,starts_at);
create table public.car_agent_devices (
  subscription_id uuid primary key references public.car_push_subscriptions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade
);
create index car_agent_devices_owner on public.car_agent_devices(owner_id);
create table public.car_agent_reminders (
  appointment_id uuid references public.car_agent_appointments(id) on delete cascade,
  revision integer not null,
  offset_hours integer not null,
  subscription_id uuid references public.car_push_subscriptions(id) on delete cascade,
  state text not null check(state in ('processing','sent','failed')),
  updated_at timestamptz not null default now(),
  primary key(appointment_id,revision,offset_hours,subscription_id)
);
alter table public.car_agent_cases enable row level security;
alter table public.car_agent_case_events enable row level security;
alter table public.car_agent_appointments enable row level security;
alter table public.car_agent_devices enable row level security;
alter table public.car_agent_reminders enable row level security;
revoke all on public.car_agent_cases,public.car_agent_case_events,public.car_agent_appointments,public.car_agent_devices,public.car_agent_reminders from anon,authenticated;
grant select,insert,update on public.car_agent_cases,public.car_agent_appointments to authenticated;
grant select on public.car_agent_case_events to authenticated;
grant all on public.car_agent_cases,public.car_agent_case_events,public.car_agent_appointments,public.car_agent_devices,public.car_agent_reminders to service_role;
create policy agent_case_select on public.car_agent_cases for select to authenticated using(owner_id=(select auth.uid()));
create policy agent_case_insert on public.car_agent_cases for insert to authenticated with check(owner_id=(select auth.uid()));
create policy agent_case_update on public.car_agent_cases for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy agent_events_select on public.car_agent_case_events for select to authenticated using(owner_id=(select auth.uid()));
create policy agent_appointment_select on public.car_agent_appointments for select to authenticated using(owner_id=(select auth.uid()));
create policy agent_appointment_insert on public.car_agent_appointments for insert to authenticated with check(owner_id=(select auth.uid()));
create policy agent_appointment_update on public.car_agent_appointments for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
-- Server timestamps and immutable owner IDs cannot be overridden by a client.
create function public.car_agent_stamp() returns trigger language plpgsql set search_path='' as $$
begin
  if TG_OP='INSERT' then
    new.created_at:=now(); new.updated_at:=now();
    if TG_TABLE_NAME='car_agent_cases' then new.activity_at:=now(); else new.revision:=1; end if;
  else
    if new.owner_id<>old.owner_id or new.id<>old.id then raise exception 'Immutable owner'; end if;
    new.created_at:=old.created_at; new.updated_at:=now();
    if TG_TABLE_NAME='car_agent_cases' then
      new.activity_at:=case when new.status is distinct from old.status or new.remark is distinct from old.remark then now() else old.activity_at end;
    else
      new.revision:=case when new.starts_at is distinct from old.starts_at or new.status is distinct from old.status or new.type is distinct from old.type then old.revision+1 else old.revision end;
    end if;
  end if;
  return new;
end $$;
create trigger car_case_stamp before insert or update on public.car_agent_cases for each row execute function public.car_agent_stamp();
create trigger car_appointment_stamp before insert or update on public.car_agent_appointments for each row execute function public.car_agent_stamp();
create function public.car_agent_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if TG_OP='INSERT' then
    insert into public.car_agent_case_events(case_id,owner_id,status,remark) values(new.id,new.owner_id,new.status,new.remark);
  elsif new.status is distinct from old.status or new.remark is distinct from old.remark then
    insert into public.car_agent_case_events(case_id,owner_id,status,remark) values(new.id,new.owner_id,new.status,new.remark);
  end if;
  return new;
end $$;
create trigger car_case_history after insert or update on public.car_agent_cases for each row execute function public.car_agent_history();
revoke all on function public.car_agent_stamp(), public.car_agent_history() from public,anon,authenticated;
create function public.car_agent_claim_reminders()
returns table(appointment_id uuid,revision integer,offset_hours integer,subscription_id uuid,subscription jsonb,type text,starts_at timestamptz)
language sql security invoker set search_path='' as $$
  with candidates as (
    select a.id,a.revision,o.hours,s.id subscription_id,s.subscription,a.type,a.starts_at
    from public.car_agent_appointments a
    cross join (values(72),(24),(4),(1)) o(hours)
    join public.car_agent_devices d on d.owner_id=a.owner_id
    join public.car_push_subscriptions s on s.id=d.subscription_id and s.enabled
    left join public.car_agent_reminders r on r.appointment_id=a.id and r.revision=a.revision and r.offset_hours=o.hours and r.subscription_id=s.id
    where a.status='Scheduled' and a.starts_at>now()
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
revoke all on function public.car_agent_claim_reminders() from public,anon,authenticated;
grant execute on function public.car_agent_claim_reminders() to service_role;
commit;
