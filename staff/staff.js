import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* 🔐 Sessão */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "staff") {
  location.href = "../index.html";
}

/* 🧭 Abas */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id).classList.add("active");
};

/* 🚪 Logout */
window.sair = () => {
  localStorage.clear();
  location.href = "../index.html";
};

/* ⏱️ SLA */
function calcularSLA(criadoEm) {
  if (!criadoEm) return "—";

  const agora = Date.now();
  const criado = criadoEm.toDate().getTime();
  const horas = (agora - criado) / (1000 * 60 * 60);

  if (horas <= 3) return `<span class="sla-ok">🟢 OK</span>`;
  if (horas <= 18) return `<span class="sla-alerta">🟡 Atenção</span>`;
  return `<span class="sla-estourado">🔴 Estourado</span>`;
}

/* 🎫 Tickets Abertos */
onSnapshot(
  query(collection(db, "tickets"), where("status", "==", "aberto")),
  snap => {
    const box = document.getElementById("lista-abertos");
    if (!box) return;
    box.innerHTML = "";

    snap.forEach(d => {
      const t = d.data();
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${t.categoria}</b><br>
        ${t.nome}<br>
        SLA: ${calcularSLA(t.criadoEm)}
      `;
      box.appendChild(div);
    });
  }
);

/* 🧾 Tickets Fechados */
onSnapshot(
  query(collection(db, "tickets"), where("status", "==", "fechado")),
  snap => {
    const box = document.getElementById("lista-fechados");
    if (!box) return;
    box.innerHTML = "";

    snap.forEach(d => {
      const t = d.data();
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${t.categoria}</b><br>
        ${t.nome}
      `;
      box.appendChild(div);
    });
  }
);

/* 📊 Dashboard */
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
      SLA: ${calcularSLA(t.criadoEm)}
    `;
    box.appendChild(div);
  });
});
