const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');
const app = express();

app.use(session({ secret: 'segredo', resave: false, saveUninitialized: true }));

const CLIENT_ID = "1450905109083979785";
const CLIENT_SECRET = "yTuT6joTJ9nA28wRA3W-6EVkhJvN9il3";
const REDIRECT_URI = "https://oasis-backend.hinarahelo.repl.co/callback";

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify');

    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = await response.json();
    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
    });
    const user = await userResponse.json();

    req.session.user = { id: user.id, username: user.username };

    // Redireciona para o dashboard do sistema
    res.redirect('https://hinarahelo.github.io/sistema-oasis/dashboard.html');
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
