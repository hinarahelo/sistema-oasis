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
  orderBy
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
let arquivoSelecionado = null;

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
   💬 CHAT (COM PREVIEW)
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.querySelector(".chat-input button");

  box.innerHTML = "";
  if (unsubscribeMensagens) unsubscribeMensagens();
  if (unsubscribeStatus) unsubscribeStatus();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), s => {
    const t = s.data();
    input.disabled = btn.disabled = t.status === "encerrado";
    input.placeholder = t.status === "encerrado" ? "🔒 Ticket encerrado" : "Digite sua mensagem...";
  });

  unsubscribeMensagens = onSnapshot(
    query(collection(db, "tickets", ticketAtual, "mensagens"), orderBy("criadoEm")),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        let tipo = "cidadao", classe = "nome-cidadao";
        if (m.autor?.includes("juridico")) (tipo = "juridico"), (classe = "nome-juridico");
        if (m.autor?.includes("coordenacao")) (tipo = "coordenacao"), (classe = "nome-coordenacao");

        const dh = m.criadoEm
          ? m.criadoEm.toDate().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit"
            })
          : "";

        let preview = "";
        if (m.anexo) {
          const url = m.anexo.url;
          if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            preview = `
              <div class="preview-img">
                <a href="${url}" target="_blank" download>
                  <img src="${url}" alt="preview">
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
              ${m.texto || ""}
              ${preview}
            </div>
            <div class="hora">${dh}</div>
          </div>`;
      });
      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   📎 ARQUIVO
====================================================== */
const fileInput = document.getElementById("arquivo");
fileInput.addEventListener("change", () => {
  arquivoSelecionado = fileInput.files[0];
  document.getElementById("arquivoPreview")?.remove();
  if (arquivoSelecionado) {
    fileInput.insertAdjacentHTML(
      "afterend",
      `<div id="arquivoPreview">📎 ${arquivoSelecionado.name}
        <button type="button" onclick="removerArquivo()">❌</button>
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
  const r = await fetch("https://api.cloudinary.com/v1_1/dnd90frwv/auto/upload", {
    method: "POST",
    body: fd
  });
  const d = await r.json();
  return { nome: file.name, url: d.secure_url };
}

/* ======================================================
   📤 ENVIAR
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();
  if (!texto && !arquivoSelecionado) return alert("Mensagem ou anexo obrigatório.");

  const t = await getDoc(doc(db, "tickets", ticketAtual));
  if (t.data().status === "encerrado") return alert("Ticket encerrado.");

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
