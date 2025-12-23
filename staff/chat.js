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
   🔐 USUÁRIO (JURÍDICO / COORDENAÇÃO)
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || !["juridico", "coordenacao"].includes(usuario.nivel)) {
  location.replace("../index.html");
}

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;

/* ======================================================
   ABRIR CHAT (EXPORTADO)
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
  form.append("upload_preset", "oasis"); // mesmo preset do cidadão

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/auto/upload",
    { method: "POST", body: form }
  );

  const data = await res.json();

  return {
    url: data.secure_url,
    nome: file.name,
    tipo: file.type
  };
}

/* ======================================================
   💬 CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const inputArquivo = document.getElementById("arquivo");
  const btn = document.querySelector(".chat-input button");

  if (!box || !input || !btn) return;

  box.innerHTML = "";

  /* limpa listeners antigos */
  unsubscribeMensagens?.();
  unsubscribeStatus?.();

  /* 🔒 STATUS DO TICKET */
  unsubscribeStatus = onSnapshot(
    doc(db, "tickets", ticketAtual),
    snap => {
      const t = snap.data();
      if (!t) return;

      const fechado = t.status === "encerrado";
      input.disabled = btn.disabled = fechado;
      if (inputArquivo) inputArquivo.disabled = fechado;

      input.placeholder = fechado
        ? "🔒 Ticket encerrado — somente leitura"
        : "Digite sua resposta...";
    }
  );

  /* 💬 MENSAGENS */
  unsubscribeMensagens = onSnapshot(
    query(
      collection(db, "tickets", ticketAtual, "mensagens"),
      orderBy("criadoEm", "asc")
    ),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();

        let tipo = "cidadao";
        if (m.autor?.includes("juridico")) tipo = "juridico";
        if (m.autor?.includes("coordenacao")) tipo = "coordenacao";

        const hora = m.criadoEm
          ? m.criadoEm.toDate().toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "";

        let anexo = "";
        if (m.anexo) {
          anexo = m.anexo.tipo?.startsWith("image/")
            ? `<img src="${m.anexo.url}" style="max-width:220px;border-radius:10px;margin-top:6px;">`
            : `
              <div class="anexo">
                📎 <a href="${m.anexo.url}" target="_blank">
                  ${m.anexo.nome}
                </a>
              </div>
            `;
        }

        box.innerHTML += `
          <div class="mensagem ${tipo}">
            <div class="conteudo">
              <span class="autor ${tipo}">${m.autor}</span>
              ${m.texto ? `<div class="texto">${m.texto}</div>` : ""}
              ${anexo}
            </div>
            <div class="hora">${hora}</div>
          </div>
        `;
      });

      box.scrollTop = box.scrollHeight;
    }
  );

  /* 📤 ENVIAR */
  btn.onclick = async () => {
    const texto = input.value.trim();
    const file = inputArquivo?.files?.[0] || null;

    if (!texto && !file) return;

    const snap = await getDoc(doc(db, "tickets", ticketAtual));
    if (!snap.exists() || snap.data().status === "encerrado") {
      alert("Ticket encerrado.");
      return;
    }

    let anexo = null;
    if (file) {
      anexo = await uploadArquivo(file);
    }

    await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
      autor: `${usuario.nome} (${usuario.nivel})`,
      texto: texto || "",
      anexo,
      criadoEm: serverTimestamp()
    });

    input.value = "";
    if (inputArquivo) inputArquivo.value = "";
  };
}
