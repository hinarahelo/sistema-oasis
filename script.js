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
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
if (!usuario || usuario.nivel !== "cidadao") {
  location.replace("index.html");
}

/* ======================================================
   ESTADO GLOBAL
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let arquivoSelecionado = null;

/* ======================================================
   DOM READY
====================================================== */
document.addEventListener("DOMContentLoaded", () => {

  window.mostrarAba = id => {
    document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
    if (id === "andamento") carregarTicketsEmAndamento();
  };

  window.irAba = id => {
    location.hash = id;
    mostrarAba(id);
  };

  window.sair = () => {
    localStorage.clear();
    location.replace("index.html");
  };

  mostrarAba(location.hash.replace("#", "") || "solicitacoes");

  /* ================= ARQUIVO ================= */
  const inputArquivo = document.getElementById("arquivo");
  const btnRemover = document.createElement("button");

  if (inputArquivo) {
    btnRemover.innerText = "❌ Remover arquivo";
    btnRemover.type = "button";
    btnRemover.className = "btn-secondary";
    btnRemover.style.display = "none";
    inputArquivo.after(btnRemover);

    inputArquivo.addEventListener("change", e => {
      arquivoSelecionado = e.target.files[0] || null;
      btnRemover.style.display = arquivoSelecionado ? "inline-block" : "none";
    });

    btnRemover.onclick = () => {
      arquivoSelecionado = null;
      inputArquivo.value = "";
      btnRemover.style.display = "none";
    };
  }
});

/* ======================================================
   📂 ABRIR / CRIAR TICKET (1 POR CATEGORIA)
====================================================== */
window.abrirCategoria = async categoria => {
  mostrarAba("chat");

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", categoria),
    where("status", "==", "aberto")
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    ticketAtual = snap.docs[0].id;
  } else {
    const ref = await addDoc(collection(db, "tickets"), {
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: serverTimestamp()
    });
    ticketAtual = ref.id;
  }

  iniciarChat();
};

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
      card.className = "categoria-card";
      card.innerHTML = `<h4>${cat}</h4><span>${cats[cat].length} ativo</span>`;

      card.onclick = () => {
        grid.innerHTML = "";
        lista.classList.remove("hidden");
        document.getElementById("tituloCategoria").innerText = cat;
        box.innerHTML = "";

        cats[cat].forEach(t => {
          const item = document.createElement("div");
          item.className = "card-ticket";
          item.innerHTML = `<strong>${t.categoria}</strong>`;
          item.onclick = () => {
            ticketAtual = t.id;
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
   💬 CHAT — COM CORES, DATA, HORA E PREVIEW
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  let ultimoAutor = null;
  let ultimaData = null;

  unsubscribeMensagens?.();
  unsubscribeStatus?.();

  unsubscribeMensagens = onSnapshot(
    query(
      collection(db, "tickets", ticketAtual, "mensagens"),
      orderBy("criadoEm")
    ),
    snap => {
      box.innerHTML = "";
      ultimoAutor = null;
      ultimaData = null;

      snap.forEach(d => {
        const m = d.data();
        if (!m.criadoEm) return;

        const dataObj = m.criadoEm.toDate();
        const dataStr = dataObj.toLocaleDateString("pt-BR");
        const horaStr = dataObj.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        });

        if (dataStr !== ultimaData) {
          box.innerHTML += `<div class="chat-data">${dataStr}</div>`;
          ultimaData = dataStr;
          ultimoAutor = null;
        }

        let tipo = "cidadao";
        if (m.autor?.includes("juridico")) tipo = "juridico";
        if (m.autor?.includes("coordenacao")) tipo = "coordenacao";

        const mostrarAutor = m.autor !== ultimoAutor;

        let anexoHtml = "";
        if (m.anexo) {
          if (m.anexo.tipo?.startsWith("image/")) {
            anexoHtml = `<img src="${m.anexo.url}" style="max-width:220px;border-radius:10px;">`;
          } else {
            anexoHtml = `<a href="${m.anexo.url}" target="_blank">📎 ${m.anexo.nome}</a>`;
          }
        }

        box.innerHTML += `
          <div class="mensagem ${tipo}">
            ${mostrarAutor ? `<span class="autor">${m.autor}</span>` : ""}
            ${m.texto || ""}
            ${anexoHtml}
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
   📤 ENVIAR
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();
  if (!texto && !arquivoSelecionado) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (cidadao)`,
    texto: texto || "",
    criadoEm: serverTimestamp()
  });

  document.getElementById("mensagem").value = "";
};
