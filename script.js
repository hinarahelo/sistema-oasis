import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { enviarArquivo } from "./storage.js";

/* ===============================
   🔥 FIREBASE
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===============================
   🔐 USUÁRIO (OAuth)
================================ */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) {
  location.href = "index.html";
}

/* ===============================
   🧭 ESTADO GLOBAL
================================ */
let ticketAtual = null;
let unsubscribeMensagens = null;

/* ===============================
   🗂️ ABAS
================================ */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  const aba = document.getElementById(id);
  if (aba) aba.classList.add("active");
};

/* ===============================
   🚪 LOGOUT
================================ */
window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* ===============================
   📂 ABRIR / CRIAR TICKET
================================ */
window.abrirCategoria = async categoria => {
  mostrarAba("chat");

  const titulo = document.getElementById("chatTitulo");
  if (titulo) titulo.innerText = `💬 ${categoria}`;

  // 🔍 verifica ticket aberto da categoria
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
    const docRef = await addDoc(collection(db, "tickets"), {
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: serverTimestamp()
    });
    ticketAtual = docRef.id;
  }

  iniciarChat();
};

/* ===============================
   💬 CHAT (REALTIME)
================================ */
function iniciarChat() {
  if (!ticketAtual) return;

  const box = document.getElementById("mensagens");
  if (!box) return;

  box.innerHTML = "";

  // remove listener anterior
  if (unsubscribeMensagens) unsubscribeMensagens();

  unsubscribeMensagens = onSnapshot(
    collection(db, "tickets", ticketAtual, "mensagens"),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();

        let html = `<p><b>${m.autor}:</b> ${m.texto || ""}</p>`;

        if (m.anexo) {
          html += `
            <p>
              📎 <a href="${m.anexo.url}" target="_blank">
                ${m.anexo.nome}
              </a>
            </p>
          `;
        }

        box.innerHTML += html;
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ===============================
   ✉️ ENVIAR MENSAGEM + ANEXO
================================ */
window.enviarMensagem = async () => {
  const input = document.getElementById("mensagem");
  const fileInput = document.getElementById("arquivo");

  if (!ticketAtual) return;

  const texto = input.value.trim();
  const file = fileInput.files[0];

  if (!texto && !file) return;

  let anexo = null;

  if (file) {
    anexo = await enviarArquivo(app, ticketAtual, file, usuario);
  }

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} ${usuario.cid}`,
    texto: texto || "",
    anexo,
    criadoEm: serverTimestamp()
  });

  input.value = "";
  fileInput.value = "";
};

/* ===============================
   🕒 LISTAR TICKETS EM ANDAMENTO
================================ */
async function carregarTicketsEmAndamento() {
  const lista = document.getElementById("listaTickets");
  if (!lista) return;

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("status", "==", "aberto")
  );

  const snap = await getDocs(q);

  lista.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.categoria}</b><br>
      Status: ${t.status}
    `;

    div.onclick = () => {
      ticketAtual = d.id;
      mostrarAba("chat");

      const titulo = document.getElementById("chatTitulo");
      if (titulo) titulo.innerText = `💬 ${t.categoria}`;

      iniciarChat();
    };

    lista.appendChild(div);
  });
}

/* ===============================
   🚀 INICIALIZAÇÃO
================================ */
carregarTicketsEmAndamento();
mostrarAba("solicitacoes");
