(() => {
  const key=new URLSearchParams(location.hash.slice(1)).get('station')||sessionStorage.getItem('exhibit-station');
  if(key){sessionStorage.setItem('exhibit-station',key);history.replaceState(null,'',location.pathname);}
  const card=document.createElement('section');card.className='exhibit-card';
  card.innerHTML='<span class="exhibit-label">Exhibition edition</span><h2>You are what you scroll.</h2><div class="exhibit-pair"><img id="exhibit-qr" alt="Scan to send history from your phone" hidden><div><p>Scan with your phone. Choose your Safari history. See its words become your portrait. Common explicit words are filtered before display.</p><a id="exhibit-link" target="_blank" rel="noreferrer"></a></div></div><p id="exhibit-status" role="status">Connecting…</p><div class="sample-picker"><label for="sample-kind">Explore a sample</label><select id="sample-kind" aria-describedby="sample-description"><option value="curated">Curated · 1,000 words</option><option value="search-2026">Google searches · June 2026</option></select><p id="sample-description"></p><a id="sample-source" target="_blank" rel="noreferrer" hidden>About the search data</a><button id="exhibit-sample">Try a sample portrait</button></div>';
  document.querySelector('.landing-inner').prepend(card);
  const local=document.createElement('details');local.className='exhibit-local';local.innerHTML='<summary>Or upload a file on this computer</summary>';
  const inner=document.querySelector('.landing-inner');
  for(const child of [...inner.children]) if(child!==card&&!child.classList.contains('landing-actions')) local.append(child);
  inner.append(local);
  const status=card.querySelector('#exhibit-status'), qr=card.querySelector('img'), link=card.querySelector('a');
  const sampleKind=card.querySelector('#sample-kind'), sampleDescription=card.querySelector('#sample-description'), sampleSource=card.querySelector('#sample-source');
  function describeSample(){try{const sample=buildExhibitionSample(sampleKind.value);sampleDescription.textContent=sample.description;sampleSource.hidden=!sample.sourceUrl;if(sample.sourceUrl)sampleSource.href=sample.sourceUrl;}catch(e){sampleDescription.textContent=e.message;}}
  sampleKind.onchange=describeSample;describeSample();
  const next=document.createElement('button');next.textContent='Next visitor · exit portrait';next.className='next-visitor';next.hidden=true;document.body.append(next);
  let session=null,timer=null,resetting=false,claimed=false;
  async function api(path,options={}){const r=await fetch('/api/sessions'+path,{...options,headers:{'x-station-key':key||'',...options.headers}});const d=await r.json();if(!r.ok)throw Error(d.error);return d;}
  async function reset(){if(resetting)return;resetting=true;clearInterval(timer);try{if(session)await api('/'+session.id,{method:'DELETE'});}catch{} location.reload();}
  next.onclick=reset;
  async function claim(){claimed=true;sampleKind.disabled=true;card.querySelector('button').disabled=true;qr.hidden=true;link.hidden=true;next.hidden=false;setTimeout(reset,5*60_000);}
  card.querySelector('button').onclick=async()=>{
    if(claimed)return;
    let sample;
    try {sample=buildExhibitionSample(sampleKind.value);} catch(e){status.textContent=e.message;return;}
    if(!applyImportedWordFreq(sample.freq,sample.label))return;
    await claim();
    if(session)try{await api('/'+session.id,{method:'DELETE'});}catch{}
    clearInterval(timer);
    status.textContent=`${sample.label} loaded. Select Start Camera below, then step into the frame.`;
  };
  // Local uploads also retire the pairing code so a phone cannot replace a visitor.
  document.querySelector('#start-camera').addEventListener('click',async()=>{if(!claimed){await claim();if(session)try{await api('/'+session.id,{method:'DELETE'});}catch{}clearInterval(timer);}});
  async function poll(){if(!session||resetting||claimed)return;try{const d=await api('/'+session.id+'/portrait');if(d.titles){const freq=parseHistoryJsonText(JSON.stringify(d.titles));if(!Object.keys(freq).length){await api('/'+session.id,{method:'DELETE'});status.textContent='No usable words in that export. Select Next visitor to try again.';await claim();return;}applyImportedWordFreq(freq,'Phone history received');await claim();await api('/'+session.id+'/ack',{method:'POST'});status.textContent='Your words have arrived. Select Start Camera below, then step into the frame.';}else status.textContent='Ready for a visitor · QR code valid for 15 minutes';}catch(e){status.textContent=e.message;if(Date.now()>session.expires)reset();}}
  async function start(){if(!key){status.textContent='To enable phone uploads, run npm start and open the station URL printed in the terminal. Computer uploads and the sample still work.';return;}try{session=await api('',{method:'POST'});qr.src=session.qr;qr.hidden=false;link.href=session.url;link.textContent='Open phone upload page';await poll();timer=setInterval(poll,2000);}catch(e){status.textContent=e.message;}}
  start();
})();
