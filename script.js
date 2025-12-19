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

/* 🔥 Firebase */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* 🔐 Usuário */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "cidadao") {
  location.href = "index.html";
}

/* ESTADO */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let typingTimeout = null;

/* ================= ABAS ================= */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a =>
    a.classList.remove("active")
  );
  document.getElementById(id)?.classList.add("active");
};

/* 🔁 HASH */
const hash = location.hash.replace("#", "");
mostrarAba(hash || "solicitacoes");

/* 🚪 LOGOUT */
window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* 📜 LOG */
async function registrarLog(acao) {
  await addDoc(collection(db, "logs"), {
    ticket: ticketAtual,
    cid: usuario.cid,
    usuario: usuario.nome,
    acao,
    data: serverTimestamp()
  });
}

/* ================= ABRIR / CRIAR TICKET ================= */
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

/* ================= CHAT ================= */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btnEnviar = document.querySelector(".chat-input button");
  const digitandoBox = document.getElementById("digitando");

  box.innerHTML = "";

  if (unsubscribeMensagens) unsubscribeMensagens();
  if (unsubscribeStatus) unsubscribeStatus();

  /* 🔒 STATUS */
  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const t = snap.data();
    input.disabled = t.status === "encerrado";
    btnEnviar.disabled = t.status === "encerrado";
    input.placeholder = t.status === "encerrado"
      ? "🔒 Ticket encerrado"
      : "Digite sua mensagem...";
  });

  /* 💬 MENSAGENS */
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

  /* 🟢 DIGITANDO */
  input.oninput = () => {
    setDoc(
      doc(db, "tickets", ticketAtual, "digitando", usuario.cid),
      {
        nome: usuario.nome,
        nivel: usuario.nivel,
        em: serverTimestamp()
      }
    );

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      updateDoc(
        doc(db, "tickets", ticketAtual, "digitando", usuario.cid),
        { em: null }
      );
    }, 2000);
  };

  onSnapshot(
    collection(db, "tickets", ticketAtual, "digitando"),
    snap => {
      digitandoBox.innerHTML = "";
      snap.forEach(d => {
        const t = d.data();
        if (t.nome && t.nome !== usuario.nome) {
          digitandoBox.innerHTML = `🟢 ${t.nome} está digitando...`;
        }
      });
    }
  );
}

/* ================= ENVIAR ================= */
window.enviarMensagem = async () => {
  const texto = mensagem.value.trim();
  const file = arquivo?.files[0];

  if (!texto && !file) {
    alert("Mensagem ou anexo obrigatório.");
    return;
  }

  const ticketSnap = await getDoc(doc(db, "tickets", ticketAtual));
  if (ticketSnap.data().status === "encerrado") {
    alert("Este ticket está encerrado.");
    return;
  }

  let anexo = null;
  if (file) anexo = await enviarArquivo(app, ticketAtual, file, usuario);

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (${usuario.nivel})`,
    texto,
    anexo,
    criadoEm: serverTimestamp()
  });

  await registrarLog("Mensagem enviada");

  mensagem.value = "";
};
