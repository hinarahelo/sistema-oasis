import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function iniciarNotificacoes(db, usuario) {
  const badge = document.getElementById("notif-count");
  const list = document.getElementById("notif-list");

  if (!badge || !list) return;

  onSnapshot(
    query(
      collection(db, "notificacoes"),
      where("cid", "==", usuario.cid)
    ),
    snap => {
      list.innerHTML = "";
      badge.innerText = snap.size;
      badge.style.display = snap.size ? "inline-block" : "none";

      snap.forEach(d => {
        const n = d.data();
        const li = document.createElement("li");
        li.innerText = n.texto;
        list.appendChild(li);
      });
    }
  );
}
