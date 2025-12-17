const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');

const app = express();

// ====== SESSÃO ======
app.use(session({
    secret: 'segredo_super_secreto',
    resave: false,
    saveUninitialized: true
}));

// ====== CONFIGURAÇÃO DISCORD OAUTH ======
const CLIENT_ID = "1450905109083979785";
const CLIENT_SECRET = "yTuT6joTJ9nA28wRA3W-6EVkhJvN9il3";
const REDIRECT_URI = "https://oasis-backend.hinarahelo.repl.co/callback";

// ====== CALLBACK ======
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if(!code) return res.status(400).send("Código não fornecido");

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('scope', 'identify');

        // Troca code por token
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await response.json();
        if(!data.access_token) throw new Error("Token inválido");

        // Pega dados do usuário
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        const user = await userResponse.json();

        // Salva usuário na sessão
        req.session.user = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar
        };

        // Redireciona para dashboard do sistema
        res.redirect('https://hinarahelo.github.io/sistema-oasis/dashboard.html');

    } catch(err) {
        console.error(err);
        res.status(500).send("Erro ao processar login do Discord");
    }
});

// ====== ROTA TESTE ======
app.get('/', (req,res) => res.send("Servidor Oasis Online"));

// ====== INICIALIZAÇÃO ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
