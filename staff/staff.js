import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  addDoc
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

  const horas = (Date.now() - ticket.criadoEm.toDate().getTime()) / 36e5;
  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  return "🔴 Estourado";
}

/* 📜 LOG */
async function registrarLog(ticketId, acao) {
  await addDoc(collection(db, "logs"), {
    ticket: ticketId,
    acao,
    usuario: usuario.nome,
    nivel: usuario.nivel,
    data: serverTimestamp()
  });
}

/* 🎫 TICKETS */
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
      Status: ${t.status}<br>
      SLA: <b>${calcularSLA(t)}</b><br><br>
    `;

    /* ⚖️ ENCERRAR — jurídico e coordenação */
    if (t.status !== "encerrado") {
      const btnEncerrar = document.createElement("button");
      btnEncerrar.textContent = "⚖️ Encerrar Ticket";
      btnEncerrar.onclick = async () => {
        await updateDoc(doc(db, "tickets", id), {
          status: "encerrado",
          encerradoPor: usuario.nome,
          encerradoEm: serverTimestamp()
        });

        await registrarLog(id, "Ticket encerrado");
      };
      div.appendChild(btnEncerrar);
    }

    /* 👑 COORDENAÇÃO — reabrir */
    if (usuario.nivel === "coordenacao" && t.status === "encerrado") {
      const btnReabrir = document.createElement("button");
      btnReabrir.textContent = "🔓 Reabrir Ticket";
      btnReabrir.onclick = async () => {
        await updateDoc(doc(db, "tickets", id), {
          status: "aberto",
          atendente: null
        });

        await registrarLog(id, "Ticket reaberto");
      };
      div.appendChild(btnReabrir);
    }

    box.appendChild(div);
  });
});
