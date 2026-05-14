// ============================================================
// firestore.js
// Salva traduções no Firestore e mantém limite de 10 por usuário.
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const TRANSLATIONS_COL = "translations";
const MAX_HISTORY = 10;

/**
 * Salva uma tradução no Firestore e garante o limite de 10 itens por usuário.
 * @param {string} uid - ID do usuário autenticado.
 * @param {string} originalText - Texto original digitado pelo usuário.
 * @param {string} style - Estilo de tradução: "ti" | "linkedin" | "juridico" | "corporativo"
 * @param {string[]} translations - Array com as 2 opções de tradução geradas.
 */
export async function saveTranslation(uid, originalText, style, translations) {
  // 1. Salva o novo documento
  await addDoc(collection(db, TRANSLATIONS_COL), {
    uid,
    original: originalText,
    style,
    translations,       // array com 2 opções
    timestamp: serverTimestamp()
  });

  // 2. Busca todos os documentos do usuário (mais antigos primeiro)
  const q = query(
    collection(db, TRANSLATIONS_COL),
    where("uid", "==", uid),
    orderBy("timestamp", "desc")
  );
  const snapshot = await getDocs(q);

  // 3. Se ultrapassar o limite, deleta os mais antigos
  if (snapshot.size > MAX_HISTORY) {
    const toDelete = snapshot.docs.slice(MAX_HISTORY);
    const deletePromises = toDelete.map(d => deleteDoc(doc(db, TRANSLATIONS_COL, d.id)));
    await Promise.all(deletePromises);
  }
}

/**
 * Recupera as últimas 10 traduções do usuário, ordenadas da mais recente para a mais antiga.
 * @param {string} uid - ID do usuário autenticado.
 * @returns {Promise<Array>} - Array de objetos de tradução.
 */
export async function getLastTranslations(uid) {
  const q = query(
    collection(db, TRANSLATIONS_COL),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(MAX_HISTORY)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}
