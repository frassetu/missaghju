/* ===== Helpers ===== */
const $ = s => document.querySelector(s);
const pad2 = n => String(n).padStart(2,'0');
const STORAGE_HISTORY = 'missaghju.history';
const STORAGE_NEXTNUM = 'missaghju.nextNumber';

/* ===== Time selectors ===== */
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

/* ===== Build dynamic field blocks from templates ===== */
const userFrag = document.getElementById('tpl-user').content.cloneNode(true);
const otherFrag = document.getElementById('tpl-other').content.cloneNode(true);
const userFields = userFrag.querySelector('#userFields');
const otherFields = otherFrag.querySelector('#otherFields');

/* Place initial blocks: role default = EMETTEUR */
const slotEmetteur = document.getElementById('slot-emetteur');
const slotRecepteur = document.getElementById('slot-recepteur');
slotEmetteur.appendChild(userFields);
slotRecepteur.appendChild(otherFields);

/* ===== Inputs inside blocks ===== */
// User
const userNum = userFields.querySelector('#userNum');
const userGenBtn = userFields.querySelector('#btnGenUserNum');
const userName = userFields.querySelector('#userName');
const userFunction = userFields.querySelector('#userFunction');
const userEntite = userFields.querySelector('#userEntite');
// Other
const otherNum = otherFields.querySelector('#otherNum');
const otherName = otherFields.querySelector('#otherName');
const otherFunction = otherFields.querySelector('#otherFunction');
const otherEntite = otherFields.querySelector('#otherEntite');

/* ===== Enforce digits only & uppercase ===== */
function enforceDigits(inp){
  inp.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
}
function enforceUpper(inp){
  inp.addEventListener('input', e => {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    try{ e.target.setSelectionRange(pos,pos);}catch{}
  });
}
[userNum, otherNum].forEach(enforceDigits);
[userName, userEntite, otherName, otherEntite].forEach(enforceUpper);

/* ===== Fonction → Entité rules (only for Other: CEX/CEF/CCO) ===== */
otherFunction.addEventListener('change', () => {
  if (otherFunction.value === 'CCO') otherEntite.value = 'DELCO';
  else if (otherFunction.value === 'CEX' || otherFunction.value === 'CEF') otherEntite.value = 'BAO';
  else otherEntite.value = '';
});

/* ===== Generate Number for user only (1..999 loop) ===== */
function nextNumber(){
  let n = parseInt(localStorage.getItem(STORAGE_NEXTNUM) || '0', 10);
  n = (n % 999) + 1;
  localStorage.setItem(STORAGE_NEXTNUM, String(n));
  return n;
}
userGenBtn.addEventListener('click', () => {
  userNum.value = String(nextNumber());
});

/* ===== Swap blocks between Emetteur/Recepteur on role change ===== */
const roleSelect = $('#roleSelect');
function placeBlocks(){
  // Clear slots (move children)
  // Move userFields to chosen role, otherFields to opposite
  if (roleSelect.value === 'EMETTEUR') {
    if (userFields.parentElement !== slotEmetteur) slotEmetteur.appendChild(userFields);
    if (otherFields.parentElement !== slotRecepteur) slotRecepteur.appendChild(otherFields);
  } else {
    if (userFields.parentElement !== slotRecepteur) slotRecepteur.appendChild(userFields);
    if (otherFields.parentElement !== slotEmetteur) slotEmetteur.appendChild(otherFields);
  }
}
placeBlocks();
roleSelect.addEventListener('change', placeBlocks);

/* ===== Save to local history ===== */
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
const messageEl = $('#message');

$('#btnSave').addEventListener('click', () => {
  const date = new Date();
  const data = {
    isoDate: date.toISOString().slice(0,10),
    heure: heureSelect.value,
    minute: minuteSelect.value,
    role: roleSelect.value,
    emetteur: {},
    recepteur: {},
    message: messageEl.value,
    createdAt: date.toISOString()
  };

  // Map en fonction du rôle : le bloc "user" devient soit Émetteur soit Récepteur
  const userData = {
    num: userNum.value, nom: userName.value, fonction: userFunction.value, entite: userEntite.value
  };
  const otherData = {
    num: otherNum.value, nom: otherName.value, fonction: otherFunction.value, entite: otherEntite.value
  };

  if (roleSelect.value === 'EMETTEUR') {
    data.emetteur = {
      num: userData.num, nom: userData.nom.toUpperCase(), fonction: userData.fonction, entite: userData.entite.toUpperCase()
    };
    data.recepteur = {
      num: otherData.num, nom: otherData.nom.toUpperCase(), fonction: otherData.fonction, entite: otherData.entite.toUpperCase()
    };
  } else {
    data.recepteur = {
      num: userData.num, nom: userData.nom.toUpperCase(), fonction: userData.fonction, entite: userData.entite.toUpperCase()
    };
    data.emetteur = {
      num: otherData.num, nom: otherData.nom.toUpperCase(), fonction: otherData.fonction, entite: otherData.entite.toUpperCase()
    };
  }

  // validations simples
  if(!data.emetteur.num || !data.recepteur.num){
    toast('Numéros Émetteur et Récepteur requis.');
    return;
  }

  const hist = loadHistory();
  hist.unshift(data);
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

/* ===== Install PWA button (Android/Chrome) ===== */
let deferredPrompt = null;
const btnInstall = $('#btnInstall');
btnInstall.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
  // Chrome déclenche uniquement si PWA conforme (HTTPS, SW, manifest, icons)
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.style.display = 'inline-block';
});

btnInstall.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  btnInstall.style.display = 'none';
});

/* Fallback iOS: afficher une aide si pas d’événement d’install */
setTimeout(() => {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const inStandalone = window.navigator.standalone === true;
  if (isIOS && !inStandalone) {
    btnInstall.textContent = 'Ajouter à l’écran d’accueil';
    btnInstall.style.display = 'inline-block';
    btnInstall.onclick = () => {
      alert('Sur iPhone/iPad : partager ▸ “Ajouter à l’écran d’accueil”.');
    };
  }
}, 1500);
