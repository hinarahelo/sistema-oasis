console.log("🔥 Atendimento Oasis iniciado");

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

// 🎫 Abrir ou criar ticket por categoria
async function abrirSolicitacao(categoria) {
  document.getElementById("mensagens").innerHTML = "";
  document.getElementById("chat-titulo").innerText = "💬 " + categoria;

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

  escutarMensagens();
}

// 👂 Escutar mensagens do ticket atual
function escutarMensagens() {
  db.collection("tickets")
    .doc(ticketAtual)
    .collection("mensagens")
    .orderBy("criadoEm")
    .onSnapshot(snap => {
      const box = document.getElementById("mensagens");
      box.innerHTML = "";

      snap.forEach(d => {
        const m = d.data();
        box.innerHTML += `
          <p>
            <b>${m.autor} ${m.cid}:</b> ${m.texto}
          </p>
        `;
      });

      box.scrollTop = box.scrollHeight;
    });
}

// ✉️ Enviar mensagem
async function enviarMensagem() {
  if (!ticketAtual) {
    alert("Selecione uma categoria primeiro.");
    return;
  }

  const input = document.getElementById("mensagem");
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
