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
   🔐 USUÁRIO — JURÍDICO
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "juridico") {
  location.href = "index.html";
}

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let arquivoSelecionado = null;
let ticketsCache = [];

/* ======================================================
   LOGOUT
====================================================== */
window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* ======================================================
   ABAS
====================================================== */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
};

/* ======================================================
   🕒 CARREGAR TICKETS (TODOS)
====================================================== */
const filtro = document.getElementById("filtroCategoria");
const lista = document.getElementById("ticketsCategoria");

onSnapshot(
  query(collection(db, "tickets"), where("status", "==", "aberto")),
  snap => {
    ticketsCache = [];
    filtro.innerHTML = `<option value="">Todas as categorias</option>`;
    const categorias = new Set();

    snap.forEach(d => {
      const t = { id: d.id, ...d.data() };
      ticketsCache.push(t);
      categorias.add(t.categoria);
    });

    categorias.forEach(c =>
      filtro.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`)
    );

    renderTickets();
  }
);

window.aplicarFiltro = () => renderTickets();

function renderTickets() {
  lista.innerHTML = "";
  const cat = filtro.value;

  ticketsCache
    .filter(t => !cat || t.categoria === cat)
    .forEach(t => {
      lista.innerHTML += `
        <div class="card-ticket official" onclick="abrirTicket('${t.id}','${t.categoria}')">
          <h5>${t.categoria}</h5>
          <span class="badge prioridade-media">NORMAL</span>
        </div>
      `;
    });
}

/* ======================================================
   ABRIR CHAT
====================================================== */
window.abrirTicket = (id, categoria) => {
  ticketAtual = id;
  document.getElementById("chatTitulo").innerText = `💬 ${categoria}`;
  mostrarAba("chat");
  iniciarChat();
};

/* ======================================================
   CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  onSnapshot(
    query(collection(db, "tickets", ticketAtual, "mensagens"), orderBy("criadoEm")),
    snap => {
      box.innerHTML = "";
      snap.forEach(d => {
        const m = d.data();

        let tipo = "cidadao";
        if (m.autor?.includes("jurídico")) tipo = "juridico";
        if (m.autor?.includes("coordenação")) tipo = "coordenacao";

        const dh = m.criadoEm
          ? m.criadoEm.toDate().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo"
            })
          : "";

        let preview = "";
        if (m.anexo) {
          const u = m.anexo.url;
          if (u.match(/\.(jpg|png|jpeg|webp)$/i)) {
            preview = `<img src="${u}" class="preview-img">`;
          } else if (u.endsWith(".pdf")) {
            preview = `<a href="${u}" target="_blank" download>📄 Baixar PDF</a>`;
          } else {
            preview = `<a href="${u}" target="_blank" download>⬇️ ${m.anexo.nome}</a>`;
          }
        }

        box.innerHTML += `
          <div class="mensagem ${tipo}">
            <div class="conteudo">
              <b>${m.autor}</b><br>
              ${m.texto || ""}
              ${preview}
            </div>
            <div class="hora">${dh}</div>
          </div>
        `;
      });
      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   ARQUIVO
====================================================== */
document.getElementById("arquivo").addEventListener("change", e => {
  arquivoSelecionado = e.target.files[0];
});

/* ======================================================
   CLOUDINARY
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
   ENVIAR
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();
  if (!texto && !arquivoSelecionado) return;

  let anexo = null;
  if (arquivoSelecionado) {
    anexo = await uploadCloudinary(arquivoSelecionado);
    arquivoSelecionado = null;
    document.getElementById("arquivo").value = "";
  }

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (jurídico)`,
    texto,
    anexo,
    criadoEm: serverTimestamp()
  });

  document.getElementById("mensagem").value = "";
};
