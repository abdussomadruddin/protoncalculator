module.exports=async(req,res,{supabase,fail,uuid,adminEmail})=>{
  const action=req.query.action,body=req.body||{};
  if(action==='manage-agent-list'&&req.method==='GET'){
    const page=Number(req.query.page||1);if(!Number.isSafeInteger(page)||page<1||page>10000)fail(400,'Halaman tidak sah.');
    const {data}=await supabase('/auth/v1/admin/users?page='+page+'&per_page=50');
    const users=data.users||[];return res.status(200).json({page,hasNext:users.length===50,records:users.filter(u=>u.user_metadata?.carloan_pro===true&&u.email?.toLowerCase()!==adminEmail.toLowerCase()).map(u=>({id:u.id,email:u.email,name:u.user_metadata.name||'',phone:u.user_metadata.whatsapp||'',disabled:!!u.app_metadata?.pro_disabled,confirmed:!!u.email_confirmed_at,created_at:u.created_at}))});
  }
  if(req.method!=='POST')fail(405,'Gunakan POST.');
  if(action==='manage-agent-create'){
    const contact=validate(body,fail);if(typeof body.password!=='string'||body.password.length<8||body.password.length>256)fail(400,'Password minimum 8 aksara.');
    if(contact.email===adminEmail.toLowerCase())fail(403,'Akaun admin dilindungi.');
    await supabase('/auth/v1/admin/users',{method:'POST',body:{email:contact.email,password:body.password,email_confirm:true,user_metadata:{carloan_pro:true,name:contact.name,whatsapp:contact.phone,return_tab:'case'}}});
    return res.status(200).json({saved:true});
  }
  const id=uuid(body.id);const {data:existing}=await supabase('/auth/v1/admin/users/'+id);
  if(existing.user_metadata?.carloan_pro!==true||existing.email?.toLowerCase()===adminEmail.toLowerCase())fail(403,'Akaun ini dilindungi.');
  if(action==='manage-agent-delete'){
    if(body.confirm!==true||body.confirmEmail!==existing.email)fail(400,'Dua pengesahan diperlukan.');
    await supabase('/auth/v1/admin/users/'+id,{method:'PUT',body:{ban_duration:'876000h',app_metadata:{...existing.app_metadata,pro_disabled:true}}});
    return res.status(200).json({deleted:true});
  }
  if(action==='manage-agent-edit'){
    const contact=validate(body,fail);if(contact.email===adminEmail.toLowerCase())fail(403,'Akaun admin dilindungi.');
    if(contact.email!==existing.email.toLowerCase())fail(400,'Email login tidak boleh diubah di sini.');
    await supabase('/auth/v1/admin/users/'+id,{method:'PUT',body:{user_metadata:{...existing.user_metadata,name:contact.name,whatsapp:contact.phone}}});
    const {data}=await supabase('/rest/v1/rpc/car_save_download',{method:'POST',body:{request_id:require('node:crypto').randomUUID(),person_name:contact.name,whatsapp:contact.phone,calculation:{kind:'agent-profile'},client_hash:'admin-agent-edit:'+id}});
    if(!data)fail(429,'Butiran akaun disimpan; rekod kontak belum disegerakkan. Cuba lagi.');return res.status(200).json({saved:true});
  }
  fail(404,'Tindakan tidak sah.');
};
function validate(body,fail){const name=typeof body.name==='string'?body.name.trim():'',email=typeof body.email==='string'?body.email.trim().toLowerCase():'',phone='+'+String(body.phone||'').replace(/[\s()-]/g,'').replace(/^\+/,'').replace(/^0/,'60');if(!name||name.length>100||/[\x00-\x1f]/.test(name)||!/^\+601(?:1\d{8}|[02-9]\d{7})$/.test(phone)||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Nama, email atau WhatsApp tidak sah.');return {name,email,phone};}
