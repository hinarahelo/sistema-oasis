import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

/* 🔐 Usuário */
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || (usuario.nivel !== "staff" && usuario.nivel !== "coordenacao")) {
  location.href = "../index.html";
}

/* ⏱ SLA */
function calcularSLA(ticket) {
  if (!ticket.criadoEm) return "🟢 OK";

  const inicio = ticket.criadoEm.toDate().getTime();
  const horas = (Date.now() - inicio) / 36e5;

  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  return "🔴 Estourado";
}

/* 🎫 Tickets */
onSnapshot(collection(db, "tickets"), snap => {
  const box = document.getElementById("lista-tickets");
  if (!box) return;

  box.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();
    box.innerHTML += `
      <div class="card">
        <b>${t.categoria}</b><br>
        Usuário: ${t.nome}<br>
        Status: ${t.status}<br>
        SLA: <b>${calcularSLA(t)}</b>
      </div>
    `;
  });
});
