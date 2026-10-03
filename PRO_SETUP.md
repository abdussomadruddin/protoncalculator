# Agent PRO Workspace

Calculator is the default home, anonymous. Comparison, Case, Follow Up and
Appointment require a confirmed Supabase email/password agent session. Agent
cookies are separate from admin cookies. No billing or automatic charges are
implemented. PRO access is free through 31 December 2026 (Malaysia time); the
API stops PRO access after that date pending an authorized paid-access release.

## Database

`backend/pro.sql` was applied to Car Loan MY (`zioazzlxzksaxmndkulh`). All five
new tables have RLS enabled. Authenticated case/appointment requests use the
user JWT and publishable key, not the service-role key. Other agents cannot
read or modify their rows. Remarks/status snapshots are written by a trigger;
clients cannot alter history or reset the activity timestamp by changing only
customer details. There is no file/document upload.

Follow Up means at least 72 elapsed hours without status/remark changes.
Rejected, Delivered and Cancelled never appear. Appointments use Kuala Lumpur
time and can link only to the same owner's case. Completed/cancelled or
rescheduled appointments invalidate old reminder claims.

## Auth Configuration

The owner Chrome dashboard was used to save and reload-verify the root Site
URL and all four redirects declared in `supabase/config.toml`. Admin redirects
remain allowed for existing admin flows but are no longer the default signup
destination. Previously sent emails retain their original redirect URL.
Email confirmations must stay on. The CLI Auth update token still returns 403.
For registration by the general public, configure a production SMTP provider;
Supabase's default email service is restricted and rate-limited. Do not disable
email confirmation as a workaround. No test account or password was created
by the agent. The requested sender is Car Loan MY <lurbaymarketing@gmail.com>.
Gmail SMTP requires the owner to create and enter an App Password privately.
Use smtp.gmail.com, port 587, and the full Gmail address as username. Do not
store SMTP credentials in source. The branded signup template is prepared at
`supabase/templates/confirmation.html`; publishing it in Auth Emails and
verifying delivery are still required. Subject: Sahkan Pendaftaran Ejen Car Loan MY.

## Appointment Push Rollout

1. Deploy the verified code only when the user authorizes production release.
2. Generate a private random `PRO_REMINDER_SECRET` in server environment, and
   store that same value in Supabase Vault as `car_pro_reminder_secret`. Never
   expose it to client config, source code, logs or chat.
3. Apply `backend/pro-scheduler.sql` as the owner. It schedules a one-minute
   pg_cron/pg_net call to the authenticated reminder endpoint. Do not apply
   before the endpoint is deployed. The script aborts without a Vault secret.
4. Verify the job and HTTP response, then set server env
   `PRO_REMINDER_SCHEDULER=enabled`. Without this flag the UI explicitly warns
   that server reminders are not activated.
5. On an authenticated agent device, enable browser notifications in existing
   app Settings. The device is linked using the existing secret device token;
   a supplied endpoint alone cannot claim another device. Logout detaches only
   that browser's private agent reminder mapping, preserving general broadcasts.
6. Test the four offsets (72/24/4/1 hours), rescheduling, cancellation and
   notification click routing on real supported devices. Notifications show
   type/time, not private customer names or phone numbers, on lock screens.

Claims are per appointment revision, offset and subscription. Concurrent cron
calls cannot claim the same fresh row; crashed claims can be retried after two
minutes. Claims are due within a ten-minute window; a longer scheduler outage
does not send a burst of stale alerts. Network uncertainty can still cause a
provider to accept a retried message. Notification tags deduplicate display;
provider acceptance is not proof the device displayed/read it. Current batch
size is 30, so review queue capacity before substantially increasing usage.

The scheduler and private push secret have NOT been activated on production
as part of this local-preview implementation.

## Validation
## Daily Follow Up

`backend/pro-followup.sql` adds private daily delivery claims. The prepared
cron starts at 08:00 Asia/Kuala_Lumpur (00:00 UTC), processing bounded batches
through 08:09. Only agents with non-terminal cases inactive at least 72 hours
and linked enabled subscriptions receive a summary. Each device is claimed
once per Malaysian date; no automatic retries after uncertain delivery.
No customer names or phone numbers appear in the notification. Clicking it
opens the authenticated Follow Up tab. Production scheduler is not activated
until the new worker is deployed and its private secret is configured.

## Validation

`npm test` includes existing calculator/catalog/admin/poster checks plus new
PRO API, PostgreSQL RLS/trigger/claim tests and Chrome responsive UI checks.
These checks do not prove real iPhone/Android background delivery. There are
no configured build, type-check or lint scripts; JavaScript syntax and scoped
diff checks are run separately.
