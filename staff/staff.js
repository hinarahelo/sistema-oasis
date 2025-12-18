import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display="none");
  document.getElementById(id).style.display="block";
};

function calcSLA(ticket){
  if (!ticket.sla || !ticket.sla.criadoEm) return "—";

  const agora = Date.now();
  const criado = ticket.sla.criadoEm.toDate().getTime();
  const primeira = ticket.sla.primeiraRespostaEm
    ? ticket.sla.primeiraRespostaEm.toDate().getTime()
    : null;

  const diffMin = primeira
    ? (primeira - criado) / 60000
    : (agora - criado) / 60000;

  if (diffMin <= 10) return `<span class="sla-ok">🟢 OK</span>`;
  if (diffMin <= 30) return `<span class="sla-alerta">🟡 Atenção</span>`;
  return `<span class="sla-estourado">🔴 Estourado</span>`;
}

onSnapshot(collection(db,"tickets"), snap=>{
  const box = document.getElementById("lista-tickets");
  box.innerHTML = "";

  snap.forEach(d=>{
    const t = d.data();
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.categoria}</b><br>
      ${t.nome}<br>
      SLA: ${calcSLA(t)}
    `;
    box.appendChild(div);
  });
});
