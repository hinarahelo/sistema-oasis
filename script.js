import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  orderBy,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { notificarDiscord } from "./discord.js";

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
if (!usuario || usuario.nivel !== "cidadao") location.href = "index.html";

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let unsubscribeDigitando = null;
let arquivoSelecionado = null;
let ultimoAutor = null;
let ultimaData = null;
let typingTimeout = null;

/* ======================================================
   ABAS
====================================================== */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  if (id === "andamento") carregarTicketsEmAndamento();
};
mostrarAba(location.hash.replace("#", "") || "solicitacoes");

/* ======================================================
   LOGOUT
====================================================== */
window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* ======================================================
   LOG
====================================================== */
async function registrarLog(acao) {
  await addDoc(collection(db, "logs"), {
    ticket: ticketAtual,
    cid: usuario.cid,
    usuario: usuario.nome,
    acao,
    data: serverTimestamp()
  });
}

/* ======================================================
   🕒 EM ANDAMENTO
====================================================== */
function carregarTicketsEmAndamento() {
  const grid = document.getElementById("categoriasTickets");
  const lista = document.getElementById("listaPorCategoria");
  const box = document.getElementById("ticketsCategoria");

  grid.innerHTML = "";
  lista.classList.add("hidden");

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("status", "==", "aberto")
  );

  onSnapshot(q, snap => {
    const cats = {};
    grid.innerHTML = "";

    snap.forEach(d => {
      const t = d.data();
      if (!cats[t.categoria]) cats[t.categoria] = [];
      cats[t.categoria].push({ id: d.id, ...t });
    });

    if (!Object.keys(cats).length) {
      grid.innerHTML = "<p>Nenhum ticket em andamento.</p>";
      return;
    }

    Object.keys(cats).forEach(cat => {
      const card = document.createElement("div");
      card.className = "categoria-card official";
      card.innerHTML = `<h4>${cat}</h4><span>${cats[cat].length} em andamento</span>`;

      card.onclick = () => {
        document.getElementById("tituloCategoria").innerText = cat;
        grid.innerHTML = "";
        lista.classList.remove("hidden");
        box.innerHTML = "";

        cats[cat].forEach(t => {
          const item = document.createElement("div");
          item.className = "card-ticket official";
          item.innerHTML = `
            <h5>${t.categoria}</h5>
            <small>${t.criadoEm?.toDate().toLocaleString("pt-BR")}</small>
          `;
          item.onclick = () => {
            ticketAtual = t.id;
            document.getElementById("chatTitulo").innerText = `💬 ${t.categoria}`;
            mostrarAba("chat");
            iniciarChat();
          };
          box.appendChild(item);
        });
      };
      grid.appendChild(card);
    });
  });
}
window.voltarCategorias = () => carregarTicketsEmAndamento();

/* ======================================================
   📂 ABRIR / CRIAR
====================================================== */
window.abrirCategoria = async categoria => {
  mostrarAba("chat");
  document.getElementById("chatTitulo").innerText = `💬 ${categoria}`;

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", categoria),
    where("status", "!=", "encerrado")
  );

  const snap = await getDocs(q);
  if (!snap.empty) ticketAtual = snap.docs[0].id;
  else {
    const ref = await addDoc(collection(db, "tickets"), {
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: serverTimestamp()
    });
    ticketAtual = ref.id;
    await registrarLog("Ticket criado");
    await notificarDiscord(
      `📩 NOVO TICKET\nCategoria: ${categoria}\nCidadão: ${usuario.nome}`,
      "WEBHOOK_JURIDICO_AQUI"
    );
  }
  iniciarChat();
};

/* ======================================================
   💬 CHAT (AGRUPADO + DATA + DIGITANDO)
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.querySelector(".chat-input button");

  box.innerHTML = "";
  ultimoAutor = null;
  ultimaData = null;

  if (unsubscribeMensagens) unsubscribeMensagens();
  if (unsubscribeStatus) unsubscribeStatus();
  if (unsubscribeDigitando) unsubscribeDigitando();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), s => {
    const t = s.data();
    input.disabled = btn.disabled = t.status === "encerrado";
    input.placeholder =
      t.status === "encerrado"
        ? "🔒 Ticket encerrado — leitura apenas"
        : "Digite sua mensagem...";
  });

  unsubscribeDigitando = onSnapshot(
    collection(db, "tickets", ticketAtual, "digitando"),
    snap => {
      document.getElementById("digitando")?.remove();
      snap.forEach(d => {
        if (d.id !== usuario.cid) {
          box.insertAdjacentHTML(
            "beforeend",
            `<div id="digitando" class="digitando">✍️ ${d.data().nome} está digitando...</div>`
          );
        }
      });
    }
  );

  unsubscribeMensagens = onSnapshot(
    query(collection(db, "tickets", ticketAtual, "mensagens"), orderBy("criadoEm")),
    snap => {
      box.innerHTML = "";
      ultimoAutor = null;
      ultimaData = null;

      snap.forEach(d => {
        const m = d.data();
        if (!m.criadoEm) return;

        const dataObj = m.criadoEm.toDate();
        const dataStr = dataObj.toLocaleDateString("pt-BR");
        const horaStr = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        if (dataStr !== ultimaData) {
          box.innerHTML += `<div class="chat-data">${dataStr}</div>`;
          ultimaData = dataStr;
          ultimoAutor = null;
        }

        let tipo = "cidadao", classe = "nome-cidadao";
        if (m.autor?.includes("juridico")) (tipo = "juridico"), (classe = "nome-juridico");
        if (m.autor?.includes("coordenacao")) (tipo = "coordenacao"), (classe = "nome-coordenacao");

        const mostrarAutor = m.autor !== ultimoAutor;

        box.innerHTML += `
          <div class="mensagem ${tipo} nova">
            ${mostrarAutor ? `<span class="autor ${classe}">${m.autor}</span>` : ""}
            <div class="texto">${m.texto || ""}</div>
            <div class="hora">${horaStr}</div>
          </div>
        `;

        ultimoAutor = m.autor;
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   DIGITANDO
====================================================== */
const inputMensagem = document.getElementById("mensagem");
inputMensagem?.addEventListener("input", () => {
  if (!ticketAtual) return;
  setDoc(doc(db, "tickets", ticketAtual, "digitando", usuario.cid), {
    nome: `${usuario.nome} (${usuario.nivel})`,
    at: serverTimestamp()
  });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    deleteDoc(doc(db, "tickets", ticketAtual, "digitando", usuario.cid));
  }, 2000);
});

/* ======================================================
   📤 ENVIAR
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();
  if (!texto && !arquivoSelecionado) return;

  const t = await getDoc(doc(db, "tickets", ticketAtual));
  if (t.data().status === "encerrado") return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (${usuario.nivel})`,
    texto,
    criadoEm: serverTimestamp()
  });

  await registrarLog("Mensagem enviada");
  document.getElementById("mensagem").value = "";
  deleteDoc(doc(db, "tickets", ticketAtual, "digitando", usuario.cid));
};
