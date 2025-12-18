// 🔐 Sessão
let usuario;
try {
  usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) throw new Error();
} catch {
  location.href = "https://sistema-oasis-auth.hinarahelo.workers.dev/login";
}

// 🔥 Firebase (global)
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 📂 Abas
window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";
};

// 🎫 Ticket atual
let ticketAtual = null;

// 🎫 Abrir solicitação
window.abrirSolicitacao = async categoria => {
  const snap = await db.collection("tickets")
    .where("cid", "==", usuario.cid)
    .where("categoria", "==", categoria)
    .where("status", "!=", "fechado")
    .get();

  if (!snap.empty) {
    ticketAtual = snap.docs[0].id;
  } else {
    const doc = await db.collection("tickets").add({
      nome: usuario.nome,
      cid: usuario.cid,
      categoria,
      status: "aberto",
      criadoEm: new Date()
    });
    ticketAtual = doc.id;
  }

  abrirChat(categoria);
};

// 💬 Chat
function abrirChat(categoria) {
  document.getElementById("chat-titulo").innerText = `💬 ${categoria}`;
  abrirAba("chat");

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
  const texto = document.getElementById("mensagem").value.trim();
  const anexo = document.getElementById("anexoLink")?.value.trim();

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
  if (document.getElementById("anexoLink"))
    document.getElementById("anexoLink").value = "";
};
