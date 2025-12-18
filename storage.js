import { getStorage, ref, uploadBytes, getDownloadURL } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export async function uploadAnexo(app, ticketId, file) {
  const storage = getStorage(app);
  const caminho = `tickets/${ticketId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, caminho);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
