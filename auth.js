// ============================================================
// auth.js
// Gerencia autenticação: Google Login, Email/Senha e Logout.
// ============================================================

import { auth } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/** Login com Google via popup */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

/** Login com Email e Senha */
export async function loginWithEmail(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

/** Cadastro com Email e Senha */
export async function registerWithEmail(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

/** Logout do usuário atual */
export async function logout() {
  return await signOut(auth);
}

/**
 * Observador de estado de autenticação.
 * @param {Function} callback - Chamado com o user object ou null.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
