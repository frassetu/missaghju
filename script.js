let numeroAuto = 1;

function setCurrentTime() {
  const now = new Date();
  document.getElementById('heure').value = now.getHours().toString().padStart(2, '0');
  document.getElementById('minute').value = now.getMinutes().toString().padStart(2, '0');
}

function generateNumber() {
  document.getElementById('numEmetteur').value = numeroAuto.toString().padStart(3, '0');
  numeroAuto++;
}

function updateService(role) {
  const fonction = document.getElementById('fonction' + role).value;
  const serviceField = document.getElementById('service' + role);
  if (fonction === 'CEX' || fonction === 'CEF') {
    serviceField.value = 'BAO';
  } else if (fonction === 'CCO') {
    serviceField.value = 'DELCO';
  } else {
    serviceField.value = '';
  }
}

function resetForm() {
  if (confirm('Voulez-vous vraiment réinitialiser tous les champs ?')) {
    document.getElementById('messageForm').reset();
    numeroAuto = 1;
  }
}

document.getElementById('messageForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const numE = document.getElementById('numEmetteur').value;
  const nomE = document.getElementById('nomEmetteur').value;
  const fonctionE = document.getElementById('fonctionEmetteur').value;
  const serviceE = document.getElementById('serviceEmetteur').value;

  const numR = document.getElementById('numRecepteur').value;
  const nomR = document.getElementById('nomRecepteur').value;
  const fonctionR = document.getElementById('fonctionRecepteur').value;
  const serviceR = document.getElementById('serviceRecepteur').value;

  const message = document.getElementById('message').value;

  const row = document.createElement('tr');
  row.innerHTML = `<td>${numE}</td><td>${nomE}</td><td>${fonctionE}</td><td>${serviceE}</td>
                   <td>${numR}</td><td>${nomR}</td><td>${fonctionR}</td><td>${serviceR}</td>
                   <td>${message}</td>`;
  document.querySelector('#historique tbody').appendChild(row);
  alert('Message enregistré');
});