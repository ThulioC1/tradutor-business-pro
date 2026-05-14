// ============================================================
// app.js
// Lógica principal da UI: tradução e histórico local.
// Sem autenticação — funciona de forma anônima para todos.
// ============================================================

import { translate, STYLE_CONFIGS } from "./translator.js";

// ─── Constantes ───────────────────────────────────────────────
const HISTORY_KEY = "tbp_history";
const MAX_HISTORY = 10;

// ─── Referências DOM ─────────────────────────────────────────
const inputText     = document.getElementById("input-text");
const charCount     = document.getElementById("char-count");
const clearBtn      = document.getElementById("clear-btn");
const styleButtons  = document.querySelectorAll(".style-btn");
const resultsGrid   = document.getElementById("results-grid");
const historyList   = document.getElementById("history-list");
const historyEmpty  = document.getElementById("history-empty");
const toastEl       = document.getElementById("toast");

// ─── Estado ───────────────────────────────────────────────────
let isLoading = false;

// ─── Init ─────────────────────────────────────────────────────
loadHistory();

// ─── Utilitários ─────────────────────────────────────────────

function showToast(msg, type = "info") {
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove("show"), 3500);
}

function setLoading(loading) {
  isLoading = loading;
  styleButtons.forEach(btn => {
    btn.disabled = loading;
    btn.classList.toggle("loading", loading);
  });
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/\n/g, "&#10;");
}

// ─── Input ───────────────────────────────────────────────────

inputText.addEventListener("input", () => {
  const len = inputText.value.length;
  charCount.textContent = `${len}/500`;
  charCount.classList.toggle("warn", len > 400);
  if (len > 500) inputText.value = inputText.value.slice(0, 500);
});

clearBtn.addEventListener("click", () => {
  inputText.value = "";
  charCount.textContent = "0/500";
  resultsGrid.innerHTML = "";
});

// ─── Tradução ────────────────────────────────────────────────

styleButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const text = inputText.value.trim();
    if (!text) return showToast("Digite algo primeiro! ✍️", "error");
    if (isLoading) return;

    const style = btn.dataset.style;
    setLoading(true);
    showTranslationSkeleton(style);

    try {
      const result = await translate(text, style);
      renderResultCard(result, style);

      // Salva no histórico local (sem bloquear a UI)
      saveToHistory(text, style, result);
      loadHistory();

    } catch (err) {
      showToast("Erro ao gerar a tradução. Tente novamente.", "error");
      removeSkeletonCard(style);
    } finally {
      setLoading(false);
    }
  });
});

function showTranslationSkeleton(style) {
  const existing = document.getElementById(`result-${style}`);
  if (existing) existing.remove();

  const card = document.createElement("div");
  card.className = "result-card skeleton-card";
  card.id = `result-${style}`;
  const cfg = STYLE_CONFIGS[style];
  card.innerHTML = `
    <div class="card-header">
      <span class="card-emoji">${cfg.emoji}</span>
      <span class="card-title">${cfg.nome}</span>
      <span class="badge loading-badge">gerando...</span>
    </div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
    <div class="skeleton-line"></div>
  `;
  resultsGrid.prepend(card);
}

function removeSkeletonCard(style) {
  const el = document.getElementById(`result-${style}`);
  if (el) el.remove();
}

function renderResultCard(result, style) {
  const existing = document.getElementById(`result-${style}`);
  if (existing) existing.remove();

  const card = document.createElement("div");
  card.className = "result-card animate-in";
  card.id = `result-${style}`;
  card.innerHTML = `
    <div class="card-header">
      <span class="card-emoji">${result.emoji}</span>
      <span class="card-title">${result.styleName}</span>
      <span class="badge badge-${style}">2 opções</span>
    </div>
    <div class="options-tabs">
      <button class="opt-tab active" data-opt="1">Opção 1</button>
      <button class="opt-tab" data-opt="2">Opção 2</button>
    </div>
    <div class="option-content" id="opt-content-1-${style}">
      <p>${renderMarkdown(result.opcao1)}</p>
      <button class="copy-btn" data-text="${escapeAttr(result.opcao1)}">📋 Copiar</button>
    </div>
    <div class="option-content hidden" id="opt-content-2-${style}">
      <p>${renderMarkdown(result.opcao2)}</p>
      <button class="copy-btn" data-text="${escapeAttr(result.opcao2)}">📋 Copiar</button>
    </div>
  `;

  // Tabs de opções
  const tabs = card.querySelectorAll(".opt-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      card.querySelectorAll(".option-content").forEach(c => c.classList.add("hidden"));
      card.querySelector(`#opt-content-${tab.dataset.opt}-${style}`).classList.remove("hidden");
    });
  });

  // Botões de copiar
  card.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.text).then(() => {
        btn.textContent = "✅ Copiado!";
        setTimeout(() => (btn.textContent = "📋 Copiar"), 2000);
      });
    });
  });

  resultsGrid.prepend(card);
}

// ─── Histórico (localStorage) ─────────────────────────────────

function saveToHistory(original, style, result) {
  const history = getHistoryData();
  const entry = {
    id: Date.now(),
    original,
    style,
    opcao1: result.opcao1,
    opcao2: result.opcao2,
    timestamp: new Date().toISOString()
  };

  // Adiciona no início e garante máximo de 10
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getHistoryData() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function loadHistory() {
  const items = getHistoryData();
  renderHistory(items);
}

function renderHistory(items) {
  historyList.innerHTML = "";
  if (!items || items.length === 0) {
    historyEmpty.classList.remove("hidden");
    return;
  }
  historyEmpty.classList.add("hidden");

  const styleNames = {
    ti:          { emoji: "🖥️", nome: "Portal TI" },
    linkedin:    { emoji: "💼", nome: "LinkedIn" },
    juridico:    { emoji: "⚖️", nome: "Juridiquês" },
    corporativo: { emoji: "🏢", nome: "Corporativo" }
  };

  items.forEach(item => {
    const meta = styleNames[item.style] || { emoji: "📝", nome: item.style };
    const date = item.timestamp
      ? new Date(item.timestamp).toLocaleDateString("pt-BR", {
          day: "2-digit", month: "2-digit",
          hour: "2-digit", minute: "2-digit"
        })
      : "agora";

    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="history-meta">
        <span class="history-badge badge-${item.style}">${meta.emoji} ${meta.nome}</span>
        <span class="history-date">${date}</span>
      </div>
      <p class="history-original">"${truncate(item.original, 80)}"</p>
    `;
    li.addEventListener("click", () => {
      inputText.value = item.original;
      charCount.textContent = `${item.original.length}/500`;
      inputText.focus();
      inputText.scrollIntoView({ behavior: "smooth" });
    });
    historyList.appendChild(li);
  });
}
