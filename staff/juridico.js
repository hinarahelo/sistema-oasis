import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { notificarDiscord } from "../discord.js";

/* ======================================================
   🔥 FIREBASE
====================================================== */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* ======================================================
   🔐 USUÁRIO
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "juridico") {
  location.href = "../index.html";
}

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let ticketsCache = [];
let unsubscribeMensagens = null;
let arquivoSelecionado = null;

/* ======================================================
   📂 CARREGAR TICKETS + FILTRO
====================================================== */
function carregarTickets() {
  const lista = document.getElementById("listaTickets");
  const filtro = document.getElementById("filtroCategoria");

  const q = query(collection(db, "tickets"), where("status", "==", "aberto"));

  onSnapshot(q, snap => {
    ticketsCache = [];
    lista.innerHTML = "";
    filtro.innerHTML = `<option value="">Todas as categorias</option>`;

    snap.forEach(d => {
      const t = { id: d.id, ...d.data() };
      ticketsCache.push(t);

      if (![...filtro.options].some(o => o.value === t.categoria)) {
        filtro.innerHTML += `<option value="${t.categoria}">${t.categoria}</option>`;
      }
    });

    renderTickets();
  });
}

window.filtrarCategoria = () => {
  const cat = document.getElementById("filtroCategoria").value;
  renderTickets(cat);
};

function prioridadeBadge(p = "media") {
  if (p === "alta") return `<span class="badge badge-alta">ALTA</span>`;
  if (p === "baixa") return `<span class="badge badge-baixa">BAIXA</span>`;
  return `<span class="badge badge-media">MÉDIA</span>`;
}

function renderTickets(filtro = "") {
  const lista = document.getElementById("listaTickets");
  lista.innerHTML = "";

  ticketsCache
    .filter(t => !filtro || t.categoria === filtro)
    .forEach(t => {
      const card = document.createElement("div");
      card.className = "card-ticket official";
      card.innerHTML = `
        <h4>${t.categoria} ${prioridadeBadge(t.prioridade)}</h4>
        <small>${t.nome}</small>
      `;

      card.onclick = () => {
        ticketAtual = t.id;
        document.getElementById("chatTitulo").innerText = `💬 ${t.categoria}`;
        document.getElementById("painel").classList.remove("active");
        document.getElementById("chat").classList.add("active");
        iniciarChat();
      };

      lista.appendChild(card);
    });
}

carregarTickets();

/* ======================================================
   💬 CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  if (unsubscribeMensagens) unsubscribeMensagens();

  unsubscribeMensagens = onSnapshot(
    query(collection(db, "tickets", ticketAtual, "mensagens"), orderBy("criadoEm")),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();

        let tipo = "juridico", classe = "nome-juridico";
        if (m.autor?.includes("cidadao")) (tipo = "cidadao"), (classe = "nome-cidadao");
        if (m.autor?.includes("coordenacao")) (tipo = "coordenacao"), (classe = "nome-coordenacao");

        const dh = m.criadoEm
          ? m.criadoEm.toDate().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
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
            <span class="autor ${classe}">${m.autor}</span>
            ${m.texto || ""}
            ${anexo}
            <div class="hora">${dh}</div>
          </div>
        `;
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   📤 ENVIAR
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();
  if (!texto) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (juridico)`,
    texto,
    criadoEm: serverTimestamp()
  });

  document.getElementById("mensagem").value = "";
};

/* ======================================================
   🔒 ENCERRAR
====================================================== */
window.encerrarTicket = async () => {
  if (!confirm("Encerrar este ticket?")) return;

  await updateDoc(doc(db, "tickets", ticketAtual), { status: "encerrado" });

  await notificarDiscord(
    `🔒 Ticket encerrado\nID: ${ticketAtual}`,
    "WEBHOOK_COORDENACAO_AQUI"
  );

  voltarPainel();
};
