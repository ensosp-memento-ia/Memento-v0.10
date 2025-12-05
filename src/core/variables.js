// ======================================================================
// variables.js — UI dynamique pour la LECTURE d'une fiche
// Version corrigée : validation géolocalisation + meilleure gestion erreurs
// ======================================================================

// Détection automatique : on est dans scan.html ?
const isScanMode = window.location.pathname.includes("scan.html");

// =================================================================
// Validation des coordonnées GPS
// =================================================================
function isValidLatitude(lat) {
  const num = parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

function isValidLongitude(lon) {
  const num = parseFloat(lon);
  return !isNaN(num) && num >= -180 && num <= 180;
}

// =================================================================
// Construire l'UI dynamique des variables
// =================================================================
export function buildVariablesUI(container, fiche) {
  if (!container) {
    console.error("❌ Container variables introuvable");
    return;
  }

  container.innerHTML = "";

  if (!fiche.prompt || !Array.isArray(fiche.prompt.variables)) {
    console.error("❌ Aucune variable trouvée dans la fiche");
    return;
  }

  fiche.prompt.variables.forEach(v => {

    const wrapper = document.createElement("div");
    wrapper.className = "var-field";

    // Label
    const label = document.createElement("label");
    label.textContent = v.label || v.id;
    label.htmlFor = v.id;
    
    // Indicateur obligatoire
    if (v.required) {
      const req = document.createElement("span");
      req.textContent = " *";
      req.style.color = "#ff4d4d";
      label.appendChild(req);
    }
    
    wrapper.appendChild(label);

    let inputEl = null;

    // --------------------------
    // TYPE : TEXT
    // --------------------------
    if (v.type === "text") {
      inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.placeholder = v.placeholder || "";
      if (v.required) inputEl.required = true;
    }

    // --------------------------
    // TYPE : NUMBER
    // --------------------------
    else if (v.type === "number") {
      inputEl = document.createElement("input");
      inputEl.type = "number";
      inputEl.placeholder = v.placeholder || "";
      if (v.required) inputEl.required = true;
    }

    // --------------------------
    // TYPE : SELECT (choice)
    // --------------------------
    else if (v.type === "choice") {
      inputEl = document.createElement("select");
      if (v.required) inputEl.required = true;
      
      // Option vide si non requis
      if (!v.required) {
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "-- Sélectionner --";
        inputEl.appendChild(emptyOpt);
      }

      (v.options || []).forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        inputEl.appendChild(o);
      });
    }

    // --------------------------
    // TYPE : GEOLOC 
    // -> Affiché UNIQUEMENT dans scan.html
    // --------------------------
    else if (v.type === "geoloc") {

      inputEl = document.createElement("div");
      inputEl.className = "geoloc-container";

      if (isScanMode) {
        const btn = document.createElement("button");
        btn.textContent = "📍 Acquérir position GPS";
        btn.type = "button";
        btn.className = "btn-add-var";
        btn.style.marginBottom = "10px";

        const lat = document.createElement("input");
        lat.placeholder = "Latitude (ex: 48.8566)";
        lat.dataset.id = v.id + "_lat";
        lat.className = "geo-input";
        lat.type = "number";
        lat.step = "0.000001";
        if (v.required) lat.required = true;

        const lon = document.createElement("input");
        lon.placeholder = "Longitude (ex: 2.3522)";
        lon.dataset.id = v.id + "_lon";
        lon.className = "geo-input";
        lon.type = "number";
        lon.step = "0.000001";
        if (v.required) lon.required = true;

        // ✅ CORRECTION : Validation + gestion erreurs GPS
        btn.onclick = () => {
          btn.disabled = true;
          btn.textContent = "⏳ Localisation...";

          navigator.geolocation.getCurrentPosition(
            pos => {
              lat.value = pos.coords.latitude.toFixed(6);
              lon.value = pos.coords.longitude.toFixed(6);
              btn.disabled = false;
              btn.textContent = "✅ Position acquise";
              
              setTimeout(() => {
                btn.textContent = "📍 Acquérir position GPS";
              }, 2000);

              console.log("📍 GPS acquis :", lat.value, lon.value);
            },
            err => {
              console.error("❌ Erreur GPS :", err);
              btn.disabled = false;
              btn.textContent = "❌ Erreur GPS";
              
              let errorMsg = "Erreur de géolocalisation : ";
              switch(err.code) {
                case err.PERMISSION_DENIED:
                  errorMsg += "Permission refusée. Autorisez la géolocalisation dans les paramètres.";
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMsg += "Position indisponible.";
                  break;
                case err.TIMEOUT:
                  errorMsg += "Timeout dépassé.";
                  break;
                default:
                  errorMsg += err.message;
              }
              
              alert(errorMsg);
              
              setTimeout(() => {
                btn.textContent = "📍 Acquérir position GPS";
              }, 2000);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        };

        inputEl.appendChild(btn);
        inputEl.appendChild(lat);
        inputEl.appendChild(lon);
      } 
      else {
        // Mode création => info uniquement
        const info = document.createElement("div");
        info.className = "helper";
        info.style.fontStyle = "italic";
        info.style.color = "#666";
        info.textContent = "ℹ️ (Géolocalisation — champs générés automatiquement lors du scan)";
        inputEl.appendChild(info);
      }
    }

    // --------------------------
    // ATTRIBUT COMMUN
    // --------------------------
    if (inputEl && inputEl.dataset) {
      inputEl.dataset.id = v.id;
    }

    wrapper.appendChild(inputEl);
    container.appendChild(wrapper);
  });

  console.log(`✅ ${fiche.prompt.variables.length} variables affichées`);
}


// =================================================================
// Récupérer toutes les valeurs du formulaire (scan mode only)
// =================================================================
export function getValues(fiche) {
  const vals = {};

  if (!fiche.prompt || !Array.isArray(fiche.prompt.variables)) {
    console.error("❌ Aucune variable dans la fiche");
    return vals;
  }

  fiche.prompt.variables.forEach(v => {

    if (v.type === "geoloc") {
      // GPS => latitude + longitude
      const lat = document.querySelector(`[data-id="${v.id}_lat"]`);
      const lon = document.querySelector(`[data-id="${v.id}_lon"]`);

      // ✅ CORRECTION : Validation des coordonnées
      if (lat && lon) {
        const latVal = lat.value.trim();
        const lonVal = lon.value.trim();

        if (latVal && lonVal) {
          if (isValidLatitude(latVal) && isValidLongitude(lonVal)) {
            vals[v.id] = `${latVal},${lonVal}`;
            console.log(`✅ GPS valide : ${v.id} = ${vals[v.id]}`);
          } else {
            console.error(`❌ Coordonnées GPS invalides pour ${v.id}`);
            vals[v.id] = "";
          }
        } else {
          vals[v.id] = "";
        }
      } else {
        vals[v.id] = "";
      }

      return;
    }

    // Variables simples
    const el = document.querySelector(`[data-id="${v.id}"]`);
    
    if (el) {
      vals[v.id] = el.value.trim();
      
      // Validation champs requis
      if (v.required && !vals[v.id]) {
        console.warn(`⚠️ Champ requis vide : ${v.label || v.id}`);
      }
    } else {
      console.warn(`⚠️ Champ introuvable : ${v.id}`);
      vals[v.id] = "";
    }
  });

  return vals;
}


// =================================================================
// Générer le prompt final
// =================================================================
export function generatePrompt(fiche, vals) {
  if (!fiche.prompt || !fiche.prompt.base) {
    throw new Error("❌ Prompt de base manquant dans la fiche");
  }

  let prompt = fiche.prompt.base;

  // Remplacement des variables
  Object.keys(vals).forEach(k => {
    const value = vals[k] || "";
    prompt = prompt.replaceAll(`{{${k}}}`, value);
  });

  // Vérification des variables non remplacées
  const unreplaced = prompt.match(/\{\{[^}]+\}\}/g);
  if (unreplaced) {
    console.warn("⚠️ Variables non remplacées :", unreplaced);
  }

  return prompt;
}
