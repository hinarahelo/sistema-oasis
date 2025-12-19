onSnapshot(
  query(
    collection(db, "tickets", ticketId, "mensagens"),
    orderBy("criadoEm", "asc")
  ),
  snap => {
    const box = document.getElementById("mensagens");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      const hora = m.criadoEm
        ? new Date(m.criadoEm.toDate()).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "--:--";

      box.innerHTML += `
        <p>
          <b>${m.autor}</b>
          <span style="font-size:11px;color:#666;">(${hora})</span><br>
          ${m.texto || ""}
        </p>
      `;

      if (m.anexo) {
        box.innerHTML += `
          <p style="font-size:13px;">
            📎 <a href="${m.anexo.url}" target="_blank">${m.anexo.nome}</a>
          </p>
        `;
      }
    });

    box.scrollTop = box.scrollHeight;
  }
);
