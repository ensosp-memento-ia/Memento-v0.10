// ========================================================================
// uiScan.js — Lecture + exploitation de fiche IA RCH
// VERSION FINALE : affichage métadonnées condensé
// ========================================================================

import { decodeFiche } from "../core/compression.js";

// ---------- Sections ----------
const sectionScan   = document.getElementById("sectionScan");
const sectionMeta   = document.getElementById("sectionMeta");
const sectionVars   = document.getElementById("sectionVars");
const sectionExtra  = document.getElementById("sectionExtra");
const sectionPrompt = document.getElementById("sectionPrompt");

// ---------- Éléments principaux ----------
const metaHeader    = document.getElementById("metaHeader");
const scanVariables = document.getElementById("scanVariables");
const extraInput    = document.getElementById("extra_input");
const promptResult  = document.getElementById("promptResult");
const aiButtons     = document.getElementById("aiButtons");

// Caméra / fichier
const btnStartCam   = document.getElementById("btnStartCam");
const btnStopCam    = document.getElementById("btnStopCam");
const videoContainer= document.getElementById("videoContainer");
const videoEl       = document.getElementById("qrVideo");
const fileInput     = document.getElementById("qrFileInput");

// Stockage de la fiche courante + scanner
window.currentFiche = null;
let scanner = null;

// Bouton reset
const btnResetScan = document.getElementById("btnResetScan");

// ------------------------------------------------------------------------
// ✅ CHARGEMENT AUTOMATIQUE si fiche dans URL
// ------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log("📱 Page scan.html chargée");
  
  // Attendre que window.autoLoadFiche soit défini (si présent)
  setTimeout(() => {
    if (window.autoLoadFiche) {
      console.log("🔗 Chargement automatique de la fiche depuis URL");
      try {
        onFicheDecoded(window.autoLoadFiche);
      } catch (e) {
        console.error("❌ Erreur chargement auto fiche :", e);
        alert("⚠️ Erreur lors du chargement automatique de la fiche.");
      }
    }
  }, 500);
});

// ------------------------------------------------------------------------
// Cleanup systématique du scanner
// ------------------------------------------------------------------------
async function cleanupScanner() {
  if (!scanner) return;

  console.log("🧹 Nettoyage scanner...");
  
  try {
    await scanner.stop();
  } catch (e) {
    console.warn("⚠️ Erreur arrêt scanner :", e);
  }

  try {
    scanner.destroy();
  } catch (e) {
    console.warn("⚠️ Erreur destruction scanner :", e);
  } finally {
    scanner = null;
  }
}

// ------------------------------------------------------------------------
// Réinitialisation complète
// ------------------------------------------------------------------------
function resetScanPage() {
  console.log("🔄 Réinitialisation de la page scan");

  cleanupScanner();
  window.currentFiche = null;

  if (sectionScan) sectionScan.style.display = "block";
  if (sectionMeta) sectionMeta.style.display = "none";
  if (sectionVars) sectionVars.style.display = "none";
  if (sectionExtra) sectionExtra.style.display = "none";
  if (sectionPrompt) sectionPrompt.style.display = "none";

  if (metaHeader) metaHeader.innerHTML = "";
  if (scanVariables) scanVariables.innerHTML = "";
  if (extraInput) extraInput.value = "";
  if (promptResult) promptResult.textContent = "";
  if (aiButtons) aiButtons.innerHTML = "";

  if (fileInput) fileInput.value = "";

  if (btnResetScan) btnResetScan.style.display = "none";

  if (btnStartCam) btnStartCam.disabled = false;
  if (btnStopCam) btnStopCam.disabled = true;
  if (videoContainer) videoContainer.style.display = "none";

  console.log("✅ Page réinitialisée");
}

// ------------------------------------------------------------------------
// Bouton Reset
// ------------------------------------------------------------------------
if (btnResetScan) {
  btnResetScan.addEventListener("click", () => {
    const confirm = window.confirm("⚠️ Voulez-vous vraiment scanner une nouvelle fiche ?\n\nLes données actuelles seront perdues.");
    if (confirm) {
      resetScanPage();
    }
  });
}

// ------------------------------------------------------------------------
// Quand une fiche est décodée (depuis fichier ou caméra)
// ✅ AFFICHAGE CONDENSÉ DES MÉTADONNÉES
// ------------------------------------------------------------------------
function onFicheDecoded(fiche) {
  console.log("✅ Fiche décodée :", fiche);

  window.currentFiche = fiche;

  // 1) Masquer la zone scan, afficher les autres
  if (sectionScan)   sectionScan.style.display   = "none";
  if (sectionMeta)   sectionMeta.style.display   = "block";
  if (sectionVars)   sectionVars.style.display   = "block";
  if (sectionExtra)  sectionExtra.style.display  = "block";
  if (sectionPrompt) sectionPrompt.style.display = "block";

  // Afficher le bouton reset
  if (btnResetScan) btnResetScan.style.display = "block";

  // 2) ✅ AFFICHAGE CONDENSÉ : Catégorie + Titre sur même ligne
  if (metaHeader) {
    metaHeader.style.display = "block";
    metaHeader.innerHTML = `
      <div style="margin-bottom:10px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
        <span style="font-weight:700;color:#001F8F;font-size:16px;">
          ${fiche.meta?.categorie || "Catégorie non renseignée"}
        </span>
        <span style="font-size:18px;font-weight:600;color:#001F8F;">
          ${fiche.meta?.titre || "Titre inconnu"}
        </span>
      </div>
      <div style="font-style:italic;color:#555;font-size:14px;margin-bottom:8px;line-height:1.4;">
        <span style="font-weight:600;">Objectif :</span> ${fiche.meta?.objectif || "-"}
      </div>
      <div style="font-size:13px;color:#666;line-height:1.6;">
        ${fiche.meta?.concepteur || "Concepteur non renseigné"} • 
        Version ${fiche.meta?.version || "1.0"} • 
        ${fiche.meta?.date || "Date non renseignée"}
      </div>
    `;
  }

  // 3) Générer les champs de variables
  if (scanVariables) {
    scanVariables.innerHTML = "";
    
    (fiche.prompt?.variables || []).forEach(v => {
      const block = document.createElement("div");
      block.className = "var-field";

      const lab = document.createElement("label");
      lab.textContent = v.label || v.id;
      
      if (v.required) {
        const req = document.createElement("span");
        req.textContent = " *";
        req.style.color = "#ff4d4d";
        lab.appendChild(req);
      }
      
      block.appendChild(lab);

      let field;

      if (v.type === "text") {
        field = document.createElement("input");
        field.type = "text";
        if (v.required) field.required = true;
      } 
      else if (v.type === "number") {
        field = document.createElement("input");
        field.type = "number";
        if (v.required) field.required = true;
      } 
      else if (v.type === "choice") {
        field = document.createElement("select");
        if (v.required) field.required = true;
        
        if (!v.required) {
          const emptyOpt = document.createElement("option");
          emptyOpt.value = "";
          emptyOpt.textContent = "-- Sélectionner --";
          field.appendChild(emptyOpt);
        }

        (v.options || []).forEach(opt => {
          const o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          field.appendChild(o);
        });
      } 
      else if (v.type === "geoloc") {
        field = document.createElement("div");
        field.innerHTML = `
          <button class="btn-reset" id="${v.id}_gps" type="button">📍 Acquérir position</button>
          <input id="${v.id}_lat" placeholder="Latitude" type="number" step="0.000001" ${v.required ? 'required' : ''}>
          <input id="${v.id}_lon" placeholder="Longitude" type="number" step="0.000001" ${v.required ? 'required' : ''}>
        `;
        
        setTimeout(() => {
          const btn = document.getElementById(`${v.id}_gps`);
          if (!btn) return;
          
          btn.onclick = () => {
            btn.disabled = true;
            btn.textContent = "⏳ Localisation...";
            
            navigator.geolocation.getCurrentPosition(
              pos => {
                const lat = document.getElementById(`${v.id}_lat`);
                const lon = document.getElementById(`${v.id}_lon`);
                if (lat) lat.value = pos.coords.latitude.toFixed(6);
                if (lon) lon.value = pos.coords.longitude.toFixed(6);
                btn.disabled = false;
                btn.textContent = "✅ Position acquise";
                setTimeout(() => { btn.textContent = "📍 Acquérir position"; }, 2000);
              },
              err => {
                console.error("❌ Erreur GPS :", err);
                btn.disabled = false;
                btn.textContent = "❌ Erreur GPS";
                alert("Erreur de géolocalisation : " + err.message);
                setTimeout(() => { btn.textContent = "📍 Acquérir position"; }, 2000);
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          };
        }, 0);
      } 
      else {
        field = document.createElement("input");
        field.type = "text";
      }

      field.dataset.id = v.id;
      block.appendChild(field);
      scanVariables.appendChild(block);
    });
  }

  if (promptResult) promptResult.textContent = "";
  if (aiButtons) aiButtons.innerHTML = "";
}

// ------------------------------------------------------------------------
// Lecture via FICHIER - Gestion erreur améliorée
// ------------------------------------------------------------------------
if (fileInput) {
  fileInput.addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;

    console.log("📁 Lecture fichier QR...");

    try {
      // ✅ Lecture avec gestion d'erreur détaillée
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
      
      console.log("📄 Texte brut QR :", text);

      if (!text || text.length === 0) {
        throw new Error("QR Code vide ou illisible.");
      }
      
      // Décodage de la fiche
      const fiche = decodeFiche(text);
      console.log("✅ Fiche décodée :", fiche);
      
      onFicheDecoded(fiche);
      
    } catch (err) {
      console.error("❌ Erreur lecture fichier :", err);
      
      // ✅ Message d'erreur plus explicite
      let errorMsg = "Erreur lecture QR";
      
      if (err.message && err.message !== "undefined") {
        errorMsg += " : " + err.message;
      } else if (err.toString && err.toString() !== "[object Object]") {
        errorMsg += " : " + err.toString();
      } else {
        errorMsg += " : Le QR Code n'a pas pu être décodé. Vérifiez qu'il a bien été généré par cette application.";
      }
      
      alert("❌ " + errorMsg);
    }
  });
}

// ------------------------------------------------------------------------
// Lecture via CAMÉRA
// ------------------------------------------------------------------------
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

// ------------------------------------------------------------------------
// Compiler le PROMPT final
// ------------------------------------------------------------------------
const btnBuildPrompt = document.getElementById("btnBuildPrompt");
const btnCopyPrompt  = document.getElementById("btnCopy");

if (btnBuildPrompt) {
  btnBuildPrompt.onclick = () => {
    const fiche = window.currentFiche;
    if (!fiche) {
      alert("❌ Aucune fiche chargée.");
      return;
    }

    let missingFields = [];
    (fiche.prompt?.variables || []).forEach(v => {
      if (!v.required) return;
      
      if (v.type === "geoloc") {
        const lat = document.getElementById(`${v.id}_lat`);
        const lon = document.getElementById(`${v.id}_lon`);
        if (!lat?.value || !lon?.value) {
          missingFields.push(v.label || v.id);
        }
      } else {
        const el = document.querySelector(`[data-id="${v.id}"]`);
        if (!el?.value) {
          missingFields.push(v.label || v.id);
        }
      }
    });

    if (missingFields.length > 0) {
      alert("⚠️ Champs requis manquants :\n- " + missingFields.join("\n- "));
      return;
    }

    let prompt = fiche.prompt?.base || "";

    (fiche.prompt?.variables || []).forEach(v => {
      let replacement = "";

      if (v.type === "geoloc") {
        const lat = document.getElementById(`${v.id}_lat`)?.value || "";
        const lon = document.getElementById(`${v.id}_lon`)?.value || "";
        replacement = `${lat},${lon}`;
      } else {
        const el = document.querySelector(`[data-id="${v.id}"]`);
        replacement = el?.value || "";
      }

      prompt = prompt.replaceAll(`{{${v.id}}}`, replacement);
    });

    const extra = extraInput?.value.trim() || "";
    if (extra) {
      prompt += `\n\nInformations complémentaires :\n${extra}`;
    }

    if (promptResult) promptResult.textContent = prompt;
    buildAIButtons(fiche, prompt);
  };
}

if (btnCopyPrompt) {
  btnCopyPrompt.onclick = async () => {
    const txt = promptResult?.textContent.trim();
    if (!txt) {
      alert("⚠️ Aucun prompt à copier");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(txt);
      alert("✅ Prompt copié dans le presse-papiers.");
    } catch (err) {
      console.error("❌ Erreur copie :", err);
      alert("❌ Impossible de copier le prompt.");
    }
  };
}

// ------------------------------------------------------------------------
// Boutons d'envoi vers les IA
// ------------------------------------------------------------------------
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

window.addEventListener("beforeunload", () => {
  cleanupScanner();
});
