// Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔐 CONFIGURAÇÃO FIREBASE (SUA)
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979",
  storageBucket: "sistema-oasis-75979.firebasestorage.app",
  messagingSenderId: "925698565602",
  appId: "1:925698565602:web:127df3a95aad70484ac5bb"
};

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔒 Recuperar usuário verificado
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario && window.location.pathname.includes("tickets")) {
  window.location.href = "index.html";
}

// 🧭 CONTROLE DE ABAS
window.abrirAba = function (id) {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";

  if (id === "historico") carregarHistorico();
};

// Abrir aba inicial
setTimeout(() => abrirAba("denuncia"), 100);

// 🎫 CRIAR TICKET NORMAL
window.criarTicket = async function (categoria, textareaId) {
  const texto = document.getElementById(textareaId).value.trim();
  if (!texto) {
    alert("Preencha a descrição.");
    return;
  }

  // Limite de 1 ticket ativo por categoria
  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", categoria),
    where("status", "==", "aberto")
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    alert("Você já possui um ticket aberto nessa categoria.");
    return;
  }

  await addDoc(collection(db, "tickets"), {
    nome: usuario.nome,
    cid: usuario.cid,
    categoria,
    mensagem: texto,
    status: "aberto",
    criadoEm: serverTimestamp()
  });

  alert("Ticket criado com sucesso!");
  document.getElementById(textareaId).value = "";
};

// 📂 PROCESSOS (AUTOMÁTICO)
window.processo = async function (tipo) {
  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", tipo),
    where("status", "==", "aberto")
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    alert("Você já possui um processo aberto desse tipo.");
    return;
  }

  await addDoc(collection(db, "tickets"), {
    nome: usuario.nome,
    cid: usuario.cid,
    categoria: tipo,
    mensagem: "Solicitação de processo: " + tipo,
    status: "aberto",
    criadoEm: serverTimestamp()
  });

  alert("Processo aberto com sucesso!");
};

// 🧾 HISTÓRICO DO USUÁRIO
async function carregarHistorico() {
  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    lista.innerHTML = "<li>Nenhum ticket encontrado.</li>";
    return;
  }

  snap.forEach(doc => {
    const t = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${t.categoria}</strong> —
      ${t.status.toUpperCase()}
    `;
    lista.appendChild(li);
  });
}
