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
   🔐 USUÁRIO (CIDADÃO)
====================================================== */
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || usuario.nivel !== "cidadao") {
  location.replace("index.html");
}

/* ======================================================
   ESTADO GLOBAL
====================================================== */
let ticketAtual = null;
let unsubscribeMensagens = null;
let unsubscribeStatus = null;
let unsubscribeDigitando = null;
let typingTimeout = null;

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
   LOGS
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
   🕒 TICKETS EM ANDAMENTO (AGRUPADOS)
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
    const categorias = {};
    grid.innerHTML = "";

    snap.forEach(d => {
      const t = d.data();
      if (!categorias[t.categoria]) categorias[t.categoria] = [];
      categorias[t.categoria].push({ id: d.id, ...t });
    });

    if (!Object.keys(categorias).length) {
      grid.innerHTML = "<p>Nenhum ticket em andamento.</p>";
      return;
    }

    Object.keys(categorias).forEach(cat => {
      const card = document.createElement("div");
      card.className = "categoria-card official";
      card.innerHTML = `<h4>${cat}</h4><span>${categorias[cat].length} ativo</span>`;

      card.onclick = () => {
        grid.innerHTML = "";
        lista.classList.remove("hidden");
        document.getElementById("tituloCategoria").innerText = cat;
        box.innerHTML = "";

        categorias[cat].forEach(t => {
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
   📂 ABRIR / CRIAR TICKET (1 POR CATEGORIA)
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
   💬 CHAT
====================================================== */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  const input = document.getElementById("mensagem");
  const btn = document.querySelector(".chat-input button");

  box.innerHTML = "";

  unsubscribeMensagens?.();
  unsubscribeStatus?.();
  unsubscribeDigitando?.();

  unsubscribeStatus = onSnapshot(doc(db, "tickets", ticketAtual), snap => {
    const t = snap.data();
    const fechado = t.status === "encerrado";

    input.disabled = btn.disabled = fechado;
    input.placeholder = fechado
      ? "🔒 Ticket encerrado — somente leitura"
      : "Digite sua mensagem...";
  });

  unsubscribeMensagens = onSnapshot(
    query(
      collection(db, "tickets", ticketAtual, "mensagens"),
      orderBy("criadoEm")
    ),
    snap => {
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        if (!m.criadoEm) return;

        const hora = m.criadoEm.toDate().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        });

        box.innerHTML += `
          <div class="mensagem cidadao">
            <span class="autor">${m.autor}</span>
            <div>${m.texto || ""}</div>
            <div class="hora">${hora}</div>
          </div>
        `;
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ======================================================
   DIGITANDO
====================================================== */
document.getElementById("mensagem")?.addEventListener("input", () => {
  if (!ticketAtual) return;

  setDoc(doc(db, "tickets", ticketAtual, "digitando", usuario.cid), {
    nome: usuario.nome,
    at: serverTimestamp()
  });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    deleteDoc(doc(db, "tickets", ticketAtual, "digitando", usuario.cid));
  }, 2000);
});

/* ======================================================
   📤 ENVIAR MENSAGEM
====================================================== */
window.enviarMensagem = async () => {
  const input = document.getElementById("mensagem");
  const texto = input.value.trim();

  if (!texto || !ticketAtual) return;

  const t = await getDoc(doc(db, "tickets", ticketAtual));
  if (t.data().status === "encerrado") return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} (cidadão)`,
    texto,
    criadoEm: serverTimestamp()
  });

  await registrarLog("Mensagem enviada");
  input.value = "";
  deleteDoc(doc(db, "tickets", ticketAtual, "digitando", usuario.cid));
};
