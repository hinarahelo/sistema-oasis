// 🔐 Sessão
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

// 🎫 Abrir ou criar ticket
window.abrirSolicitacao = async categoria => {
  console.log("Abrindo ticket:", categoria);

  const snap = await db.collection("tickets")
    .where("cid", "==", usuario.cid)
    .get();

  let encontrado = null;

  snap.forEach(doc => {
    const t = doc.data();
    if (t.categoria === categoria && t.status === "aberto") {
      encontrado = doc.id;
    }
  });

  if (encontrado) {
    ticketAtual = encontrado;
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
};

// 💬 Chat
function abrirChat(categoria) {
  document.getElementById("chat-titulo").innerText = `💬 ${categoria}`;

  db.collection("tickets")
    .doc(ticketAtual)
    .collection("mensagens")
    .orderBy("criadoEm")
    .onSnapshot(snap => {
      const box = document.getElementById("mensagens");
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        box.innerHTML += `<p><b>${m.autor}:</b> ${m.texto || ""}</p>`;
        if (m.anexoLink) {
          box.innerHTML += `<a href="${m.anexoLink}" target="_blank">📎 Anexo</a>`;
        }
      });
    });
}

// ✉️ Enviar mensagem
window.enviarMensagem = async () => {
  if (!ticketAtual) return;

  const texto = document.getElementById("mensagem").value.trim();
  const anexo = document.getElementById("anexoLink").value.trim();

  if (!texto && !anexo) return;

  await db.collection("tickets")
    .doc(ticketAtual)
    .collection("mensagens")
    .add({
      autor: usuario.nome,
      texto,
      anexoLink: anexo || null,
      criadoEm: new Date()
    });

  document.getElementById("mensagem").value = "";
  document.getElementById("anexoLink").value = "";
};
