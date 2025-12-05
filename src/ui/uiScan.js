// ======================================================================
// uiScan.js – Interface complète de lecture + exploitation de fiche
// Version corrigée : gestion améliorée de l'import de fichier QR
// ======================================================================

import { decodeFiche } from "../core/compression.js";
import { buildFullPrompt } from "../core/variables.js";

let scanner = null;
let currentFiche = null;
window.currentFiche = null;

// -----------------------------------------------------------------------
// Cleanup du scanner (stop + destroy)
// -----------------------------------------------------------------------
async function cleanupScanner() {
  if (scanner) {
    console.log("🧹 Nettoyage scanner...");
    try {
      await scanner.stop();
      scanner.destroy();
    } catch (e) {
      console.warn("⚠️ Erreur cleanup scanner :", e);
    }
    scanner = null;
  }
}

// -----------------------------------------------------------------------
// Éléments DOM
// -----------------------------------------------------------------------
const fileInput = document.getElementById("qrFileInput");
const btnStartCam = document.getElementById("btnStartCam");
const btnStopCam = document.getElementById("btnStopCam");
const videoEl = document.getElementById("qrVideo");
const videoContainer = document.getElementById("videoContainer");

const sectionScan = document.getElementById("sectionScan");
const sectionMeta = document.getElementById("sectionMeta");
const sectionVars = document.getElementById("sectionVars");
const sectionExtra = document.getElementById("sectionExtra");
const sectionPrompt = document.getElementById("sectionPrompt");

const metaHeader = document.getElementById("metaHeader");
const scanVariables = document.getElementById("scanVariables");
const extraInput = document.getElementById("extra_input");
const promptResult = document.getElementById("promptResult");
const aiButtons = document.getElementById("aiButtons");

const btnResetScan = document.getElementById("btnResetScan");

// -----------------------------------------------------------------------
// FONCTION PRINCIPALE : Fiche décodée
// -----------------------------------------------------------------------
function onFicheDecoded(fiche) {
  console.log("✅ Fiche décodée reçue :", fiche);
  
  currentFiche = fiche;
  window.currentFiche = fiche;

  // Afficher sections
  if (sectionMeta) sectionMeta.style.display = "block";
  if (sectionVars) sectionVars.style.display = "block";
  if (sectionExtra) sectionExtra.style.display = "block";
  if (sectionPrompt) sectionPrompt.style.display = "block";

  // Bouton reset visible
  if (btnResetScan) btnResetScan.style.display = "inline-block";

  // Remplir métadonnées
  buildMetaHeader(fiche);

  // Remplir variables
  buildVariablesUI(fiche);
}

// -----------------------------------------------------------------------
// MÉTADONNÉES CONDENSÉES
// -----------------------------------------------------------------------
function buildMetaHeader(fiche) {
  if (!metaHeader) return;

  const m = fiche.meta || {};
  const geo = fiche.geoloc || {};

  // Titre principal
  const titre = m.titre || "Sans titre";
  
  // Ligne catégorie + objectif
  const cat = m.categorie || "";
  const obj = m.objectif || "";
  let subLine = [];
  if (cat) subLine.push(cat);
  if (obj) subLine.push(obj);
  const subText = subLine.length > 0 ? subLine.join(" • ") : "";

  // Ligne auteur + version + date
  const concepteur = m.concepteur || "";
  const version = m.version || "";
  const date = m.date_maj || "";
  let metaLine = [];
  if (concepteur) metaLine.push(concepteur);
  if (version) metaLine.push(`v${version}`);
  if (date) metaLine.push(date);
  const metaText = metaLine.length > 0 ? metaLine.join(" • ") : "";

  // Géolocalisation
  const lat = geo.latitude || "";
  const lon = geo.longitude || "";
  const geoText = (lat && lon) ? `📍 ${lat}, ${lon}` : "";

  // Construction HTML
  metaHeader.innerHTML = `
    <h2 style="color:#001F8F;font-size:18px;margin:0 0 6px 0;font-weight:700;">${titre}</h2>
    ${subText ? `<p style="margin:0 0 4px 0;font-size:14px;color:#444;">${subText}</p>` : ""}
    ${metaText ? `<p style="margin:0 0 4px 0;font-size:13px;color:#666;">${metaText}</p>` : ""}
    ${geoText ? `<p style="margin:0;font-size:12px;color:#888;">${geoText}</p>` : ""}
  `;
}

// -----------------------------------------------------------------------
// VARIABLES UI
// -----------------------------------------------------------------------
function buildVariablesUI(fiche) {
  if (!scanVariables) return;

  scanVariables.innerHTML = "";

  const vars = fiche.variables || [];
  if (vars.length === 0) {
    scanVariables.innerHTML = "<p style='color:#999;'>Aucune variable à remplir.</p>";
    return;
  }

  vars.forEach((v) => {
    const div = document.createElement("div");
    div.style.marginBottom = "12px";

    const label = document.createElement("label");
    label.textContent = v.label || v.id;
    label.style.display = "block";
    label.style.marginBottom = "4px";
    label.style.fontWeight = "600";
    label.style.fontSize = "14px";

    const input = document.createElement("input");
    input.type = "text";
    input.value = v.value || "";
    input.dataset.varId = v.id;
    input.placeholder = v.help || "";
    input.style.width = "100%";
    input.style.padding = "10px";
    input.style.border = "2px solid #ddd";
    input.style.borderRadius = "8px";
    input.style.fontSize = "14px";

    div.appendChild(label);
    div.appendChild(input);
    scanVariables.appendChild(div);
  });
}

// -----------------------------------------------------------------------
// LECTURE VIA FICHIER - ✅ CORRECTION DU BUG
// -----------------------------------------------------------------------
if (fileInput) {
  fileInput.addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;

    console.log("📁 Lecture fichier QR...");

    try {
      // ✅ Vérification de QrScanner
      if (!window.QrScanner) {
        throw new Error("QrScanner n'est pas chargé. Actualisez la page.");
      }

      // ✅ Lecture avec gestion d'erreur détaillée
      const result = await window.QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });
      
      console.log("📄 Résultat brut QrScanner :", result);

      // ✅ Extraction du texte (gestion multi-formats)
      let text = "";
      if (typeof result === "string") {
        text = result;
      } else if (result && typeof result === "object") {
        if (typeof result.data === "string") {
          text = result.data;
        } else if (result.data && typeof result.data === "object") {
          // Cas iOS où data peut être un objet
          text = JSON.stringify(result.data);
        }
      }
      
      console.log("📄 Texte extrait du QR :", text);

      // ✅ Validation du texte
      if (!text || text.trim().length === 0) {
        throw new Error("No QR code found");
      }
      
      // ✅ Décodage de la fiche avec gestion d'erreur
      let fiche;
      try {
        fiche = decodeFiche(text);
        console.log("✅ Fiche décodée avec succès :", fiche);
      } catch (decodeError) {
        console.error("❌ Erreur decodeFiche :", decodeError);
        throw new Error("QR Code invalide ou corrompu");
      }
      
      onFicheDecoded(fiche);
      
    } catch (err) {
      console.error("❌ Erreur lecture fichier :", err);
      
      // ✅ Message d'erreur adapté
      let errorMsg = "Erreur lecture QR";
      
      if (err.message === "No QR code found") {
        errorMsg = "Aucun QR code détecté dans cette image";
      } else if (err.message && err.message !== "undefined") {
        errorMsg += " : " + err.message;
      } else {
        errorMsg = "Le QR Code n'a pas pu être décodé. Vérifiez qu'il a bien été généré par cette application.";
      }
      
      alert("❌ " + errorMsg);
    } finally {
      // Réinitialiser le champ file pour permettre de recharger le même fichier
      fileInput.value = "";
    }
  });
}

// -----------------------------------------------------------------------
// LECTURE VIA CAMÉRA
// -----------------------------------------------------------------------
if (btnStartCam && btnStopCam && videoEl) {
  
  btnStartCam.onclick = async () => {
    console.log("🎥 Démarrage caméra...");

    await cleanupScanner();

    videoContainer.style.display = "block";
    btnStartCam.disabled = true;
    btnStopCam.disabled = false;

    try {
      scanner = new window.QrScanner(
        videoEl, 
        result => {
          const text = result.data || result;
          console.log("📷 QR scanné :", text);
          
          try {
            const fiche = decodeFiche(text);
            
            cleanupScanner().then(() => {
              videoContainer.style.display = "none";
              btnStartCam.disabled = false;
              btnStopCam.disabled = true;
              onFicheDecoded(fiche);
            });
            
          } catch (e) {
            console.warn("⚠️ QR non compatible :", e.message);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true
        }
      );

      await scanner.start({ facingMode: "environment" });
      console.log("✅ Caméra démarrée");
      
    } catch (err) {
      console.error("❌ Erreur caméra :", err);
      alert("❌ Impossible d'accéder à la caméra : " + err.message);
      await cleanupScanner();
      videoContainer.style.display = "none";
      btnStartCam.disabled = false;
      btnStopCam.disabled = true;
    }
  };

  btnStopCam.onclick = async () => {
    console.log("🛑 Arrêt caméra manuel");
    await cleanupScanner();
    videoContainer.style.display = "none";
    btnStartCam.disabled = false;
    btnStopCam.disabled = true;
  };
}

// -----------------------------------------------------------------------
// COMPILER LE PROMPT FINAL
// -----------------------------------------------------------------------
const btnBuildPrompt = document.getElementById("btnBuildPrompt");
const btnCopyPrompt  = document.getElementById("btnCopy");

if (btnBuildPrompt) {
  btnBuildPrompt.onclick = () => {
    const fiche = window.currentFiche;
    if (!fiche) {
      alert("❌ Aucune fiche chargée.");
      return;
    }

    // Récupérer valeurs des variables
    const inputs = scanVariables.querySelectorAll("input[data-var-id]");
    const userValues = {};
    inputs.forEach(inp => {
      const id = inp.dataset.varId;
      userValues[id] = inp.value.trim();
    });

    // Extra
    const extra = extraInput ? extraInput.value.trim() : "";

    // Construire prompt
    const finalPrompt = buildFullPrompt(fiche, userValues, extra);

    if (promptResult) {
      promptResult.textContent = finalPrompt;
      promptResult.style.display = "block";
    }

    // Boutons IA
    buildAIButtons(fiche, finalPrompt);

    console.log("✅ Prompt compilé :", finalPrompt);
  };
}

if (btnCopyPrompt) {
  btnCopyPrompt.onclick = async () => {
    const text = promptResult ? promptResult.textContent : "";
    if (!text) {
      alert("⚠️ Aucun prompt à copier.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("✅ Prompt copié dans le presse-papiers !");
    } catch (err) {
      console.error("❌ Erreur copie :", err);
      alert("❌ Impossible de copier le prompt.");
    }
  };
}

// -----------------------------------------------------------------------
// BOUTONS D'ENVOI VERS LES IA
// -----------------------------------------------------------------------
function buildAIButtons(fiche, prompt) {
  if (!aiButtons) return;
  
  aiButtons.innerHTML = "";
  aiButtons.style.display = "flex";
  
  if (!prompt.trim()) return;

  const levels = fiche.ai || {
    chatgpt: 3,
    perplexity: 3,
    mistral: 3,
  };

  const styleForLevel = (lvl) => {
    switch (Number(lvl)) {
      case 3: return "background:#1dbf65;color:white;";
      case 2: return "background:#ff9f1c;color:white;";
      default: return "background:#cccccc;color:#777;";
    }
  };

  const mkBtn = (label, lvl, baseUrl) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style = styleForLevel(lvl)
      + "padding:10px 16px;margin-right:10px;border:none;border-radius:10px;font-weight:600;cursor:pointer;";

    if (Number(lvl) === 1) {
      btn.disabled = true;
      btn.style.cursor = "not-allowed";
      btn.title = "Non recommandée pour cette fiche";
    } else {
      btn.onclick = () => {
        const encoded = encodeURIComponent(prompt);
        window.open(baseUrl + encoded, "_blank");
      };
    }

    aiButtons.appendChild(btn);
  };

  mkBtn("ChatGPT",   levels.chatgpt,   "https://chat.openai.com/?q=");
  mkBtn("Perplexity",levels.perplexity,"https://www.perplexity.ai/search?q=");
  mkBtn("Mistral",   levels.mistral,   "https://chat.mistral.ai/chat?q=");
}

// -----------------------------------------------------------------------
// BOUTON RESET
// -----------------------------------------------------------------------
if (btnResetScan) {
  btnResetScan.onclick = () => {
    if (!confirm("🔄 Réinitialiser et scanner une nouvelle fiche ?")) {
      return;
    }

    // Nettoyage
    currentFiche = null;
    window.currentFiche = null;

    // Masquer sections
    if (sectionMeta) sectionMeta.style.display = "none";
    if (sectionVars) sectionVars.style.display = "none";
    if (sectionExtra) sectionExtra.style.display = "none";
    if (sectionPrompt) sectionPrompt.style.display = "none";

    // Vider champs
    if (metaHeader) metaHeader.innerHTML = "";
    if (scanVariables) scanVariables.innerHTML = "";
    if (extraInput) extraInput.value = "";
    if (promptResult) {
      promptResult.textContent = "";
      promptResult.style.display = "none";
    }
    if (aiButtons) {
      aiButtons.innerHTML = "";
      aiButtons.style.display = "none";
    }

    // Masquer bouton reset
    btnResetScan.style.display = "none";

    // Cleanup scanner si actif
    cleanupScanner().then(() => {
      if (videoContainer) videoContainer.style.display = "none";
      if (btnStartCam) btnStartCam.disabled = false;
      if (btnStopCam) btnStopCam.disabled = true;
    });

    console.log("🔄 Interface réinitialisée");
  };
}

// -----------------------------------------------------------------------
// CHARGEMENT AUTOMATIQUE DEPUIS URL
// -----------------------------------------------------------------------
window.addEventListener("beforeunload", () => {
  cleanupScanner();
});

// Chargement auto si fiche en paramètre URL
window.addEventListener('DOMContentLoaded', () => {
  if (window.autoLoadFiche) {
    console.log("🔗 Chargement automatique de la fiche depuis URL");
    onFicheDecoded(window.autoLoadFiche);
    delete window.autoLoadFiche;
  }
});
