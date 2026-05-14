// ============================================================
// firebase-config.js
// Substitua as credenciais abaixo pelas do seu projeto Firebase.
// Console: https://console.firebase.google.com/
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyX3HHUkrU_SNt1Bvz_23UDt_DfxD9k9E",
  authDomain: "tradutor-business-pro.firebaseapp.com",
  projectId: "tradutor-business-pro",
  storageBucket: "tradutor-business-pro.firebasestorage.app",
  messagingSenderId: "150367351407",
  appId: "1:150367351407:web:30934abfb9216b766d939a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
