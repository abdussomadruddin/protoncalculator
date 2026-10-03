(() => {
  const $ = id => document.getElementById(id);
  let loading = false, data = null, days = 7;
  function render() {
    if (!data) return;
    $('agentTotal').textContent = Number(data.total).toLocaleString('ms-MY');
    const daily = data.daily.slice(-days);
    const max = Math.max(1, ...daily.map(day => day.count));
    $('agentChart').replaceChildren();
    for (const day of daily) {
      const bar = document.createElement('div'); bar.className = 'agent-bar';
      bar.style.height = (day.count / max * 100) + '%';
      bar.title = day.date + ': ' + day.count + ' ejen';
      bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', bar.title);
      $('agentChart').append(bar);
    }
    $('downloadsStatus').textContent = daily.reduce((sum, day) => sum + day.count, 0).toLocaleString('ms-MY') + ' ejen baharu · ' + days + ' hari';
    $('agentChartDates').replaceChildren();
    for (const day of [daily[0], daily.at(-1)]) {
      const label = document.createElement('span');
      label.textContent = new Date(day.date + 'T00:00:00+08:00').toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', timeZone: 'Asia/Kuala_Lumpur' });
      $('agentChartDates').append(label);
    }
    $('agents7').setAttribute('aria-pressed', String(days === 7));
    $('agents30').setAttribute('aria-pressed', String(days === 30));
  }
  async function load() {
    if (loading || $('adminDashboard').hidden) return;
    loading = true; $('downloadsStatus').textContent = 'Memuatkan database ejen...';
    try {
      const response = await fetch('/api/app?action=agent-stats', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Database ejen tidak tersedia.');
      if ($('adminDashboard').hidden) return;
      data = result; render();
    } catch (error) {
      data = null; $('agentTotal').textContent = '—'; $('agentChart').replaceChildren(); $('agentChartDates').replaceChildren();
      $('downloadsStatus').textContent = error.message;
    } finally { loading = false; }
  }
  $('agents7').onclick = () => { days = 7; if (data) render(); else load(); };
  $('agents30').onclick = () => { days = 30; if (data) render(); else load(); };
  new MutationObserver(() => {
    if (!$('adminDashboard').hidden) load();
    else { data = null; $('agentTotal').textContent = '—'; $('agentChart').replaceChildren(); $('agentChartDates').replaceChildren(); }
  }).observe($('adminDashboard'), { attributes: true, attributeFilter: ['hidden'] });
  load();
})();
