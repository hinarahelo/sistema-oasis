import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
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

/* =========================
   📂 UI
========================= */

window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";
};

let filtroAtual = "todos";
window.aplicarFiltro = () => {
  filtroAtual = document.getElementById("filtro-status").value;
  renderTickets();
};

let cacheTickets = [];

/* =========================
   🎫 REALTIME
========================= */

onSnapshot(collection(db, "tickets"), snap => {
  cacheTickets = [];
  let abertos = 0, atendimento = 0, fechados = 0;

  snap.forEach(d => {
    const t = { id: d.id, ...d.data() };
    cacheTickets.push(t);

    if (t.status === "fechado") fechados++;
    else if (t.status === "atendimento") atendimento++;
    else abertos++;
  });

  document.getElementById("qtd-abertos").innerText = abertos;
  document.getElementById("qtd-atendimento").innerText = atendimento;
  document.getElementById("qtd-fechados").innerText = fechados;

  renderTickets();
});

function renderTickets() {
  const box = document.getElementById("lista-tickets");
  box.innerHTML = "";

  cacheTickets
    .filter(t => filtroAtual === "todos" || t.status === filtroAtual)
    .forEach(t => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${t.categoria}</b><br>
        ${t.nome}<br>
        <span class="tag ${t.status || "aberto"}">${t.status || "aberto"}</span>
      `;
      box.appendChild(div);
    });
}
