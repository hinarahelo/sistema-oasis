import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, onSnapshot,
  updateDoc, doc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

/* LISTA */
onSnapshot(collection(db,"tickets"), snap=>{
  const lista = document.getElementById("lista-abertos");
  lista.innerHTML = "";
  snap.forEach(d=>{
    const t=d.data();
    if(t.status!=="fechado"){
      lista.innerHTML += `
        <div class="card">
          <b>${t.categoria}</b><br>${t.nome}
          <button onclick="abrir('${d.id}')">Abrir</button>
        </div>`;
    }
  });
});

/* ABRIR */
window.abrir = id =>{
  ticketAtual=id;
  onSnapshot(collection(db,"tickets",id,"mensagens"),snap=>{
    const box=document.getElementById("mensagens");
    box.innerHTML="";
    snap.forEach(d=>{
      const m=d.data();
      box.innerHTML+=`<p><b>${m.autor}:</b> ${m.texto}</p>`;
    });
  });
};

/* RESPONDER */
window.responder = async ()=>{
  const texto=msg.value.trim();
  if(!texto)return;
  await addDoc(collection(db,"tickets",ticketAtual,"mensagens"),{
    autor:"Staff",
    texto,
    criadoEm:serverTimestamp()
  });
  msg.value="";
};

/* STATUS */
window.mudarStatus = async status=>{
  await updateDoc(doc(db,"tickets",ticketAtual),{status});
};
