import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase.js";

/* ======================================================
   🔐 USUÁRIO
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || !["juridico", "coordenacao"].includes(usuario.nivel)) {
  location.replace("../index.html");
}

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let unsubscribe = null;

/* ======================================================
   EXPORT
====================================================== */
export function abrirChat(ticketId) {
  ticketAtual = ticketId;
  iniciarChat();
}

/* ======================================================
   ☁️ CLOUDINARY
====================================================== */
async function uploadArquivo(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", "oasis");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/auto/upload",
    { method: "POST", body: form }
  );

  const data = await res.json();
  return { url: data.secure_url, nome: file.name, tipo: file.type };
}

/* ======================================================
   CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.querySelector(".chat-input button");
  const fileInput = document.getElementById("arquivo");

  box.innerHTML = "";
  unsubscribe?.();

  /* STATUS */
  onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const fechado = snap.data().status === "encerrado";
    input.disabled = btn.disabled = fechado;
    if (fileInput) fileInput.disabled = fechado;
  });

  unsubscribe = onSnapshot(
    query(
      collection(db, "tickets", ticketAtual, "mensagens"),
      orderBy("criadoEm")
    ),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        const hora = m.criadoEm
          ? m.criadoEm.toDate().toLocaleString("pt-BR")
          : "";

        let tipo = "cidadao";
        if (m.autor.includes("juridico")) tipo = "juridico";
        if (m.autor.includes("coordenacao")) tipo = "coordenacao";

        let anexo = "";
        if (m.anexo) {
          anexo = m.anexo.tipo?.startsWith("image/")
            ? `<img src="${m.anexo.url}" style="max-width:220px;border-radius:10px;">`
            : `<a href="${m.anexo.url}" target="_blank">📎 ${m.anexo.nome}</a>`;
        }

        box.innerHTML += `
          <div class="mensagem ${tipo}">
            <span class="autor ${tipo}">${m.autor}</span>
            ${m.texto || ""}
            ${anexo}
            <div class="hora">${hora}</div>
          </div>
        `;
      });

      box.scrollTop = box.scrollHeight;
    }
  );

  /* ENVIAR */
  btn.onclick = async () => {
    const texto = input.value.trim();
    const file = fileInput?.files?.[0] || null;
    if (!texto && !file) return;

    const snap = await getDoc(doc(db, "tickets", ticketAtual));
    if (snap.data().status === "encerrado") return;

    let anexo = null;
    if (file) anexo = await uploadArquivo(file);

    await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
      autor: `${usuario.nome} (${usuario.nivel})`,
      texto: texto || "",
      anexo,
      criadoEm: serverTimestamp()
    });

    input.value = "";
    if (fileInput) fileInput.value = "";
  };
}
