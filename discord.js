export async function notificarDiscord(mensagem, webhook) {
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: mensagem })
  });
}
