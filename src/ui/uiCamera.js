// ======================================================
// uiCamera.js — Gestion UI de la lecture QR par caméra
// ======================================================
//
// - Récupère les éléments DOM (boutons, vidéo, <pre>)
// - Utilise startCameraScan / stopCameraScan (module core)
// - Appelle decodeFiche() pour reconstruire la fiche
// - Met à jour l'UI (messages, erreurs, etc.)
// ======================================================

import { startCameraScan, stopCameraScan } from "../core/qrReaderCamera.js";
import { decodeFiche } from "../core/compression.js";

export function setupCameraUI() {
  const btnStart = document.getElementById("btnStartCam");
  const btnStop = document.getElementById("btnStopCam");
  const videoElem = document.getElementById("qrVideo");
  const resultBox = document.getElementById("qrCamResult");

  if (!btnStart || !btnStop || !videoElem || !resultBox) {
    console.warn("[CAM UI] Éléments caméra manquants dans le DOM, section non initialisée.");
    return;
  }

  btnStop.disabled = true;

  btnStart.addEventListener("click", async () => {
    resultBox.textContent = "Activation de la caméra…";

    try {
      await startCameraScan(videoElem, async (rawText) => {
        // Affichage brut
        resultBox.textContent = "QR détecté !\n\n" + rawText;

        try {
          const fiche = decodeFiche(rawText);
          resultBox.textContent += "\n\nFiche décodée :\n" +
            JSON.stringify(fiche, null, 2);
          // On stocke pour d'autres modules
          window.lastDecodedFiche = fiche;
        } catch (e) {
          console.error("[CAM UI] Erreur decodeFiche :", e);
          resultBox.textContent += "\n\nErreur decodeFiche : " + e.message;
        }

        // Arrêt automatique après un scan
        await stopCameraScan();
        btnStart.disabled = false;
        btnStop.disabled = true;
      });

      btnStart.disabled = true;
      btnStop.disabled = false;
      resultBox.textContent = "Caméra activée. Présente un QR dans le cadre…";
    } catch (e) {
      console.error("[CAM UI] Erreur startCameraScan :", e);
      resultBox.textContent = "Erreur activation caméra : " + e.message;
      btnStart.disabled = false;
      btnStop.disabled = true;
    }
  });

  btnStop.addEventListener("click", async () => {
    await stopCameraScan();
    btnStart.disabled = false;
    btnStop.disabled = true;
    resultBox.textContent = "Caméra arrêtée.";
  });
}
