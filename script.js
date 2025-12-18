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
let categoriaAtual = null;
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
   📂 ABRIR CATEGORIA
================================ */
window.abrirCategoria = async categoria => {
  categoriaAtual = categoria;
  mostrarAba("chat");

  const titulo = document.getElementById("chatTitulo");
  if (titulo) titulo.innerText = `💬 ${categoria}`;

  // 🔍 Busca ticket aberto da categoria
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
   💬 CHAT
================================ */
function iniciarChat() {
  if (!ticketAtual) return;

  const box = document.getElementById("mensagens");
  if (!box) return;

  // 🔁 Remove listener anterior
  if (unsubscribeMensagens) unsubscribeMensagens();

  unsubscribeMensagens = onSnapshot(
    collection(db, "tickets", ticketAtual, "mensagens"),
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
   ✉️ ENVIAR MENSAGEM
================================ */
window.enviarMensagem = async () => {
  const input = document.getElementById("mensagem");
  if (!input || !ticketAtual) return;

  const texto = input.value.trim();
  if (!texto) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} ${usuario.cid}`,
    texto,
    criadoEm: serverTimestamp()
  });

  input.value = "";
};

/* ===============================
   🚀 ABA INICIAL
================================ */
mostrarAba("solicitacoes");
