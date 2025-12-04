// ======================================================================
// uiQrToUrl.js — Conversion QR Code existant → URL cliquable
// ======================================================================

import { decodeFiche } from "../core/compression.js";
import { generateFicheUrl } from "../core/urlEncoder.js";

const fileInput = document.getElementById("qrFileInput");
const previewContainer = document.getElementById("previewContainer");
const qrPreview = document.getElementById("qrPreview");
const resultSection = document.getElementById("resultSection");
const infoSection = document.getElementById("infoSection");
const generatedUrl = document.getElementById("generatedUrl");
const btnCopyUrl = document.getElementById("btnCopyUrl");
const btnTestUrl = document.getElementById("btnTestUrl");
const ficheInfo = document.getElementById("ficheInfo");

let currentFiche = null;

// ------------------------------------------------------------------------
// Import et traitement du QR Code
// ------------------------------------------------------------------------
if (fileInput) {
  fileInput.addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;

    console.log("📁 Fichier QR sélectionné :", file.name);

    // Afficher l'aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      qrPreview.src = e.target.result;
      previewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Lecture du QR Code
    try {
      console.log("🔍 Scan du QR Code en cours...");

      const result = await window.QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });

      // Extraction du texte
      let text = "";
      if (typeof result === "string") {
        text = result;
      } else if (result && result.data) {
        text = (typeof result.data === "string") ? result.data : JSON.stringify(result.data);
      }

      console.log("📄 Données QR extraites (longueur) :", text.length);

      if (!text || text.length === 0) {
        throw new Error("QR Code vide ou illisible.");
      }

      // Décodage de la fiche
      console.log("🔓 Décodage de la fiche...");
      const fiche = decodeFiche(text);
      console.log("✅ Fiche décodée avec succès :", fiche);

      currentFiche = fiche;

      // Génération de l'URL
      generateAndDisplayUrl(fiche);

      // Affichage des infos
      displayFicheInfo(fiche);

    } catch (err) {
      console.error("❌ Erreur traitement QR :", err);
      
      alert(
        "❌ Erreur lors de la lecture du QR Code\n\n" +
        "Détails : " + err.message + "\n\n" +
        "Vérifiez que :\n" +
        "• L'image est bien un QR Code\n" +
        "• Le QR a été généré par cette application\n" +
        "• L'image n'est pas floue ou endommagée"
      );

      // Reset de l'interface
      resultSection.style.display = "none";
      infoSection.style.display = "none";
    }
  });
}

// ------------------------------------------------------------------------
// Génération et affichage de l'URL
// ------------------------------------------------------------------------
function generateAndDisplayUrl(fiche) {
  try {
    // Générer l'URL
    const url = generateFicheUrl(fiche);
    
    // Afficher
    generatedUrl.value = url;
    resultSection.style.display = "block";

    console.log("🔗 URL générée :", url);
    console.log("📏 Longueur URL :", url.length);

    // Avertissement si URL très longue
    if (url.length > 2000) {
      const warning = document.createElement("p");
      warning.style.cssText = "background:#fff3cd;padding:10px;border-radius:6px;margin-top:10px;font-size:13px;color:#856404;";
      warning.innerHTML = "⚠️ <strong>Attention :</strong> Cette URL est très longue (" + url.length + " caractères). Certains navigateurs ou applications pourraient avoir des difficultés à l'ouvrir.";
      resultSection.querySelector("div").appendChild(warning);
    }

  } catch (e) {
    console.error("❌ Erreur génération URL :", e);
    alert("❌ Impossible de générer l'URL : " + e.message);
  }
}

// ------------------------------------------------------------------------
// Affichage des informations de la fiche
// ------------------------------------------------------------------------
function displayFicheInfo(fiche) {
  const meta = fiche.meta || {};
  
  ficheInfo.innerHTML = `
    <div style="margin-bottom:10px;">
      <strong style="color:#001F8F;">Catégorie :</strong> ${meta.categorie || "-"}
    </div>
    <div style="margin-bottom:10px;">
      <strong style="color:#001F8F;">Titre :</strong> ${meta.titre || "-"}
    </div>
    <div style="margin-bottom:10px;">
      <strong style="color:#001F8F;">Objectif :</strong> ${meta.objectif || "-"}
    </div>
    <div style="margin-bottom:10px;">
      <strong style="color:#001F8F;">Concepteur :</strong> ${meta.concepteur || "-"}
    </div>
    <div style="margin-bottom:10px;">
      <strong style="color:#001F8F;">Version :</strong> ${meta.version || "-"}
    </div>
    <div>
      <strong style="color:#001F8F;">Date :</strong> ${meta.date || "-"}
    </div>
  `;

  infoSection.style.display = "block";
}

// ------------------------------------------------------------------------
// Copier l'URL
// ------------------------------------------------------------------------
if (btnCopyUrl) {
  btnCopyUrl.addEventListener("click", async () => {
    const url = generatedUrl.value;
    
    if (!url) {
      alert("⚠️ Aucune URL à copier");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      
      // Feedback visuel
      const originalText = btnCopyUrl.textContent;
      btnCopyUrl.textContent = "✅ Lien copié !";
      btnCopyUrl.style.background = "#1dbf65";
      
      setTimeout(() => {
        btnCopyUrl.textContent = originalText;
        btnCopyUrl.style.background = "";
      }, 2000);

      console.log("✅ URL copiée dans le presse-papiers");

    } catch (e) {
      console.error("❌ Erreur copie :", e);
      alert("❌ Impossible de copier l'URL : " + e.message);
    }
  });
}

// ------------------------------------------------------------------------
// Tester l'URL
// ------------------------------------------------------------------------
if (btnTestUrl) {
  btnTestUrl.addEventListener("click", () => {
    const url = generatedUrl.value;
    
    if (!url) {
      alert("⚠️ Aucune URL à tester");
      return;
    }

    console.log("🔍 Test de l'URL :", url);
    window.open(url, "_blank");
  });
}
