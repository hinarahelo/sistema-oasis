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
   🔐 USUÁRIO — JURÍDICO
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "juridico") {
  location.href = "../index.html";
}

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let arquivoSelecionado = null;

/* ======================================================
   LOGS
====================================================== */
async function registrarLog(acao) {
  await addDoc(collection(db, "logs"), {
    ticket: ticketAtual,
    usuario: usuario.nome,
    nivel: "juridico",
    acao,
    data: serverTimestamp()
  });
}

/* ======================================================
   📂 TICKETS ABERTOS (TODOS)
====================================================== */
function carregarTicketsAbertos() {
  const lista = document.getElementById("listaTickets");
  lista.innerHTML = "";

  const q = query(
    collection(db, "tickets"),
    where("status", "==", "aberto")
  );

  onSnapshot(q, snap => {
    lista.innerHTML = "";

    if (snap.empty) {
      lista.innerHTML = "<p>Nenhum ticket aberto.</p>";
      return;
    }

    snap.forEach(d => {
      const t = d.data();
      const item = document.createElement("div");
      item.className = "card-ticket official";
      item.innerHTML = `
        <h4>${t.categoria}</h4>
        <small>${t.nome}</small>
      `;

      item.onclick = () => {
        ticketAtual = d.id;
        document.getElementById("chatTitulo").innerText = `💬 ${t.categoria}`;
        iniciarChat();
      };

      lista.appendChild(item);
    });
  });
}

carregarTicketsAbertos();

/* ======================================================
   💬 CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.getElementById("btnEnviar");

  box.innerHTML = "";

  if (unsubscribeMensagens) unsubscribeMensagens();
  if (unsubscribeStatus) unsubscribeStatus();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const t = snap.data();
    input.disabled = btn.disabled = t.status === "encerrado";
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

        let tipo = "juridico";
        let classe = "nome-juridico";
        if (m.autor?.includes("cidadao")) {
          tipo = "cidadao";
          classe = "nome-cidadao";
        }
        if (m.autor?.includes("coordenacao")) {
          tipo = "coordenacao";
          classe = "nome-coordenacao";
        }

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

        let preview = "";
        if (m.anexo) {
          const url = m.anexo.url;

          if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            preview = `
              <div class="preview-img">
                <a href="${url}" target="_blank" download>
                  <img src="${url}">
                </a>
              </div>`;
          } else if (url.match(/\.pdf$/i)) {
            preview = `
              <div class="preview-pdf">
                📄 <a href="${url}" target="_blank" download>Baixar PDF</a>
              </div>`;
          } else {
            preview = `
              <div class="anexo">
                📎 <a href="${url}" target="_blank" download>⬇️ ${m.anexo.nome}</a>
              </div>`;
          }
        }

        box.innerHTML += `
          <div class="mensagem ${tipo}">
            <div class="conteudo">
              <span class="autor ${classe}">${m.autor}</span>
              <div class="texto">${m.texto || ""}</div>
              ${preview}
            </div>
            <div class="hora">${dataHora}</div>
          </div>
        `;
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   📎 ARQUIVO
====================================================== */
const fileInput = document.getElementById("arquivo");
fileInput?.addEventListener("change", () => {
  arquivoSelecionado = fileInput.files[0];
  document.getElementById("arquivoPreview")?.remove();

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
   ☁️ CLOUDINARY
====================================================== */
async function uploadCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "oasis_upload");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dnd90frwv/auto/upload",
    { method: "POST", body: fd }
  );

  const data = await res.json();
  return { nome: file.name, url: data.secure_url };
}

/* ======================================================
   📤 ENVIAR MENSAGEM
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();
  if (!texto && !arquivoSelecionado) {
    alert("Mensagem ou anexo obrigatório.");
    return;
  }

  let anexo = null;
  if (arquivoSelecionado) {
    anexo = await uploadCloudinary(arquivoSelecionado);
    removerArquivo();
  }

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (juridico)`,
    texto,
    anexo,
    criadoEm: serverTimestamp()
  });

  await registrarLog("Resposta jurídica enviada");
  document.getElementById("mensagem").value = "";
};

/* ======================================================
   🔒 ENCERRAR TICKET
====================================================== */
window.encerrarTicket = async () => {
  if (!confirm("Deseja encerrar este ticket?")) return;

  await updateDoc(doc(db, "tickets", ticketAtual), {
    status: "encerrado"
  });

  await registrarLog("Ticket encerrado pelo jurídico");

  await notificarDiscord(
    `🔒 TICKET ENCERRADO\nTicket: ${ticketAtual}\nPor: ${usuario.nome}`,
    "WEBHOOK_COORDENACAO_AQUI"
  );
};
