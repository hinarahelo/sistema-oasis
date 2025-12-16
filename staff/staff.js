import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
  window.location.href = "../index.html";
}

window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a=>a.style.display="none");
  document.getElementById(id).style.display="block";
};

async function carregar(status, el) {
  const q = query(collection(db,"tickets"), where("status","==",status));
  const s = await getDocs(q);
  el.innerHTML="";
  s.forEach(d=>{
    const t=d.data();
    el.innerHTML+=`<div class="card">
      <b>${t.categoria}</b><br>${t.nome} (${t.cid})<br>
      ${status==="aberto"?`<button onclick="fechar('${d.id}')">Fechar</button>`:""}
    </div>`;
  });
}

window.fechar = async id=>{
  await updateDoc(doc(db,"tickets",id),{status:"fechado"});
  carregar("aberto",listaAbertos);
};

abrirAba("abertos");
const listaAbertos=document.getElementById("lista-abertos");
const listaFechados=document.getElementById("lista-fechados");
carregar("aberto",listaAbertos);
carregar("fechado",listaFechados);
