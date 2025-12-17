import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STAFF_IDS = ["1","admin"];
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || !STAFF_IDS.includes(usuario.cid)) {
  location.href = "../index.html";
}

let ticketAtual = null;

// LISTA DE ABERTOS
onSnapshot(collection(db,"tickets"), snap=>{
  const lista = document.getElementById("lista-abertos");
  const listaFechados = document.getElementById("lista-fechados");
  lista.innerHTML = "";
  listaFechados.innerHTML = "";
  snap.forEach(d=>{
    const t = d.data();
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<b>${t.categoria}</b><br>${t.nome}`;
    const btn = document.createElement("button");
    btn.textContent = "Abrir";
    btn.onclick = () => abrir(d.id);
    div.appendChild(btn);
    if(t.status !== "fechado") lista.appendChild(div);
    else listaFechados.appendChild(div);
  });
});

// ABRIR CHAT
window.abrir = id =>{
  ticketAtual = id;
  onSnapshot(collection(db,"tickets",id,"mensagens"),snap=>{
    const box=document.getElementById("mensagens");
    if(!box) return;
    box.innerHTML="";
    snap.forEach(d=>{
      const m=d.data();
      box.innerHTML+=`<p><b>${m.autor}:</b> ${m.texto}</p>`;
    });
    box.scrollTop = box.scrollHeight;
  });
};

// RESPONDER
window.responder = async () => {
  const msg = document.getElementById("mensagem");
  const texto = msg.value.trim();
  if(!texto || !ticketAtual) return;
  await addDoc(collection(db,"tickets",ticketAtual,"mensagens"),{
    autor:"Staff",
    texto,
    criadoEm:serverTimestamp()
  });
  msg.value="";
};

// MUDAR STATUS
window.mudarStatus = async status => {
  if(!ticketAtual) return;
  await updateDoc(doc(db,"tickets",ticketAtual),{status});
};
