// ===============================================================
// uiReset.js — Réinitialisation complète du module création
// Version corrigée : fusion des deux définitions
// ===============================================================

import { resetMetaUI } from "./uiMeta.js";
import { initVariablesUI } from "./uiVariables.js";

/**
 * Réinitialise complètement l'interface de création
 */
export function resetCreateUI() {
  console.log("🔄 Réinitialisation complète de l'interface");

  // 1. Métadonnées
  resetMetaUI();

  // 2. Variables
  initVariablesUI();

  // 3. Prompt
  const promptInput = document.getElementById("prompt_input");
  const promptCounter = document.getElementById("prompt_count");
  if (promptInput) promptInput.value = "";
  if (promptCounter) promptCounter.textContent = "0 / 4000";

  // 4. QR Container
  const qrContainer = document.getElementById("qrContainer");
  if (qrContainer) qrContainer.innerHTML = "";

  // 5. Indices de confiance
  resetConfidenceIndexes();

  console.log("✅ Réinitialisation terminée");
}

/**
 * Remet tous les indices de confiance IA à 3 (recommandée)
 */
export function resetConfidenceIndexes() {
  const chatGPT = document.getElementById("aiChatGPT");
  const perplexity = document.getElementById("aiPerplexity");
  const mistral = document.getElementById("aiMistral");

  if (chatGPT) chatGPT.value = "3";
  if (perplexity) perplexity.value = "3";
  if (mistral) mistral.value = "3";

  console.log("🔄 Indices IA réinitialisés à 3");
}
