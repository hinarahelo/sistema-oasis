import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/**
 * Envia arquivo para o Firebase Storage
 * @param {object} app Firebase app
 * @param {string} ticketId ID do ticket
 * @param {File} file Arquivo selecionado
 * @param {object} usuario Dados do usuário
 */
export async function enviarArquivo(app, ticketId, file, usuario) {
  if (!file) return null;

  const storage = getStorage(app);

  const caminho = `tickets/${ticketId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, caminho);

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  return {
    nome: file.name,
    url
  };
}
