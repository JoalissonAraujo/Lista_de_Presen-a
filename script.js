const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0K-z6C-5MOPN54YgdVmOvbyhponwRvwugU39qbM48rfIWKaj1bk7B8NtVSWIculY/exec";

// Verifica se já registrou no mesmo dia
function jaRegistrouHoje() {
  const hoje = new Date().toLocaleDateString();
  const ultimoRegistro = localStorage.getItem("dataRegistro");
  return ultimoRegistro === hoje;
}

function marcarRegistroHoje() {
  const hoje = new Date().toLocaleDateString();
  localStorage.setItem("dataRegistro", hoje);
}

function dentroDoCampus(lat, lon) {
  const UNIFIP_LAT = -7.242581;
  const UNIFIP_LON = -35.900841;
  const RAIO = 0.2; // ~200 metros

  const R = 6371; // Raio da Terra em km
  const dLat = (lat - UNIFIP_LAT) * Math.PI / 180;
  const dLon = (lon - UNIFIP_LON) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(UNIFIP_LAT * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c; // km

  return distancia <= RAIO;
}

function registrar() {
  const nome = document.getElementById("nome").value;
  const resultado = document.getElementById("resultado");

  if (!nome) {
    alert("Por favor, digite seu nome!");
    return;
  }

  if (jaRegistrouHoje()) {
    resultado.innerHTML = "<strong>Você já registrou presença hoje com este dispositivo!</strong>";
    return;
  }

  const agora = new Date();
  const dataHora = agora.toLocaleString();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        if (!dentroDoCampus(lat, lon)) {
          resultado.innerHTML = "<strong>Você não está dentro do campus da UNIFIP!</strong>";
          return;
        }

        // Envia para Google Sheets
        fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ nome, dataHora, lat, lon })
        })
        .then(res => res.text())
        .then(() => {
          marcarRegistroHoje(); // Marca que já registrou no dia
          resultado.innerHTML = `
            <strong>Registro feito com sucesso!</strong><br>
            Nome: ${nome}<br>
            Data/Hora: ${dataHora}<br>
            Localização: ${lat.toFixed(6)}, ${lon.toFixed(6)}
          `;
        })
        .catch(err => {
          resultado.innerHTML = "Erro ao salvar presença!";
        });
      },
      () => {
        resultado.innerHTML = "Não foi possível obter sua localização.";
      }
    );
  } else {
    resultado.innerHTML = "Seu navegador não suporta geolocalização.";
  }
}

