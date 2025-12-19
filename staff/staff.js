import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

/* =====================================================
   🔐 CONTROLE DE ACESSO
===================================================== */

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || !["juridico", "coordenacao"].includes(usuario.nivel)) {
  location.href = "../index.html";
}

/* =====================================================
   📜 LOGS / AUDITORIA
===================================================== */

async function registrarLog(ticketId, acao, detalhes = "") {
  await addDoc(collection(db, "logs"), {
    ticket: ticketId,
    acao,
    detalhes,
    usuario: usuario.nome,
    nivel: usuario.nivel,
    data: serverTimestamp()
  });
}

/* =====================================================
   ⏱ SLA
===================================================== */

function calcularSLA(ticket) {
  if (!ticket.criadoEm) return "🟢 OK";

  const horas =
    (Date.now() - ticket.criadoEm.toDate().getTime()) / 36e5;

  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  return "🔴 Estourado";
}

/* =====================================================
   🎫 LISTAGEM DE TICKETS
===================================================== */

onSnapshot(collection(db, "tickets"), snap => {
  const box = document.getElementById("lista-tickets");
  if (!box) return;

  box.innerHTML = "";

  snap.forEach(d => {
    const ticket = d.data();
    const ticketId = d.id;

    const statusAtual =
      (ticket.status || "").toLowerCase().trim();

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <b>${ticket.categoria}</b><br>
      👤 Cidadão: <b>${ticket.nome}</b><br>
      🆔 CID: ${ticket.cid}<br>
      ⚖️ Jurídico: ${ticket.atendente || "—"}<br>
      📌 Status: <b>${ticket.status}</b><br>
      ⏱ SLA: <b>${calcularSLA(ticket)}</b><br><br>
    `;

    /* ✏️ ALTERAR NOME DO CIDADÃO */
    const btnCidadao = document.createElement("button");
    btnCidadao.textContent = "✏️ Alterar nome do cidadão";
    btnCidadao.onclick = async () => {
      const novoNome = prompt(
        "Novo nome do cidadão:",
        ticket.nome
      );
      if (!novoNome) return;

      await updateDoc(doc(db, "tickets", ticketId), {
        nome: novoNome
      });

      await registrarLog(
        ticketId,
        "Alteração de nome do cidadão",
        `De "${ticket.nome}" para "${novoNome}"`
      );
    };
    card.appendChild(btnCidadao);

    /* ✏️ ALTERAR NOME DO JURÍDICO (coordenação) */
    if (usuario.nivel === "coordenacao" && ticket.atendente) {
      const btnJuridico = document.createElement("button");
      btnJuridico.textContent = "✏️ Alterar nome do jurídico";
      btnJuridico.onclick = async () => {
        const novoNome = prompt(
          "Novo nome do jurídico:",
          ticket.atendente
        );
        if (!novoNome) return;

        await updateDoc(doc(db, "tickets", ticketId), {
          atendente: novoNome
        });

        await registrarLog(
          ticketId,
          "Alteração de nome do jurídico",
          `De "${ticket.atendente}" para "${novoNome}"`
        );
      };
      card.appendChild(btnJuridico);
    }

    /* 👑 ALTERAR NOME DA COORDENAÇÃO */
    if (usuario.nivel === "coordenacao") {
      const btnCoord = document.createElement("button");
      btnCoord.textContent = "👑 Alterar nome da coordenação";
      btnCoord.onclick = async () => {
        const novoNome = prompt(
          "Novo nome da coordenação:",
          usuario.nome
        );
        if (!novoNome) return;

        usuario.nome = novoNome;
        localStorage.setItem(
          "usuario",
          JSON.stringify(usuario)
        );

        await registrarLog(
          ticketId,
          "Alteração de nome da coordenação",
          `Coordenação alterou o próprio nome para "${novoNome}"`
        );

        alert("Nome da coordenação atualizado.");
      };
      card.appendChild(btnCoord);
    }

    /* ⚖️ ENCERRAR TICKET — JURÍDICO E COORDENAÇÃO */
    if (statusAtual !== "encerrado") {
      const btnEncerrar = document.createElement("button");
      btnEncerrar.textContent = "⚖️ Encerrar Ticket";
      btnEncerrar.onclick = async () => {
        await updateDoc(doc(db, "tickets", ticketId), {
          status: "encerrado",
          encerradoPor: usuario.nome,
          encerradoEm: serverTimestamp()
        });

        await registrarLog(
          ticketId,
          "Ticket encerrado",
          `Encerrado por ${usuario.nome}`
        );
      };
      card.appendChild(btnEncerrar);
    }

    box.appendChild(card);
  });
});
