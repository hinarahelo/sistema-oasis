// Configuração OAuth Discord
const DISCORD_CLIENT_ID = "1450905109083979785";
const REDIRECT_URI = "https://hinarahelo.github.io/sistema-oasis/callback.html";

export function discordAuthUrl() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify"
  });
  return "https://discord.com/api/oauth2/authorize?" + params.toString();
}
