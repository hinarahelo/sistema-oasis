import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   🔥 FIREBASE
================================ */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* ===============================
   🔐 PERMISSÃO
================================ */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || (usuario.nivel !== "juridico" && usuario.nivel !== "coordenacao")) {
  location.href = "../index.html";
}

/* ===============================
   🧭 ESTADO
================================ */
let ticketAtual = null;
let unsubscribe = null;

/* ===============================
   🗂️ ABAS
================================ */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
};

window.sair = () => {
  localStorage.clear();
  location.href = "../index.html";
};

/* ===============================
   🕒 SLA
================================ */
function calcularSLA(criadoEm) {
  if (!criadoEm) return "🟢 OK";
  const horas = (Date.now() - criadoEm.toDate().getTime()) / 36e5;
  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  if (horas > 48) return "🔴 Estourado";
  return "🟡 Atenção";
}

/* ===============================
   🎫 LISTA TICKETS
================================ */
onSnapshot(collection(db, "tickets"), snap => {
  const lista = document.getElementById("listaTickets");
  if (!lista) return;

  lista.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.categoria}</b><br>
      ${t.nome} (${t.cid})<br>
      Status: ${t.status}<br>
      SLA: ${calcularSLA(t.criadoEm)}
    `;

    div.onclick = () => abrirTicket(d.id, t.categoria);
    lista.appendChild(div);
  });
});

/* ===============================
   💬 ABRIR TICKET
================================ */
function abrirTicket(id, categoria) {
  ticketAtual = id;
  mostrarAba("chat");
  document.getElementById("chatTitulo").innerText = `💬 ${categoria}`;

  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(
    collection(db, "tickets", id, "mensagens"),
    snap => {
      box.innerHTML = "";
      snap.forEach(d => {
        const m = d.data();
        box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto}</p>`;
      });
      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ===============================
   ✉️ RESPONDER
================================ */
window.enviarMensagemStaff = async () => {
  const input = document.getElementById("mensagem");
  if (!input.value || !ticketAtual) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `Staff ${usuario.nome}`,
    texto: input.value,
    criadoEm: serverTimestamp()
  });

  await updateDoc(doc(db, "tickets", ticketAtual), {
    status: "em_atendimento"
  });

  input.value = "";
};

/* ===============================
   🔄 STATUS
================================ */
window.alterarStatus = async status => {
  if (!ticketAtual) return;
  await updateDoc(doc(db, "tickets", ticketAtual), { status });
  alert(`Status alterado para: ${status}`);
};
