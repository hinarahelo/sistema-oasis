import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display="none");
  document.getElementById(id).style.display="block";
};

onSnapshot(collection(db,"logs"), snap => {
  const ul = document.getElementById("lista-logs");
  if (!ul) return;

  ul.innerHTML = "";
  snap.forEach(d => {
    const l = d.data();
    const li = document.createElement("li");
    li.textContent = `${l.tipo} — ${l.usuario || ""}`;
    ul.appendChild(li);
  });
});
