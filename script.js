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

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* USUÁRIO */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) {
  window.location.href = "index.html";
}

/* ABAS */
window.abrirAba = (id) => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";
};

/* ABRE POR PADRÃO */
abrirAba("denuncia");

/* CRIAR TICKET */
window.criarTicket = async (categoria, campoTexto) => {
  const texto = document.getElementById(campoTexto)?.value.trim();

  if (!texto) {
    alert("Descreva o problema");
    return;
  }

  /* VERIFICA SE JÁ EXISTE TICKET ABERTO */
  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", categoria),
    where("status", "==", "aberto")
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    alert("Você já possui um ticket aberto nessa categoria");
    return;
  }

  /* CRIA */
  await addDoc(collection(db, "tickets"), {
    nome: usuario.nome,
    cid: usuario.cid,
    categoria,
    mensagem: texto,
    status: "aberto",
    criadoEm: serverTimestamp()
  });

  document.getElementById(campoTexto).value = "";
  alert(`Ticket de ${categoria} aberto com sucesso`);

  abrirAba("historico");
  carregarHistorico();
};

/* PROCESSOS */
window.processo = async (categoria) => {
  const confirmar = confirm(`Deseja abrir um processo de ${categoria}?`);
  if (!confirmar) return;

  await addDoc(collection(db, "tickets"), {
    nome: usuario.nome,
    cid: usuario.cid,
    categoria,
    mensagem: "Processo iniciado",
    status: "aberto",
    criadoEm: serverTimestamp()
  });

  alert(`Processo de ${categoria} iniciado`);
  abrirAba("historico");
  carregarHistorico();
};

/* HISTÓRICO */
async function carregarHistorico() {
  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid)
  );

  const snap = await getDocs(q);

  snap.forEach(doc => {
    const t = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <b>${t.categoria}</b><br>
      Status: ${t.status}
    `;
    lista.appendChild(li);
  });
}

carregarHistorico();
