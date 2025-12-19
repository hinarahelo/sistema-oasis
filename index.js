const params = new URLSearchParams(window.location.search);
const session = params.get("session");
const tipo = params.get("tipo");

if (session) {
  localStorage.setItem("session", session);
  localStorage.setItem("tipo", tipo);

  // limpa URL
  window.history.replaceState({}, document.title, "/");

  if (tipo === "staff") {
    window.location.href = "/staff/dashboard.html";
  } else {
    window.location.href = "/tickets.html";
  }
} else {
  if (!localStorage.getItem("session")) {
    window.location.href = "/login.html";
  }
}
