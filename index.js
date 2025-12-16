import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979",
  storageBucket: "sistema-oasis-75979.firebasestorage.app",
  messagingSenderId: "925698565602",
  appId: "1:925698565602:web:127df3a95aad70484ac5bb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const botao = document.getElementById("btnVerificar");

botao.addEventListener("click", async () => {
  const campoNome = document.getElementById("nome");
  const campoCid  = document.getElementById("cid");

  const valorNome = campoNome.value.trim();
  const valorCid  = campoCid.value.trim();

  if (valorNome === "" || valorCid === "") {
    alert("Preencha todos os campos");
    return;
  }

  localStorage.setItem(
    "usuario",
    JSON.stringify({ nome: valorNome, cid: valorCid })
  );

  try {
    await setDoc(doc(db, "users", valorCid), {
      nome: valorNome,
      cid: valorCid,
      criadoEm: serverTimestamp()
    });

    window.location.href = "tickets.html";
  } catch (e) {
    console.error(e);
    alert("Erro ao salvar no Firebase");
  }
});
