import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   🔐 SESSÃO / PROTEÇÃO
========================= */

let usuario = null;

try {
  const raw = localStorage.getItem("usuario");
  if (!raw) throw new Error("Sessão inexistente");

  usuario = JSON.parse(raw);

  if (!usuario.nome || !usuario.cid || !usuario.nivel) {
    throw new Error("Sessão inválida");
  }

} catch (e) {
  console.warn("[SESSION INVALID]", e);
  localStorage.removeItem("usuario");
  location.href = "https://sistema-oasis-auth.hinarahelo.workers.dev/login";
}

/* =========================
   🔥 FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   📂 UI / ABAS
========================= */

let ticketAtual = null;

window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
};

abrirAba("solicitacoes");

/* =========================
   🎫 TICKETS
========================= */

window.abrirSolicitacao = async categoria => {
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
    const docRef = await addDoc(collection(db, "tickets"), {
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: serverTimestamp()
    });
    ticketAtual = docRef.id;
  }

  abrirChat(categoria);
};

function abrirChat(categoria) {
  document.getElementById("chat-titulo").innerText = `💬 ${categoria}`;
  abrirAba("chat");

  const ref = collection(db, "tickets", ticketAtual, "mensagens");

  onSnapshot(ref, snap => {
    const box = document.getElementById("mensagens");
    box.innerHTML = "";
    snap.forEach(d => {
      const m = d.data();
      box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto}</p>`;
    });
    box.scrollTop = box.scrollHeight;
  });
}

window.enviarMensagem = async () => {
  const input = document.getElementById("mensagem");
  const texto = input.value.trim();
  if (!texto || !ticketAtual) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: usuario.nome,
    texto,
    criadoEm: serverTimestamp()
  });

  input.value = "";
};

async function carregarHistorico() {
  const q = query(collection(db, "tickets"), where("cid", "==", usuario.cid));
  const snap = await getDocs(q);

  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";

  snap.forEach(d => {
    const t = d.data();
    const li = document.createElement("li");
    li.textContent = `${t.categoria} — ${t.status}`;
    li.onclick = () => {
      ticketAtual = d.id;
      abrirChat(t.categoria);
    };
    lista.appendChild(li);
  });
}

carregarHistorico();
