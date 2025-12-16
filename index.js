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

document.getElementById("btnVerificar").onclick = async () => {
  const nome = nome.value.trim();
  const cid = cid.value.trim();

  if (!nome || !cid) return alert("Preencha todos os campos");

  localStorage.setItem("usuario", JSON.stringify({ nome, cid }));

  await setDoc(doc(db, "users", cid), {
    nome, cid, criadoEm: serverTimestamp()
  });

  window.location.href = "tickets.html";
};
