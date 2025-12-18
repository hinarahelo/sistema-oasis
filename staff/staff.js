import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 Firebase */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* 📂 Abas */
window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display="none");
  document.getElementById(id).style.display="block";
};

/* 🕒 SLA — TEMPO TOTAL ABERTO */
function calcularSLA(ticket) {
  if (!ticket.sla || !ticket.sla.criadoEm) {
    return `<span class="sla-ok">🟢 OK</span>`;
  }

  const agora = Date.now();
  const criado = ticket.sla.criadoEm.toDate().getTime();
  const diffHoras = (agora - criado) / (1000 * 60 * 60);

  // 🟢 até 3h
  if (diffHoras <= 3) {
    return `<span class="sla-ok">🟢 OK</span>`;
  }

  // 🟡 entre 3h e 18h
  if (diffHoras > 3 && diffHoras <= 18) {
    return `<span class="sla-alerta">🟡 Atenção</span>`;
  }

  // 🔴 mais de 48h (2 dias)
  if (diffHoras > 48) {
    return `<span class="sla-estourado">🔴 Estourado</span>`;
  }

  // fallback
  return `<span class="sla-alerta">🟡 Atenção</span>`;
}

/* 🎫 Tickets em tempo real */
onSnapshot(collection(db, "tickets"), snap => {
  const box = document.getElementById("lista-tickets");
  if (!box) return;

  box.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.categoria}</b><br>
      ${t.nome}<br>
      SLA: ${calcularSLA(t)}
    `;
    box.appendChild(div);
  });
});
