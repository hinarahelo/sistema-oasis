import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot,
  updateDoc, doc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ====== CONFIGURAÇÃO FIREBASE ======
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== AUTORIZAÇÃO STAFF ======
const STAFF_IDS = ["1","admin"];
const usuario = JSON.parse(localStorage.getItem("usuario"));
if(!usuario || !STAFF_IDS.includes(usuario.cid)){
  location.href="../index.html";
}

let ticketAtual = null;

// ====== LISTAGEM DE TICKETS ABERTOS ======
onSnapshot(collection(db,"tickets"), snap=>{
  const lista = document.getElementById("lista-abertos");
  lista.innerHTML = "";
  snap.forEach(d=>{
    const t = d.data();
    if(t.status !== "fechado"){
      lista.innerHTML += `
        <div class="card">
          <b>${t.categoria}</b> - ${t.nome}<br>
          <small>Usuário: ${t.usuarioID || 'Desconhecido'}</small><br>
          <button onclick="abrirTicket('${d.id}')">Abrir</button>
        </div>`;
    }
  });
});

// ====== ABRIR TICKET ======
window.abrirTicket = id => {
  ticketAtual = id;
  abrirAba('mensagens'); // muda para aba de chat

  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  // Atualiza mensagens em tempo real
  onSnapshot(collection(db,"tickets",id,"mensagens"), snap=>{
    box.innerHTML = "";
    snap.forEach(d=>{
      const m = d.data();
      box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto}</p>`;
    });
    box.scrollTop = box.scrollHeight;
  });
};

// ====== ENVIAR MENSAGEM ======
window.responder = async () => {
  const msgInput = document.getElementById("msg");
  const texto = msgInput.value.trim();
  if(!texto) return;

  await addDoc(collection(db,"tickets",ticketAtual,"mensagens"),{
    autor: "Staff",
    texto,
    criadoEm: serverTimestamp()
  });
  msgInput.value = "";
};

// ====== MUDAR STATUS ======
window.mudarStatus = async status => {
  if(!ticketAtual) return alert("Nenhum ticket aberto!");
  await updateDoc(doc(db,"tickets",ticketAtual), { status });
};

// ====== FUNÇÃO PARA ABRIR ABAS ======
window.abrirAba = (aba) => {
  document.querySelectorAll('.aba').forEach(s => s.classList.remove('active'));
  document.getElementById(aba).classList.add('active');
};
