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
   🔐 USUÁRIO
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
  document.getElementById("chatTitulo").innerText = `💬 ${categoria}`;

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", categoria),
    where("status", "in", ["aberto", "em_atendimento"])
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

/* ===============================
   💬 CHAT REALTIME
================================ */
function iniciarChat() {
  if (!ticketAtual) return;

  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  if (unsubscribeMensagens) unsubscribeMensagens();

  unsubscribeMensagens = onSnapshot(
    collection(db, "tickets", ticketAtual, "mensagens"),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        let html = `<p><b>${m.autor}:</b> ${m.texto || ""}</p>`;

        if (m.anexo) {
          html += `<p>📎 <a href="${m.anexo.url}" target="_blank">${m.anexo.nome}</a></p>`;
        }

        box.innerHTML += html;
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ===============================
   ✉️ ENVIAR MENSAGEM
================================ */
window.enviarMensagem = async () => {
  const input = document.getElementById("mensagem");
  const file = document.getElementById("arquivo")?.files[0];
  if (!ticketAtual) return;

  let anexo = null;
  if (file) {
    anexo = await enviarArquivo(app, ticketAtual, file, usuario);
  }

  if (!input.value && !anexo) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} ${usuario.cid}`,
    texto: input.value || "",
    anexo,
    criadoEm: serverTimestamp()
  });

  await updateDoc(doc(db, "tickets", ticketAtual), {
    status: "em_atendimento"
  });

  input.value = "";
  if (document.getElementById("arquivo")) {
    document.getElementById("arquivo").value = "";
  }
};

/* ===============================
   🕒 SLA
================================ */
function calcularSLA(criadoEm) {
  if (!criadoEm) return "🟢 OK";

  const agora = Date.now();
  const inicio = criadoEm.toDate().getTime();
  const horas = (agora - inicio) / (1000 * 60 * 60);

  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  if (horas > 48) return "🔴 Estourado";
  return "🟡 Atenção";
}

/* ===============================
   🕒 TICKETS EM ANDAMENTO
================================ */
async function carregarTicketsEmAndamento() {
  const lista = document.getElementById("listaTickets");
  if (!lista) return;

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("status", "in", ["aberto", "em_atendimento"])
  );

  const snap = await getDocs(q);
  lista.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.categoria}</b><br>
      Status: ${t.status}<br>
      SLA: ${calcularSLA(t.criadoEm)}
    `;

    div.onclick = () => {
      ticketAtual = d.id;
      mostrarAba("chat");
      document.getElementById("chatTitulo").innerText = `💬 ${t.categoria}`;
      iniciarChat();
    };

    lista.appendChild(div);
  });
}

/* ===============================
   🚀 INIT
================================ */
carregarTicketsEmAndamento();
mostrarAba("solicitacoes");
