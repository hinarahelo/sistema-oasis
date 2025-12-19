import { collection, addDoc, serverTimestamp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Registrar log oficial
 * @param {Firestore} db
 * @param {Object} dados
 */
export async function registrarLog(db, dados) {
  try {
    await addDoc(collection(db, "logs"), {
      ...dados,
      criadoEm: serverTimestamp()
    });
  } catch (e) {
    console.error("Erro ao registrar log:", e);
  }
}
