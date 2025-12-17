const express = require("express");
const fetch = require("node-fetch");
const session = require("express-session");

const app = express();

app.use(
  session({
    secret: "oasis-secret",
    resave: false,
    saveUninitialized: true
  })
);

const CLIENT_ID = "1450905109083979785";
const CLIENT_SECRET = "SEU_CLIENT_SECRET_AQUI";
const REDIRECT_URI =
  "https://hinarahelo.github.io/sistema-oasis/callback.html";

app.get("/", (req, res) => {
  res.send("Backend Oasis Online");
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Código não recebido");

  try {
    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);

    const tokenRes = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      }
    );

    const token = await tokenRes.json();

    const userRes = await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      }
    );

    const user = await userRes.json();

    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar
    };

    res.redirect(
      "https://hinarahelo.github.io/sistema-oasis/dashboard.html"
    );

  } catch (err) {
    console.error(err);
    res.send("Erro no login Discord");
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log("Servidor rodando na porta", PORT)
);
