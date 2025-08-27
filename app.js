/* ===== Utils ===== */
const $ = s => document.querySelector(s);
const $all = s => Array.from(document.querySelectorAll(s));
const pad2 = n => String(n).padStart(2,'0');

const STORAGE_HISTORY = 'missaghju.history';
const STORAGE_NEXTNUM = 'missaghju.nextNumber';

/* ===== Enforce digits only & uppercase (except message) ===== */
$all('.only-digits').forEach(inp => {
  inp.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
});
$all('input.upper').forEach(inp => {
  inp.addEventListener('input', e => {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    try{ e.target.setSelectionRange(pos,pos);}catch{}
  });
});

/* ===== Time selectors & now button ===== */
const heureSelect = $('#heureSelect');
const minuteSelect = $('#minuteSelect');
(function populateTime(){
  for(let h=0; h<24; h++) heureSelect.add(new Option(pad2(h),pad2(h)));
  for(let m=0; m<60; m++) minuteSelect.add(new Option(pad2(m),pad2(m)));
})();
function setTimeNow(){
  const now = new Date();
  heureSelect.value = pad2(now.getHours());
  minuteSelect.value = pad2(now.getMinutes());
}
setTimeNow();
$('#btnNow').addEventListener('click', setTimeNow);

/* ===== Fonction → Entité rules ===== */
function bindFonctionEntite(fId, eId){
  const f = document.getElementById(fId);
  const e = document.getElementById(eId);
  if(!f || !e) return;
  f.addEventListener('change', () => {
    if(f.value === 'CCO') e.value = 'DELCO';
    else if(f.value === 'CEX' || f.value === 'CEF') e.value = 'BAO';
    else e.value = (e.value || '').toUpperCase();
  });
}
bindFonctionEntite('fonctionEmetteur','entiteEmetteur');
bindFonctionEntite('fonctionRecepteur','entiteRecepteur');

/* ===== Role swap Émetteur ⇄ Récepteur ===== */
const roleSelect = $('#roleSelect');
function getSection(prefix){
  return {
    num:      $(`#num${prefix}`)?.value || '',
    nom:      $(`#nom${prefix}`)?.value || '',
    fonction: $(`#fonction${prefix}`)?.value || '',
    entite:   $(`#entite${prefix}`)?.value || ''
  };
}
function setSection(prefix, v){
  const iNum = document.getElementById(`num${prefix}`);
  const iNom = document.getElementById(`nom${prefix}`);
  const iFon = document.getElementById(`fonction${prefix}`);
  const iEnt = document.getElementById(`entite${prefix}`);
  if(iNum) iNum.value = v.num || '';
  if(iNom) iNom.value = (v.nom || '').toUpperCase();
  if(iFon) { iFon.value = v.fonction || ''; iFon.dispatchEvent(new Event('change')); }
  if(iEnt) iEnt.value = (v.entite || '').toUpperCase();
}
function swapSections(){
  const em = getSection('Emetteur');
  const re = getSection('Recepteur');
  setSection('Emetteur', re);
  setSection('Recepteur', em);
}
roleSelect.addEventListener('change', swapSections);

/* ===== Generate Number (1..999 looping) ===== */
function nextNumber(){
  let n = parseInt(localStorage.getItem(STORAGE_NEXTNUM) || '0', 10);
  n = (n % 999) + 1;
  localStorage.setItem(STORAGE_NEXTNUM, String(n));
  return n;
}
function bindGen(btnId, inputId){
  const btn = document.getElementById(btnId);
  const inp = document.getElementById(inputId);
  if(!btn || !inp) return;
  btn.addEventListener('click', () => {
    inp.value = String(nextNumber());
  });
}
bindGen('btnGenNumEmetteur','numEmetteur');
bindGen('btnGenNumRecepteur','numRecepteur');

/* ===== Save (local history) ===== */
function getFormData(){
  const date = new Date();
  const data = {
    isoDate: date.toISOString().slice(0,10),
    heure: heureSelect.value,
    minute: minuteSelect.value,
    role: roleSelect.value,
    emetteur: {
      num: $('#numEmetteur').value,
      nom: $('#nomEmetteur').value.toUpperCase(),
      fonction: $('#fonctionEmetteur').value,
      entite: $('#entiteEmetteur').value.toUpperCase(),
    },
    recepteur: {
      num: $('#numRecepteur').value,
      nom: $('#nomRecepteur').value.toUpperCase(),
      fonction: $('#fonctionRecepteur').value,
      entite: $('#entiteRecepteur').value.toUpperCase(),
    },
    message: $('#message').value, // pas de upper
    createdAt: new Date().toISOString()
  };
  return data;
}
function loadHistory(){
  try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'); }
  catch { return []; }
}
function saveHistory(arr){
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(arr));
}
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(()=> t.classList.add('hidden'), 1800);
}

$('#btnSave').addEventListener('click', () => {
  const d = getFormData();
  // validations simples
  if(!d.emetteur.num || !d.recepteur.num){
    toast('Numéros Émetteur et Récepteur requis.');
    return;
  }
  const hist = loadHistory();
  hist.unshift(d);
  saveHistory(hist);
  toast('Enregistré dans l’historique ✔');
});

/* ===== Refresh with confirmation ===== */
$('#btnRefresh').addEventListener('click', () => {
  if(confirm('Rafraîchir la page ? Les données non enregistrées seront perdues.')){
    location.reload();
  }
});

/* ===== Historique: panneau, recherche, export CSV ===== */
const historyPanel = $('#historyPanel');
const historyTableBody = $('#historyTable tbody');
const historySearch = $('#historySearch');

function openHistory(){
  renderHistory();
  historyPanel.classList.remove('hidden');
  historySearch.focus();
}
function closeHistory(){
  historyPanel.classList.add('hidden');
}
$('#btnHistorique').addEventListener('click', openHistory);
$('#btnCloseHistory').addEventListener('click', closeHistory);

function filterHistory(items, q){
  if(!q) return items;
  q = q.toLowerCase();
  return items.filter(it => {
    const blob = [
      it.isoDate, it.heure+':'+it.minute, it.role,
      it.emetteur.num, it.emetteur.nom, it.emetteur.fonction, it.emetteur.entite,
      it.recepteur.num, it.recepteur.nom, it.recepteur.fonction, it.recepteur.entite,
      it.message
    ].join(' ').toLowerCase();
    return blob.includes(q);
  });
}

function renderHistory(){
  const items = loadHistory();
  const q = historySearch.value?.trim() || '';
  const list = filterHistory(items, q);
  historyTableBody.innerHTML = '';
  for(const it of list){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.isoDate}</td>
      <td>${it.heure}:${it.minute}</td>
      <td>${it.role}</td>
      <td>${it.emetteur.num}</td>
      <td>${it.emetteur.nom}</td>
      <td>${it.emetteur.fonction}</td>
      <td>${it.emetteur.entite}</td>
      <td>${it.recepteur.num}</td>
      <td>${it.recepteur.nom}</td>
      <td>${it.recepteur.fonction}</td>
      <td>${it.recepteur.entite}</td>
      <td>${(it.message||'').replace(/\n/g,'<br>')}</td>
    `;
    historyTableBody.appendChild(tr);
  }
}
historySearch.addEventListener('input', renderHistory);

/* Export CSV */
function toCsvValue(v){
  if(v==null) v='';
  v = String(v).replace(/"/g,'""');
  return `"${v}"`;
}
function exportCsv(){
  const items = loadHistory();
  const headers = [
    'DATE','HEURE','ROLE',
    'NUM_EMETTEUR','NOM_EMETTEUR','FONCTION_EMETTEUR','ENTITE_EMETTEUR',
    'NUM_RECEPTEUR','NOM_RECEPTEUR','FONCTION_RECEPTEUR','ENTITE_RECEPTEUR',
    'MESSAGE'
  ];
  const rows = [headers.join(',')];
  for(const it of items){
    const row = [
      it.isoDate,
      `${it.heure}:${it.minute}`,
      it.role,
      it.emetteur.num, it.emetteur.nom, it.emetteur.fonction, it.emetteur.entite,
      it.recepteur.num, it.recepteur.nom, it.recepteur.fonction, it.recepteur.entite,
      it.message
    ].map(toCsvValue).join(',');
    rows.push(row);
  }
  const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:T]/g,'-').slice(0,16);
  a.download = `missaghju-historique-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
$('#btnExportCsv').addEventListener('click', exportCsv);

/* ===== Ensure selects start empty ===== */
['#fonctionEmetteur','#fonctionRecepteur'].forEach(sel=>{
  const s = $(sel); if(s && !s.value) s.selectedIndex = 0;
});
