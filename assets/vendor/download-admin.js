(() => {
  let page = 1, loading = false;
  const $ = id => document.getElementById(id);
  async function load() {
    if (loading || $('adminDashboard').hidden) return;
    loading = true; $('downloadsStatus').textContent = 'Memuatkan rekod...';
    try {
      const response = await fetch('/api/app?action=downloads&page='+page,{cache:'no-store'});
      const data = await response.json(); if(!response.ok) throw new Error(data.error || 'Rekod tidak tersedia.');
      $('downloadsList').replaceChildren();
      for(const record of data.records) {
        const item = document.createElement('p');
        const cars = record.snapshot?.cars || [record.snapshot || {}];
        const detail = record.snapshot?.kind === 'agent-profile' ? 'Profil Ejen' : cars.map(car=>[car.brand,car.model,car.variant].filter(Boolean).join(' ')).join(' vs ');
        item.textContent = new Date(record.created_at).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'})+' | '+record.name+' | '+record.whatsapp+' | '+detail;
        $('downloadsList').append(item);
      }
      $('downloadsPrevious').disabled = page === 1;
      $('downloadsNext').disabled = !data.hasNext;
      $('downloadsStatus').textContent = 'Halaman '+page+(data.records.length?'':' · Tiada rekod.');
    } catch(error) {$('downloadsStatus').textContent=error.message;}
    finally {loading=false;}
  }
  $('downloadsPrevious').onclick=()=>{if(page>1){page--;load();}};
  $('downloadsNext').onclick=()=>{page++;load();};
  $('downloadsRefresh').onclick=load;
  new MutationObserver(()=>{if(!$('adminDashboard').hidden)load();}).observe($('adminDashboard'),{attributes:true,attributeFilter:['hidden']});
  load();
})();
