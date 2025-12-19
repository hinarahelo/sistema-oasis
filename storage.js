/**
 * Upload de arquivos via Cloudinary (PLANO FREE)
 * Integrado ao SITE OASIS
 */
export async function enviarArquivo(app, ticketId, file, usuario) {
  if (!file) return null;

  const cloudName = "dnd90frw";
  const uploadPreset = "oasis_upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `tickets/${ticketId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!data.secure_url) {
    console.error("Erro Cloudinary:", data);
    throw new Error("Falha ao enviar arquivo para o Cloudinary");
  }

  return {
    nome: file.name,
    url: data.secure_url
  };
}
