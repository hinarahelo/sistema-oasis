/**
 * Upload de arquivo via Cloudinary (Unsigned)
 * SITE OASIS
 */
export async function enviarArquivo(ticketId, file) {
  if (!file) return null;

  const CLOUD_NAME = "dnd90frw";
  const UPLOAD_PRESET = "oasis_upload"; // precisa existir e ser UNSIGNED

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `tickets/${ticketId}`);

  let response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData
      }
    );
  } catch (e) {
    console.error("Erro de rede Cloudinary:", e);
    alert("Erro de conexão ao enviar arquivo.");
    return null;
  }

  const data = await response.json();

  if (!data.secure_url) {
    console.error("Resposta Cloudinary:", data);
    alert("Falha no upload do arquivo.");
    return null;
  }

  return {
    nome: file.name,
    url: data.secure_url
  };
}
