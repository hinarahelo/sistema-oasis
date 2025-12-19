import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const app = initializeApp({
  apiKey: "AIzaSyC6btKxDjOK6VT17DdCS3FvF36Hf_7_TXo",
  authDomain: "sistema-oasis-75979.firebaseapp.com",
  projectId: "sistema-oasis-75979"
});

export const db = getFirestore(app);
