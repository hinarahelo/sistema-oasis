import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

/* 🔐 Usuário */
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || !["juridico", "coordenacao"].includes(usuario.nivel)) {
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
    const id = d.id;

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <b>${t.categoria}</b><br>
      Usuário: ${t.nome}<br>
      Status: ${t.status || "aberto"}<br>
      Atendente: ${t.atendente || "—"}<br>
      SLA: <b>${calcularSLA(t)}</b><br><br>
    `;

    /* ⚖️ JURÍDICO E COORDENAÇÃO — ENCERRAR */
    if (t.status !== "encerrado") {
      const btnEncerrar = document.createElement("button");
      btnEncerrar.textContent = "⚖️ Encerrar Ticket";
      btnEncerrar.onclick = async () => {
        await updateDoc(doc(db, "tickets", id), {
          status: "encerrado",
          encerradoPor: usuario.nome,
          encerradoEm: serverTimestamp()
        });
      };
      div.appendChild(btnEncerrar);
    }

    /* 👑 COORDENAÇÃO — LIBERAR */
    if (usuario.nivel === "coordenacao" && t.atendente) {
      const btnLiberar = document.createElement("button");
      btnLiberar.textContent = "🔓 Liberar Ticket";
      btnLiberar.onclick = async () => {
        await updateDoc(doc(db, "tickets", id), {
          atendente: null,
          status: "aberto"
        });
      };
      div.appendChild(btnLiberar);
    }

    box.appendChild(div);
  });
});
