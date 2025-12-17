// ====== CONFIGURAÇÃO DO DISCORD OAUTH ======
export const DISCORD_CLIENT_ID = "1450905109083979785";
export const DISCORD_CLIENT_SECRET = "yTuT6joTJ9nA28wRA3W-6EVkhJvN9il3";

// URL de callback do seu site (deve coincidir com Redirect URI cadastrado no Discord)
export const REDIRECT_URI = "https://hinarahelo.github.io/sistema-oasis/callback.html";

// URL base para gerar o link de login
export const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;

// IDs de staff autorizados (pode ser atualizado conforme necessidade)
export const STAFF_IDS = ["1","admin"];
