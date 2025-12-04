// ======================================================
// jsonSchema.js — Compactage JSON complet et cohérent
// ======================================================

// Table de compactage
const MAP = {
  // META
  meta: "m",
  categorie: "c",
  titre: "T",
  objectif: "o",
  concepteur: "C",
  date: "d",

  // PROMPT
  prompt: "p",
  base: "b",
  variables: "V",

  // VARIABLES
  id: "i",
  label: "l",
  type: "t",
  required: "r",
  options: "O",

  // AI confidence levels
  ai: "A",

  // Versionning optional
  version: "v"
};

// Table inverse
const REVERSE = Object.fromEntries(
  Object.entries(MAP).map(([k, v]) => [v, k])
);

// ------------------------------------------------------
// Compactage récursif
// ------------------------------------------------------
export function toCompact(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCompact);
  }

  if (obj && typeof obj === "object") {
    const result = {};
    for (const key in obj) {
      const compactKey = MAP[key] || key;  // compatibilité ascendante
      result[compactKey] = toCompact(obj[key]);
    }
    return result;
  }

  return obj;
}

// ------------------------------------------------------
// Décompactage récursif
// ------------------------------------------------------
export function fromCompact(obj) {
  if (Array.isArray(obj)) {
    return obj.map(fromCompact);
  }

  if (obj && typeof obj === "object") {
    const result = {};
    for (const key in obj) {
      const fullKey = REVERSE[key] || key; // compatibilité anciens QR
      result[fullKey] = fromCompact(obj[key]);
    }
    return result;
  }

  return obj;
}

// ------------------------------------------------------
// Validation minimale (extensible)
// ------------------------------------------------------
export function validateFiche(fiche) {
  if (!fiche.meta) throw new Error("Meta manquant");
  if (!fiche.prompt) throw new Error("Prompt manquant");
  if (!fiche.prompt.variables) throw new Error("Variables manquantes");
  return true;
}
