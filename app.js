const objects = [
  ['Land_Wall_Gate_IndCnc4','Industrial Gate','Structures','structures/industrial','▥','#1687ff',1,'A heavy concrete-and-steel industrial gate.'],
  ['Land_Mil_Barracks4','Military Barracks','Structures','structures/military','▤','#40a4ff',1,'A modular military barracks building with interior access.'],
  ['Land_House_2W03','Two Storey House','Structures','structures/residential','⌂','#8d6cff',1,'A weathered two-storey residential house.'],
  ['Land_Shed_W4','Timber Shed','Structures','structures/residential','▱','#b97948',1,'A compact timber storage shed.'],
  ['Land_City_Store','City Storefront','Structures','structures/commercial','▦','#df5f7b',1,'An urban storefront shell for custom trader areas.'],
  ['Land_Radio_Tower','Radio Tower','Structures','structures/military','⌁','#ffb229',1,'A tall communications tower visible across long distances.'],
  ['Offroad_02','Offroad Hatchback','Vehicles','vehicles/civilian','◆','#ec434c',1,'A nimble civilian offroad vehicle.'],
  ['Sedan_02','Executive Sedan','Vehicles','vehicles/civilian','◆','#a7b2c4',1,'A four-door executive sedan with usable storage.'],
  ['Truck_01_Covered','Covered Cargo Truck','Vehicles','vehicles/heavy','▰','#58a062',1,'A rugged six-wheel cargo truck with a covered tray.'],
  ['Hatchback_02','Compact Hatchback','Vehicles','vehicles/civilian','◆','#f0b63d',1,'A compact commuter car with sharp handling.'],
  ['StaticObj_Roadblock_Wood','Wooden Roadblock','Props','props/roadside','╳','#c4864c',1,'A portable wooden roadblock for checkpoints.'],
  ['StaticObj_Sign_Stop','Stop Sign','Props','props/signs','⬢','#e84554',1,'A standard roadside stop sign.'],
  ['StaticObj_FuelPump_Red','Fuel Pump','Props','props/industrial','⛽','#e34545',1,'A vintage red service-station fuel pump.'],
  ['StaticObj_Workbench','Field Workbench','Props','props/utility','▰','#b48556',1,'A rugged bench for repair and crafting zones.'],
  ['StaticObj_Crate_Military','Military Supply Crate','Containers','containers/military','▣','#6f8b4a',1,'A reinforced military supply container.'],
  ['StaticObj_SeaChest','Sea Chest','Containers','containers/storage','▣','#795b3f',1,'A durable wooden chest with generous capacity.'],
  ['Weapon_M4A1','M4-A1','Weapons','weapons/rifles','⌐','#667382',0,'A selective-fire NATO-pattern assault rifle.'],
  ['Weapon_SVD','VSD Marksman Rifle','Weapons','weapons/rifles','⌐','#b48155',0,'A semi-automatic designated marksman rifle.'],
  ['Item_GPSReceiver','GPS Receiver','Equipment','equipment/navigation','⌖','#2cc9bd',1,'A compact satellite navigation receiver.'],
  ['Item_FieldRadio','Field Transceiver','Equipment','equipment/comms','▥','#56804f',1,'A long-range portable field radio.'],
  ['Item_TacticalBag_Black','Tactical Backpack','Equipment','equipment/storage','♢','#4e596b',1,'A low-profile tactical backpack with modular storage.'],
  ['Plant_Cannabis','Cannabis Plant','Nature','nature/plants','♧','#50b26b',1,'A mature harvestable cannabis plant.'],
  ['Tree_Pine_Small','Young Pine','Nature','nature/trees','♠','#3b9b67',1,'A young evergreen pine for natural scene dressing.'],
  ['Rock_Granite_Large','Large Granite Rock','Nature','nature/rocks','⬟','#77849a',1,'A large granite formation for terrain dressing.'],
].map((o,i)=>({id:i+1,className:o[0],displayName:o[1],category:o[2],path:'dz/'+o[3],icon:o[4],accent:o[5],console:!!o[6],description:o[7]}));

const $ = s => document.querySelector(s);
const state = {search:'',category:'All',platform:'All',mode:'finder',page:1,size:12,sort:'className',direction:1,pins:new Set(JSON.parse(localStorage.getItem('sonics-pins')||'[]')),selected:null};
const categories = [...new Set(objects.map(o=>o.category))];

function filtered(){
  let list=objects.filter(o=>state.category==='All'||o.category===state.category);
  if(state.search){const q=state.search.toLowerCase();list=list.filter(o=>[o.className,o.displayName,o.path,o.category].some(v=>v.toLowerCase().includes(q)))}
  if(state.platform==='Console')list=list.filter(o=>o.console);if(state.platform==='PC')list=list.filter(()=>true);
  if(state.mode==='favorites')list=list.filter(o=>state.pins.has(o.id));
  if(state.mode==='types')list=[...list].sort((a,b)=>a.category.localeCompare(b.category)||a.displayName.localeCompare(b.displayName));
  else list=[...list].sort((a,b)=>String(a[state.sort]).localeCompare(String(b[state.sort]))*state.direction);
  return list;
}

function renderFolders(){
  $('#folderTree').innerHTML=`<button class="folder ${state.category==='All'?'active':''}" data-cat="All"><span>▾</span> All objects <span class="folder-count">${objects.length}</span></button>`+categories.map(c=>`<button class="folder ${state.category===c?'active':''}" data-cat="${c}"><span>+</span> ${c.toLowerCase()} <span class="folder-count">${objects.filter(o=>o.category===c).length}</span></button>`).join('');
  document.querySelectorAll('.folder').forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;state.page=1;render()});
}

function render(){
  const list=filtered(), pages=Math.max(1,Math.ceil(list.length/state.size));state.page=Math.min(state.page,pages);const start=(state.page-1)*state.size,page=list.slice(start,start+state.size);
  $('#objectCount').textContent=objects.length.toLocaleString();$('#shownCount').textContent=list.length;$('#categoryCount').textContent=new Set(list.map(o=>o.category)).size;$('#consoleCount').textContent=list.filter(o=>o.console).length;
  $('#crumb').textContent=state.category==='All'?'ALL OBJECTS':state.category.toUpperCase();$('#viewTitle').textContent=state.mode==='favorites'?'Pinned Objects':state.mode==='types'?'Types Explorer':'Object Finder';
  $('#objectRows').innerHTML=page.map(o=>`<tr data-id="${o.id}" tabindex="0"><td><div class="object-icon" style="--accent:${o.accent}">${o.icon}</div></td><td><span class="class-name">${mark(o.className)}</span></td><td>${mark(o.displayName)}</td><td><span class="path">${mark(o.path)}</span></td><td><span class="badge pc">PC</span>${o.console?'<span class="badge console">Console</span>':''}</td><td><button class="pin ${state.pins.has(o.id)?'active':''}" data-pin="${o.id}" aria-label="Pin ${o.displayName}">${state.pins.has(o.id)?'★':'☆'}</button></td></tr>`).join('');
  $('#emptyState').classList.toggle('hidden',list.length>0);$('.table-scroll').classList.toggle('hidden',list.length===0);$('#resultLabel').textContent=list.length?`Showing ${start+1}–${Math.min(start+state.size,list.length)} of ${list.length}`:'Showing 0 results';$('#pageLabel').textContent=`Page ${state.page} / ${pages}`;$('#prevPage').disabled=state.page===1;$('#nextPage').disabled=state.page===pages;$('#clearFavorites').classList.toggle('hidden',state.mode!=='favorites'||!state.pins.size);
  renderFolders();bindRows();
}

function mark(text){if(!state.search)return text;const safe=state.search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return text.replace(new RegExp(`(${safe})`,'ig'),'<mark>$1</mark>')}
function bindRows(){
  document.querySelectorAll('tbody tr').forEach(row=>{row.onclick=e=>{if(!e.target.closest('.pin'))openDetail(+row.dataset.id)};row.onkeydown=e=>{if(e.key==='Enter')openDetail(+row.dataset.id)}});
  document.querySelectorAll('[data-pin]').forEach(b=>b.onclick=e=>{e.stopPropagation();togglePin(+b.dataset.pin)});
}
function togglePin(id){state.pins.has(id)?state.pins.delete(id):state.pins.add(id);localStorage.setItem('sonics-pins',JSON.stringify([...state.pins]));render();if(state.selected?.id===id)updateDialogPin();toast(state.pins.has(id)?'Object pinned':'Pin removed')}
function openDetail(id){const o=objects.find(x=>x.id===id);state.selected=o;$('#dialogArt').style.setProperty('--accent',o.accent);$('#dialogArt').textContent=o.icon;$('#dialogCategory').textContent=o.category+' / OBJECT '+String(o.id).padStart(3,'0');$('#dialogName').textContent=o.displayName;$('#dialogDescription').textContent=o.description;$('#dialogDetails').innerHTML=`<div><dt>Class name</dt><dd>${o.className}</dd></div><div><dt>Platform</dt><dd>${o.console?'PC + Console':'PC only'}</dd></div><div><dt>Config path</dt><dd>${o.path}</dd></div><div><dt>Object ID</dt><dd>SOF-${String(o.id).padStart(5,'0')}</dd></div>`;updateDialogPin();$('#detailDialog').showModal()}
function updateDialogPin(){if(!state.selected)return;$('#dialogPin').textContent=state.pins.has(state.selected.id)?'★ Pinned':'☆ Pin object'}
function reset(){Object.assign(state,{search:'',category:'All',platform:'All',mode:'finder',page:1});$('#searchInput').value='';$('#platformFilter').value='All';document.querySelectorAll('.mode').forEach((b,i)=>b.classList.toggle('active',i===0));render()}
let toastTimer;function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}

$('#searchInput').oninput=e=>{state.search=e.target.value.trim();state.page=1;render()};$('#pageSize').onchange=e=>{state.size=+e.target.value;state.page=1;render()};$('#platformFilter').onchange=e=>{state.platform=e.target.value;state.page=1;render()};
$('#prevPage').onclick=()=>{state.page--;render()};$('#nextPage').onclick=()=>{state.page++;render()};$('#resetButton').onclick=reset;$('#emptyReset').onclick=reset;
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;state.page=1;document.querySelectorAll('.mode').forEach(x=>x.classList.toggle('active',x===b));render()});
document.querySelectorAll('.sort').forEach(b=>b.onclick=()=>{state.direction=state.sort===b.dataset.key?-state.direction:1;state.sort=b.dataset.key;render()});
document.querySelectorAll('[data-toast]').forEach(b=>b.onclick=()=>toast(b.dataset.toast));
$('#themeToggle').onclick=()=>{document.body.classList.toggle('light');localStorage.setItem('sonics-theme',document.body.classList.contains('light')?'light':'dark')};
$('#exportButton').onclick=()=>{const rows=filtered(),csv=['Class Name,In-game Name,Category,Path,Console',...rows.map(o=>[o.className,o.displayName,o.category,o.path,o.console?'Yes':'No'].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='sonics-objects.csv';a.click();URL.revokeObjectURL(a.href);toast('CSV exported')};
$('#clearFavorites').onclick=()=>{state.pins.clear();localStorage.removeItem('sonics-pins');render();toast('Pins cleared')};$('#dialogClose').onclick=()=>$('#detailDialog').close();$('#detailDialog').onclick=e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close()};$('#dialogPin').onclick=()=>togglePin(state.selected.id);$('#copyClass').onclick=async()=>{await navigator.clipboard.writeText(state.selected.className);toast('Class name copied')};
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==$('#searchInput')){e.preventDefault();$('#searchInput').focus()}if(e.key==='Escape'&&!$('#detailDialog').open)$('#searchInput').blur()});
if(localStorage.getItem('sonics-theme')==='light')document.body.classList.add('light');render();
