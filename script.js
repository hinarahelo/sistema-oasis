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
  doc,
  getDoc,
  orderBy,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================================================
   🔥 FIREBASE
====================================================== */
const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});
const db = getFirestore(app);

/* ======================================================
   🔐 USUÁRIO
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.nivel !== "cidadao") {
  location.replace("index.html");
}

/* ======================================================
   ESTADO
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let unsubscribeDigitando = null;
let typingTimeout = null;
let arquivoSelecionado = null;

/* ======================================================
   ABAS
====================================================== */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  if (id === "andamento") carregarTicketsEmAndamento();
};

mostrarAba(location.hash.replace("#", "") || "solicitacoes");

/* ======================================================
   SAIR
====================================================== */
window.sair = () => {
  localStorage.clear();
  location.replace("index.html");
};

/* ======================================================
   LOG
====================================================== */
async function registrarLog(acao) {
  await addDoc(collection(db, "logs"), {
    ticket: ticketAtual,
    cid: usuario.cid,
    usuario: usuario.nome,
    acao,
    data: serverTimestamp()
  });
}

/* ======================================================
   🕒 EM ANDAMENTO
====================================================== */
function carregarTicketsEmAndamento() {
  const grid = document.getElementById("categoriasTickets");
  const lista = document.getElementById("listaPorCategoria");
  const box = document.getElementById("ticketsCategoria");

  grid.innerHTML = "";
  lista.classList.add("hidden");

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("status", "==", "aberto")
  );

  onSnapshot(q, snap => {
    const cats = {};
    grid.innerHTML = "";

    snap.forEach(d => {
      const t = d.data();
      if (!cats[t.categoria]) cats[t.categoria] = [];
      cats[t.categoria].push({ id: d.id, ...t });
    });

    if (!Object.keys(cats).length) {
      grid.innerHTML = "<p>Nenhum ticket em andamento.</p>";
      return;
    }

    Object.keys(cats).forEach(cat => {
      const card = document.createElement("div");
      card.className = "categoria-card official";
      card.innerHTML = `<h4>${cat}</h4><span>${cats[cat].length} ativo</span>`;

      card.onclick = () => {
        document.getElementById("tituloCategoria").innerText = cat;
        grid.innerHTML = "";
        lista.classList.remove("hidden");
        box.innerHTML = "";

        cats[cat].forEach(t => {
          const item = document.createElement("div");
          item.className = "card-ticket official";
          item.innerHTML = `
            <strong>${t.categoria}</strong><br>
            <small>${t.criadoEm?.toDate().toLocaleString("pt-BR")}</small>
          `;
          item.onclick = () => {
            ticketAtual = t.id;
            document.getElementById("chatTitulo").innerText =
              `💬 ${t.categoria} — ${t.nome} ${t.cid}`;
            mostrarAba("chat");
            iniciarChat();
          };
          box.appendChild(item);
        });
      };
      grid.appendChild(card);
    });
  });
}

window.voltarCategorias = () => carregarTicketsEmAndamento();

/* ======================================================
   📂 ABRIR / CRIAR
====================================================== */
window.abrirCategoria = async categoria => {
  mostrarAba("chat");
  document.getElementById("chatTitulo").innerText =
    `💬 ${categoria} — ${usuario.nome} ${usuario.cid}`;

  const q = query(
    collection(db, "tickets"),
    where("cid", "==", usuario.cid),
    where("categoria", "==", categoria),
    where("status", "==", "aberto")
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    ticketAtual = snap.docs[0].id;
  } else {
    const ref = await addDoc(collection(db, "tickets"), {
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: serverTimestamp()
    });
    ticketAtual = ref.id;
    await registrarLog("Ticket criado");
  }

  iniciarChat();
};

/* ======================================================
   📎 CAPTURA DE ARQUIVO
====================================================== */
document.getElementById("arquivo")?.addEventListener("change", e => {
  arquivoSelecionado = e.target.files[0] || null;
});

/* ======================================================
   ☁️ UPLOAD CLOUDINARY
====================================================== */
async function uploadArquivo(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", "oasis"); // 🔴 CONFIRME ESSE PRESET

  const res = await fetch("https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/auto/upload", {
    method: "POST",
    body: form
  });

  const data = await res.json();
  return data.secure_url;
}

/* ======================================================
   💬 CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.querySelector(".chat-input button");

  box.innerHTML = "";

  unsubscribeMensagens?.();
  unsubscribeStatus?.();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const t = snap.data();
    const fechado = t.status === "encerrado";
    input.disabled = btn.disabled = fechado;
    input.placeholder = fechado
      ? "🔒 Ticket encerrado — somente leitura"
      : "Digite sua mensagem...";
  });

  unsubscribeMensagens = onSnapshot(
    query(collection(db, "tickets", ticketAtual, "mensagens"), orderBy("criadoEm")),
    snap => {
      box.innerHTML = "";
      snap.forEach(d => {
        const m = d.data();
        const hora = m.criadoEm?.toDate().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        });

        box.innerHTML += `
          <div class="mensagem cidadao">
            <span class="autor">${m.autor}</span>
            ${m.texto ? `<div>${m.texto}</div>` : ""}
            ${m.arquivo ? `<a href="${m.arquivo}" target="_blank">📎 Arquivo</a>` : ""}
            <div class="hora">${hora || ""}</div>
          </div>
        `;
      });
      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   📤 ENVIAR
====================================================== */
window.enviarMensagem = async () => {
  const texto = document.getElementById("mensagem").value.trim();
  if (!texto && !arquivoSelecionado) return;

  let arquivoUrl = null;

  if (arquivoSelecionado) {
    arquivoUrl = await uploadArquivo(arquivoSelecionado);
  }

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (cidadão)`,
    texto: texto || "",
    arquivo: arquivoUrl,
    criadoEm: serverTimestamp()
  });

  await registrarLog("Mensagem enviada");

  document.getElementById("mensagem").value = "";
  document.getElementById("arquivo").value = "";
  arquivoSelecionado = null;
};
