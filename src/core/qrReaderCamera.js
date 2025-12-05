// ======================================================
// qrReaderCamera.js — Lecture QR via caméra (module technique)
// Version corrigée : cleanup mémoire + meilleure extraction iOS
// ======================================================

let currentScanner = null;

/**
 * Normalise le résultat renvoyé par QrScanner en string.
 * Version améliorée avec support iOS renforcé
 */
function extractTextFromScanResult(result) {
  if (!result) {
    console.warn("⚠️ Résultat QR vide");
    return "";
  }

  // Cas 1 : string directe
  if (typeof result === "string") {
    console.log("✅ String directe extraite");
    return result;
  }

  // Cas 2 : ScanResult standard { data: "...", cornerPoints: [...] }
  if (result.data && typeof result.data === "string") {
    console.log("✅ String depuis result.data");
    return result.data;
  }

  // Cas 3 : iOS tordu - data est un objet ou Buffer
  if (result.data && typeof result.data === "object") {
    console.warn("⚠️ iOS : data est un objet, tentative stringify");
    
    // Si c'est un Buffer ou Uint8Array
    if (result.data instanceof Uint8Array || result.data.buffer) {
      try {
        const decoded = new TextDecoder().decode(result.data);
        console.log("✅ Décodage Buffer réussi");
        return decoded;
      } catch (e) {
        console.error("❌ Erreur décodage Buffer :", e);
      }
    }

    // Sinon on stringify
    try {
      const stringified = JSON.stringify(result.data);
      console.log("✅ Stringify objet réussi");
      return stringified;
    } catch (e) {
      console.error("❌ Stringify échoué :", e);
    }
  }

  // Cas 4 : Fallback - on stringify tout
  console.warn("⚠️ Format inconnu, stringify complet");
  try {
    return JSON.stringify(result);
  } catch (e) {
    console.error("❌ Impossible d'extraire le texte :", e);
    return "";
  }
}

/**
 * Démarre le scan caméra.
 * Version améliorée avec cleanup systématique
 * 
 * @param {HTMLVideoElement} videoElement
 * @param {(rawText: string) => void} onText
 */
export async function startCameraScan(videoElement, onText) {
  if (!window.QrScanner) {
    throw new Error("❌ QrScanner n'est pas chargé (window.QrScanner absent).");
  }
  if (!videoElement) {
    throw new Error("❌ Élément <video> non fourni.");
  }

  // ✅ CORRECTION : Cleanup systématique avant nouvelle instance
  if (currentScanner) {
    console.log("🧹 Nettoyage scanner existant...");
    try {
      await currentScanner.stop();
      currentScanner.destroy();
    } catch (e) {
      console.warn("⚠️ Erreur cleanup scanner :", e);
    } finally {
      currentScanner = null;
    }
  }

  console.log("🎥 Création nouveau scanner...");

  currentScanner = new window.QrScanner(
    videoElement,
    (scanResult) => {
      console.log("[CAM] Résultat brut QrScanner :", scanResult);
      
      const text = extractTextFromScanResult(scanResult);
      console.log("[CAM] Texte normalisé :", text);
      
      if (text && text.length > 0) {
        onText(text);
      } else {
        console.warn("⚠️ Texte extrait vide, scan ignoré");
      }
    },
    {
      returnDetailedScanResult: true,
      highlightScanRegion: true,  // ✅ Aide visuelle
      highlightCodeOutline: true
    }
  );

  // On privilégie la caméra arrière si dispo
  try {
    await currentScanner.start({ facingMode: "environment" });
    console.log("✅ Scanner démarré (caméra arrière)");
  } catch (e) {
    console.warn("⚠️ Caméra arrière indisponible, tentative caméra frontale...");
    try {
      await currentScanner.start({ facingMode: "user" });
      console.log("✅ Scanner démarré (caméra frontale)");
    } catch (e2) {
      console.error("❌ Impossible de démarrer la caméra :", e2);
      throw new Error("Impossible d'accéder à la caméra : " + e2.message);
    }
  }
}

/**
 * Arrête et détruit le scanner actuel.
 * Version améliorée avec nettoyage complet
 */
export async function stopCameraScan() {
  if (!currentScanner) {
    console.log("ℹ️ Aucun scanner à arrêter");
    return;
  }

  console.log("🛑 Arrêt du scanner...");

  try {
    await currentScanner.stop();
    console.log("✅ Scanner arrêté");
  } catch (e) {
    console.warn("⚠️ Erreur à l'arrêt du scanner :", e);
  }

  try {
    currentScanner.destroy();
    console.log("✅ Scanner détruit");
  } catch (e) {
    console.warn("⚠️ Erreur destruction scanner :", e);
  } finally {
    currentScanner = null;
  }
}

/**
 * Vérifie si un scanner est actif
 */
export function isScannerActive() {
  return currentScanner !== null;
}
