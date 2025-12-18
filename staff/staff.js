import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   🔐 SESSÃO
========================= */

const usuario = JSON.parse(localStorage.getItem("usuario"));

/* =========================
   🔥 FIREBASE
========================= */

const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});

const db = getFirestore(app);

let ticketAtual = null;

/* =========================
   📂 UI
========================= */

window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";
};

/* =========================
   🎫 LISTAGEM DE TICKETS
========================= */

onSnapshot(collection(db, "tickets"), snap => {
  const abertos = document.getElementById("lista-abertos");
  const fechados = document.getElementById("lista-fechados");

  abertos.innerHTML = "";
  fechados.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.categoria}</b><br>
      ${t.nome}<br>
      <small>Status: ${t.status}</small>
    `;

    // Jurídico e Coordenação podem responder
    if (usuario.nivel === "juridico" || usuario.nivel === "coordenacao") {
      const btn = document.createElement("button");
      btn.textContent = "Assumir";
      btn.onclick = () => (ticketAtual = d.id);
      div.appendChild(btn);
    }

    if (t.status === "fechado") fechados.appendChild(div);
    else abertos.appendChild(div);
  });
});

/* =========================
   💬 RESPONDER
========================= */

window.responder = async texto => {
  if (!ticketAtual || !texto) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: usuario.nome,
    texto,
    criadoEm: serverTimestamp()
  });
};

/* =========================
   🔒 MUDAR STATUS (SÓ COORDENAÇÃO)
========================= */

window.fecharTicket = async () => {
  if (usuario.nivel !== "coordenacao" || !ticketAtual) return;

  await updateDoc(doc(db, "tickets", ticketAtual), {
    status: "fechado"
  });
};
