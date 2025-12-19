export async function enviarArquivo(ticketId, file) {
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
    throw new Error("Falha no upload");
  }

  return {
    nome: file.name,
    url: data.secure_url
  };
}
