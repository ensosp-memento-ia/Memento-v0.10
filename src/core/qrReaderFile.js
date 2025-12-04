// ======================================================
// qrReaderFile.js — Lecture d'un QR Code depuis un fichier image
// Version corrigée : meilleure gestion des erreurs
// ======================================================

import { decodeFiche } from "./compression.js";

export async function readQrFromFile(file) {
  if (!file) {
    throw new Error("Aucun fichier fourni.");
  }

  if (!window.QrScanner) {
    throw new Error("QrScanner n'est pas chargé. Vérifie l'import dans scan.html.");
  }

  const imgUrl = URL.createObjectURL(file);
  console.log("[QR FILE] URL image temporaire :", imgUrl);

  try {
    // Scan de l'image
    const scanResult = await window.QrScanner.scanImage(imgUrl, {
      returnDetailedScanResult: true
    });

    console.log("[QR FILE] Résultat brut QrScanner :", scanResult);

    // ✅ Extraction sécurisée du texte
    let text = "";
    
    if (typeof scanResult === "string") {
      text = scanResult;
    } else if (scanResult && typeof scanResult === "object") {
      if (typeof scanResult.data === "string") {
        text = scanResult.data;
      } else if (scanResult.data && typeof scanResult.data === "object") {
        // Cas iOS tordu
        try {
          text = JSON.stringify(scanResult.data);
        } catch (e) {
          console.error("[QR FILE] Impossible de stringify data :", e);
        }
      }
    }

    console.log("[QR FILE] Texte extrait du QR :", text);

    if (!text || text.length === 0) {
      throw new Error("Aucune donnée texte trouvée dans le QR Code.");
    }

    // ✅ Décodage avec gestion d'erreur détaillée
    let fiche;
    try {
      fiche = decodeFiche(text);
      console.log("[QR FILE] Fiche décodée avec succès :", fiche);
    } catch (decodeError) {
      console.error("[QR FILE] Erreur decodeFiche :", decodeError);
      throw new Error("QR Code invalide ou corrompu : " + decodeError.message);
    }

    return fiche;

  } catch (e) {
    console.error("[QR FILE] Erreur globale :", e);
    
    // ✅ Message d'erreur plus explicite
    if (e.message && e.message !== "undefined") {
      throw new Error(e.message);
    } else {
      throw new Error("Impossible de lire le QR Code. Vérifiez que l'image est bien un QR Code valide généré par cette application.");
    }
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}
