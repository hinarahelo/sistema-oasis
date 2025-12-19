import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
   🔐 USUÁRIO (STAFF)
================================ */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || (usuario.nivel !== "juridico" && usuario.nivel !== "coordenacao")) {
  location.href = "../index.html";
}

/* ===============================
   🧭 ESTADO GLOBAL
================================ */
let ticketAtual = null;
let unsubscribeChat = null;

/* ===============================
   🗂️ ABAS
================================ */
window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  const aba = document.getElementById(id);
  if (aba) aba.classList.add("active");
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
   📋 LISTAR TICKETS ABERTOS
================================ */
function listarTickets(status, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const q = query(
    collection(db, "tickets"),
    where("status", "==", status)
  );

  onSnapshot(q, snap => {
    box.innerHTML = "";

    snap.forEach(d => {
      const t = d.data();
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${t.categoria}</b><br>
        ${t.nome}<br>
        Status: ${t.status}<br>
        SLA: ${calcularSLA(t.criadoEm)}
      `;

      div.onclick = () => abrirTicket(d.id, t);
      box.appendChild(div);
    });
  });
}

/* ===============================
   📂 ABRIR TICKET
================================ */
function abrirTicket(id, ticket) {
  ticketAtual = id;
  abrirAba("chat");

  const titulo = document.getElementById("chatTitulo");
  if (titulo) {
    titulo.innerText = `💬 ${ticket.categoria} — ${ticket.nome}`;
  }

  iniciarChat();
}

/* ===============================
   💬 CHAT REALTIME
================================ */
function iniciarChat() {
  if (!ticketAtual) return;

  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  if (unsubscribeChat) unsubscribeChat();

  unsubscribeChat = onSnapshot(
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
   ✉️ ENVIAR MENSAGEM (STAFF)
================================ */
window.enviarMensagem = async () => {
  const input = document.getElementById("mensagem");
  if (!input.value || !ticketAtual) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (STAFF)`,
    texto: input.value,
    criadoEm: serverTimestamp()
  });

  await updateDoc(doc(db, "tickets", ticketAtual), {
    status: "em_atendimento",
    staff: usuario.nome
  });

  input.value = "";
};

/* ===============================
   ✅ FECHAR TICKET
================================ */
window.fecharTicket = async () => {
  if (!ticketAtual) return;

  await updateDoc(doc(db, "tickets", ticketAtual), {
    status: "fechado",
    fechadoEm: serverTimestamp()
  });

  ticketAtual = null;
  abrirAba("abertos");
};

/* ===============================
   🚀 INIT
================================ */
listarTickets("aberto", "lista-abertos");
listarTickets("em_atendimento", "lista-abertos");
listarTickets("fechado", "lista-fechados");

abrirAba("abertos");
