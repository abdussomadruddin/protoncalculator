begin;
create or replace function public.car_push_readiness()
returns jsonb language sql security definer set search_path='' as $$
with devices as (
  select a.owner_id,s.id,coalesce(u.raw_user_meta_data->>'name',u.email,'Ejen') as name,
    d.last_seen,s.updated_at,
    case when not s.enabled or d.permission in ('denied','default','unsupported')
      or coalesce((u.raw_app_meta_data->>'pro_disabled')::boolean,false)
      or not exists(select 1 from auth.sessions x where x.user_id=u.id and (x.not_after is null or x.not_after>now())) then 'unavailable'
    when d.permission='granted' and d.phone_app_seen_at is not null
      and d.last_seen>now()-interval '7 days' and s.updated_at>now()-interval '7 days' then 'ready'
    else 'review' end as state
  from public.car_agent_devices a
  join public.car_push_subscriptions s on s.id=a.subscription_id
  join auth.users u on u.id=a.owner_id
  left join public.car_device_activity d on d.token_hash=s.token_hash
)
select jsonb_build_object('checkedAt',now(),'readyAgents',count(distinct owner_id) filter(where state='ready'),
  'readyDevices',count(*) filter(where state='ready'),'reviewDevices',count(*) filter(where state='review'),
  'unavailableDevices',count(*) filter(where state='unavailable'),
  'devices',coalesce(jsonb_agg(jsonb_build_object('agent',name,'state',state,'lastSeen',last_seen,'subscriptionCheckedAt',updated_at) order by name,id),'[]'::jsonb)) from devices;
$$;
revoke all on function public.car_push_readiness() from public,anon,authenticated;
grant execute on function public.car_push_readiness() to service_role;
commit;
