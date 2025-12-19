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

if (!usuario || (usuario.nivel !== "staff" && usuario.nivel !== "coordenacao")) {
  location.href = "../index.html";
}

/* ⏱ SLA (mantido) */
function calcularSLA(ticket) {
  if (!ticket.criadoEm) return "🟢 OK";

  const inicio = ticket.criadoEm.toDate().getTime();
  const horas = (Date.now() - inicio) / 36e5;

  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  return "🔴 Estourado";
}

/* 🎫 Tickets — tempo real */
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

    /* 👮 STAFF — assumir ticket */
    if (!t.atendente && usuario.nivel === "staff") {
      const btnAssumir = document.createElement("button");
      btnAssumir.textContent = "👮 Assumir Ticket";
      btnAssumir.onclick = async () => {
        await updateDoc(doc(db, "tickets", id), {
          atendente: usuario.nome,
          status: "em atendimento",
          assumidoEm: serverTimestamp()
        });
      };
      div.appendChild(btnAssumir);
    }

    /* ⚖️ COORDENAÇÃO — PODER REAL */
    if (usuario.nivel === "coordenacao") {

      // Encerrar ticket
      if (t.status !== "encerrado") {
        const btnFechar = document.createElement("button");
        btnFechar.textContent = "⚖️ Encerrar Ticket";
        btnFechar.onclick = async () => {
          await updateDoc(doc(db, "tickets", id), {
            status: "encerrado",
            encerradoPor: usuario.nome,
            encerradoEm: serverTimestamp()
          });
        };
        div.appendChild(btnFechar);
      }

      // Liberar ticket (remover atendente)
      if (t.atendente) {
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
    }

    box.appendChild(div);
  });
});
