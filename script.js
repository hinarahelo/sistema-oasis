import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.verificar = async function () {
  const nome = document.getElementById("nome").value;
  const cid = document.getElementById("cid").value;

  if (!nome || !cid) {
    alert("Preencha todos os campos");
    return;
  }

  await setDoc(doc(db, "users", cid), {
    nome,
    cid,
    criadoEm: new Date()
  });

  alert("Verificação concluída com sucesso!");
};
