# Local Feature Preview

Run `node scripts/preview.cjs 4193` and open `http://localhost:4193/` in Chrome.
This mode uses a temporary local Postgres-compatible database for download
requests. It does not use production credentials, contact production, send
notifications, or enable admin login. Data disappears when the server stops.

The existing JSONB snapshot column and latest-contact view already support
single- and two-car records; no schema migration is required. The updated API
retains legacy records and validates every car before inserting. Deploy the
API and frontend together after approval; no production release is authorized
by this preview.

Checks: `npm test`, then `node tests/poster.cjs` with the preview server running.
There is no configured build, type-check or lint script for this static app.
Browser file sharing is simulated in automated tests. Physical iPhone/Android
share sheets still need testing; one tap is not guaranteed by browsers.
