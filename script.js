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

import { enviarArquivo } from "./storage.js";
import { notificarDiscord } from "./discord.js";

/* 🔥 FIREBASE */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* 🔐 USUÁRIO */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "cidadao") {
  location.href = "index.html";
}

/* ESTADO */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let typingTimeout = null;

/* ABAS */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  if (id === "andamento") carregarTicketsEmAndamento();
};

const hash = location.hash.replace("#", "");
mostrarAba(hash || "solicitacoes");

window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* LOG */
async function registrarLog(acao) {
  await addDoc(collection(db, "logs"), {
    ticket: ticketAtual,
    cid: usuario.cid,
    usuario: usuario.nome,
    acao,
    data: serverTimestamp()
  });
}

/* CHAT */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btnEnviar = document.querySelector(".chat-input button");

  box.innerHTML = "";

  if (unsubscribeMensagens) unsubscribeMensagens();
  if (unsubscribeStatus) unsubscribeStatus();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const t = snap.data();
    input.disabled = t.status === "encerrado";
    btnEnviar.disabled = t.status === "encerrado";
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
        box.innerHTML += `
          <p>
            <b>${m.autor}</b><br>
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

/* ENVIAR */
window.enviarMensagem = async () => {
  try {
    const texto = document.getElementById("mensagem").value.trim();
    const fileInput = document.getElementById("arquivo");
    const file = fileInput?.files[0];

    console.log("📎 Arquivo detectado:", file);

    if (!texto && !file) {
      alert("Mensagem ou anexo obrigatório.");
      return;
    }

    let anexo = null;
    if (file) {
      anexo = await enviarArquivo(app, ticketAtual, file, usuario);
      fileInput.value = "";
    }

    await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
      autor: `${usuario.nome} (${usuario.nivel})`,
      texto,
      anexo,
      criadoEm: serverTimestamp()
    });

    document.getElementById("mensagem").value = "";
    await registrarLog("Mensagem enviada");
  } catch (err) {
    console.error("❌ ERRO AO ENVIAR:", err);
    alert("Erro ao enviar arquivo. Veja o console.");
  }
};
