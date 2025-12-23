import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";

const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || !["juridico", "coordenacao"].includes(usuario.nivel)) {
  location.href = "index.html";
}

let ticketAtual = null;
let unsubscribe = null;

export function abrirChat(ticketId) {
  ticketAtual = ticketId;
  iniciarChat();
}

function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.getElementById("btnEnviar");

  box.innerHTML = "";
  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(
    query(
      collection(db, "tickets", ticketAtual, "mensagens"),
      orderBy("criadoEm", "asc")
    ),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();

        let tipo = "cidadao";
        if (m.autor?.includes("juridico")) tipo = "juridico";
        if (m.autor?.includes("coordenacao")) tipo = "coordenacao";

        const dataHora = m.criadoEm
          ? m.criadoEm.toDate().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "";

        let anexo = "";
        if (m.anexo) {
          anexo = `
            <div class="anexo">
              📎 <a href="${m.anexo.url}" target="_blank" download>${m.anexo.nome}</a>
            </div>`;
        }

        box.innerHTML += `
          <div class="mensagem ${tipo}">
            <div class="conteudo">
              <span class="autor ${tipo}">${m.autor}</span>
              <div class="texto">${m.texto || ""}</div>
              ${anexo}
            </div>
            <div class="hora">${dataHora}</div>
          </div>
        `;
      });

      box.scrollTop = box.scrollHeight;
    }
  );

  btn.onclick = enviarMensagem;
}

async function enviarMensagem() {
  const input = document.getElementById("mensagem");
  const texto = input.value.trim();
  if (!texto) return;

  const snap = await getDoc(doc(db, "tickets", ticketAtual));
  if (snap.data().status === "encerrado") return alert("Ticket encerrado.");

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (${usuario.nivel})`,
    texto,
    criadoEm: serverTimestamp()
  });

  input.value = "";
}
