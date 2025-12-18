import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, getDocs,
  serverTimestamp, onSnapshot, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { registrarLog } from "./logs.js";

/* 🔐 Sessão */
let usuario;
try {
  usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) throw new Error();
} catch {
  location.href = "https://sistema-oasis-auth.hinarahelo.workers.dev/login";
}

/* 🔥 Firebase */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

let ticketAtual = null;

/* 📂 Abas */
window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display="none");
  document.getElementById(id).style.display="block";
};

/* 🎫 Abrir ticket */
window.abrirSolicitacao = async categoria => {
  const q = query(
    collection(db,"tickets"),
    where("cid","==",usuario.cid),
    where("categoria","==",categoria),
    where("status","!=","fechado")
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    ticketAtual = snap.docs[0].id;
  } else {
    const ref = await addDoc(collection(db,"tickets"),{
      nome:usuario.nome,
      cid:usuario.cid,
      categoria,
      status:"aberto",
      criadoEm:serverTimestamp(),
      sla: {
        criadoEm: serverTimestamp(),
        primeiraRespostaEm: null,
        fechadoEm: null
      }
    });
    ticketAtual = ref.id;

    await registrarLog(db,{ tipo:"criou_ticket", usuario:usuario.nome });
  }

  abrirChat(categoria);
};

/* 💬 Chat */
function abrirChat(categoria){
  document.getElementById("chat-titulo").innerText = `💬 ${categoria}`;
  abrirAba("chat");

  onSnapshot(collection(db,"tickets",ticketAtual,"mensagens"), snap=>{
    const box = document.getElementById("mensagens");
    box.innerHTML="";
    snap.forEach(d=>{
      const m = d.data();
      box.innerHTML += `
        <p><b>${m.autor}:</b> ${m.texto || ""}</p>
        ${m.anexoLink ? `<a href="${m.anexoLink}" target="_blank">📎 Anexo</a>` : ""}
      `;
    });
    box.scrollTop = box.scrollHeight;
  });
}

/* ✉️ Enviar mensagem */
window.enviarMensagem = async ()=>{
  const texto = document.getElementById("mensagem").value.trim();
  const anexoLink = document.getElementById("anexoLink").value.trim();
  if (!texto && !anexoLink) return;

  const msgRef = await addDoc(
    collection(db,"tickets",ticketAtual,"mensagens"),
    {
      autor:usuario.nome,
      texto,
      anexoLink: anexoLink || null,
      criadoEm:serverTimestamp(),
      tipo: usuario.nivel === "cidadao" ? "cliente" : "staff"
    }
  );

  // primeira resposta do staff
  if (usuario.nivel !== "cidadao") {
    const ticketRef = doc(db,"tickets",ticketAtual);
    await updateDoc(ticketRef,{
      "sla.primeiraRespostaEm": serverTimestamp(),
      status: "atendimento"
    });
  }

  await registrarLog(db,{ tipo:"mensagem", usuario:usuario.nome });

  document.getElementById("mensagem").value="";
  document.getElementById("anexoLink").value="";
};
