<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <title>Sistema de Atendimento — Supremo Tribunal de Oasis</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css" />
</head>

<body class="bg-paper official">

<script>
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || usuario.nivel !== "cidadao") location.href = "index.html";
</script>

<header class="header small official">
  <img src="logo-oasis.png" class="logo" />
  <div class="header-text">
    <h1>Supremo Tribunal de Oasis</h1>
    <span>Sistema Oficial de Atendimento ao Cidadão</span>
  </div>
</header>

<div class="layout">

  <nav class="nav-bar sidebar official">
    <button onclick="irAba('solicitacoes')">📂 Solicitações</button>
    <button onclick="irAba('andamento')">🕒 Em andamento</button>
    <button onclick="irAba('precos')">💰 Tabela de Serviços</button>
    <button onclick="sair()">🚪 Encerrar Sessão</button>
  </nav>

  <main class="content official">

    <!-- SOLICITAÇÕES -->
    <section id="solicitacoes" class="aba active">
      <h2>Solicitações</h2>

      <div class="bloco-servicos">
        <h3>💍 Serviços Civis</h3>
        <div class="grid-servicos">
          <button onclick="abrirCategoria('Casamento')">Casamento</button>
          <button onclick="abrirCategoria('Divórcio')">Divórcio</button>
          <button onclick="abrirCategoria('Nascimento')">Nascimento</button>
          <button onclick="abrirCategoria('Adoção')">Adoção</button>
          <button onclick="abrirCategoria('Troca de Nome')">Troca de Nome</button>
        </div>
      </div>

      <div class="bloco-servicos">
        <h3>⚖️ Serviços Jurídicos</h3>
        <div class="grid-servicos">
          <button onclick="abrirCategoria('Porte de Arma')">Porte de Arma</button>
          <button onclick="abrirCategoria('Limpeza de Ficha')">Limpeza de Ficha</button>
          <button onclick="abrirCategoria('Jovem Aprendiz')">Jovem Aprendiz</button>
        </div>
      </div>
    </section>

    <!-- ANDAMENTO -->
    <section id="andamento" class="aba">
      <h2>🕒 Tickets em Andamento</h2>
      <div id="categoriasTickets" class="categoria-grid"></div>

      <div id="listaPorCategoria" class="hidden">
        <button class="btn-secondary" onclick="voltarCategorias()">⬅ Voltar</button>
        <h3 id="tituloCategoria"></h3>
        <div id="ticketsCategoria"></div>
      </div>
    </section>

    <!-- CHAT -->
    <section id="chat" class="aba">
      <h2 id="chatTitulo"></h2>
      <div id="mensagens" class="chat-box"></div>

      <div class="chat-input">
        <input id="mensagem" placeholder="Digite sua mensagem..." />
        <input type="file" id="arquivo" />
        <button onclick="enviarMensagem()">Enviar</button>
        <button class="btn-secondary" onclick="irAba('andamento')">⬅ Voltar</button>
      </div>
    </section>

    <!-- TABELA -->
    <section id="precos" class="aba">
      <article class="documento-oficial">
        <header class="doc-header">
          <h2>⚖️ Tabela Oficial de Serviços</h2>
          <span>Supremo Tribunal de Oasis</span>
          <div class="selo-oficial">DOCUMENTO OFICIAL • USO INSTITUCIONAL</div>
        </header>
      </article>
    </section>

    <footer class="footer">
      <div>Sistema institucional — acesso monitorado</div>
      <div>Site desenvolvido por <strong>Hinara Heloar</strong> — direitos reservados</div>
    </footer>

  </main>
</div>

<script>
function mostrarAba(id){
  document.querySelectorAll(".aba").forEach(a=>a.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}
function irAba(id){
  location.hash=id;
  mostrarAba(id);
}
function sair(){
  localStorage.clear();
  location.href="index.html";
}
mostrarAba(location.hash.replace("#","")||"solicitacoes");
</script>

<script type="module" src="script.js"></script>
</body>
</html>
