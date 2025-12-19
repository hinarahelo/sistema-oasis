import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 Firebase */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* 🔐 Usuário */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || (usuario.nivel !== "juridico" && usuario.nivel !== "coordenacao")) {
  location.href = "../index.html";
}

/* 🗂️ Abas */
window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
};

/* ⏱ SLA AVANÇADO */
function calcularSLA(ticket) {
  if (!ticket.criadoEm) return "🟢 OK";

  const inicio = ticket.criadoEm.toDate().getTime();
  const horas = (Date.now() - inicio) / (1000 * 60 * 60);

  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  return "🔴 Estourado";
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
      Usuário: ${t.nome}<br>
      Status: ${t.status}<br>
      SLA: <b>${calcularSLA(t)}</b>
    `;

    box.appendChild(div);
  });
});
