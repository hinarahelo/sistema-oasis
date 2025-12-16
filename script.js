// Firebase (modo web / CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração do Firebase (SUA)
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979",
  storageBucket: "sistema-oasis-75979.firebasestorage.app",
  messagingSenderId: "925698565602",
  appId: "1:925698565602:web:127df3a95aad70484ac5bb"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função de verificação
window.verificar = async function () {
  const nome = document.getElementById("nome").value;
  const cid = document.getElementById("cid").value;

  if (!nome || !cid) {
    alert("Preencha todos os campos");
    return;
  }

  await setDoc(doc(db, "users", cid), {
    nome: nome,
    cid: cid,
    criadoEm: new Date()
  });

  alert("Verificação concluída com sucesso!");
};
