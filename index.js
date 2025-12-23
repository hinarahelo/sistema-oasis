/* ======================================================
   🔐 CONTROLE DE SESSÃO — INDEX
   Supremo Tribunal de Oasis
====================================================== */

(function () {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return;

    const usuario = JSON.parse(raw);

    if (!usuario || !usuario.nivel) {
      localStorage.removeItem("usuario");
      return;
    }

    /* 🔁 REDIRECIONAMENTO POR NÍVEL */
    if (usuario.nivel === "cidadao") {
      location.replace("welcome.html");
      return;
    }

    if (usuario.nivel === "juridico") {
      location.replace("welcome.html");
      return;
    }

    if (usuario.nivel === "coordenacao") {
      location.replace("welcome.html");
      return;
    }

    // Qualquer coisa fora do padrão
    localStorage.removeItem("usuario");

  } catch (e) {
    console.error("Erro ao validar sessão:", e);
    localStorage.removeItem("usuario");
  }
})();
