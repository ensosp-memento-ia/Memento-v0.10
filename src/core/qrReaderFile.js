// ======================================================
// qrReaderFile.js — Lecture d'un QR Code depuis un fichier image
// Version améliorée : pré-traitement d'image pour QR denses
// ======================================================

import { decodeFiche } from "./compression.js";

// ✅ Pré-traitement de l'image pour améliorer la détection
async function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // Créer un canvas pour redimensionner/optimiser l'image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Dimensions optimales : minimum 1000px pour QR denses
        const targetSize = Math.max(img.width, img.height, 1200);
        const scale = targetSize / Math.max(img.width, img.height);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Dessiner l'image redimensionnée avec lissage désactivé (meilleur pour QR)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir en URL
        const processedUrl = canvas.toDataURL('image/png');
        console.log("[QR FILE] Image pré-traitée :", canvas.width, "x", canvas.height);
        resolve(processedUrl);
      };

      img.onerror = () => reject(new Error("Impossible de charger l'image"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export async function readQrFromFile(file) {
  if (!file) {
    throw new Error("Aucun fichier fourni.");
  }

  if (!window.QrScanner) {
    throw new Error("QrScanner n'est pas chargé. Vérifie l'import dans scan.html.");
  }

  console.log("[QR FILE] Fichier reçu :", file.name, file.size, "octets");

  // ✅ Pré-traitement de l'image pour améliorer la lecture
  const processedImgUrl = await preprocessImage(file);
  
  try {
    // ✅ Scan de l'image avec options optimisées pour QR denses
    const scanResult = await window.QrScanner.scanImage(processedImgUrl, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true,  // ✅ Essaye plusieurs zones
      maxScansPerSecond: 1  // ✅ Scan plus précis
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
    URL.revokeObjectURL(processedImgUrl);
  }
}
