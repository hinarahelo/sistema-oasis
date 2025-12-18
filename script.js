console.log("SCRIPT INICIADO");

// 🔐 Usuário
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) {
  location.href = "https://sistema-oasis-auth.hinarahelo.workers.dev/login";
}

// 🔥 Firebase
firebase.initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});

const db = firebase.firestore();
let ticketAtual = null;

// 🚪 Logout
function logout() {
  localStorage.removeItem("usuario");
  location.href = "index.html";
}

// 🎫 Criar / Abrir Ticket
async function abrirSolicitacao(categoria) {
  console.log("Abrindo:", categoria);

  const snap = await db.collection("tickets")
    .where("cid", "==", usuario.cid)
    .get();

  let existente = null;

  snap.forEach(doc => {
    const t = doc.data();
    if (t.categoria === categoria && t.status === "aberto") {
      existente = doc.id;
    }
  });

  if (existente) {
    ticketAtual = existente;
  } else {
    const ref = await db.collection("tickets").add({
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: new Date()
    });
    ticketAtual = ref.id;
  }

  abrirChat(categoria);
}

// 💬 Chat em tempo real
function abrirChat(categoria) {
  document.getElementById("chat-titulo").innerText = "💬 " + categoria;

  db.collection("tickets")
    .doc(ticketAtual)
    .collection("mensagens")
    .orderBy("criadoEm")
    .onSnapshot(snap => {
      const box = document.getElementById("mensagens");
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto}</p>`;
      });
    });
}

// ✉️ Enviar mensagem
async function enviarMensagem() {
  if (!ticketAtual) return;

  const input = document.getElementById("mensagem");
  const texto = input.value.trim();
  if (!texto) return;

  await db.collection("tickets")
    .doc(ticketAtual)
    .collection("mensagens")
    .add({
      autor: usuario.nome,
      texto,
      criadoEm: new Date()
    });

  input.value = "";
}
