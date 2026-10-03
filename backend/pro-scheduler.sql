-- Apply ONLY after the PRO endpoint is deployed and PRO_REMINDER_SECRET is in
-- server env and in Vault as car_pro_reminder_secret. Never commit the secret.
-- Supabase Cron is used instead of daily-only Hobby Vercel cron.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
  if not exists(select 1 from vault.decrypted_secrets where name='car_pro_reminder_secret') then
    raise exception 'Missing car_pro_reminder_secret in Vault; scheduler not activated';
  end if;
  if exists(select 1 from cron.job where jobname='car-loan-pro-appointments') then
    perform cron.unschedule('car-loan-pro-appointments');
  end if;
end $$;
select cron.schedule('car-loan-pro-appointments','* * * * *',$job$
  select net.http_post(
    url:='https://carloanmalaysia.vercel.app/api/app?action=pro-reminders',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='car_pro_reminder_secret')),
    body:='{}'::jsonb,timeout_milliseconds:=60000
  );
$job$);
commit;
-- UTC 00:00 is 08:00 Asia/Kuala_Lumpur. Apply only after worker deployment.
select cron.schedule('car-loan-pro-followup','0-9 0 * * *',$job$
  select net.http_post(
    url:='https://carloanmalaysia.vercel.app/api/app?action=pro-followup-reminders',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='car_pro_reminder_secret')),
    body:='{}'::jsonb,timeout_milliseconds:=60000
  );
$job$);
