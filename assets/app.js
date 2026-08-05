/* Sales Mapping — territory / area / org structure editor.
   Data arrives at runtime via boot(dataset); nothing here is hard-coded to one company. */
let D,T,ADD,K0,SN,PAL,VALID,TOTREV,TOTH,MX;
let S, history=[], menu=null, modal=null, flash=-1, tab='terr', view='map', sel=[];
const dark=()=>document.documentElement.getAttribute('data-theme')==='dark'
  ||(!document.documentElement.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);
const fmt=n=>'$'+Math.round(n).toLocaleString('en-US');
const fmtM=n=>'$'+(n/1e6).toFixed(2)+'M';
const pct=x=>(x>=0?'+':'')+(x*100).toFixed(1)+'%';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- state ---------- */
function initState(){
  S={ cro:{title:'Chief Revenue Officer',name:''},
      evp:{on:true,title:'EVP of Sales',name:''},
      areas:D.areas.map((a,i)=>({id:i,name:a.name,title:a.role==='ASD'?'Area Sales Director':'Area Vice President',
                                 leader:'',home:a.open?'':a.leader,ci:i,open:!!a.open,lat:a.lat,lon:a.lon})),
      districts:[], nextA:D.areas.length, nextD:1,
      terr:T.map((t,i)=>({a:D.baseline[i],d:null,name:''})),
      add:ADD.map(()=>({a:null,name:''})) };
}
const areaById=id=>S.areas.find(a=>a.id===id);
const distById=id=>S.districts.find(d=>d.id===id);
const colOf=id=>{const a=areaById(id); return a?(dark()?PAL.dark[a.ci%12]:PAL.light[a.ci%12]):'#888';};
const areaOfAdd=j=>S.add[j].a!=null?S.add[j].a:S.terr[ADD[j].parent].a;
const distOfAdd=j=>S.add[j].a!=null?null:S.terr[ADD[j].parent].d;
function push(){ history.push(JSON.stringify(S)); if(history.length>250) history.shift(); }

/* ---------- metrics ---------- */
function stats(){
  const m={}; S.areas.forEach(a=>m[a.id]={rev:0,heads:0,terr:0,adds:0,land:0,dists:0,direct:0});
  S.terr.forEach((x,i)=>{ const o=m[x.a]; if(!o) return; o.rev+=T[i].rev; o.heads+=1; o.terr+=1; o.land+=T[i].land;
    if(x.d==null) o.direct+=1; });
  S.add.forEach((x,j)=>{ const a=areaOfAdd(j), o=m[a]; if(!o) return; o.heads+=1; o.adds+=1;
    if(distOfAdd(j)==null) o.direct+=1; });
  S.districts.forEach(d=>{ if(m[d.areaId]) m[d.areaId].dists+=1; });
  return m;
}
function distStats(){
  const m={}; S.districts.forEach(d=>m[d.id]={rev:0,heads:0,terr:0,adds:0});
  S.terr.forEach((x,i)=>{ if(x.d!=null&&m[x.d]){m[x.d].rev+=T[i].rev;m[x.d].heads+=1;m[x.d].terr+=1;} });
  S.add.forEach((x,j)=>{ const d=distOfAdd(j); if(d!=null&&m[d]){m[d].heads+=1;m[d].adds+=1;} });
  return m;
}
function connected(aid){ const mem=[]; S.terr.forEach((x,i)=>{if(x.a===aid) mem.push(i);});
  if(!mem.length) return true;
  const set=new Set(mem),seen=new Set([mem[0]]),st=[mem[0]];
  while(st.length){const x=st.pop(); for(const y of (D.adj[x]||[])) if(set.has(y)&&!seen.has(y)){seen.add(y);st.push(y);}}
  return seen.size===mem.length; }
function issues(){
  const out=[], m=stats();
  S.areas.forEach(a=>{ if(m[a.id].terr===0) out.push({sev:'warn',txt:`${a.name} has no territories.`});
    else if(!connected(a.id)) out.push({sev:'bad',txt:`${a.name} is not geographically contiguous — it has been split into separate pieces.`}); });
  D.homes.forEach(h=>{ const areas=[...new Set(h.core.map(i=>S.terr[i].a))];
    if(areas.length>1) out.push({sev:'warn',txt:`The ${h.leader} leader's home market is split across ${areas.length} areas.`});
    else { const a=areaById(areas[0]); if(a && a.home && a.home!==h.leader)
      out.push({sev:'warn',txt:`The ${h.leader} leader's home market now sits in ${a.name}, which is based in ${a.home}.`}); } });
  D.colocate.forEach(([x,y])=>{ if(S.terr[x].a!==S.terr[y].a)
    out.push({sev:'warn',txt:`${T[x].name} and ${T[y].name} are the same metro but sit in different areas.`}); });
  S.add.forEach((x,j)=>{ if(x.a!=null && x.a!==S.terr[ADD[j].parent].a)
    out.push({sev:'warn',txt:`Planned add ${ADD[j].market} sits in ${areaById(x.a).name} but its territory ${T[ADD[j].parent].name} is elsewhere.`}); });
  if(S.areas.length>VALID) out.push({sev:'warn',txt:`${S.areas.length} areas — colours beyond the seventh are not colour-blind validated, so rely on the labels.`});
  return out;
}
const tgtRev=()=>TOTREV/Math.max(1,S.areas.length), tgtH=()=>TOTH/Math.max(1,S.areas.length);

/* ---------- map ---------- */
function tint(hex,m){const s=m==='light'?[252,252,251]:[26,26,25],f=m==='light'?0.34:0.40;
  const c=[1,3,5].map(i=>parseInt(hex.substr(i,2),16));
  return '#'+c.map((v,i)=>Math.round(s[i]+(v-s[i])*f).toString(16).padStart(2,'0')).join('');}
function stateArea(){const z={};
  for(const st in D.stateTerr){const t={};
    D.stateTerr[st].forEach(i=>{const a=S.terr[i].a; t[a]=t[a]||[0,0]; t[a][0]++; t[a][1]+=T[i].rev/T[i].states.length;});
    z[st]=+Object.keys(t).sort((p,q)=>t[q][0]-t[p][0]||t[q][1]-t[p][1])[0];}
  return z;}
function drawMap(){
  const m=dark()?'dark':'light', surf=m==='light'?'#fcfcfb':'#1a1a19', ink=m==='light'?'#0b0b0b':'#ffffff';
  const sa=stateArea(), sts=Object.keys(sa);
  const ids=S.areas.map(a=>a.id), pos={}; ids.forEach((id,i)=>pos[id]=i);
  const cs=[]; ids.forEach((id,i)=>{const c=tint(colOf(id),m); cs.push([i/ids.length,c]); cs.push([(i+1)/ids.length,c]);});
  const hotT=new Set(menu&&menu.scope.kind!=='add'?menu.scope.ids:sel);
  const hotA=new Set(menu&&menu.scope.kind==='add'?menu.scope.ids:[]);
  const hotS=menu&&menu.scope.st?menu.scope.st:null;
  const tr=[
   {type:'choropleth',locationmode:'USA-states',locations:sts,z:sts.map(s=>pos[sa[s]]+0.5),zmin:0,zmax:ids.length,
    colorscale:cs,showscale:false,name:'states',
    marker:{line:{color:sts.map(s=>s===hotS?ink:surf),width:sts.map(s=>s===hotS?3:1.2)}},
    customdata:sts.map(s=>[SN[s]||s,(D.stateTerr[s]||[]).length]),
    hovertemplate:'<b>%{customdata[0]}</b><br>%{customdata[1]} territory(ies)<extra>click to move the whole state</extra>'},
   {type:'choropleth',locationmode:'USA-states',locations:D.uncovered,z:[0],
    colorscale:[[0,m==='light'?'#e8e8e4':'#2e2e2c'],[1,m==='light'?'#e8e8e4':'#2e2e2c']],
    showscale:false,hoverinfo:'skip',marker:{line:{color:surf,width:1.2}}},
   {type:'scattergeo',mode:'markers',lon:T.map(t=>t.lon),lat:T.map(t=>t.lat),name:'territories',
    marker:{size:T.map(t=>7+30*Math.sqrt(t.rev/MX)),color:T.map((t,i)=>colOf(S.terr[i].a)),
      line:{width:T.map((t,i)=>hotT.has(i)?4.5:1.8),color:T.map((t,i)=>hotT.has(i)?ink:surf)},opacity:.95},
    customdata:T.map((t,i)=>{const d=S.terr[i].d!=null?distById(S.terr[i].d):null;
      return [t.name,t.rev,areaById(S.terr[i].a)?areaById(S.terr[i].a).name:'—',d?d.name:'—'];}),
    hovertemplate:'<b>%{customdata[0]}</b><br>%{customdata[2]}<br>District: %{customdata[3]}<br>$%{customdata[1]:,.0f}<extra>click to reassign</extra>'},
   {type:'scattergeo',mode:'markers',lon:ADD.map(a=>a.lon),lat:ADD.map(a=>a.lat),name:'adds',
    marker:{size:ADD.map((a,j)=>hotA.has(j)?18:14),color:surf,
      line:{width:ADD.map((a,j)=>hotA.has(j)?4.5:3),color:ADD.map((a,j)=>colOf(areaOfAdd(j)))}},
    customdata:ADD.map((a,j)=>[a.market,a.role,a.timing,areaById(areaOfAdd(j)).name]),
    hovertemplate:'<b>%{customdata[0]}</b> — planned add<br>%{customdata[3]}<br>%{customdata[1]} · %{customdata[2]}<extra>click to reassign</extra>'},
   {type:'scattergeo',mode:'markers',lon:S.areas.map(a=>a.lon),lat:S.areas.map(a=>a.lat),name:'leaders',
    marker:{size:18,symbol:'star',color:S.areas.map(a=>colOf(a.id)),line:{width:1.6,color:surf}},
    customdata:S.areas.map(a=>[a.leader||(a.home?'vacant — based in '+a.home:'(vacant)'),a.name]),
    hovertemplate:'<b>%{customdata[0]}</b><br>%{customdata[1]}<extra>area leader</extra>'}];
  Plotly.react('map',tr,{geo:{scope:'usa',bgcolor:surf,showland:true,landcolor:surf,showlakes:false,
    showframe:false,showcoastlines:false,subunitcolor:surf,lakecolor:surf},
    paper_bgcolor:surf,plot_bgcolor:surf,font:{family:'Arial',color:ink},
    margin:{l:0,r:0,t:6,b:0},height:520,showlegend:false,dragmode:false},
    {responsive:true,displayModeBar:false,scrollZoom:false});
}

/* ---------- picker ---------- */
function openMenu(x,y,scope,label,sub){menu={x,y,scope,label,sub,expand:false};render();}
function closeMenu(){menu=null;render();}
function moveTo(aid,did){ const sc=menu?menu.scope:{kind:'terr',ids:sel}; menu=null; push();
  if(sc.kind==='add') sc.ids.forEach(j=>{S.add[j].a=aid;});
  else sc.ids.forEach(i=>{S.terr[i].a=aid; S.terr[i].d=did;});
  sel=[]; flash=aid; render(); setTimeout(()=>{flash=-1;renderPanel();},900); }
function relink(){const sc=menu.scope;menu=null;push();sc.ids.forEach(j=>S.add[j].a=null);render();}
function menuHTML(){
  if(!menu) return '';
  const sc=menu.scope;
  const cur = sc.kind==='add'?areaOfAdd(sc.ids[0]):S.terr[sc.ids[0]].a;
  const curD = sc.kind==='add'?null:S.terr[sc.ids[0]].d;
  const same = sc.kind==='add'?sc.ids.every(j=>areaOfAdd(j)===cur):sc.ids.every(i=>S.terr[i].a===cur&&S.terr[i].d===curD);
  let h=`<div class="mh"><div class="mt">${menu.label}</div><div class="ms">${menu.sub}</div></div>`;
  h+=`<div class="msep">move to area</div>`;
  h+=S.areas.map(a=>{
    const isCur = same && a.id===cur && (sc.kind==='add'||curD==null);
    if(isCur) return `<div class="mrow cur"><span class="sw" style="background:${colOf(a.id)}"></span><span class="mname">${esc(a.name)}</span><span class="mdet">current</span></div>`;
    return `<div class="mrow" onclick="moveTo(${a.id},null)"><span class="sw" style="background:${colOf(a.id)}"></span>
      <span class="mname">${esc(a.name)}</span><span class="mdet">${esc(a.leader||a.home||'vacant')}</span></div>`;}).join('');
  if(sc.kind!=='add'){
    if(S.districts.length){
      h+=`<div class="msep">or into a district</div>`;
      h+=S.districts.map(d=>{const a=areaById(d.areaId);
        if(same&&d.id===curD) return `<div class="mrow cur"><span class="sw" style="background:${colOf(d.areaId)}"></span><span class="mname">${esc(d.name)}</span><span class="mdet">current</span></div>`;
        return `<div class="mrow" onclick="moveTo(${d.areaId},${d.id})"><span class="sw" style="background:${colOf(d.areaId)}"></span>
          <span class="mname">${esc(d.name)}</span><span class="mdet">${esc(a?a.name:'')}</span></div>`;}).join('');
    }
    h+=`<div class="mrow back" onclick="newDistrictFrom([${sc.ids.join(',')}])">✚ new district from ${sc.ids.length>1?sc.ids.length+' territories':'this territory'}</div>`;
  }
  if(sc.kind==='add'&&S.add[sc.ids[0]].a!=null)
    h+=`<div class="mrow back" onclick="relink()">↩ follow its territory</div>`;
  if(sc.kind==='state'){const list=D.stateTerr[sc.st];
    h+=`<div class="mrow back" onclick="menu.expand=!menu.expand;render()">${menu.expand?'▾':'▸'} or move one of the ${list.length} territories</div>`;
    if(menu.expand) h+=list.map(i=>`<div class="mrow sub" onclick="pickOne(${i})">
      <span class="sw" style="background:${colOf(S.terr[i].a)}"></span><span class="mname">${esc(T[i].name)}</span>
      <span class="mdet">${fmt(T[i].rev)}</span></div>`).join('');}
  return `<div class="menu" style="left:${menu.x}px;top:${menu.y}px" onclick="event.stopPropagation()">
    <button class="mx" onclick="closeMenu()">✕</button>${h}</div>`;
}
function pickOne(i){menu.scope={kind:'terr',ids:[i]};menu.label=esc(T[i].name);
  menu.sub=`${fmt(T[i].rev)} · now in ${esc(areaById(S.terr[i].a).name)}`;menu.expand=false;render();}

/* ---------- modals ---------- */
function closeModal(){modal=null;render();}
function modalHTML(){
  if(!modal) return '';
  const f=modal.fields.map(f=>{
    if(f.type==='select') return `<label>${f.label}<select id="mf_${f.key}">${f.options.map(o=>`<option value="${o.v}" ${o.v==f.value?'selected':''}>${esc(o.t)}</option>`).join('')}</select></label>`;
    if(f.type==='color') return `<label>${f.label}<div class="swatches">${PAL.light.map((c,i)=>`<span class="swpick${i==f.value?' on':''}" style="background:${dark()?PAL.dark[i]:c}" onclick="modal.fields.find(x=>x.key==='${f.key}').value=${i};render()">${i>=VALID?'!':''}</span>`).join('')}</div></label>`;
    return `<label>${f.label}<input id="mf_${f.key}" value="${esc(f.value)}" placeholder="${esc(f.ph||'')}"></label>`;}).join('');
  return `<div class="modalbg" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()">
    <h3>${esc(modal.title)}</h3>${modal.note?`<p class="mnote">${modal.note}</p>`:''}${f}
    <div class="mbtns">${modal.danger?`<button class="danger" onclick="modalDanger()">${esc(modal.danger)}</button>`:''}
      <span class="spacer"></span><button onclick="closeModal()">Cancel</button>
      <button class="primary" onclick="modalOK()">${esc(modal.ok||'Save')}</button></div></div></div>`;
}
function readModal(){const o={};modal.fields.forEach(f=>{
  if(f.type==='color') o[f.key]=f.value;
  else {const el=document.getElementById('mf_'+f.key); o[f.key]=el?el.value:f.value;}});return o;}
function modalOK(){const o=readModal(),fn=modal.onOK;modal=null;push();fn(o);render();}
function modalDanger(){const fn=modal.onDanger;modal=null;push();fn();render();}

function editArea(id){const a=areaById(id);
  modal={title:'Rename / edit area',ok:'Save',danger:S.areas.length>1?'Delete area':null,
    fields:[{key:'name',label:'Area name',value:a.name},
            {key:'title',label:'Leader title',value:a.title,ph:'Area Vice President'},
            {key:'leader',label:'Leader name',value:a.leader,ph:'leave blank if open'},
            {key:'home',label:'Leader based in',value:a.home||'',ph:'city or state'},
            {key:'ci',label:'Colour',type:'color',value:a.ci}],
    onOK:o=>{a.name=o.name||a.name;a.title=o.title;a.leader=o.leader;a.home=o.home;a.ci=+o.ci;a.open=!o.leader;},
    onDanger:()=>askDeleteArea(id)};render();}
function addArea(){const used=new Set(S.areas.map(a=>a.ci)); let ci=0; while(used.has(ci)&&ci<12) ci++;
  modal={title:'New area',ok:'Create',
    fields:[{key:'name',label:'Area name',value:'New Area '+(S.areas.length+1)},
            {key:'title',label:'Leader title',value:'Area Vice President'},
            {key:'leader',label:'Leader name',value:'',ph:'leave blank if open'},
            {key:'home',label:'Leader based in',value:'',ph:'city or state'},
            {key:'ci',label:'Colour',type:'color',value:ci}],
    note:'It starts empty — move territories into it from the map or the lists.',
    onOK:o=>{S.areas.push({id:S.nextA++,name:o.name||'New area',title:o.title,leader:o.leader,home:o.home,ci:+o.ci,open:!o.leader,
      lat:39.5,lon:-98.35});}};render();}
function askDeleteArea(id){
  const others=S.areas.filter(a=>a.id!==id);
  if(!others.length) return;
  const m=stats()[id];
  modal={title:'Delete area',ok:'Delete',
    note:`${esc(areaById(id).name)} holds ${m.terr} territor${m.terr===1?'y':'ies'} and ${m.heads} head${m.heads===1?'':'s'}. Choose where they go.`,
    fields:[{key:'to',label:'Move its territories to',type:'select',value:others[0].id,
             options:others.map(a=>({v:a.id,t:a.name}))}],
    onOK:o=>{const to=+o.to;
      S.districts.forEach(d=>{if(d.areaId===id) d.areaId=to;});
      S.terr.forEach(t=>{if(t.a===id) t.a=to;});
      S.add.forEach(x=>{if(x.a===id) x.a=to;});
      S.areas=S.areas.filter(a=>a.id!==id);}};render();}
function newDistrictFrom(ids){
  menu=null;
  const aid=ids.length?S.terr[ids[0]].a:S.areas[0].id;
  modal={title:'New district',ok:'Create',
    note:ids.length?`${ids.length} territor${ids.length>1?'ies':'y'} will move into it.`:'It starts empty.',
    fields:[{key:'name',label:'District name',value:ids.length===1?T[ids[0]].name+' District':'New District '+(S.districts.length+1)},
            {key:'title',label:'Leader title',value:'District Manager'},
            {key:'leader',label:'Leader name',value:'',ph:'leave blank if open'},
            {key:'area',label:'Inside area',type:'select',value:aid,options:S.areas.map(a=>({v:a.id,t:a.name}))}],
    onOK:o=>{const d={id:S.nextD++,name:o.name||'New district',title:o.title,leader:o.leader,areaId:+o.area};
      S.districts.push(d); ids.forEach(i=>{S.terr[i].a=+o.area;S.terr[i].d=d.id;}); sel=[];}};render();}
function editDistrict(id){const d=distById(id);
  modal={title:'Rename / edit district',ok:'Save',danger:'Delete district',
    fields:[{key:'name',label:'District name',value:d.name},
            {key:'title',label:'Leader title',value:d.title},
            {key:'leader',label:'Leader name',value:d.leader,ph:'leave blank if open'},
            {key:'area',label:'Inside area',type:'select',value:d.areaId,options:S.areas.map(a=>({v:a.id,t:a.name}))}],
    onOK:o=>{d.name=o.name||d.name;d.title=o.title;d.leader=o.leader;
      if(+o.area!==d.areaId){d.areaId=+o.area; S.terr.forEach(t=>{if(t.d===id) t.a=+o.area;});}},
    onDanger:()=>{S.terr.forEach(t=>{if(t.d===id) t.d=null;}); S.districts=S.districts.filter(x=>x.id!==id);}};render();}
function editPerson(kind,id){
  let o,title;
  if(kind==='cro'){o=S.cro;title='Chief Revenue Officer';}
  else if(kind==='evp'){o=S.evp;title='EVP of Sales';}
  else if(kind==='terr'){o=S.terr[id];title=T[id].name;}
  else if(kind==='add'){o=S.add[id];title=ADD[id].market+' (planned add)';}
  modal={title:'Edit '+title,ok:'Save',
    fields:(kind==='cro'||kind==='evp')?[{key:'title',label:'Title',value:o.title},{key:'name',label:'Name',value:o.name,ph:'leave blank if vacant'}]
          :[{key:'name',label:'Person name',value:o.name,ph:'leave blank if vacant'}],
    onOK:v=>{if(v.title!==undefined)o.title=v.title;o.name=v.name;}};render();}

/* ---------- panels ---------- */
function renderPanel(){
  const m=stats(), dm=distStats(), tr=tgtRev(), th=tgtH();
  const maxBar=Math.max(Math.max(...S.areas.map(a=>m[a.id].rev)),tr)*1.05;
  document.getElementById('cards').innerHTML=S.areas.map(a=>{
    const s=m[a.id], dR=(s.rev-tr)/tr, dH=(s.heads-th)/th;
    const ds=S.districts.filter(d=>d.areaId===a.id);
    return `<div class="card${flash===a.id?' flash':''}" style="border-left-color:${colOf(a.id)}">
      <div class="chead"><div class="n rn" title="click to rename this area" onclick="editArea(${a.id})"><span class="sw" style="background:${colOf(a.id)}"></span>${esc(a.name)}<span class="pen">✎</span></div>
        <div class="cbtn"><button class="mini" onclick="newDistrictFrom([])" title="new district here">＋dist</button>
        <button class="mini" onclick="editArea(${a.id})">rename</button></div></div>
      <div class="who">${a.leader?'★ '+esc(a.leader):'<b class="open">vacant</b>'} <span class="muted">· ${esc(a.title)}${a.home?' · based in '+esc(a.home):''}</span></div>
      <div class="big">${fmt(s.rev)}</div>
      <div class="track"><div class="fill" style="width:${Math.max(0,s.rev)/maxBar*100}%;background:${colOf(a.id)}"></div>
        <div class="tgtline" style="left:${tr/maxBar*100}%"></div></div>
      <div class="m"><span>${pct(dR)} vs target</span><span>${fmt(s.heads?s.rev/s.heads:0)} / head</span></div>
      <div class="m"><span><b>${s.heads}</b> heads · ${s.terr} terr + ${s.adds} adds</span><span>${pct(dH)}</span></div>
      <div class="m"><span>direct reports: <b>${s.dists+s.direct}</b></span><span class="muted">${s.dists} district${s.dists===1?'':'s'} + ${s.direct} direct</span></div>
      ${ds.length?`<div class="dlist">${ds.map(d=>`<div class="drow" title="click to rename this district" onclick="editDistrict(${d.id})">
        <span class="dn">${esc(d.name)}<span class="pen">✎</span></span><span class="dd">${dm[d.id].heads}h · ${fmtM(dm[d.id].rev)} · ${esc(d.leader||'vacant')}</span></div>`).join('')}</div>`:''}
    </div>`;}).join('')+`<button class="addarea" onclick="addArea()">✚ Add area</button>`;
}
function renderTables(){
  const w=document.getElementById('tabbody'); if(!w) return;
  const aOpts=(cur,fn)=>`<select onchange="${fn}">${S.areas.map(a=>`<option value="a${a.id}" ${cur==='a'+a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
    ${S.districts.map(d=>`<option value="d${d.id}" ${cur==='d'+d.id?'selected':''}>&nbsp;&nbsp;↳ ${esc(d.name)}</option>`).join('')}</select>`;
  if(tab==='terr'){
    w.innerHTML=`<table><thead><tr><th>Territory</th><th>Area / district</th><th>Rep name</th><th style="text-align:right">2026 revenue</th><th>States</th></tr></thead><tbody>`
      +T.map((t,i)=>{const x=S.terr[i],cur=x.d!=null?'d'+x.d:'a'+x.a;
        return `<tr class="${x.a!==D.baseline[i]||x.d!=null?'moved':''}"><td>${esc(t.name)}</td>
          <td>${aOpts(cur,`setPlace(${i},this.value)`)}</td>
          <td><input class="nm" value="${esc(x.name)}" placeholder="—" oninput="S.terr[${i}].name=this.value"></td>
          <td class="num">${fmt(t.rev)}</td><td class="muted">${t.states.join(', ')}</td></tr>`;}).join('')+`</tbody></table>`;
  } else if(tab==='state'){
    const sts=Object.keys(D.stateTerr).sort((a,b)=>(SN[a]||a).localeCompare(SN[b]||b));
    w.innerHTML=`<table><thead><tr><th>State</th><th>Move whole state to</th><th style="text-align:right">Terr</th><th>Territories in it</th></tr></thead><tbody>`
      +sts.map(st=>{const ids=D.stateTerr[st],as=[...new Set(ids.map(i=>S.terr[i].a))],mix=as.length>1;
        return `<tr class="${mix?'mixed':''}"><td><b>${esc(SN[st]||st)}</b></td>
          <td><select onchange="setStatePlace('${st}',this.value)">${mix?'<option value="" selected>— split across '+as.length+' areas —</option>':''}
            ${S.areas.map(a=>`<option value="a${a.id}" ${(!mix&&as[0]===a.id)?'selected':''}>${esc(a.name)}</option>`).join('')}
            ${S.districts.map(d=>`<option value="d${d.id}">&nbsp;&nbsp;↳ ${esc(d.name)}</option>`).join('')}</select></td>
          <td class="num">${ids.length}</td><td class="muted">${ids.map(i=>esc(T[i].name)).join(', ')}</td></tr>`;}).join('')+`</tbody></table>`;
  } else if(tab==='add'){
    w.innerHTML=`<table><thead><tr><th>Planned add</th><th>Area</th><th>Person name</th><th>Role</th><th>Timing</th><th>Attaches to</th></tr></thead><tbody>`
      +ADD.map((x,j)=>{const det=S.add[j].a!=null;
        return `<tr class="${det?'moved':''}"><td><b>${esc(x.market)}</b></td>
          <td><select onchange="setAddArea(${j},this.value)"><option value="">follow territory</option>
            ${S.areas.map(a=>`<option value="${a.id}" ${S.add[j].a===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></td>
          <td><input class="nm" value="${esc(S.add[j].name)}" placeholder="—" oninput="S.add[${j}].name=this.value"></td>
          <td class="muted">${esc(x.role)}</td><td class="muted">${esc(x.timing)}</td>
          <td class="muted">${esc(T[x.parent].name)}</td></tr>`;}).join('')+`</tbody></table>`;
  } else {
    const dm=distStats();
    w.innerHTML=`<div class="dtop"><button class="primary" onclick="newDistrictFrom([])">✚ New district</button>
      <span class="muted">Districts sit between the area leader and the reps. Territories inside one report to its leader.</span></div>`
      +(S.districts.length?`<table><thead><tr><th>District</th><th>Leader</th><th>Inside area</th><th style="text-align:right">Heads</th><th style="text-align:right">Revenue</th><th>Territories</th><th></th></tr></thead><tbody>`
      +S.districts.map(d=>{const ts=S.terr.map((x,i)=>x.d===d.id?i:-1).filter(i=>i>=0);
        return `<tr><td><b>${esc(d.name)}</b><div class="muted">${esc(d.title)}</div></td>
          <td>${esc(d.leader||'—')}</td><td><span class="sw" style="background:${colOf(d.areaId)}"></span>${esc(areaById(d.areaId).name)}</td>
          <td class="num">${dm[d.id].heads}</td><td class="num">${fmt(dm[d.id].rev)}</td>
          <td class="muted">${ts.map(i=>esc(T[i].name)).join(', ')||'—'}</td>
          <td><button class="mini" onclick="editDistrict(${d.id})">edit</button></td></tr>`;}).join('')+`</tbody></table>`
      :`<p class="muted" style="padding:10px 2px">No districts yet. Select territories on the map (shift-click for several) and choose “new district”, or click ✚ New district above.</p>`);
  }
  ['terr','state','add','dist'].forEach(k=>{const b=document.getElementById('tab_'+k); if(b) b.setAttribute('aria-pressed',tab===k);});
}
/* ---------- org chart ---------- */
function personBox(cls,color,title,name,sub,onclick){
  const ghost=cls.indexOf('ghost')>=0;
  return `<div class="pbox ${cls}" ${onclick?`onclick="${onclick}"`:''}>
    <div class="ptitle" style="background:${color}">${esc(title)}</div>
    ${ghost?'':`<div class="pname">${name?esc(name):'<i>vacant</i>'}</div>`}
    ${sub?`<div class="psub">${sub}</div>`:''}</div>`;
}
function repBox(i){const t=T[i],x=S.terr[i];
  return personBox('rep',colOf(x.a),'Territory Manager',x.name,`${esc(t.name)} · ${fmtM(t.rev)}`,`editPerson('terr',${i})`);}
function addBox(j){const a=ADD[j];
  return personBox('rep add',colOf(areaOfAdd(j)),esc(a.role),S.add[j].name,`${esc(a.market)} · ${esc(a.timing)}`,`editPerson('add',${j})`);}
function renderOrg(){
  const m=stats(), dm=distStats();
  const areaBlocks=S.areas.map(a=>{
    const ds=S.districts.filter(d=>d.areaId===a.id);
    const direct=S.terr.map((x,i)=>(x.a===a.id&&x.d==null)?i:-1).filter(i=>i>=0);
    const directAdds=ADD.map((x,j)=>(areaOfAdd(j)===a.id&&distOfAdd(j)==null)?j:-1).filter(j=>j>=0);
    const distCols=ds.map(d=>{
      const ts=S.terr.map((x,i)=>x.d===d.id?i:-1).filter(i=>i>=0);
      const as=ADD.map((x,j)=>distOfAdd(j)===d.id?j:-1).filter(j=>j>=0);
      return `<li>${personBox('dist',colOf(a.id),d.title,d.leader,`${esc(d.name)} · ${dm[d.id].heads}h · ${fmtM(dm[d.id].rev)}`,`editDistrict(${d.id})`)}
        <div class="stack">${ts.map(repBox).join('')}${as.map(addBox).join('')}</div></li>`;}).join('');
    const directCol = (direct.length||directAdds.length)
      ? `<li>${personBox('dist ghost',colOf(a.id),'Reports directly to '+esc(a.title),'', (direct.length+directAdds.length)+' head'+((direct.length+directAdds.length)===1?'':'s'),'')}
         <div class="stack">${direct.map(repBox).join('')}${directAdds.map(addBox).join('')}</div></li>` : '';
    return `<li>${personBox('area',colOf(a.id),a.title,a.leader,`${esc(a.name)}${a.home?' · '+esc(a.home):''} · ${m[a.id].heads}h · ${fmtM(m[a.id].rev)}`,`editArea(${a.id})`)}
      ${(distCols||directCol)?`<ul>${distCols}${directCol}</ul>`:''}</li>`;}).join('');
  const inner = S.evp.on
    ? `<li>${personBox('evp','#7a5195',S.evp.title,S.evp.name,'',"editPerson('evp')")}<ul>${areaBlocks}</ul></li>`
    : areaBlocks;
  document.getElementById('org').innerHTML =
    `<div class="tree"><ul><li>${personBox('cro','#1F3864',S.cro.title,S.cro.name,'',"editPerson('cro')")}<ul>${inner}</ul></li></ul></div>`;
  const tot=S.terr.length+ADD.length;
  document.getElementById('orgmeta').innerHTML =
    `${S.areas.length} area${S.areas.length===1?'':'s'} · ${S.districts.length} district${S.districts.length===1?'':'s'} · ${tot} field heads ·
     CRO span ${S.evp.on?1:S.areas.length} · widest area span ${Math.max(...S.areas.map(a=>stats()[a.id].dists+stats()[a.id].direct))} direct reports
     <label class="tg"><input type="checkbox" ${S.evp.on?'checked':''} onchange="push();S.evp.on=this.checked;render()"> EVP layer</label>`;
}
/* ---------- render ---------- */
function render(){
  document.getElementById('mapView').classList.toggle('hide',view!=='map');
  document.getElementById('orgView').classList.toggle('hide',view!=='org');
  document.getElementById('vw_map').setAttribute('aria-pressed',view==='map');
  document.getElementById('vw_org').setAttribute('aria-pressed',view==='org');
  if(view==='map'){ drawMap(); renderPanel(); renderTables(); } else renderOrg();
  const m=stats(), rev=S.areas.map(a=>m[a.id].rev), hd=S.areas.map(a=>m[a.id].heads);
  const tr=tgtRev(), th=tgtH();
  const mn=Math.min(...rev), ratio=mn>0?Math.max(...rev)/mn:null;
  const wR=Math.max(...rev.map(r=>Math.abs(r-tr)/tr)), wH=Math.max(...hd.map(h=>Math.abs(h-th)/th));
  document.getElementById('summary').innerHTML=`
    <div class="stat"><div class="lab">Areas</div><div class="val">${S.areas.length}</div><div class="sub">${S.districts.length} district${S.districts.length===1?'':'s'}</div></div>
    <div class="stat"><div class="lab">Revenue spread (max ÷ min)</div><div class="val">${ratio&&isFinite(ratio)?ratio.toFixed(2)+'x':'—'}</div><div class="sub">target ${fmtM(tr)} each</div></div>
    <div class="stat"><div class="lab">Widest revenue variance</div><div class="val">${(wR*100).toFixed(1)}%</div><div class="sub">${fmtM(Math.min(...rev))} – ${fmtM(Math.max(...rev))}</div></div>
    <div class="stat"><div class="lab">Heads per area</div><div class="val">${Math.min(...hd)}–${Math.max(...hd)}</div><div class="sub">target ${th.toFixed(1)} · widest ${(wH*100).toFixed(1)}%</div></div>`;
  const iss=issues();
  document.getElementById('issues').innerHTML=iss.length
    ? iss.map(x=>`<div class="iss ${x.sev}">${x.sev==='bad'?'✕':'!'} ${esc(x.txt)}</div>`).join('')
    : '<div class="iss ok">✓ Every area contiguous · leaders with their home markets · no metro split · every add with its territory</div>';
  document.getElementById('undoBtn').disabled=!history.length;
  document.getElementById('menuLayer').innerHTML=menuHTML();
  document.getElementById('modalLayer').innerHTML=modalHTML();
  document.getElementById('selbar').innerHTML = sel.length
    ? `<b>${sel.length} selected</b> <span class="muted">${sel.slice(0,4).map(i=>esc(T[i].name)).join(', ')}${sel.length>4?'…':''}</span>
       <button class="mini" onclick="newDistrictFrom([${sel.join(',')}])">✚ new district from these</button>
       <button class="mini" onclick="sel=[];render()">clear</button>`
    : `<span class="muted">Click a state, territory or planned add to reassign it. Shift-click territories to select several, then group them into a district.</span>`;
}
/* ---------- actions ---------- */
function setPlace(i,v){push(); if(v[0]==='d'){const d=distById(+v.slice(1)); S.terr[i].d=d.id; S.terr[i].a=d.areaId;}
  else {S.terr[i].a=+v.slice(1); S.terr[i].d=null;} render();}
function setStatePlace(st,v){ if(!v) return; push();
  D.stateTerr[st].forEach(i=>{ if(v[0]==='d'){const d=distById(+v.slice(1)); S.terr[i].d=d.id; S.terr[i].a=d.areaId;}
    else {S.terr[i].a=+v.slice(1); S.terr[i].d=null;} }); render();}
function setAddArea(j,v){push(); S.add[j].a = v===''?null:+v; render();}
function undo(){ if(!history.length) return; S=JSON.parse(history.pop()); menu=null;modal=null;sel=[]; render(); }
function resetAll(){ push(); initState(); menu=null;modal=null;sel=[]; render(); }
function setTab(k){tab=k;renderTables();}
function setView(v){view=v;render(); if(v==='map') setTimeout(()=>Plotly.Plots.resize('map'),40);}
function saveJSON(){const b=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}),u=URL.createObjectURL(b);
  const a=document.createElement('a');a.href=u;a.download='2027-area-structure.json';a.click();URL.revokeObjectURL(u);}
function loadJSON(ev){const f=ev.target.files[0]; if(!f) return; const r=new FileReader();
  r.onload=()=>{try{const o=JSON.parse(r.result); if(!o.areas||!o.terr) throw 0; push(); S=o; menu=null;modal=null;sel=[]; render();}
    catch(e){alert('That file does not look like a saved structure.');}}; r.readAsText(f); ev.target.value='';}
function exportCSV(){
  const m=stats(), dm=distStats();
  let csv='Level,Name,Person,Title,Based in,Reports to,Area,District,2026 Revenue,Heads\n';
  const q=s=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
  csv+=['CRO',q(S.cro.title),q(S.cro.name),q(S.cro.title),'','','','','',TOTH].join(',')+'\n';
  if(S.evp.on) csv+=['EVP',q(S.evp.title),q(S.evp.name),q(S.evp.title),'',q(S.cro.name||S.cro.title),'','','',TOTH].join(',')+'\n';
  const top=S.evp.on?(S.evp.name||S.evp.title):(S.cro.name||S.cro.title);
  S.areas.forEach(a=>{ csv+=['Area',q(a.name),q(a.leader),q(a.title),q(a.home),q(top),q(a.name),'',Math.round(m[a.id].rev),m[a.id].heads].join(',')+'\n';
    S.districts.filter(d=>d.areaId===a.id).forEach(d=>{
      csv+=['District',q(d.name),q(d.leader),q(d.title),'',q(a.leader||a.name),q(a.name),q(d.name),Math.round(dm[d.id].rev),dm[d.id].heads].join(',')+'\n';});});
  S.terr.forEach((x,i)=>{const a=areaById(x.a),d=x.d!=null?distById(x.d):null;
    csv+=['Territory',q(T[i].name),q(x.name),'"Territory Manager"','',q(d?(d.leader||d.name):(a.leader||a.name)),q(a.name),q(d?d.name:''),T[i].rev,1].join(',')+'\n';});
  S.add.forEach((x,j)=>{const a=areaById(areaOfAdd(j)),dd=distOfAdd(j),d=dd!=null?distById(dd):null;
    csv+=['Planned add',q(ADD[j].market),q(x.name),q(ADD[j].role),'',q(d?(d.leader||d.name):(a.leader||a.name)),q(a.name),q(d?d.name:''),0,1].join(',')+'\n';});
  const b=new Blob([csv],{type:'text/csv'}),u=URL.createObjectURL(b);
  const el=document.createElement('a');el.href=u;el.download='2027-org-structure.csv';el.click();URL.revokeObjectURL(u);}
function toggleTheme(){const d=!dark();document.documentElement.setAttribute('data-theme',d?'dark':'light');
  document.getElementById('thm').textContent=d?'Light mode':'Dark mode';render();}
/* ---------- wire ---------- */
function at(ev){const h=document.getElementById('mapWrap').getBoundingClientRect();
  let x=(ev&&ev.clientX!==undefined?ev.clientX-h.left:h.width/2)+8;
  let y=(ev&&ev.clientY!==undefined?ev.clientY-h.top:60);
  return [Math.max(6,Math.min(x,h.width-318)),Math.max(6,Math.min(y,Math.max(6,h.height-160)))];}
function boot(ds){
  D=ds; T=D.territories; ADD=D.adds; K0=D.k; SN=window.STATE_NAMES;
  PAL=D.palette; VALID=PAL.validated; TOTREV=D.total; TOTH=D.totalHeads;
  MX=Math.max(...T.map(t=>t.rev));
  document.getElementById('dsname').textContent=(D.meta&&D.meta.name)||'dataset';
  document.getElementById('app').classList.remove('hide');
  if(wired) { initState(); render(); return; }
  wired=true;
  initState(); render();
  const gd=document.getElementById('map');
  gd.on('plotly_click',ev=>{const p=ev.points[0]; if(!p) return; const de=ev.event||{},[x,y]=at(de);
    if(p.data.name==='territories'){const i=p.pointIndex;
      if(de.shiftKey||de.metaKey){ if(!sel.includes(i)) sel.push(i); else sel=sel.filter(v=>v!==i); return render(); }
      sel=[]; const a=areaById(S.terr[i].a), d=S.terr[i].d!=null?distById(S.terr[i].d):null;
      openMenu(x,y,{kind:'terr',ids:[i]},esc(T[i].name),`${fmt(T[i].rev)} · ${esc(a.name)}${d?' / '+esc(d.name):''}`);}
    else if(p.data.name==='adds'){const j=p.pointIndex;
      openMenu(x,y,{kind:'add',ids:[j]},esc(ADD[j].market)+' <span class="tagp">planned add</span>',
        `${esc(ADD[j].role)} · ${esc(ADD[j].timing)} · now in ${esc(areaById(areaOfAdd(j)).name)}`);}
    else if(p.data.name==='states'){const st=p.location,ids=(D.stateTerr[st]||[]); if(!ids.length) return;
      const rev=ids.reduce((s,i)=>s+T[i].rev,0);
      openMenu(x,y,{kind:'state',ids,st},esc(SN[st]||st),`whole state · ${ids.length} territor${ids.length>1?'ies':'y'} · ${fmt(rev)}`);}});
  document.addEventListener('click',e=>{if(menu&&!e.target.closest('.menu')&&!e.target.closest('#map')) closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal)closeModal();else if(menu)closeMenu();}
    if((e.key==='z'||e.key==='Z')&&(e.metaKey||e.ctrlKey)){e.preventDefault();undo();}});
  document.getElementById('thm').textContent=dark()?'Light mode':'Dark mode';
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(!document.documentElement.getAttribute('data-theme'))render();});
}
let wired=false;
window.boot=boot;
