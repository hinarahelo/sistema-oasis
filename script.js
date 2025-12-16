import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where,
  getDocs, serverTimestamp, onSnapshot, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) location.href = "index.html";

let ticketAtual = null;

/* ABAS */
window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";
};

abrirAba("solicitacoes");

/* ABRIR SOLICITAÇÃO */
window.abrirSolicitacao = async categoria => {
  const q = query(
    collection(db, "tickets"),
    where("cid","==",usuario.cid),
    where("categoria","==",categoria),
    where("status","!=","fechado")
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    ticketAtual = snap.docs[0].id;
  } else {
    const docRef = await addDoc(collection(db,"tickets"),{
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

/* CHAT */
function abrirChat(categoria){
  document.getElementById("chat-titulo").innerText = `💬 ${categoria}`;
  abrirAba("chat");

  const ref = collection(db,"tickets",ticketAtual,"mensagens");
  onSnapshot(ref, snap => {
    const box = document.getElementById("mensagens");
    box.innerHTML = "";
    snap.forEach(d=>{
      const m = d.data();
      box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto}</p>`;
    });
    box.scrollTop = box.scrollHeight;
  });
}

/* ENVIAR */
window.enviarMensagem = async () => {
  const texto = mensagem.value.trim();
  if (!texto) return;

  await addDoc(collection(db,"tickets",ticketAtual,"mensagens"),{
    autor: usuario.nome,
    texto,
    criadoEm: serverTimestamp()
  });

  mensagem.value = "";
};

/* HISTÓRICO */
async function carregarHistorico(){
  const q = query(collection(db,"tickets"),where("cid","==",usuario.cid));
  const snap = await getDocs(q);
  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";
  snap.forEach(d=>{
    const t = d.data();
    lista.innerHTML += `<li onclick="ticketAtual='${d.id}';abrirChat('${t.categoria}')">
      ${t.categoria} — ${t.status}
    </li>`;
  });
}
carregarHistorico();
