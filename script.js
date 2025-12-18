import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* 🔐 USUÁRIO */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) location.href = "index.html";

/* 🧭 ESTADO */
let ticketAtual = null;
let unsubscribeMensagens = null;

/* 🗂️ ABAS */
window.mostrarAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");

  if (id === "andamento") carregarTicketsEmAndamento();
};

/* 🚪 SAIR */
window.sair = () => {
  localStorage.clear();
  location.href = "index.html";
};

/* 📂 ABRIR CATEGORIA */
window.abrirCategoria = async categoria => {
  mostrarAba("chat");
  document.getElementById("chatTitulo").innerText = `💬 ${categoria}`;

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
  }

  iniciarChat();
};

/* 💬 CHAT */
function iniciarChat() {
  const box = document.getElementById("mensagens");
  box.innerHTML = "";

  if (unsubscribeMensagens) unsubscribeMensagens();

  unsubscribeMensagens = onSnapshot(
    collection(db, "tickets", ticketAtual, "mensagens"),
    snap => {
      box.innerHTML = "";
      snap.forEach(d => {
        const m = d.data();
        box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto}</p>`;
      });
      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ✉️ ENVIAR */
window.enviarMensagem = async () => {
  const input = document.getElementById("mensagem");
  if (!input.value.trim()) return;

  await addDoc(collection(db, "tickets", ticketAtual, "mensagens"), {
    autor: `${usuario.nome} ${usuario.cid}`,
    texto: input.value,
    criadoEm: serverTimestamp()
  });

  input.value = "";
};

/* 🕒 EM ANDAMENTO */
function carregarTicketsEmAndamento() {
  const lista = document.getElementById("lista-andamento");
  if (!lista) return;

  onSnapshot(
    query(
      collection(db, "tickets"),
      where("cid", "==", usuario.cid),
      where("status", "==", "aberto")
    ),
    snap => {
      lista.innerHTML = "";

      if (snap.empty) {
        lista.innerHTML = "<p>Nenhum ticket em andamento.</p>";
        return;
      }

      snap.forEach(doc => {
        const t = doc.data();
        const btn = document.createElement("button");
        btn.textContent = `📂 ${t.categoria}`;
        btn.onclick = () => {
          ticketAtual = doc.id;
          mostrarAba("chat");
          document.getElementById("chatTitulo").innerText = `💬 ${t.categoria}`;
          iniciarChat();
        };
        lista.appendChild(btn);
      });
    }
  );
}

/* 🚀 INICIAL */
mostrarAba("solicitacoes");
