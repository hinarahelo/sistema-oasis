import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  orderBy,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { enviarArquivo } from "./upload.js";
import { notificarDiscord } from "./discord.js";

/* 🔥 Firebase */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* 🔐 Usuário */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "cidadao") {
  location.href = "index.html";
}

/* ESTADO */
let ticketAtual = null;

/* ENVIAR */
window.enviarMensagem = async () => {
  try {
    const texto = document.getElementById("mensagem").value.trim();
    const fileInput = document.getElementById("arquivo");
    const file = fileInput.files[0];

    console.log("📎 arquivo:", file);

    if (!texto && !file) {
      alert("Mensagem ou anexo obrigatório.");
      return;
    }

    let anexo = null;
    if (file) {
      anexo = await enviarArquivo(ticketAtual, file);
      fileInput.value = "";
    }

    await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
      autor: `${usuario.nome} (${usuario.nivel})`,
      texto,
      anexo,
      criadoEm: serverTimestamp()
    });

    document.getElementById("mensagem").value = "";
  } catch (e) {
    console.error("❌ ERRO UPLOAD:", e);
    alert("Erro ao enviar arquivo. Veja o console.");
  }
};
