// 🔐 Sessão
let usuario;
try {
  usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) throw new Error();
} catch {
  location.href = "https://sistema-oasis-auth.hinarahelo.workers.dev/login";
}

// 🔥 Firebase (compatível sem módulo)
firebase.initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});

const db = firebase.firestore();

let ticketAtual = null;

/* 📂 Abas */
window.abrirAba = id => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";
};

/* 🎫 ABRIR / CRIAR TICKET (SEM QUERY COMPLEXA) */
window.abrirSolicitacao = async categoria => {
  // Busca TODOS os tickets do usuário
  const snap = await db.collection("tickets")
    .where("cid", "==", usuario.cid)
    .get();

  // tenta achar ticket aberto da categoria
  let encontrado = null;
  snap.forEach(d => {
    const t = d.data();
    if (t.categoria === categoria && t.status === "aberto") {
      encontrado = d.id;
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

/* 💬 CHAT DO TICKET */
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
        box.innerHTML += `
          <p><b>${m.autor}:</b> ${m.texto || ""}</p>
          ${m.anexoLink ? `<a href="${m.anexoLink}" target="_blank">📎 Anexo</a>` : ""}
        `;
      });

      box.scrollTop = box.scrollHeight;
    });
}

/* ✉️ ENVIAR MENSAGEM */
window.enviarMensagem = async () => {
  if (!ticketAtual) return;

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
