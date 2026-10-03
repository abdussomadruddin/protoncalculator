const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { randomUUID } = require('node:crypto');
(async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(fs.readFileSync('backend/downloads.sql','utf8'));
    await db.exec(fs.readFileSync('backend/downloads.sql','utf8'));
    const id=randomUUID();
    const save=async (request=id,name='Test',client='client') => (await db.query('select public.car_save_download($1,$2,$3,$4,$5) as saved',[request,name,'+60123456789',{model:'Test'},client])).rows[0].saved;
    assert.equal(await save(),true); assert.equal(await save(),true);
    assert.equal(await save(id,'Changed'),false);
    assert.equal((await db.query('select count(*) from public.car_download_requests')).rows[0].count,1);
    for(let i=0;i<9;i++) assert.equal(await save(randomUUID()),true);
    assert.equal(await save(randomUUID()),false);
    assert.equal(await save(randomUUID(),'Test','other-client'),true);
    assert.equal((await db.query('select count(*) from public.car_download_contacts')).rows[0].count,1);
    assert.equal((await db.query('select count(*) from public.car_download_requests')).rows[0].count,11);
    for(const role of ['anon','authenticated']) {
      const result=await db.query("select has_table_privilege($1,'public.car_download_requests','select') as read, has_function_privilege($1,'public.car_save_download(uuid,text,text,jsonb,text)','execute') as execute",[role]);
      assert.equal(result.rows[0].read,false);assert.equal(result.rows[0].execute,false);
    }
    const ExcelJS=require('exceljs'), workbook=new ExcelJS.Workbook();
    workbook.addWorksheet('Test').addRow(['=HYPERLINK("bad")','+60123456789']);
    const bytes=await workbook.xlsx.writeBuffer(), loaded=new ExcelJS.Workbook();
    await loaded.xlsx.load(bytes);
    assert.equal(loaded.worksheets[0].getCell('A1').type,ExcelJS.ValueType.String);
    assert.equal(loaded.worksheets[0].getCell('B1').value,'+60123456789');
    console.log('PASS downloads: schema, private grants, retry idempotency, rate limit and Excel text safety.');
  } finally {await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
