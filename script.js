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
  updateDoc,
  doc,
  getDoc,
  orderBy,
  setDoc
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
if (!usuario || usuario.nivel !== "cidadao") {
  location.href = "index.html";
}

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let typingTimeout = null;

let arquivoSelecionado = null;

/* ======================================================
   ABAS
====================================================== */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a =>
    a.classList.remove("active")
  );

  document.getElementById(id)?.classList.add("active");

  if (id === "andamento") {
    carregarTicketsEmAndamento();
  }
};

const hash = location.hash.replace("#", "");
mostrarAba(hash || "solicitacoes");

/* ======================================================
   LOGOUT
====================================================== */
window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* ======================================================
   LOGS
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
  const listaCategoria = document.getElementById("listaPorCategoria");
  const ticketsBox = document.getElementById("ticketsCategoria");

  grid.innerHTML = "";
  listaCategoria.classList.add("hidden");

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("status", "==", "aberto")
  );

  onSnapshot(q, snap => {
    const categorias = {};
    grid.innerHTML = "";

    snap.forEach(d => {
      const t = d.data();
      if (!categorias[t.categoria]) categorias[t.categoria] = [];
      categorias[t.categoria].push({ id: d.id, ...t });
    });

    if (Object.keys(categorias).length === 0) {
      grid.innerHTML = "<p>Nenhum ticket em andamento.</p>";
      return;
    }

    Object.keys(categorias).forEach(cat => {
      const card = document.createElement("div");
      card.className = "categoria-card official";
      card.innerHTML = `
        <h4>${cat}</h4>
        <span>${categorias[cat].length} em andamento</span>
      `;

      card.onclick = () => {
        document.getElementById("tituloCategoria").innerText = cat;
        grid.innerHTML = "";
        listaCategoria.classList.remove("hidden");
        ticketsBox.innerHTML = "";

        categorias[cat].forEach(t => {
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

          ticketsBox.appendChild(item);
        });
      };

      grid.appendChild(card);
    });
  });
}

window.voltarCategorias = () => carregarTicketsEmAndamento();

/* ======================================================
   📂 ABRIR / CRIAR TICKET
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

    await registrarLog("Ticket criado");

    await notificarDiscord(
      `📩 NOVO TICKET\nCategoria: ${categoria}\nCidadão: ${usuario.nome}`,
      "WEBHOOK_JURIDICO_AQUI"
    );
  }

  iniciarChat();
};

/* ======================================================
   💬 CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btnEnviar = document.querySelector(".chat-input button");
  const digitandoBox = document.getElementById("digitando");

  box.innerHTML = "";

  if (unsubscribeMensagens) unsubscribeMensagens();
  if (unsubscribeStatus) unsubscribeStatus();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const t = snap.data();
    input.disabled = t.status === "encerrado";
    btnEnviar.disabled = t.status === "encerrado";
    input.placeholder = t.status === "encerrado"
      ? "🔒 Ticket encerrado"
      : "Digite sua mensagem...";
  });

  unsubscribeMensagens = onSnapshot(
    query(
      collection(db, "tickets", ticketAtual, "mensagens"),
      orderBy("criadoEm", "asc")
    ),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        const hora = m.criadoEm
          ? m.criadoEm.toDate().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            })
          : "--:--";

        let classe = "nome-cidadao";
        if (m.autor?.includes("juridico")) classe = "nome-juridico";
        if (m.autor?.includes("coordenacao")) classe = "nome-coordenacao";

        box.innerHTML += `
          <p>
            <b class="${classe}">${m.autor}</b>
            <span class="hora">(${hora})</span><br>
            ${m.texto || ""}
          </p>
        `;

        if (m.anexo) {
          box.innerHTML += `
            <p class="anexo">
              📎 <a href="${m.anexo.url}" target="_blank">${m.anexo.nome}</a>
            </p>
          `;
        }
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   📎 ARQUIVO — SELEÇÃO / REMOVER
====================================================== */
const fileInput = document.getElementById("arquivo");

fileInput.addEventListener("change", () => {
  arquivoSelecionado = fileInput.files[0];
  if (arquivoSelecionado) {
    fileInput.insertAdjacentHTML(
      "afterend",
      `<div id="arquivoPreview">
        📎 ${arquivoSelecionado.name}
        <button onclick="removerArquivo()">❌</button>
      </div>`
    );
  }
});

window.removerArquivo = () => {
  arquivoSelecionado = null;
  fileInput.value = "";
  document.getElementById("arquivoPreview")?.remove();
};

/* ======================================================
   ☁️ CLOUDINARY UPLOAD
====================================================== */
async function uploadCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "oasis_upload");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dnd90frwv/auto/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  return {
    nome: file.name,
    url: data.secure_url
  };
}

/* ======================================================
   📤 ENVIAR
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();

  if (!texto && !arquivoSelecionado) {
    alert("Mensagem ou anexo obrigatório.");
    return;
  }

  const ticketSnap = await getDoc(doc(db, "tickets", ticketAtual));
  if (ticketSnap.data().status === "encerrado") {
    alert("Este ticket está encerrado.");
    return;
  }

  let anexo = null;
  if (arquivoSelecionado) {
    anexo = await uploadCloudinary(arquivoSelecionado);
    removerArquivo();
  }

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (${usuario.nivel})`,
    texto,
    anexo,
    criadoEm: serverTimestamp()
  });

  await registrarLog("Mensagem enviada");

  document.getElementById("mensagem").value = "";
};
