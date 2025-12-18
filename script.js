const usuario = JSON.parse(localStorage.getItem("usuario"));

firebase.initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});

const db = firebase.firestore();
let ticketAtual = null;
let listener = null;

// ABAS
function abrirAba(id) {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
}

// LOGOUT
function logout() {
  localStorage.removeItem("usuario");
  location.href = "index.html";
}

// ABRIR / CRIAR TICKET
async function abrirTicket(categoria) {
  if (listener) listener();

  document.querySelectorAll(".chat").forEach(c => c.innerHTML = "");

  const snap = await db.collection("tickets")
    .where("cid", "==", usuario.cid)
    .get();

  let id = null;

  snap.forEach(doc => {
    const t = doc.data();
    if (t.categoria === categoria && t.status === "aberto") {
      id = doc.id;
    }
  });

  if (!id) {
    const ref = await db.collection("tickets").add({
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: new Date()
    });
    id = ref.id;
  }

  ticketAtual = id;
  escutarMensagens(categoria);
}

// CHAT
function escutarMensagens(categoria) {
  listener = db.collection("tickets")
    .doc(ticketAtual)
    .collection("mensagens")
    .orderBy("criadoEm")
    .onSnapshot(snap => {
      const box = document.querySelector(".aba.ativa .chat");
      box.innerHTML = "";
      snap.forEach(d => {
        const m = d.data();
        box.innerHTML += `<p><b>${m.autor} ${m.cid}:</b> ${m.texto}</p>`;
      });
      box.scrollTop = box.scrollHeight;
    });
}

// ENVIAR
async function enviarMensagem() {
  await enviarMensagemBase("mensagem");
}

async function enviarMensagemTickets() {
  await enviarMensagemBase("mensagem-tickets");
}

async function enviarMensagemBase(idCampo) {
  if (!ticketAtual) {
    alert("Selecione uma categoria.");
    return;
  }

  const input = document.getElementById(idCampo);
  const texto = input.value.trim();
  if (!texto) return;

  await db.collection("tickets")
    .doc(ticketAtual)
    .collection("mensagens")
    .add({
      autor: usuario.nome,
      cid: usuario.cid,
      texto,
      criadoEm: new Date()
    });

  input.value = "";
}
