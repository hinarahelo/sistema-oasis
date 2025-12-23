import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

/* ======================================================
   🔐 PROTEÇÃO (COORDENAÇÃO)
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "coordenacao") {
  location.replace("../index.html");
}

/* ======================================================
   🔀 ABAS
====================================================== */
window.mostrar = id => {
  document.querySelectorAll(".aba").forEach(a =>
    a.classList.remove("active")
  );
  document.getElementById(id)?.classList.add("active");
};

/* ======================================================
   🚪 LOGOUT
====================================================== */
window.sair = () => {
  localStorage.clear();
  location.replace("../index.html");
};

/* ======================================================
   🎫 TICKETS (VISÃO GERAL)
====================================================== */
onSnapshot(collection(db, "tickets"), snap => {
  const box = document.getElementById("lista-tickets");
  if (!box) return;

  box.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();
    const id = d.id;

    const card = document.createElement("div");
    card.className = "price-card official";

    card.innerHTML = `
      <b>${t.categoria || "—"}</b><br>
      👤 Cidadão: ${t.nome || "—"}<br>
      🆔 CID: ${t.cid || "—"}<br>
      📌 Status: ${t.status || "—"}<br>
      ⚖️ Encerrado por: ${t.encerradoPor || "—"}
      <br><br>
    `;

    if (t.status !== "encerrado") {
      const btn = document.createElement("button");
      btn.textContent = "🔒 Encerrar Ticket";
      btn.onclick = async () => {
        await updateDoc(doc(db, "tickets", id), {
          status: "encerrado",
          encerradoPor: usuario.nome,
          encerradoEm: serverTimestamp()
        });
      };
      card.appendChild(btn);
    }

    box.appendChild(card);
  });
});

/* ======================================================
   📜 LOGS / AUDITORIA
====================================================== */
onSnapshot(
  query(collection(db, "logs"), orderBy("data", "desc")),
  snap => {
    const box = document.getElementById("lista-logs");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const l = d.data();

      const data = l.data
        ? l.data.toDate().toLocaleString("pt-BR")
        : "";

      box.innerHTML += `
        <div class="price-card official">
          <b>${l.acao}</b><br>
          👤 ${l.usuario || "—"}<br>
          🆔 CID: ${l.cid || "—"}<br>
          🕒 ${data}
        </div>
      `;
    });
  }
);
