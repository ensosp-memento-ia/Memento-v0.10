// ===============================================================
// uiVariables.js – Gestion UI des variables pour CREATE MODE
// Version optimisée mobile : champs côte à côte
// ===============================================================

let varCount = 0;
const MAX_VARS = 10;

export function initVariablesUI() {
  const btnAdd = document.getElementById("btnAddVariable");
  if (btnAdd) {
    btnAdd.addEventListener("click", addVariableUI);
  }
  
  const container = document.getElementById("variablesContainer");
  if (container) {
    container.innerHTML = "";
  }
  
  varCount = 0;
  addVariableUI(); // ajoute une variable vide par défaut
}

export function addVariableUI() {
  if (varCount >= MAX_VARS) return alert("Maximum 10 variables.");

  varCount++;

  const container = document.getElementById("variablesContainer");

  const div = document.createElement("div");
  div.className = "variableBlock";
  div.dataset.index = varCount;

  div.innerHTML = `
    <input class="input" placeholder="Label (ex : Code ONU)" id="var_label_${varCount}">
    <input class="input" placeholder="Identifiant (ex : code_onu)" id="var_id_${varCount}">

    <!-- ✅ Ligne : Checkbox + Select côte à côte -->
    <div class="var-row">
      <label class="checkbox" style="display:flex;align-items:center;gap:6px;margin:0;">
        <input type="checkbox" id="var_req_${varCount}" style="width:auto;margin:0;">
        <span>Obligatoire</span>
      </label>

      <select class="input varTypeSelect" id="var_type_${varCount}" style="margin:0;">
        <option value="text">📝 Texte</option>
        <option value="number">🔢 Nombre</option>
        <option value="choice">☑️ Choix</option>
        <option value="geoloc">📍 GPS</option>
      </select>
    </div>

    <div id="var_choice_options_${varCount}" class="choiceOptions hidden">
      <input class="input" placeholder="Choix séparés par ;" id="var_opts_${varCount}">
      <p class="helper-small">Exemple : rouge ; vert ; bleu</p>
    </div>

    <button class="remove-var" data-del="${varCount}">🗑️ Supprimer cette variable</button>
  `;

  // Suppression du bloc
  const delBtn = div.querySelector(".remove-var");
  if (delBtn) {
    delBtn.addEventListener("click", () => {
      div.remove();
      varCount--;
    });
  }

  // Détection du type pour afficher les options
  const typeSelect = div.querySelector(".varTypeSelect");
  if (typeSelect) {
    typeSelect.addEventListener("change", () => {
      const optBox = document.getElementById(`var_choice_options_${varCount}`);
      if (typeSelect.value === "choice") {
        optBox.classList.remove("hidden");
      } else {
        optBox.classList.add("hidden");
      }
    });
  }

  container.appendChild(div);
}


// ===============================================================
// EXTRACTION DU JSON FINAL
// ===============================================================
export function getVariablesFromUI() {
  const blocks = [...document.querySelectorAll(".variableBlock")];
  const vars = [];

  const ids = new Set();

  for (const b of blocks) {
    const idx = b.dataset.index;

    const label = document.getElementById(`var_label_${idx}`)?.value.trim() || "";
    const id = document.getElementById(`var_id_${idx}`)?.value.trim() || "";
    const type = document.getElementById(`var_type_${idx}`)?.value || "text";
    const req = document.getElementById(`var_req_${idx}`)?.checked || false;

    if (!label || !id) continue;

    if (ids.has(id)) {
      throw new Error(`Identifiant '${id}' dupliqué.`);
    }
    ids.add(id);

    let entry = { id, label, type, required: req };

    // Gestion du type CHOICE
    if (type === "choice") {
      const raw = document.getElementById(`var_opts_${idx}`)?.value.trim() || "";
      const opts = raw.split(";").map(s => s.trim()).filter(s => s.length > 0);

      if (opts.length < 2) {
        throw new Error(`La variable '${label}' doit avoir au moins deux choix.`);
      }

      entry.options = opts;
    }

    vars.push(entry);
  }

  return vars;
}
