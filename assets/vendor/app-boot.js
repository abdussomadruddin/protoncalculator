(() => {
  const root=document.documentElement,start=performance.now();
  let pending=0,parsed=false,finished=false,timer;
  root.classList.add('app-booting');
  function finish(){
    if(finished)return;finished=true;clearTimeout(timer);clearTimeout(deadline);
    root.classList.remove('app-booting');root.classList.add('app-boot-ready');
    const overlay=document.getElementById('appBoot');
    if(overlay){overlay.setAttribute('aria-hidden','true');setTimeout(()=>overlay.remove(),350);}
    dispatchEvent(new Event('carloan-app-ready'));
  }
  function check(){clearTimeout(timer);if(parsed&&!pending&&!finished)timer=setTimeout(finish,Math.max(100,300-(performance.now()-start)));}
  const deadline=setTimeout(finish,8000);
  window.CarLoanBoot={wait(promise){if(finished)return promise;pending++;clearTimeout(timer);return Promise.resolve(promise).finally(()=>{pending--;check();});},get ready(){return finished;}};
  document.addEventListener('DOMContentLoaded',()=>{parsed=true;const logo=document.querySelector('#appBoot img');if(logo?.decode)window.CarLoanBoot.wait(logo.decode().catch(()=>{}));check();},{once:true});
})();
