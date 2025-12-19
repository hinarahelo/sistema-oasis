import { getStorage, ref, uploadBytes, getDownloadURL } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export async function enviarArquivo(app, ticketId, file, usuario) {
  const storage = getStorage(app);

  const caminho = `tickets/${ticketId}/${Date.now()}_${file.name}`;
  const arquivoRef = ref(storage, caminho);

  await uploadBytes(arquivoRef, file);
  const url = await getDownloadURL(arquivoRef);

  return {
    nome: file.name,
    url,
    enviadoPor: `${usuario.nome} ${usuario.cid}`
  };
}
