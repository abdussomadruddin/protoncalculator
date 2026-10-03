begin;
create table public.car_live_signals (
  topic text primary key check(topic in ('admin','announcements')),
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.car_live_signals(topic) values ('admin'),('announcements');
alter table public.car_live_signals enable row level security;
revoke all on public.car_live_signals from public,anon,authenticated;
grant select on public.car_live_signals to anon,authenticated;
create policy public_announcement_signal on public.car_live_signals for select to anon,authenticated using(topic='announcements');
create policy private_admin_signal on public.car_live_signals for select to authenticated
using(topic='admin' and (select auth.jwt()->>'email')='lurbaymarketing@gmail.com');

-- Triggers emit only a revision; private records are still fetched through authenticated APIs.
create function public.car_emit_live_signal() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.car_live_signals set revision=revision+1,updated_at=clock_timestamp() where topic=tg_argv[0];
  return null;
end;
$$;
revoke all on function public.car_emit_live_signal() from public,anon,authenticated;
create trigger car_announcement_live after insert or update or delete on public.car_announcements
for each statement execute function public.car_emit_live_signal('announcements');
create trigger car_announcement_admin_live after insert or update or delete on public.car_announcements
for each statement execute function public.car_emit_live_signal('admin');
create trigger car_download_admin_live after insert or update or delete on public.car_download_requests
for each statement execute function public.car_emit_live_signal('admin');
create trigger car_visit_admin_live after insert or update or delete on public.car_visits
for each statement execute function public.car_emit_live_signal('admin');
create trigger car_device_admin_live after insert or update or delete on public.car_device_activity
for each statement execute function public.car_emit_live_signal('admin');
create trigger car_push_admin_live after insert or update or delete on public.car_push_subscriptions
for each statement execute function public.car_emit_live_signal('admin');
create trigger car_user_admin_live after insert or delete or update of raw_user_meta_data,raw_app_meta_data,email on auth.users
for each statement execute function public.car_emit_live_signal('admin');
alter publication supabase_realtime add table public.car_agent_cases,public.car_agent_appointments,public.car_live_signals;
commit;
