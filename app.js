const pad2 = n => String(n).padStart(2, '0');

// Forcer chiffres uniquement
document.querySelectorAll('.only-digits').forEach(inp => {
  inp.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
});

// Forcer MAJUSCULES
document.querySelectorAll('input.upper').forEach(inp => {
  inp.addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase();
  });
});

// Remplir sélecteurs heure/minute
const heureSelect = document.getElementById('heureSelect');
const minuteSelect = document.getElementById('minuteSelect');
for (let h = 0; h < 24; h++) {
  heureSelect.add(new Option(pad2(h), pad2(h)));
}
for (let m = 0; m < 60; m++) {
  minuteSelect.add(new Option(pad2(m), pad2(m)));
}
function setTimeNow() {
  const now = new Date();
  heureSelect.value = pad2(now.getHours());
  minuteSelect.value = pad2(now.getMinutes());
}
setTimeNow();
document.getElementById('btnNow').addEventListener('click', setTimeNow);

// Règles entité selon fonction
function bindFonctionEntite(fonctionId, entiteId) {
  const f = document.getElementById(fonctionId);
  const e = document.getElementById(entiteId);
  f.addEventListener('change', () => {
    if (f.value === 'CCO') e.value = 'DELCO';
    else if (f.value === 'CEX' || f.value === 'CEF') e.value = 'BAO';
    else e.value = '';
  });
}
bindFonctionEntite('fonctionRecepteur', 'entiteRecepteur');
bindFonctionEntite('fonctionEmetteur', 'entiteEmetteur');

// Inversion Émetteur/Récepteur
document.getElementById('roleSelect').addEventListener('change', () => {
  const em = {
    num: document.getElementById('numEmetteur').value,
    nom: document.getElementById('nomEmetteur').value,
    fonction: document.getElementById('fonctionEmetteur').value,
    entite: document.getElementById('entiteEmetteur').value
  };
  const re = {
    num: document.getElementById('numRecepteur').value,
    nom: document.getElementById('nomRecepteur').value,
    fonction: document.getElementById('fonctionRecepteur').value,
    entite: document.getElementById('entiteRecepteur').value
  };
  document.getElementById('numEmetteur').value = re.num;
  document.getElementById('nomEmetteur').value = re.nom;
  document.getElementById('fonctionEmetteur').value = re.fonction;
  document.getElementById('entiteEmetteur').value = re.entite;
  document.getElementById('numRecepteur').value = em.num;
  document.getElementById('nomRecepteur').value = em.nom;
  document.getElementById('fonctionRecepteur').value = em.fonction;
  document.getElementById('entiteRecepteur').value = em.entite;
});
