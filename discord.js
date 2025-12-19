export async function notificarDiscord(mensagem) {
  await fetch("https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: mensagem
    })
  });
}
