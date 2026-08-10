/* Org Chart Builder — standalone. No territories, no geography, no dependency on app.js.
   A free-form tree of positions: title, person, an optional unit/territory label, and an
   optional revenue figure that rolls up the tree. Everything is local to this browser. */
let NODES, nextId, history=[], modal=null, root=0;
const dark=()=>document.documentElement.getAttribute('data-theme')==='dark'
  ||(!document.documentElement.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);
const fmt=n=>'$'+Math.round(n).toLocaleString('en-US');
const fmtM=n=>Math.abs(n)>=1e6?'$'+(n/1e6).toFixed(2)+'M':fmt(n);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=s=>{if(s==null||s==='') return null; const n=parseFloat(String(s).replace(/[^0-9.\-]/g,'')); return isFinite(n)?n:NaN;};
const PAL={light:["#1F3864","#e19b11","#b271a8","#12c6a5","#c33e0a","#167d59","#5060b5","#41a3ff","#028e9c","#dc6e78","#0dadad","#9048a5","#058750"],
           dark:["#3d5c9e","#c18408","#a53d99","#10ad8f","#b83804","#097552","#4654d8","#3d95e8","#0a98a6","#dc6e79","#01abaa","#9951af","#039256"]};
const colOf=n=>(dark()?PAL.dark:PAL.light)[(n.colorIdx||0)%PAL.light.length];

/* ---------- state ---------- */
function blankChart(){ NODES=[{id:0,parent:null,title:'Chief Revenue Officer',name:'',unit:'',revenue:null,colorIdx:0}]; nextId=1; }
function byId(id){ return NODES.find(n=>n.id===id); }
function childrenOf(id){ return NODES.filter(n=>n.parent===id); }
function descendants(id){ const out=[]; childrenOf(id).forEach(c=>{ out.push(c.id); out.push(...descendants(c.id)); }); return out; }
function rollup(id){
  const n=byId(id); let heads=1, rev=n.revenue||0;
  childrenOf(id).forEach(c=>{ const r=rollup(c.id); heads+=r.heads; rev+=r.rev; });
  return {heads,rev};
}
function push(){ history.push(JSON.stringify({NODES,nextId})); if(history.length>250) history.shift(); }
function undo(){ if(!history.length) return; const o=JSON.parse(history.pop()); NODES=o.NODES; nextId=o.nextId; modal=null; render(); }

/* ---------- storage ---------- */
const KEY='salesmapping.orgchart.v1';
let saveT=null, savedAt=null, saveOff=false;
function autosave(){ if(saveOff) return; if(saveT) clearTimeout(saveT);
  saveT=setTimeout(()=>{ try{
      localStorage.setItem(KEY,JSON.stringify({at:Date.now(),NODES,nextId}));
      savedAt=Date.now(); stampSaved();
    }catch(e){ saveOff=true; stampSaved('could not save — this browser is out of room or in private mode'); } },500); }
function restore(){
  try{ const raw=localStorage.getItem(KEY); if(!raw) return false;
    const o=JSON.parse(raw); if(!o||!Array.isArray(o.NODES)||!o.NODES.length) return false;
    NODES=o.NODES; nextId=o.nextId||(Math.max(...NODES.map(n=>n.id))+1); savedAt=o.at||null; return true;
  }catch(e){ return false; } }
const ago=t=>{const s=Math.round((Date.now()-t)/1000);
  if(s<45) return 'just now'; if(s<5400) return Math.round(s/60)+' min ago';
  const h=Math.round(s/3600); return h<36?h+' hr ago':Math.round(h/24)+' days ago';};
function stampSaved(err){
  const el=document.getElementById('saved'); if(!el) return;
  el.innerHTML = err ? `<span class="sv bad">${esc(err)}</span>`
    : savedAt ? `<span class="sv">saved in this browser · ${ago(savedAt)}</span>` : '';}

/* ---------- modal (same pattern as the mapping tool) ---------- */
function closeModal(){ modal=null; render(); }
function modalHTML(){
  if(!modal) return '';
  const f=modal.fields.map(f=>{
    if(f.type==='select') return `<label>${f.label}<select id="mf_${f.key}" onchange="modal.fields.find(x=>x.key==='${f.key}').value=this.value">${f.options.map(o=>`<option value="${o.v}" ${String(o.v)===String(f.value)?'selected':''}>${esc(o.t)}</option>`).join('')}</select></label>`;
    if(f.type==='color') return `<label>${f.label}<div class="swatches">${PAL.light.map((c,i)=>`<span class="swpick${i===f.value?' on':''}" style="background:${dark()?PAL.dark[i]:c}" onclick="modal.fields.find(x=>x.key==='${f.key}').value=${i};render()"></span>`).join('')}</div></label>`;
    return `<label>${f.label}<input id="mf_${f.key}" value="${esc(f.value==null?'':f.value)}" placeholder="${esc(f.ph||'')}" oninput="modal.fields.find(x=>x.key==='${f.key}').value=this.value"></label>`;}).join('');
  return `<div class="modalbg" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()">
    <h3>${esc(modal.title)}</h3>${modal.note?`<p class="mnote">${modal.note}</p>`:''}
    ${modal.err?`<p class="merr">${esc(modal.err)}</p>`:''}${f}
    <div class="mbtns">${modal.danger?`<button class="danger" onclick="modalDanger()">${esc(modal.danger)}</button>`:''}
      <span class="spacer"></span><button onclick="closeModal()">Cancel</button>
      <button class="primary" onclick="modalOK()">${esc(modal.ok||'Save')}</button></div></div></div>`;
}
function readModal(){ const o={}; modal.fields.forEach(f=>{
    if(f.type==='color') o[f.key]=f.value;
    else { const el=document.getElementById('mf_'+f.key); o[f.key]=el?el.value:f.value; } }); return o; }
function modalOK(){ const o=readModal(),fn=modal.onOK;
  if(modal.validate){ const err=modal.validate(o); if(err){ modal.err=err; render(); return; } }
  modal=null; push(); fn(o); render(); }
function modalDanger(){ const fn=modal.onDanger; modal=null; push(); fn(); render(); }

/* ---------- add / edit / delete ---------- */
function addNode(parentId){
  const p=byId(parentId)||byId(root);
  modal={title:'Add position',ok:'Add',
    fields:[{key:'title',label:'Position / role',value:'',ph:'e.g. Area Vice President'},
            {key:'name',label:'Person name',value:'',ph:'leave blank if vacant'},
            {key:'unit',label:'Territory / team name',value:'',ph:'optional, e.g. Southeast'},
            {key:'revenue',label:'Revenue',value:'',ph:'optional, e.g. 250000'},
            {key:'parent',label:'Reports to',type:'select',value:p.id,options:NODES.map(n=>({v:n.id,t:n.title+(n.name?' — '+n.name:'')}))},
            {key:'colorIdx',label:'Colour',type:'color',value:(p.colorIdx||0)}],
    validate:o=>{ const r=money(o.revenue); if(o.revenue!==''&&isNaN(r)) return 'Revenue has to be a number.'; return null; },
    onOK:o=>{ NODES.push({id:nextId++,parent:+o.parent,title:o.title.trim()||'Position',name:o.name.trim(),
      unit:o.unit.trim(),revenue:o.revenue===''?null:money(o.revenue),colorIdx:+o.colorIdx}); }};
  render();
}
function editNode(id){
  const n=byId(id), isRoot=id===root, bad=new Set([id,...descendants(id)]);
  const fields=[{key:'title',label:'Position / role',value:n.title,ph:'e.g. Territory Manager'},
    {key:'name',label:'Person name',value:n.name,ph:'leave blank if vacant'},
    {key:'unit',label:'Territory / team name',value:n.unit,ph:'optional'},
    {key:'revenue',label:'Revenue',value:n.revenue==null?'':n.revenue,ph:'optional, e.g. 250000'}];
  if(!isRoot) fields.push({key:'parent',label:'Reports to',type:'select',value:n.parent,
    options:NODES.filter(x=>!bad.has(x.id)).map(x=>({v:x.id,t:x.title+(x.name?' — '+x.name:'')}))});
  fields.push({key:'colorIdx',label:'Colour',type:'color',value:(n.colorIdx||0)});
  modal={title:'Edit position',ok:'Save',danger:isRoot?null:'Delete position',
    fields,
    validate:o=>{ const r=money(o.revenue); if(o.revenue!==''&&isNaN(r)) return 'Revenue has to be a number.'; return null; },
    onOK:o=>{ n.title=o.title.trim()||n.title; n.name=o.name.trim(); n.unit=o.unit.trim();
      n.revenue=o.revenue===''?null:money(o.revenue); n.colorIdx=+o.colorIdx;
      if(!isRoot) n.parent=+o.parent; },
    onDanger:()=>askDelete(id)};
  render();
}
function askDelete(id){
  const n=byId(id), kids=childrenOf(id);
  const others=NODES.filter(x=>x.id!==id && !descendants(id).includes(x.id));
  modal={title:'Delete '+n.title,ok:kids.length?'Move reports and delete':'Delete',
    danger:kids.length?'Delete this position and everyone under it':null,
    note:kids.length?`${kids.length} report${kids.length===1?'':'s'} sit directly under this position. Choose where they go, or delete the whole branch below.`
                     :'This position has no reports under it.',
    fields:kids.length?[{key:'to',label:'Move its reports to',type:'select',value:n.parent!=null?n.parent:others[0].id,
      options:others.map(x=>({v:x.id,t:x.title+(x.name?' — '+x.name:'')}))}]:[],
    onOK:o=>{ if(kids.length) kids.forEach(k=>k.parent=+o.to); NODES=NODES.filter(x=>x.id!==id); },
    onDanger:()=>{ if(!confirm('Delete '+n.title+' and everyone under it? This removes '+(descendants(id).length+1)+' position(s). Undo can bring it back.')) return;
      const gone=new Set([id,...descendants(id)]); NODES=NODES.filter(x=>!gone.has(x.id)); }};
  render();
}
function reorder(id,dir){
  const n=byId(id), sibs=childrenOf(n.parent);
  const pos=sibs.findIndex(s=>s.id===id), swap=sibs[pos+dir]; if(!swap) return;
  const ai=NODES.indexOf(n), bi=NODES.indexOf(swap);
  push(); NODES[ai]=swap; NODES[bi]=n; render();
}

/* ---------- render ---------- */
function nodeHTML(id){
  const n=byId(id), kids=childrenOf(id).sort((a,b)=>NODES.indexOf(a)-NODES.indexOf(b));
  const roll=rollup(id), own=n.revenue?fmt(n.revenue)+' own':null;
  const subBits=[n.unit,fmtM(roll.rev)+(roll.heads>1?' total':''),roll.heads+' head'+(roll.heads===1?'':'s')].filter(Boolean);
  const sibs=childrenOf(n.parent), pos=sibs.findIndex(s=>s.id===id);
  return `<li><div class="pbox${id===root?' cro':''}" style="position:relative" onclick="editNode(${id})">
      <div class="ptitle" style="background:${colOf(n)}">${esc(n.title)}
        <span class="paddbtn" title="add a report under this position" onclick="event.stopPropagation();addNode(${id})">+</span></div>
      <div class="pname">${n.name?esc(n.name):'<i>vacant</i>'}</div>
      ${subBits.length?`<div class="psub">${esc(subBits.join(' · '))}</div>`:''}
      ${sibs.length>1?`<div class="reord"><span onclick="event.stopPropagation();reorder(${id},-1)" title="move earlier">◂</span><span onclick="event.stopPropagation();reorder(${id},1)" title="move later">▸</span></div>`:''}
    </div>${kids.length?`<ul>${kids.map(k=>nodeHTML(k.id)).join('')}</ul>`:''}</li>`;
}
function render(){
  document.getElementById('org').innerHTML=`<div class="tree"><ul>${nodeHTML(root)}</ul></div>`;
  const total=rollup(root);
  document.getElementById('orgmeta').innerHTML=
    `${NODES.length} position${NODES.length===1?'':'s'} · total revenue ${fmtM(total.rev)} ·
     widest span ${Math.max(1,...NODES.map(n=>childrenOf(n.id).length))} direct reports`;
  document.getElementById('undoBtn').disabled=!history.length;
  document.getElementById('modalLayer').innerHTML=modalHTML();
  stampSaved(); autosave();
}

/* ---------- file / export ---------- */
function newChart(){
  if(!confirm('Start a new, empty chart? This throws away the current one in this browser (Save… first if you want to keep it).')) return;
  push(); blankChart(); modal=null; render();
}
function saveOrg(){
  const b=new Blob([JSON.stringify({NODES,nextId},null,1)],{type:'application/json'}),u=URL.createObjectURL(b);
  const a=document.createElement('a'); a.href=u; a.download='org-chart.json'; a.click(); URL.revokeObjectURL(u);
}
function loadOrg(ev){
  const f=ev.target.files[0]; if(!f) return; const r=new FileReader();
  r.onload=()=>{ try{
      const o=JSON.parse(r.result);
      if(!o||!Array.isArray(o.NODES)||!o.NODES.length) throw new Error('not a saved org chart');
      if(!o.NODES.some(n=>n.parent==null)) throw new Error('the file has no top position');
      push(); NODES=o.NODES; nextId=o.nextId||(Math.max(...NODES.map(n=>n.id))+1); modal=null; render();
    }catch(e){ alert('That file does not look like a saved org chart.\n\n'+e.message); } };
  r.readAsText(f); ev.target.value='';
}
function exportCSV(){
  let csv='Depth,Position,Person,Territory/Team,Reports To,Revenue (own),Revenue (subtree),Heads (subtree)\n';
  const q=s=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
  const walk=(id,depth)=>{ const n=byId(id), p=n.parent!=null?byId(n.parent):null, roll=rollup(id);
    csv+=[depth,q(n.title),q(n.name),q(n.unit),q(p?(p.name||p.title):''),n.revenue==null?'':n.revenue,Math.round(roll.rev),roll.heads].join(',')+'\n';
    childrenOf(id).forEach(c=>walk(c.id,depth+1)); };
  walk(root,0);
  const b=new Blob([csv],{type:'text/csv'}),u=URL.createObjectURL(b);
  const a=document.createElement('a'); a.href=u; a.download='org-chart.csv'; a.click(); URL.revokeObjectURL(u);
}
function toggleTheme(){ const d=!dark(); document.documentElement.setAttribute('data-theme',d?'dark':'light');
  document.getElementById('thm').textContent=d?'Light mode':'Dark mode'; render(); }

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  if(!restore()) blankChart();
  render();
  document.getElementById('thm').textContent=dark()?'Light mode':'Dark mode';
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&modal) closeModal();
    if((e.key==='z'||e.key==='Z')&&(e.metaKey||e.ctrlKey)){ e.preventDefault(); undo(); } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ if(!document.documentElement.getAttribute('data-theme')) render(); });
});
