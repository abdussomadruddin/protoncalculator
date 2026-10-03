begin;
create table if not exists public.car_download_requests (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check(length(name) between 1 and 100),
  whatsapp text not null,
  snapshot jsonb not null,
  client_hash text not null
);
alter table public.car_download_requests enable row level security;
revoke all on public.car_download_requests from anon, authenticated;
grant select, insert on public.car_download_requests to service_role;
create index if not exists car_download_rate_idx on public.car_download_requests(client_hash, created_at);
create or replace function public.car_save_download(request_id uuid, person_name text, whatsapp text, calculation jsonb, client_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(client_hash, 0));
  if exists(select 1 from public.car_download_requests d where d.id = request_id) then
    return exists(select 1 from public.car_download_requests d where d.id = request_id and d.name = person_name and d.whatsapp = car_save_download.whatsapp and d.snapshot = calculation);
  end if;
  if (select count(*) from public.car_download_requests d where d.client_hash = car_save_download.client_hash and d.created_at > now() - interval '10 minutes') >= 10 then return false; end if;
  insert into public.car_download_requests(id,name,whatsapp,snapshot,client_hash) values(request_id,person_name,whatsapp,calculation,client_hash);
  return true;
end;
$$;
revoke all on function public.car_save_download(uuid,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.car_save_download(uuid,text,text,jsonb,text) to service_role;
commit;
