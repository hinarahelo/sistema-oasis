import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* 🔐 Sessão */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "staff") {
  location.href = "../index.html";
}

/* 🧭 Abas */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id).classList.add("active");
};

/* 🚪 Logout */
window.sair = () => {
  localStorage.clear();
  location.href = "../index.html";
};

/* ⏱️ SLA */
function calcularSLA(criadoEm) {
  if (!criadoEm) return "—";
  const horas = (Date.now() - criadoEm.toDate().getTime()) / 36e5;
  if (horas <= 3) return "🟢 OK";
  if (horas <= 18) return "🟡 Atenção";
  return "🔴 Estourado";
}

/* 📂 LISTA TICKETS */
function carregarLista(status, elementId) {
  onSnapshot(
    query(collection(db, "tickets"), where("status", "==", status)),
    snap => {
      const box = document.getElementById(elementId);
      if (!box) return;
      box.innerHTML = "";

      snap.forEach(d => {
        const t = d.data();
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <b>${t.categoria}</b><br>
          ${t.nome}<br>
          SLA: ${calcularSLA(t.criadoEm)}
        `;
        div.onclick = () => {
          location.href = `staff-chat.html?id=${d.id}`;
        };
        box.appendChild(div);
      });
    }
  );
}

carregarLista("aberto", "lista-abertos");
carregarLista("fechado", "lista-fechados");

/* =========================
   CHAT STAFF
========================= */
const params = new URLSearchParams(window.location.search);
const ticketId = params.get("id");

let unsubscribe = null;

if (ticketId) {
  const ticketRef = doc(db, "tickets", ticketId);
  const mensagensRef = collection(db, "tickets", ticketId, "mensagens");

  getDoc(ticketRef).then(snap => {
    if (!snap.exists()) return;
    document.getElementById("chatCategoria").innerText =
      "Categoria: " + snap.data().categoria;
  });

  unsubscribe = onSnapshot(mensagensRef, snap => {
    const box = document.getElementById("mensagens");
    if (!box) return;
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto}</p>`;
    });

    box.scrollTop = box.scrollHeight;
  });

  window.enviarMensagem = async () => {
    const input = document.getElementById("mensagem");
    if (!input.value.trim()) return;

    await addDoc(mensagensRef, {
      autor: `[STAFF] ${usuario.nome} (${usuario.id})`,
      texto: input.value,
      criadoEm: serverTimestamp()
    });

    input.value = "";
  };

  window.fecharTicket = async () => {
    await updateDoc(ticketRef, {
      status: "fechado",
      fechadoEm: serverTimestamp()
    });
    alert("Ticket encerrado.");
    location.href = "staff.html";
  };
}
