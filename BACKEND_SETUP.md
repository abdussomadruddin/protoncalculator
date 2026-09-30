# Car Loan MY backend

This app uses one dedicated Supabase project and Vercel server functions. It does
not use or migrate any LeadFlow, Lead Laju, or CasePilot data.

## Provisioning

1. Create Car Loan MY in lurbaymarketing's Org, Free, Asia-Pacific. Turn off
   automatic table exposure and enable automatic RLS. The owner enters and
   retains the database password, not the app repository.
2. Apply `backend/schema.sql` once to the new project. Tables and RPCs are
   service-role-only; no anon or authenticated policies allow direct access.
3. Configure Supabase Auth Site URL and allowed redirect URL as
   `https://protoncalculator.vercel.app/admin`. Keep email confirmation enabled.
4. Add the variables listed in `.env.example` to Vercel production. Supabase
   service-role and VAPID private keys are server-only, never client assets.
5. Generate VAPID keys with `require('web-push').generateVAPIDKeys()` and save
   them to the server environment. Never rotate these casually; installed
   subscriptions depend on the same public key.
6. Provision the owner's password through Supabase Auth's server-only admin
   API, never through a source-code constant. Deploy after local verification.
   Open `/admin` and login with the allowlisted email and password.

No demo password, browser-local admin permission, or fake notification sender
is used. CAPTCHA was explicitly deferred by the owner. The server verifies
the password through Supabase Auth; only the confirmed allowlisted account
receives a Secure, HttpOnly, SameSite=Strict cookie with at most a one-hour
lifetime. Access and refresh tokens are never returned to the frontend.
Server authorization validates the Supabase user
and confirmed allowlisted email on every protected request. User metadata is
never used for permission checks.

## Delivery semantics

- Publishing activates a popup and replaces the previous active popup atomically.
- The close button dismisses that popup on one device. Admin can deactivate it
  globally; open clients check once per minute and whenever foregrounded.
- Publishing also starts a push batch in the same request. The admin client
  automatically drains remaining batches without a second click. If push fails
  after publishing, the popup ID is retained and a separate resume action is
  available without republishing. An interrupted browser must resume from its
  announcement record; this is not an unattended background job queue.
- Recipients are captured at the first send attempt. New subscribers can still
  see the active in-app popup; publish a new announcement to notify them.
- Durable batches claim 20 subscriptions at a time. Concurrent calls cannot
  claim the same live batch. Interrupted claims can be retried after five minutes.
- Network failure after provider acceptance can result in a retry; delivery is
  at-least-once, not guaranteed exactly-once. The same notification tag coalesces
  duplicate announcements where supported. Failed endpoints are not blindly
  retried; 404/410 subscriptions are disabled.
- Counts mean accepted by the push provider, not delivered/read on a real phone.
- Calculator prices are network-only: the service worker does not cache stale
  catalogs, authenticated API responses, or financial calculations.
- The calculator supports desktop, tablet and phone browsers. Installation
  suggestions appear initially and every five minutes (checked every 15 seconds
  and on foreground return), without interrupting another open dialog. Only a
  phone installed app with granted permission and a server-synced subscription
  is exempt. Desktop installed apps and phones without active notification
  still receive reminders. `/admin` has no installation reminders.
- Notification permission is requested only from a direct button press. After
  denial, lack of support, or temporary backend failure, users can continue with
  a visible warning and retry from settings.

## Release checks

The dedicated project is `zioazzlxzksaxmndkulh`. CLI access, database schema,
server-only credentials and production Auth redirects were configured on
30 September 2026. Auth URL settings are declared in `supabase/config.toml`;
other remote security settings are intentionally left unchanged.

Run calculator regressions, mobile onboarding/UI tests and server auth tests.
Verify configured API responses, direct database anon denial and RPC permissions.
Then the owner must validate password login and a push on at least
one iPhone installed app and one Android installed app. Browser mocks do not
prove OS permission dialogs or real-device notification delivery.
