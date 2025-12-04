// ================================================================
// app.js — Version stable test moteur JSON + variables + QR
// + version instrumentée (diagnostic & protections)
// ================================================================

// 1) Imports des modules de base
import { validateFiche } from "./src/core/jsonSchema.js";
import { buildVariablesUI, getValues, generatePrompt } from "./src/core/variables.js";
import { encodeFiche, decodeFiche } from "./src/core/compression.js";
import { generateQrForFiche } from "./src/core/qrWriter.js";
import { readQrFromFile } from "./src/core/qrReaderFile.js";

// → AJOUT : module d’interface caméra
import { setupCameraUI } from "./src/ui/uiCamera.js";

// Exposition pour tests console
window.encodeFiche = encodeFiche;
window.decodeFiche = decodeFiche;
window.generateQrForFiche = generateQrForFiche;

// ================================================================
// Gestion globale des erreurs silencieuses
// ================================================================
window.addEventListener("error", (e) => {
  alert("💥 Erreur JS globale : " + e.message);
  console.error("Erreur JS globale :", e);
});

// ================================================================
// Initialisation après chargement du DOM
// ================================================================
document.addEventListener("DOMContentLoaded", () => {

  console.log("🔧 App.js chargé — DOMContentLoaded OK");

  const logBox = document.getElementById("log");
  const outputBox = document.getElementById("output");

  function log(msg) {
    if (!logBox) return;
    logBox.textContent += msg + "\n";
  }

  // ------------------------------------------------------------
  // 1) Charger + valider la fiche JSON
  // ------------------------------------------------------------
  const btnLoad = document.getElementById("btnLoad");
  console.log("🔧 bouton load =", btnLoad);

  if (btnLoad) {
    btnLoad.addEventListener("click", () => {
      console.log("🔵 Clic détecté sur Charger & Valider");

      if (logBox) logBox.textContent = "";
      if (outputBox) outputBox.textContent = "";

      const input = document.getElementById("jsonInput");
      if (!input) {
        log("❌ Erreur : champ JSON introuvable.");
        return;
      }

      let raw = input.value.trim();
      console.log("🔍 Contenu JSON collé :", raw);

      if (!raw) {
        log("❌ Erreur : aucun JSON fourni.");
        return;
      }

      let fiche = null;

      try {
        fiche = JSON.parse(raw);
      } catch (e) {
        console.error("❌ Exception JSON.parse :", e);
        alert("Erreur JSON.parse : " + e.message);
        log("❌ JSON invalide : " + e.message);
        return;
      }

      console.log("📌 JSON parsé :", fiche);

      if (!fiche.prompt || !Array.isArray(fiche.prompt.variables)) {
        alert("❌ Structure JSON invalide : 'prompt.variables' manquant.");
        log("❌ Structure JSON incompatible : prompt.variables introuvable.");
        console.error("Structure JSON incorrecte :", fiche);
        return;
      }

      try {
        validateFiche(fiche);
        log("✔ Fiche JSON valide !");
      } catch (e) {
        log("❌ Erreur validation : " + e.message);
        return;
      }

      const container = document.getElementById("formContainer");
      if (container) {
        console.log("🛠️ Génération UI variables…");
        try {
          buildVariablesUI(container, fiche);
        } catch (e) {
          alert("❌ Erreur lors de la construction du formulaire : " + e.message);
          console.error(e);
          return;
        }
      }

      console.log("💾 Fiche stockée dans window.currentFiche");
      window.currentFiche = fiche;
    });
  }

  // ------------------------------------------------------------
  // 2) Lire les valeurs du formulaire
  // ------------------------------------------------------------
  const btnValues = document.getElementById("btnValues");
  if (btnValues) {
    btnValues.addEventListener("click", () => {
      if (outputBox) outputBox.textContent = "";

      const fiche = window.currentFiche;
      if (!fiche) {
        outputBox.textContent = "❌ Aucune fiche chargée.";
        return;
      }

      try {
        const vals = getValues(fiche);
        outputBox.textContent =
          "✔ Valeurs saisies :\n" + JSON.stringify(vals, null, 2);
      } catch (e) {
        outputBox.textContent = "❌ Erreur : " + e.message;
      }
    });
  }

  // ------------------------------------------------------------
  // 3) Générer le prompt final
  // ------------------------------------------------------------
  const btnPrompt = document.getElementById("btnPrompt");
  if (btnPrompt) {
    btnPrompt.addEventListener("click", () => {
      if (outputBox) outputBox.textContent = "";

      const fiche = window.currentFiche;
      if (!fiche) {
        outputBox.textContent = "❌ Aucune fiche chargée.";
        return;
      }

      try {
        const vals = getValues(fiche);
        const prompt = generatePrompt(fiche, vals);
        outputBox.textContent = "✔ Prompt généré :\n\n" + prompt;
      } catch (e) {
        outputBox.textContent = "❌ Erreur : " + e.message;
      }
    });
  }

  // ------------------------------------------------------------
  // 4) Générer le QR Code
  // ------------------------------------------------------------
  const btnMakeQR = document.getElementById("btnMakeQR");
  if (btnMakeQR) {
    btnMakeQR.addEventListener("click", () => {
      const fiche = window.currentFiche;
      if (!fiche) {
        alert("Aucune fiche chargée !");
        return;
      }

      try {
        generateQrForFiche(fiche, "qrContainer");
      } catch (e) {
        console.error("Erreur QR :", e);
        alert("Erreur pendant la génération du QR : " + e.message);
      }
    });
  }

  // ------------------------------------------------------------
  // 5) Lecture d’un QR via fichier image
  // ------------------------------------------------------------
  const qrInput = document.getElementById("qrFileInput");
  const qrOutput = document.getElementById("qrFileResult");

  if (qrInput && qrOutput) {
    qrInput.addEventListener("change", async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;

      qrOutput.textContent = "Lecture en cours…";

      try {
        const fiche = await readQrFromFile(file);
        qrOutput.textContent =
          "✔ QR décodé :\n\n" + JSON.stringify(fiche, null, 2);
        window.lastDecodedFiche = fiche;
      } catch (err) {
        console.error(err);
        qrOutput.textContent = "❌ Erreur : " + (err.message || err);
      }
    });
  }

  // ------------------------------------------------------------
  // 6) Initialisation de l'UI caméra (module OPTION C)
  // ------------------------------------------------------------
  console.log("🎥 Initialisation du module caméra…");
  setupCameraUI();

});
