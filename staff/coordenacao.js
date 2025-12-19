import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

/* 🔐 PROTEÇÃO */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "coordenacao") {
  location.href = "../index.html";
}

/* 🔀 ABAS */
window.mostrar = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id).classList.add("active");
};

/* 🚪 LOGOUT */
window.sair = () => {
  localStorage.clear();
  location.href = "../index.html";
};

/* 🎫 TODOS OS TICKETS */
onSnapshot(collection(db, "tickets"), snap => {
  const box = document.getElementById("lista-tickets");
  if (!box) return;
  box.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();
    const id = d.id;

    const statusAtual = (t.status || "").toLowerCase().trim();

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.categoria}</b><br>
      👤 ${t.nome}<br>
      ⚖️ ${t.atendente || "—"}<br>
      📌 ${t.status}<br><br>
    `;

    if (statusAtual !== "encerrado") {
      const btn = document.createElement("button");
      btn.textContent = "⚖️ Encerrar Ticket";
      btn.onclick = async () => {
        await updateDoc(doc(db, "tickets", id), {
          status: "encerrado",
          encerradoPor: usuario.nome,
          encerradoEm: serverTimestamp()
        });
      };
      div.appendChild(btn);
    }

    box.appendChild(div);
  });
});

/* 📜 LOGS */
onSnapshot(collection(db, "logs"), snap => {
  const box = document.getElementById("lista-logs");
  if (!box) return;
  box.innerHTML = "";

  snap.forEach(d => {
    const l = d.data();
    box.innerHTML += `
      <div class="card">
        <b>${l.acao}</b><br>
        ${l.usuario} (${l.nivel})<br>
        ${l.detalhes || ""}
      </div>
    `;
  });
});
