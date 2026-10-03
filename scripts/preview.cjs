// Isolated local download testing: no production credentials or requests.
const fs = require('node:fs');
const path = require('node:path');
const {PGlite} = require('@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(fs.readFileSync(path.join(__dirname,'../backend/downloads.sql'),'utf8'));
  process.env.SUPABASE_URL = 'https://local-preview.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'local-sandbox-only';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'local-sandbox-only';
  process.env.ADMIN_EMAIL = 'local@example.invalid';
  process.env.APP_ORIGIN = 'http://localhost:'+(Number(process.argv[2]) || 4173);
  delete process.env.VAPID_PUBLIC_KEY; delete process.env.VAPID_PRIVATE_KEY;
  global.fetch = async (url,options={}) => {
    const parsed = new URL(url);
    if(parsed.origin !== 'https://local-preview.invalid') throw new Error('Sandbox cannot contact production');
    if(parsed.pathname === '/rest/v1/rpc/car_save_download') {
      const body = JSON.parse(options.body);
      const result = await db.query('select public.car_save_download($1,$2,$3,$4,$5) as saved',[body.request_id,body.person_name,body.whatsapp,body.calculation,body.client_hash]);
      return new Response(JSON.stringify(result.rows[0].saved));
    }
    if(parsed.pathname === '/rest/v1/car_announcements') return new Response('[]');
    return new Response(JSON.stringify({error:'Sandbox: download testing only'}),{status:401});
  };
  require('./serve.cjs');
  console.log('SANDBOX: download records are temporary local data, cleared when this server stops. Production admin login/push disabled.');
})().catch(error=>{console.error(error);process.exitCode=1;});
