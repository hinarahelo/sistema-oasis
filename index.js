import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ====== CONFIGURAÇÃO FIREBASE ======
const firebaseConfig = {
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979",
  storageBucket: "sistema-oasis-75979.appspot.com",
  messagingSenderId: "925698565602",
  appId: "1:925698565602:web:127df3a95aad70484ac5bb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== ELEMENTOS DO FORM ======
const botao = document.getElementById("btnVerificar");
const status = document.getElementById("status");

botao.addEventListener("click", async () => {
  const campoNome = document.getElementById("nome").value.trim();
  const campoCid = document.getElementById("cid").value.trim();

  if (!campoNome || !campoCid) {
    status.innerText = "⚠️ Preencha todos os campos";
    return;
  }

  status.innerText = "⏳ Verificando...";

  try {
    // Salva usuário no Firestore
    await setDoc(doc(db, "users", campoCid), {
      nome: campoNome,
      cid: campoCid,
      criadoEm: serverTimestamp()
    });

    // Salva usuário no localStorage para dashboard/staff
    localStorage.setItem("usuario", JSON.stringify({
      nome: campoNome,
      cid: campoCid
    }));

    status.innerText = "✅ Verificação concluída!";
    setTimeout(() => {
      // Redireciona para dashboard do usuário
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (e) {
    console.error(e);
    status.innerText = "❌ Erro ao verificar";
  }
});
