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

document.getElementById("btnVerificar").addEventListener("click", async () => {
  const nome = document.getElementById("nome").value.trim();
  const cid = document.getElementById("cid").value.trim();

  if (!nome || !cid) {
    alert("Preencha todos os campos");
    return;
  }

  // salvar local
  localStorage.setItem("usuario", JSON.stringify({ nome, cid }));

  // salvar firebase
  await setDoc(doc(db, "users", cid), {
    nome,
    cid,
    criadoEm: serverTimestamp()
  });

  alert("Verificação concluída com sucesso!");

  // redirecionar
  window.location.href = "tickets.html";
});
