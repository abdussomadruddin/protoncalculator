begin;
create or replace function public.car_record_pro_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  person text := btrim(new.raw_user_meta_data->>'name');
  whatsapp text := new.raw_user_meta_data->>'whatsapp';
begin
  if new.raw_user_meta_data->>'carloan_pro' = 'true' then
    if person is null or length(person) not between 1 and 100
       or person ~ '[[:cntrl:]]' or whatsapp is null
       or whatsapp !~ '^\+601(1[0-9]{8}|[02-9][0-9]{7})$' then
      raise exception 'Invalid agent registration contact';
    end if;
    insert into public.car_download_requests(id,name,whatsapp,snapshot,client_hash)
    values(new.id,person,whatsapp,jsonb_build_object('kind','pro-registration'),'pro-registration')
    on conflict(id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.car_record_pro_registration() from public, anon, authenticated;
drop trigger if exists car_record_pro_registration on auth.users;
create trigger car_record_pro_registration after insert on auth.users
for each row execute function public.car_record_pro_registration();

-- Restore missing registration contacts without changing existing download history.
insert into public.car_download_requests(id,created_at,name,whatsapp,snapshot,client_hash)
select u.id,u.created_at,btrim(u.raw_user_meta_data->>'name'),u.raw_user_meta_data->>'whatsapp',
       jsonb_build_object('kind','pro-registration'),'pro-registration-backfill'
from auth.users u
where u.raw_user_meta_data->>'carloan_pro' = 'true'
  and length(btrim(u.raw_user_meta_data->>'name')) between 1 and 100
  and btrim(u.raw_user_meta_data->>'name') !~ '[[:cntrl:]]'
  and u.raw_user_meta_data->>'whatsapp' ~ '^\+601(1[0-9]{8}|[02-9][0-9]{7})$'
  and not exists(select 1 from public.car_download_requests d
                 where d.whatsapp=u.raw_user_meta_data->>'whatsapp')
on conflict(id) do nothing;
commit;
