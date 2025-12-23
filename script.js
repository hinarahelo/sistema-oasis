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
   ESTADO
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let unsubscribeDigitando = null;
let typingTimeout = null;
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
   SAIR
====================================================== */
window.sair = () => {
  localStorage.clear();
  location.replace("index.html");
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
   📎 CAPTURA DE ARQUIVO
====================================================== */
const inputArquivo = document.getElementById("arquivo");
const btnRemover = document.createElement("button");

if (inputArquivo) {
  btnRemover.innerText = "❌ Remover arquivo";
  btnRemover.type = "button";
  btnRemover.style.display = "none";
  btnRemover.className = "btn-secondary";
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

/* ======================================================
   ☁️ CLOUDINARY
====================================================== */
async function uploadArquivo(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", "oasis"); // ✅ mesmo preset antigo

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/auto/upload",
    { method: "POST", body: form }
  );

  const data = await res.json();

  return {
    url: data.secure_url,
    nome: file.name,
    tipo: file.type
  };
}

/* ======================================================
   💬 CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.querySelector(".chat-input button");

  box.innerHTML = "";

  unsubscribeMensagens?.();
  unsubscribeStatus?.();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const fechado = snap.data().status === "encerrado";
    input.disabled = btn.disabled = fechado;
    input.placeholder = fechado
      ? "🔒 Ticket encerrado — somente leitura"
      : "Digite sua mensagem...";
  });

  unsubscribeMensagens = onSnapshot(
    query(collection(db, "tickets", ticketAtual, "mensagens"), orderBy("criadoEm")),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        const hora = m.criadoEm?.toDate().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        });

        let anexo = "";
        if (m.anexo) {
          anexo = `
            <div class="anexo">
              📎 <a href="${m.anexo.url}" target="_blank">${m.anexo.nome}</a>
            </div>`;
        }

        box.innerHTML += `
          <div class="mensagem cidadao">
            <span class="autor">${m.autor}</span>
            ${m.texto ? `<div>${m.texto}</div>` : ""}
            ${anexo}
            <div class="hora">${hora || ""}</div>
          </div>
        `;
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

  let anexo = null;

  if (arquivoSelecionado) {
    anexo = await uploadArquivo(arquivoSelecionado);
  }

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (cidadão)`,
    texto: texto || "",
    anexo,
    criadoEm: serverTimestamp()
  });

  await registrarLog("Mensagem enviada");

  document.getElementById("mensagem").value = "";
  if (inputArquivo) inputArquivo.value = "";
  arquivoSelecionado = null;
  btnRemover.style.display = "none";
};
