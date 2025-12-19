import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 Firebase */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* 🔐 Permissão */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "coordenacao") {
  location.href = "../index.html";
}

/* 🧾 Logs */
const q = query(collection(db, "logs"), orderBy("criadoEm", "desc"));

onSnapshot(q, snap => {
  const box = document.getElementById("listaLogs");
  box.innerHTML = "";

  snap.forEach(d => {
    const l = d.data();
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <b>${l.tipo}</b><br>
      ${l.usuario || l.staff || "Sistema"}<br>
      Ticket: ${l.ticket || "-"}<br>
      ${l.novoStatus ? "Status: " + l.novoStatus : ""}
    `;

    box.appendChild(div);
  });
});
