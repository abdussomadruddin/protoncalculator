(() => {
  window.CarLoanLive = function(api, changed, unauthorized, action='pro-realtime') {
    let client=null,channel=null,epoch=0,starting=false,retry=null,attempt=0,active=false;
    function disconnect(){channel=null;if(client){const old=client;client=null;old.removeAllChannels().catch(()=>{}).finally(()=>old.disconnect().catch(()=>{}));}}
    async function connect(){
      if(!active||starting||document.hidden||!navigator.onLine)return;
      starting=true;const version=++epoch;
      try{
        const config=await api(action);
        if(!active||version!==epoch)return;
        disconnect();
        client=new CarLoanRealtime.RealtimeClient(config.url+'/realtime/v1',{params:{apikey:config.key}});
        if(config.accessToken)await client.setAuth(config.accessToken);
        if(!active||version!==epoch){disconnect();return;}
        channel=client.channel(action+'-'+(config.ownerId||'updates'));
        const subscriptions=config.subscriptions||['car_agent_cases','car_agent_appointments'].map(table=>({table,filter:'owner_id=eq.'+config.ownerId}));
        for(const subscription of subscriptions){
          for(const event of ['INSERT','UPDATE'])channel.on('postgres_changes',{event,schema:'public',...subscription},()=>{if(active&&version===epoch)changed();});
        }
        channel.on('system',{},event=>{if(active&&version===epoch&&event.status==='ok')changed();});
        channel.subscribe(status=>{
          if(!active||version!==epoch)return;
          if(status==='SUBSCRIBED'){attempt=0;clearTimeout(retry);retry=null;changed();}
          else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))schedule();
        });
      }catch(error){if(active&&version===epoch){if(error.status===401||error.status===403){stop();unauthorized();}else schedule();}}
      finally{starting=false;if(active&&!client&&!document.hidden)schedule();}
    }
    function schedule(){if(retry||!active)return;retry=setTimeout(()=>{retry=null;connect();},Math.min(30000,1000*2**Math.min(attempt++,5)));}
    function start(){if(active)return;active=true;epoch++;connect();}
    function stop(){active=false;epoch++;clearTimeout(retry);retry=null;disconnect();}
    function resume(){if(active&&!document.hidden){connect();changed();}}
    document.addEventListener('visibilitychange',()=>{if(document.hidden){epoch++;disconnect();}else resume();});
    addEventListener('online',resume);addEventListener('pageshow',resume);
    // Reconcile missed events and time-based follow-up/badge changes as well as renewing JWTs.
    setInterval(()=>{if(active&&!document.hidden&&navigator.onLine)changed();},30000);
    setInterval(()=>{if(active&&!document.hidden)connect();},300000);
    return {start,stop};
  };
})();
