import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

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

/* 📜 Log */
async function registrarLog(ticketId, acao) {
  await addDoc(collection(db, "logs"), {
    ticket: ticketId,
    acao,
    usuario: usuario.nome,
    nivel: usuario.nivel,
    data: serverTimestamp()
  });
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
      Status: ${t.status}<br>
      SLA: <b>${calcularSLA(t)}</b><br><br>
    `;

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

    box.appendChild(div);
  });
});
