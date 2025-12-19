const params = new URLSearchParams(window.location.search);
const session = params.get("session");

if (session) {
  try {
    const usuario = JSON.parse(atob(session));
    localStorage.setItem("usuario", JSON.stringify(usuario));
    window.history.replaceState({}, document.title, "/sistema-oasis/");
    location.href = "tickets.html";
  } catch {
    localStorage.removeItem("usuario");
  }
}
