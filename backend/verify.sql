-- Exercises production RPCs without publishing a popup or retaining test data.
begin;
do $$
declare
  announcement jsonb;
  announcement_id uuid;
  claimed integer;
begin
  if not public.car_register_subscription('carloan-release-test', 'owner', '{"endpoint":"test-only"}'::jsonb) then
    raise exception 'Subscription registration failed';
  end if;
  if public.car_register_subscription('carloan-release-test', 'different-owner', '{}'::jsonb) then
    raise exception 'Subscription ownership check failed';
  end if;
  announcement := public.car_publish_announcement('Release verification', 'Rolled back; never published.', null, null);
  announcement_id := (announcement->>'id')::uuid;
  select count(*) into claimed from public.car_claim_deliveries(announcement_id);
  if claimed < 1 then raise exception 'Delivery claim failed'; end if;
  if (public.car_delivery_summary(announcement_id)->>'processing')::integer <> claimed then
    raise exception 'Delivery summary failed';
  end if;
end $$;
rollback;
