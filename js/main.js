let tabs={},activeTabId=null,tabCounter=0,clockInterval=null,_ns=null,_tt=null;
let bookmarks=[],histList=[],bmBarVisible=false,_prevPane=null;
let greylist=[],blacklist=[];
(async()=>{
  try{const r=await fetch('/lists/greylist.json',{cache:'no-store'});if(r.ok)greylist=await r.json();}catch{}
  try{const r=await fetch('/lists/blacklist.json',{cache:'no-store'});if(r.ok)blacklist=await r.json();}catch{}
})();
function matchesList(list,url){
  try{const h=new URL(url).hostname.replace('www.','');return list.some(e=>h===e.replace('www.','')||h.endsWith('.'+e.replace('www.','')));}catch{return false;}
}

const GROQ_WORKER='https://hyperspeed-ai.cgamz.online';
const GROQ_MODEL='llama-3.1-8b-instant';
const _guardCache=new Map();

async function groqFetch(messages,maxTokens=5){
  const res=await fetch(GROQ_WORKER+'/groq',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:GROQ_MODEL,max_tokens:maxTokens,temperature:0,messages})
  });
  if(!res.ok)throw new Error('worker error '+res.status);
  return res.json();
}

async function guardCheck(url){
  if(_guardCache.has(url))return _guardCache.get(url);
  let host='';
  try{host=new URL(url).hostname.replace('www.','');}catch{return'block';}
  try{
    const data=await groqFetch([
      {role:'system',content:'You are a strict content filter for a middle school (ages 11-14). You must respond with exactly one word only: BLOCK, WARN, or ALLOW. No punctuation, no explanation.'},
      {role:'user',content:`Classify this domain:\n\nBLOCK = porn, adult content, nudity, sex, drugs, weapons, violence, gambling, hate speech, self-harm, piracy\nWARN = social media, gaming, video streaming, dating\nALLOW = educational, news, search engines, productivity, coding\n\nDomain: ${host}`}
    ]);
    const verdict=(data.choices?.[0]?.message?.content||'').trim().toUpperCase();
    const result=verdict.startsWith('BLOCK')?'block':verdict.startsWith('WARN')?'warn':'allow';
    _guardCache.set(url,result);
    return result;
  }catch{return'block';}
}

async function guardCheckQuery(query){
  const ckey='q:'+query.toLowerCase().trim();
  if(_guardCache.has(ckey))return _guardCache.get(ckey);
  try{
    const data=await groqFetch([
      {role:'system',content:'You are a strict content filter for a middle school (ages 11-14). You must respond with exactly one word only: BLOCK or ALLOW. No punctuation, no explanation. When in doubt, BLOCK.'},
      {role:'user',content:`A student typed this into a browser. Is it appropriate for a middle school?\n\nBLOCK if it involves: porn, sex, nudity, adult content, drugs, alcohol, weapons, violence, self-harm, gambling, hate speech, or anything inappropriate for children.\nALLOW everything else.\n\nQuery: "${query}"`}
    ]);
    const verdict=(data.choices?.[0]?.message?.content||'').trim().toUpperCase();
    const result=verdict.startsWith('BLOCK')?'block':'allow';
    _guardCache.set(ckey,result);
    return result;
  }catch{return'block';}
}

function showScanOverlay(id){
  const pane=document.getElementById('p-'+id);if(!pane)return;
  let ov=pane.querySelector('.scan-overlay');
  if(!ov){ov=document.createElement('div');ov.className='scan-overlay';ov.innerHTML=`<div class="scan-box"><div class="scan-ring"></div><div class="scan-icon"><i class="fa-solid fa-shield-halved"></i></div><div class="scan-lbl">AI Safety Scan</div><div class="scan-sub">Checking site content…</div></div>`;pane.appendChild(ov);}
  ov.style.display='flex';
}
function hideScanOverlay(id){
  const pane=document.getElementById('p-'+id);if(!pane)return;
  const ov=pane.querySelector('.scan-overlay');if(ov)ov.style.display='none';
}

window.addEventListener('db-ready',async()=>{
  try{bookmarks=await window._db.getBm();updateBmStar(tabs[activeTabId]?.url||'');renderBmBar();}catch(e){}
  try{histList=await window._db.getHist(100);}catch(e){}
  try{const prefs=await window._db.getPrefs();if(prefs.bmBarVisible===true){bmBarVisible=true;document.getElementById('browser').classList.add('bm-open');document.getElementById('btn-bm').classList.add('active');renderBmBar();updateBmToggleBtn();}}catch(e){}
});

const gid=()=>'t'+(++tabCounter);
const isUrl=s=>/^https?:\/\//i.test(s)||/^[\w-]+\.[a-z]{2,}/i.test(s);
const shortUrl=url=>{try{return new URL(url).hostname.replace('www.','');}catch{return url.slice(0,28);}};
const picon=p=>({newtab:'fa-solid fa-house',games:'fa-solid fa-gamepad',movies:'fa-solid fa-film',ai:'fa-solid fa-robot',settings:'fa-solid fa-gear',about:'fa-solid fa-circle-info',history:'fa-solid fa-clock-rotate-left'}[p]||'fa-solid fa-house');

function toast(msg,icon='fa-solid fa-circle-check'){
  const w=document.getElementById('toasts'),el=document.createElement('div');
  el.className='toast';el.innerHTML=`<i class="${icon}"></i> ${msg}`;w.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),260);},2500);
}

function newTab(url='hyperspeed://newtab'){
  const id=gid();
  tabs[id]={id,url,hist:[url],hi:0,title:'new tab',favicon:'fa-solid fa-house',pinned:false,muted:false};
  const pane=document.createElement('div');pane.className='tab-pane';pane.id='p-'+id;
  document.getElementById('viewport').appendChild(pane);
  renderTabs(id);switchTab(id);updateWidths();return id;
}

function closeTab(id,e){
  if(e){e.stopPropagation();e.preventDefault();}
  const ids=getOrder();if(ids.length===1)newTab();
  if(activeTabId===id){const i=ids.indexOf(id);const nx=ids[i+1]||ids[i-1];if(nx&&nx!==id)switchTab(nx);}
  const el=document.querySelector(`.tab[data-id="${id}"]`);
  const rm=()=>{document.getElementById('p-'+id)?.remove();delete tabs[id];renderTabs();updateWidths();};
  if(el){el.classList.add('tab-exit');setTimeout(rm,220);}else rm();
}

const getOrder=()=>[...document.querySelectorAll('.tab')].map(t=>t.dataset.id).filter(Boolean);

function switchTab(id){
  if(!tabs[id])return;
  if(_prevPane&&_prevPane!==id){
    const pp=document.getElementById('p-'+_prevPane);
    if(pp&&pp.classList.contains('active')){pp.classList.add('p-exit');setTimeout(()=>pp.classList.remove('active','p-exit'),230);}
  }
  const pane=document.getElementById('p-'+id);
  if(pane){
    pane.classList.add('active','p-enter');
    setTimeout(()=>pane.classList.remove('p-enter'),320);
    if(!pane.hasChildNodes()){const t=tabs[id];t.url.startsWith('hyperspeed://')?renderPane(id,t.url.replace('hyperspeed://','')): renderWeb(id,t.url);}
  }
  _prevPane=id;activeTabId=id;renderTabs();
  const t=tabs[id];document.getElementById('url-bar').value=t.url;
  updateNavBtns();updateSideActive(t.url);updateLock(t.url);updateBmStar(t.url);closeFind();
}

function renderTabs(newId){
  const bar=document.getElementById('tab-bar');bar.innerHTML='';
  const pinned=Object.values(tabs).filter(t=>t.pinned);
  const normal=Object.values(tabs).filter(t=>!t.pinned);
  [...pinned,...normal].forEach(tab=>{
    const el=document.createElement('div');
    el.className='tab'+(tab.id===activeTabId?' active':'')+(tab.muted?' muted':'');
    if(tab.id===newId)el.classList.add('tab-enter');
    el.dataset.id=tab.id;
    if(tab.pinned)el.style.cssText+='width:40px;min-width:40px;padding:0 8px;';
    el.innerHTML=`<span class="tab-spin"></span><span class="tab-fav"><i class="${tab.favicon}"></i></span>${tab.pinned?'':`<span class="tab-title">${tab.title}</span>`}${!tab.pinned?`<span class="tab-mute" onclick="muteTab('${tab.id}');event.stopPropagation()"><i class="fa-solid ${tab.muted?'fa-volume-xmark':'fa-volume-low'}"></i></span>`:''} ${!tab.pinned?`<span class="tab-close" onclick="closeTab('${tab.id}',event)"><i class="fa-solid fa-xmark"></i></span>`:''}`;
    el.addEventListener('click',()=>switchTab(tab.id));
    el.addEventListener('mousedown',e=>{
      if(e.button===1){e.preventDefault();closeTab(tab.id);return;}
      if(e.button===0){const closeEl=e.target.closest('.tab-close,.tab-mute');if(!closeEl)tabDragStart(e,tab.id,el);}
    });
    el.addEventListener('contextmenu',e=>tabCtx(e,tab.id));
    bar.appendChild(el);
  });
  const plus=document.createElement('div');plus.className='tab-new';plus.title='New tab';
  plus.innerHTML='<i class="fa-solid fa-plus"></i>';plus.onclick=()=>newTab();bar.appendChild(plus);
  const badge=document.getElementById('tab-overflow');if(badge)bar.appendChild(badge);
  setTimeout(updateOverflow,0);
}

function updateWidths(){
  const bar=document.getElementById('tab-bar');
  const reserved=128;
  const available=bar.offsetWidth-reserved;
  const normalTabs=Object.values(tabs).filter(t=>!t.pinned);
  const pinnedW=Object.values(tabs).filter(t=>t.pinned).length*(40+4);
  const slots=normalTabs.length;
  if(slots===0){bar.classList.remove('compact','very-compact');setTimeout(updateOverflow,0);return;}
  const ideal=160;
  const min=60;
  const mid=110;
  const space=available-pinnedW;
  const perTab=Math.floor(space/slots);
  bar.classList.remove('compact','very-compact');
  if(perTab<min) bar.classList.add('very-compact');
  else if(perTab<ideal) bar.classList.add('compact');
  const w=Math.max(min,Math.min(ideal,perTab));
  bar.style.setProperty('--tab-dyn-w', w+'px');
  setTimeout(updateOverflow,0);
}
window.addEventListener('resize',()=>setTimeout(()=>{updateWidths();updateOverflow();},0));
function pinTab(id){if(!tabs[id])return;tabs[id].pinned=!tabs[id].pinned;renderTabs();toast(tabs[id].pinned?'Tab pinned':'Tab unpinned','fa-solid fa-thumbtack');}
function muteTab(id){if(tabs[id]){tabs[id].muted=!tabs[id].muted;renderTabs();}}
function dupTab(id){const s=tabs[id];if(s){newTab(s.url);toast('Duplicated','fa-solid fa-clone');}}
function closeOthers(k){Object.keys(tabs).forEach(id=>{if(id!==k)closeTab(id);});}
function closeToRight(k){
  const ids=getOrder();
  const idx=ids.indexOf(k);
  if(idx<0)return;
  ids.slice(idx+1).forEach(id=>closeTab(id));
}

function updateOverflow(){
  const bar=document.getElementById('tab-bar');
  const badge=document.getElementById('tab-overflow');
  if(!badge)return;
  const allTabs=bar.querySelectorAll('.tab');
  const barW=bar.offsetWidth;
  let cum=0,hidden=0;
  allTabs.forEach(el=>{cum+=el.offsetWidth+4;if(cum>barW-70)hidden++;});
  if(hidden>0){badge.classList.add('visible');document.getElementById('overflow-count').textContent=hidden;}
  else{badge.classList.remove('visible');}
}

let _drag=null;

function tabDragStart(e,tabId,el){
  const startX=e.clientX,startY=e.clientY;
  let started=false;

  function onMove(ev){
    if(!started){
      if(Math.abs(ev.clientX-startX)<4&&Math.abs(ev.clientY-startY)<4)return;
      started=true;
      _initDrag(tabId,el,ev,startX);
    }
    if(_drag)_moveDrag(ev);
  }
  function onUp(ev){
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
    if(!started){switchTab(tabId);return;}
    if(_drag)_endDrag();
  }
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
  e.preventDefault();
}

function _initDrag(tabId,el,e,startX){
  const bar=document.getElementById('tab-bar');
  const rect=el.getBoundingClientRect();
  const barRect=bar.getBoundingClientRect();

  const ghost=el.cloneNode(true);
  ghost.className='tab-ghost'+(el.classList.contains('active')?' active':'');
  ghost.style.cssText+=`width:${rect.width}px;height:${rect.height}px;top:${rect.top}px;left:${rect.left}px;`;
  document.body.appendChild(ghost);

  el.classList.add('dragging');
  bar.style.setProperty('--drag-w', rect.width+'px');

  _drag={
    tabId, el, ghost,
    bar, barRect,
    tabW: rect.width,
    offsetX: e.clientX - rect.left,
    currentIdx: _getDOMOrder().indexOf(tabId),
    targetIdx: null,
    insertBeforeEl: null,
  };
}

function _moveDrag(e){
  if(!_drag)return;
  const {ghost,bar,barRect,tabW,offsetX}=_drag;

  const rawLeft=e.clientX-offsetX;
  const minLeft=barRect.left;
  const maxLeft=barRect.right-tabW;
  const clampedLeft=Math.max(minLeft,Math.min(maxLeft,rawLeft));
  ghost.style.left=clampedLeft+'px';

  const ghostCenter=clampedLeft+tabW/2;

  const otherEls=[...bar.querySelectorAll('.tab:not(.dragging)')];
  const fullOrder=[...bar.querySelectorAll('.tab')];
  const dragEl=bar.querySelector(`.tab[data-id="${_drag.tabId}"]`);
  const dragFullIdx=fullOrder.indexOf(dragEl);

  let insertBefore=otherEls.length;
  for(let i=0;i<otherEls.length;i++){
    const r=otherEls[i].getBoundingClientRect();
    const naturalLeft=parseFloat(otherEls[i].dataset.naturalLeft||r.left);
    otherEls[i].dataset.naturalLeft=naturalLeft;
    const center=naturalLeft+r.width/2;
    if(ghostCenter<center){insertBefore=i;break;}
  }

  let targetFullIdx;
  if(insertBefore>=otherEls.length){
    targetFullIdx=fullOrder.length-1;
  } else {
    targetFullIdx=fullOrder.indexOf(otherEls[insertBefore]);
    if(dragFullIdx<targetFullIdx) targetFullIdx--;
  }

  _drag.targetIdx=targetFullIdx;
  _drag.insertBeforeEl=insertBefore<otherEls.length?otherEls[insertBefore]:null;

  otherEls.forEach((tabEl,i)=>{
    tabEl.classList.remove('drag-shift-left','drag-shift-right','drag-settle');
    if(dragFullIdx<=fullOrder.indexOf(tabEl)){
      if(i<insertBefore) tabEl.classList.add('drag-settle');
      else if(i===insertBefore) tabEl.classList.add('drag-shift-right');
      else tabEl.classList.add('drag-settle');
    } else {

      if(i>=insertBefore) tabEl.classList.add('drag-shift-right');
      else tabEl.classList.add('drag-settle');
    }

    tabEl.classList.remove('drag-shift-left','drag-shift-right','drag-settle');
  });

  otherEls.forEach((tabEl,i)=>{
    if(i>=insertBefore) tabEl.classList.add('drag-shift-right');
    else tabEl.classList.remove('drag-shift-right');
  });
  otherEls.forEach((tabEl,i)=>{
    tabEl.classList.remove('drag-shift-left','drag-shift-right');
    const wasAfterDrag=fullOrder.indexOf(tabEl)>dragFullIdx;
    if(!wasAfterDrag && i>=insertBefore){
      tabEl.classList.add('drag-shift-right');
    } else if(wasAfterDrag && i<insertBefore){
      tabEl.classList.add('drag-shift-left');
    }
  });
}

function _endDrag(){
  if(!_drag)return;
  const {tabId,ghost,bar,insertBeforeEl}=_drag;

  bar.querySelectorAll('.tab').forEach(t=>t.classList.remove('drag-shift-left','drag-shift-right','drag-settle','dragging'));
  bar.querySelectorAll('.tab').forEach(t=>delete t.dataset.naturalLeft);
  ghost.remove();

  const dragEl=bar.querySelector(`.tab[data-id="${tabId}"]`);
  if(dragEl){
    if(insertBeforeEl&&insertBeforeEl!==dragEl){
      bar.insertBefore(dragEl,insertBeforeEl);
    } else if(!insertBeforeEl){
      bar.insertBefore(dragEl,bar.querySelector('.tab-new'));
    }
  }

  bar.style.removeProperty('--drag-w');
  _drag=null;
  setTimeout(updateOverflow,0);
}

function _getDOMOrder(){
  return [...document.getElementById('tab-bar').querySelectorAll('.tab')].map(el=>el.dataset.id);
}

function tabCtx(e,id){
  e.preventDefault();const tab=tabs[id];if(!tab)return;
  const m=document.getElementById('ctx');
  m.innerHTML=`<div class="ctx-row" onclick="dupTab('${id}');closeCtx()"><i class="fa-solid fa-clone"></i> Duplicate</div><div class="ctx-row" onclick="pinTab('${id}');closeCtx()"><i class="fa-solid fa-thumbtack"></i> ${tab.pinned?'Unpin':'Pin'}</div><div class="ctx-row" onclick="muteTab('${id}');closeCtx()"><i class="fa-solid fa-volume-xmark"></i> ${tab.muted?'Unmute':'Mute'}</div><div class="ctx-sep"></div><div class="ctx-row" onclick="newTab();closeCtx()"><i class="fa-solid fa-plus"></i> New tab</div><div class="ctx-row" onclick="closeOthers('${id}');closeCtx()"><i class="fa-solid fa-layer-group"></i> Close others</div><div class="ctx-row" onclick="closeToRight('${id}');closeCtx()"><i class="fa-solid fa-arrow-right"></i> Close to right</div><div class="ctx-sep"></div><div class="ctx-row red" onclick="closeTab('${id}');closeCtx()"><i class="fa-solid fa-xmark"></i> Close</div>`;
  m.style.left=Math.min(e.clientX,window.innerWidth-200)+'px';m.style.top=Math.min(e.clientY,window.innerHeight-230)+'px';m.classList.add('open');
}
function closeCtx(){document.getElementById('ctx').classList.remove('open');}
document.addEventListener('click',()=>closeCtx());

let _findMatches=[],_findIdx=0,_findActive=false;

function closeFind(){
  const bar=document.getElementById('find-bar');
  if(!bar)return;
  bar.classList.remove('open');
  _findActive=false;
  try{
    const pane=document.getElementById('p-'+activeTabId);
    const iframe=pane&&pane.querySelector('iframe');
    if(iframe&&iframe.contentDocument){
      iframe.contentDocument.querySelectorAll('.__hs_find').forEach(el=>{
        el.outerHTML=el.textContent;
      });
    }
  }catch{}
  _findMatches=[];_findIdx=0;
  const input=document.getElementById('find-input');
  if(input)input.value='';
  document.getElementById('find-count').textContent='0 / 0';
}

function toggleFind(){
  const bar=document.getElementById('find-bar');
  if(!bar)return;
  if(bar.classList.contains('open')){
    closeFind();
  }else{
    bar.classList.add('open');
    _findActive=true;
    const input=document.getElementById('find-input');
    if(input){input.value='';input.focus();}
  }
}

function _doFind(query){
  const count=document.getElementById('find-count');
  if(!query){_findMatches=[];_findIdx=0;count.textContent='0 / 0';return;}
  const pane=document.getElementById('p-'+activeTabId);
  if(!pane){count.textContent='0 / 0';return;}
  let searchRoot=pane;
  try{
    const iframe=pane.querySelector('iframe');
    if(iframe&&iframe.contentDocument&&iframe.contentDocument.body)
      searchRoot=iframe.contentDocument.body;
  }catch{}
  searchRoot.querySelectorAll('.__hs_find').forEach(el=>{
    const t=document.createTextNode(el.textContent);
    el.replaceWith(t);
  });
  searchRoot.normalize();
  const walker=document.createTreeWalker(searchRoot,NodeFilter.SHOW_TEXT);
  const re=new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
  const nodes=[];let node;
  while((node=walker.nextNode())){
    if(node.textContent.match(re))nodes.push(node);
  }
  _findMatches=[];
  nodes.forEach(n=>{
    let html=n.textContent.replace(re,m=>`<mark class="__hs_find" style="background:rgba(232,121,200,0.45);color:#fff;border-radius:2px;padding:0 1px;">${m}</mark>`);
    const span=document.createElement('span');span.innerHTML=html;
    n.replaceWith(span);
    span.querySelectorAll('.__hs_find').forEach(m=>_findMatches.push(m));
  });
  _findIdx=0;
  _scrollToMatch();
}

function _scrollToMatch(){
  const count=document.getElementById('find-count');
  if(!_findMatches.length){count.textContent='0 / 0';return;}
  _findMatches.forEach((m,i)=>{
    m.style.background=i===_findIdx?'rgba(245,200,66,0.85)':'rgba(232,121,200,0.45)';
    m.style.color=i===_findIdx?'#000':'#fff';
  });
  _findMatches[_findIdx].scrollIntoView({behavior:'smooth',block:'center'});
  count.textContent=`${_findIdx+1} / ${_findMatches.length}`;
}

function findNext(){
  if(!_findMatches.length)return;
  _findIdx=(_findIdx+1)%_findMatches.length;_scrollToMatch();
}
function findPrev(){
  if(!_findMatches.length)return;
  _findIdx=(_findIdx-1+_findMatches.length)%_findMatches.length;_scrollToMatch();
}

document.getElementById('find-input').addEventListener('input',e=>{
  _doFind(e.target.value.trim());
});
document.getElementById('find-input').addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.shiftKey?findPrev():findNext();}
  if(e.key==='Escape'){closeFind();}
  e.stopPropagation();
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeCtx();closeFind();closeModal();}
});

async function nav(id,url,push=true){
  if(!id||!tabs[id])id=activeTabId;if(!url)return;

  const rawInput=url.trim();
  const isSearchQuery=!rawInput.includes('://')&&!rawInput.startsWith('/')&&!isUrl(rawInput);

  if(!url.includes('://')&&!url.startsWith('/'))url=isUrl(url)?(url.startsWith('http')?url:'https://'+url):'https://hs-search.pages.dev/?q='+encodeURIComponent(url);
  const tab=tabs[id];
  if(push){tab.hist=tab.hist.slice(0,tab.hi+1);tab.hist.push(url);tab.hi=tab.hist.length-1;}
  tab.url=url;
  if(id===activeTabId){document.getElementById('url-bar').value=url;updateNavBtns();updateSideActive(url);updateLock(url);updateBmStar(url);}
  if(url.startsWith('hyperspeed://')){
    const pg=url.replace('hyperspeed://','');tab.title=pg;tab.favicon=picon(pg);renderPane(id,pg);renderTabs();return;
  }
  if(matchesList(blacklist,url)){tab.title='blocked';tab.favicon='fa-solid fa-ban';renderBlocked(id,url);renderTabs();return;}
  if(matchesList(greylist,url)){tab.title='warning';tab.favicon='fa-solid fa-triangle-exclamation';renderGreyWarn(id,url);renderTabs();return;}
  tab.title=shortUrl(url);tab.favicon='fa-solid fa-shield-halved';renderTabs();
  showScanOverlay(id);
  const verdict=isSearchQuery ? await guardCheckQuery(rawInput) : await guardCheck(url);
  hideScanOverlay(id);
  if(verdict==='block'){tab.favicon='fa-solid fa-ban';renderBlocked(id,url);renderTabs();return;}
  if(verdict==='warn'){tab.favicon='fa-solid fa-triangle-exclamation';renderGreyWarn(id,url);renderTabs();return;}
  let qVerdict='allow';
  if(!isSearchQuery){
    try{
      const qp=new URL(url).searchParams;
      const q=qp.get('q')||qp.get('query')||qp.get('search')||'';
      if(q)qVerdict=await guardCheckQuery(q);
    }catch{}
  }
  if(qVerdict==='block'){tab.favicon='fa-solid fa-ban';renderBlocked(id,url);renderTabs();return;}
  if(qVerdict==='warn'){tab.favicon='fa-solid fa-triangle-exclamation';renderGreyWarn(id,url);renderTabs();return;}
  tab.favicon='fa-solid fa-globe';renderWeb(id,url);addHist(url);renderTabs();
}
function urlKey(e){if(e.key==='Enter')nav(activeTabId,e.target.value.trim());}
function goBack(){const t=tabs[activeTabId];if(t&&t.hi>0){t.hi--;nav(activeTabId,t.hist[t.hi],false);}}
function goFwd(){const t=tabs[activeTabId];if(t&&t.hi<t.hist.length-1){t.hi++;nav(activeTabId,t.hist[t.hi],false);}}
function reload(){const t=tabs[activeTabId];if(t)nav(activeTabId,t.url,false);}
function updateNavBtns(){const t=tabs[activeTabId];document.getElementById('btn-back').disabled=!t||t.hi<=0;document.getElementById('btn-fwd').disabled=!t||t.hi>=t.hist.length-1;}
function updateSideActive(url){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));if(url.startsWith('hyperspeed://')){const b=document.getElementById('btn-'+url.replace('hyperspeed://',''));if(b)b.classList.add('active');}}
function updateLock(url){const i=document.getElementById('url-lock');if(url.startsWith('https://'))i.className='url-lock secure fa-solid fa-lock';else if(url.startsWith('http://'))i.className='url-lock fa-solid fa-lock-open';else i.className='';}

function timerStart(){
  _ns=performance.now();if(_tt)clearInterval(_tt);
  const p=document.getElementById('load-pill');p.className='pill load-pill loading';
  document.querySelector(`.tab[data-id="${activeTabId}"]`)?.classList.add('loading');
  _tt=setInterval(()=>{const ms=performance.now()-_ns;p.textContent=ms<1000?Math.round(ms)+'ms':(ms/1000).toFixed(2)+'s';},50);
}
function timerStop(){
  if(!_ns)return;if(_tt){clearInterval(_tt);_tt=null;}
  const ms=performance.now()-_ns;const p=document.getElementById('load-pill');
  p.textContent=ms<1000?Math.round(ms)+'ms':(ms/1000).toFixed(2)+'s';p.className='pill load-pill done';
  _ns=null;document.querySelectorAll('.tab.loading').forEach(t=>t.classList.remove('loading'));
}

async function renderPane(id,pg){
  const pane=document.getElementById('p-'+id);if(!pane)return;pane.innerHTML='';
  if(pg==='newtab'){const v=document.createElement('div');v.className='iv';v.innerHTML=buildNT();pane.appendChild(v);setupNT(v);timerStart();setTimeout(timerStop,80);}
  else if(pg==='history'){const v=document.createElement('div');v.className='iv';v.innerHTML=await buildHistPage();pane.appendChild(v);timerStart();setTimeout(timerStop,60);}
  else{const f=document.createElement('iframe');f.style.cssText='width:100%;height:100%;border:none;background:transparent;';f.src='/pages/'+pg+'.html';timerStart();f.onload=()=>timerStop();pane.appendChild(f);}
}
function renderWeb(id,url){
  const pane=document.getElementById('p-'+id);if(!pane)return;pane.innerHTML='';
  const f=document.createElement('iframe');f.sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation';
  const enc=(typeof __hyperspeed$config!=='undefined')?__hyperspeed$config.encodeUrl(url):encodeURIComponent(btoa(url));
  f.src='/hypertunnel/'+enc;timerStart();f.onload=()=>timerStop();pane.appendChild(f);
}

function renderBlocked(id,url){
  const pane=document.getElementById('p-'+id);if(!pane)return;pane.innerHTML='';
  const v=document.createElement('div');v.className='iv';
  const host=url.replace(/^https?:\/\/(www\.)?/,'').split('/')[0];
  v.innerHTML=`<div class="interstitial blocked-page"><div class="int-icon"><i class="fa-solid fa-ban"></i></div><div class="int-code">BLOCKED</div><div class="int-title">You will NOT be wasting my bandwidth on this</div><div class="int-host">${host}</div><div class="int-msg">This site has been blocked by Hyperspeed.</div><div class="int-actions"><button class="int-btn int-btn-back" onclick="goBack()"><i class="fa-solid fa-chevron-left"></i> Go Back</button></div></div>`;
  pane.appendChild(v);
}

function renderGreyWarn(id,url){
  const pane=document.getElementById('p-'+id);if(!pane)return;pane.innerHTML='';
  const v=document.createElement('div');v.className='iv';
  const host=url.replace(/^https?:\/\/(www\.)?/,'').split('/')[0];
  v.innerHTML=`<div class="interstitial grey-page"><div class="int-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="int-code">COMPATIBILITY WARNING</div><div class="int-title">Hyperspeed may not work on this site</div><div class="int-host">${host}</div><div class="int-msg">This site has been confirmed to have issues running through the Hyperspeed proxy. You may encounter broken pages, missing content, or errors.</div><div class="int-actions"><button class="int-btn int-btn-back" onclick="goBack()"><i class="fa-solid fa-chevron-left"></i> Go Back</button><button class="int-btn int-btn-proceed" onclick="proceedAnyway('${id}','${url}')"><i class="fa-solid fa-arrow-right"></i> Proceed Anyway</button></div></div>`;
  pane.appendChild(v);
}

function proceedAnyway(id,url){
  const tab=tabs[id];if(!tab)return;
  tab.title=shortUrl(url);tab.favicon='fa-solid fa-globe';
  renderWeb(id,url);addHist(url);renderTabs();
}

function updateBmStar(url){document.getElementById('bm-star').classList.toggle('saved',bookmarks.some(b=>b.url===url));}
async function toggleBm(){
  const t=tabs[activeTabId];if(!t)return;const url=t.url;
  if(bookmarks.some(b=>b.url===url)){bookmarks=bookmarks.filter(b=>b.url!==url);if(window._dbReady)try{await window._db.delBm(url);}catch(e){}toast('Bookmark removed','fa-regular fa-star');}
  else{const bm={url,title:t.title,favicon:t.favicon};bookmarks.push(bm);if(window._dbReady)try{await window._db.addBm(bm);}catch(e){}toast('Bookmark saved','fa-solid fa-star');}
  updateBmStar(url);renderBmBar();
}
function toggleBmBar(){bmBarVisible=!bmBarVisible;document.getElementById('browser').classList.toggle('bm-open',bmBarVisible);document.getElementById('btn-bm').classList.toggle('active',bmBarVisible);renderBmBar();if(window._dbReady)try{window._db.setPref('bmBarVisible',bmBarVisible);}catch(e){}updateBmToggleBtn();}
function toggleBmBarModal(){toggleBmBar();}
function updateBmToggleBtn(){const btn=document.getElementById('bm-toggle-btn'),lbl=document.getElementById('bm-toggle-lbl');if(!btn)return;btn.classList.toggle('bm-toggle-on',bmBarVisible);if(lbl)lbl.textContent=bmBarVisible?'visible':'hidden';}
function renderBmBar(){const bar=document.getElementById('bm-bar');if(!bmBarVisible){bar.innerHTML='';return;}bar.innerHTML=bookmarks.length?bookmarks.map(b=>`<div class="bm-chip" onclick="nav(activeTabId,'${b.url}')"><i class="${b.favicon}"></i> ${b.title}</div>`).join(''):'<span class="bm-empty">no bookmarks — press ★ to add</span>';}

async function addHist(url){const e={url,title:shortUrl(url),time:Date.now()};histList.unshift(e);if(histList.length>100)histList=histList.slice(0,100);if(window._dbReady)try{await window._db.addHist(e);}catch(e){}}
async function buildHistPage(){
  if(window._dbReady)try{histList=await window._db.getHist(60);}catch(e){}
  const items=histList.slice(0,60);
  if(!items.length)return`<div class="stub"><div class="stub-ico"><i class="fa-solid fa-clock-rotate-left"></i></div><div class="stub-lbl">history</div><div class="stub-desc">no history yet</div></div>`;
  return`<div class="ipage"><div class="ipage-h">browsing history</div>${items.map(h=>{const ts=h.visitedAt?.seconds?new Date(h.visitedAt.seconds*1000):new Date(h.time||0);return`<div class="irow" onclick="nav(activeTabId,'${h.url}')"><i class="fa-solid fa-globe" style="color:rgba(232,121,200,0.25);font-size:11px;flex-shrink:0"></i><span style="font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(220,210,245,0.65);font-family:var(--mono)">${h.url}</span><span style="font-size:8px;color:rgba(200,190,230,0.25);flex-shrink:0;font-family:var(--mono)">${ts.toLocaleString()}</span></div>`;}).join('')}<div class="idanger" onclick="clearHist()">✕ clear history</div></div>`;
}
async function clearHist(){histList=[];if(window._dbReady)try{await window._db.clearHist();}catch(e){}nav(activeTabId,'hyperspeed://history',false);toast('History cleared','fa-solid fa-trash');}


function buildNT(){
  const sites=[['fa-brands fa-wikipedia-w','wikipedia.org','Wiki'],['fa-brands fa-reddit','reddit.com','Reddit'],['fa-brands fa-x-twitter','x.com','X'],['fa-brands fa-github','github.com','GitHub'],['fa-solid fa-newspaper','news.ycombinator.com','HN'],['fa-brands fa-spotify','open.spotify.com','Spotify']];
  return`<div class="newtab"><div class="nt-logo"><div class="nt-emblem"><img src="img/favicon.png" alt="Hyperspeed"/></div><div class="nt-word"><span class="h">HYPER</span><span class="s">SPEED</span></div><div class="nt-sub">THE FASTEST PROXY EVER MADE.</div></div><div class="nt-clock" id="nt-clock"></div><div class="nt-sw"><input class="nt-search" id="nt-srch" placeholder="search or enter a url…" spellcheck="false" autocomplete="off"/><div class="nt-sicon"><i class="fa-solid fa-magnifying-glass"></i></div><div class="nt-sugs" id="nt-sugs"></div></div><div class="nt-tiles"><div class="nt-tile pk" onclick="nav(activeTabId,'hyperspeed://games')"><div class="tile-ico"><i class="fa-solid fa-gamepad"></i></div><div class="tile-name">games</div><div class="tile-desc">Play unblocked</div></div><div class="nt-tile cy" onclick="nav(activeTabId,'hyperspeed://movies')"><div class="tile-ico"><i class="fa-solid fa-film"></i></div><div class="tile-name">movies</div><div class="tile-desc">Stream free</div></div><div class="nt-tile pk" onclick="nav(activeTabId,'hyperspeed://ai')"><div class="tile-ico"><i class="fa-solid fa-robot"></i></div><div class="tile-name">ai</div><div class="tile-desc">Ask anything</div></div><div class="nt-tile cy" onclick="nav(activeTabId,'hyperspeed://settings')"><div class="tile-ico"><i class="fa-solid fa-gear"></i></div><div class="tile-name">settings</div><div class="tile-desc">Configure</div></div></div><div class="nt-div"></div><div class="nt-sites">${sites.map(([ic,url,label])=>`<div class="nt-site" onclick="nav(activeTabId,'https://${url}')"><div class="nt-sico"><i class="${ic}"></i></div><div class="nt-slbl">${label}</div></div>`).join('')}</div></div>`;
}
const SUGS=[{icon:'fa-solid fa-gamepad',label:'hyperspeed://games',hint:'Games'},{icon:'fa-solid fa-robot',label:'hyperspeed://ai',hint:'AI'},{icon:'fa-solid fa-bolt',label:'https://hs-search.pages.dev',hint:'HS Search'},{icon:'fa-brands fa-youtube',label:'youtube.com',hint:'YouTube'},{icon:'fa-brands fa-github',label:'github.com',hint:'GitHub'}];
function setupNT(view){
  const s=view.querySelector('#nt-srch'),sg=view.querySelector('#nt-sugs');
  if(s){
    s.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        sg.classList.remove('open');
        const v=e.target.value.trim();
        if(!v)return;
        const dest=isUrl(v)?(v.startsWith('http')?v:'https://'+v):'https://hs-search.pages.dev/?q='+encodeURIComponent(v);
        nav(activeTabId,dest);
      }
    });
    s.addEventListener('input',()=>{const v=s.value.trim().toLowerCase();if(!v){sg.classList.remove('open');return;}const m=SUGS.filter(x=>x.label.includes(v)||x.hint.toLowerCase().includes(v));if(!m.length){sg.classList.remove('open');return;}sg.innerHTML=m.map(x=>`<div class="nt-si" onclick="nav(activeTabId,'${x.label}')"><i class="${x.icon}"></i><span>${x.label}</span><span style="margin-left:auto;font-size:8px;color:rgba(200,190,230,0.3);font-family:var(--mono)">${x.hint}</span></div>`).join('');sg.classList.add('open');});
    s.addEventListener('blur',()=>setTimeout(()=>sg.classList.remove('open'),150));
  }
  if(clockInterval)clearInterval(clockInterval);tick();clockInterval=setInterval(tick,1000);
}
function tick(){const el=document.getElementById('nt-clock');if(!el)return;const now=new Date(),pad=n=>String(n).padStart(2,'0');const days=['SUN','MON','TUE','WED','THU','FRI','SAT'];el.textContent=`${days[now.getDay()]}  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;}

window.updateAcctUI=function(user){
  const btn=document.getElementById('acct-btn'),icon=document.getElementById('acct-icon'),tip=document.getElementById('acct-tip');
  if(user){
    const name=user.displayName||user.email||'?';
    const init=name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    btn.classList.remove('guest');icon.style.display='none';
    let sp=btn.querySelector('.ini');if(!sp){sp=document.createElement('span');sp.className='ini';sp.style.cssText='font-size:10px;font-weight:700;font-family:var(--mono);color:#fff;pointer-events:none';btn.appendChild(sp);}
    sp.textContent=init;tip.textContent=name;
    document.getElementById('u-name').textContent=user.displayName||'no display name';
    document.getElementById('u-email').textContent=user.email;
    document.getElementById('u-av').textContent=init;
  }else{
    btn.classList.add('guest');icon.style.display='';tip.textContent='sign in';btn.querySelector('.ini')?.remove();
  }
};
function openModal(){
  document.getElementById('modal-bg').classList.add('open');
  const li=!!window._cu;
  document.getElementById('p-guest').style.display=li?'none':'block';
  document.getElementById('p-user').style.display=li?'block':'none';
  if(!li)authTab('si');
}
function closeModal(){document.getElementById('modal-bg').classList.remove('open');}
document.getElementById('modal-bg').addEventListener('click',e=>{if(e.target===document.getElementById('modal-bg'))closeModal();});
function authTab(w){
  document.getElementById('t-si').classList.toggle('on',w==='si');
  document.getElementById('t-reg').classList.toggle('on',w==='reg');
  document.getElementById('f-si').style.display=w==='si'?'block':'none';
  document.getElementById('f-reg').style.display=w==='reg'?'block':'none';
}
['si-email','si-pw'].forEach(id=>document.getElementById(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')doSignIn();}));
['reg-name','reg-email','reg-pw'].forEach(id=>document.getElementById(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')doRegister();}));

async function registerSW(){
  const dot=document.getElementById('sw-dot'),lbl=document.getElementById('sw-lbl');
  const set=(cls,txt)=>{dot.className='dot '+cls;lbl.textContent=txt;};
  if(!('serviceWorker' in navigator)){set('err','unsupported');return;}set('spin','init');
  try{
    const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
    if(reg.waiting)reg.waiting.postMessage({type:'skip'});await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});return;}
    for(let i=0;i<25;i++){try{const r=await fetch('/sw-check',{cache:'no-store'});if(r.ok&&(await r.json()).ok){set('ok','ready');return;}}catch{}await new Promise(r=>setTimeout(r,200));}
    set('err','error');
  }catch{set('err','failed');}
}
newTab('hyperspeed://newtab');
registerSW();
const _s=document.createElement('script');_s.src='/hyperspeed/hyperspeed.config.js';document.head.appendChild(_s);