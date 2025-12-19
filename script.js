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
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { enviarArquivo } from "./storage.js";
import { notificarDiscord } from "./discord.js";

/* 🔥 Firebase */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* 🔐 Usuário */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) location.href = "index.html";

/* ESTADO */
let ticketAtual = null;
let unsubscribe = null;

/* ABAS */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
};

/* LOGOUT */
window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* ABRIR / CRIAR */
window.abrirCategoria = async categoria => {
  mostrarAba("chat");
  document.getElementById("chatTitulo").innerText = `💬 ${categoria}`;

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", categoria),
    where("status", "!=", "fechado")
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

    await notificarDiscord(
      `📩 NOVO TICKET\nCategoria: ${categoria}\nCidadão: ${usuario.nome}`,
      "WEBHOOK_JURIDICO_AQUI"
    );
  }

  iniciarChat();
};

/* CHAT */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(
    collection(db, "tickets", ticketAtual, "mensagens"),
    snap => {
      box.innerHTML = "";
      snap.forEach(d => {
        const m = d.data();
        box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto || ""}</p>`;
        if (m.anexo) {
          box.innerHTML += `<p>📎 <a href="${m.anexo.url}" target="_blank">${m.anexo.nome}</a></p>`;
        }
      });
      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ENVIAR */
window.enviarMensagem = async () => {
  const texto = mensagem.value.trim();
  const file = arquivo?.files[0];

  if (!texto && !file) {
    alert("Mensagem ou anexo obrigatório.");
    return;
  }

  let anexo = null;
  if (file) anexo = await enviarArquivo(app, ticketAtual, file, usuario);

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} ${usuario.cid}`,
    texto,
    anexo,
    criadoEm: serverTimestamp()
  });

  await notificarDiscord(
    `💬 NOVA RESPOSTA\nTicket: ${ticketAtual}\nPor: ${usuario.nome}`,
    "WEBHOOK_STAFF_AQUI"
  );

  mensagem.value = "";
};

mostrarAba("solicitacoes");
