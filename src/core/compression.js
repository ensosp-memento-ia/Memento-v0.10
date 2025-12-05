// ======================================================
// compression.js — Version optimisée pako + Base64
// Version corrigée : validation préventive + meilleure gestion erreurs
// ======================================================

import { toCompact, fromCompact } from "./jsonSchema.js";

const WRAPPER_VERSION = "p1";
const MAX_JSON_CHARS = 5000;
const WARN_JSON_CHARS = 3500; // Seuil d'alerte

// ------------------------------------------------------
// Helpers Base64 <-> Uint8Array (optimisés)
// ------------------------------------------------------
function uint8ToBase64(u8) {
  // Encode en blocs pour éviter les stack overflow
  let binary = "";
  const CHUNK = 0x8000;

  for (let i = 0; i < u8.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      u8.subarray(i, i + CHUNK)
    );
  }
  return btoa(binary);
}

function base64ToUint8(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const out = new Uint8Array(len);

  for (let i = 0; i < len; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// ------------------------------------------------------
// Validation AVANT compression
// ------------------------------------------------------
function validateFicheBeforeCompression(fiche) {
  // Vérification structure minimale
  if (!fiche.meta) {
    throw new Error("Métadonnées manquantes (meta)");
  }
  if (!fiche.prompt || !fiche.prompt.base) {
    throw new Error("Prompt de base manquant (prompt.base)");
  }
  if (!Array.isArray(fiche.prompt.variables)) {
    throw new Error("Variables manquantes ou invalides (prompt.variables)");
  }

  // Estimation de la taille JSON AVANT compactage
  const rawJSON = JSON.stringify(fiche);
  if (rawJSON.length > MAX_JSON_CHARS) {
    throw new Error(
      `Fiche trop volumineuse : ${rawJSON.length} caractères (max ${MAX_JSON_CHARS}). ` +
      `Réduisez le prompt ou le nombre de variables.`
    );
  }

  return true;
}

// ------------------------------------------------------
// Encodage Fiche → Wrapper compressé
// ------------------------------------------------------
export function encodeFiche(fiche) {
  if (!window.pako) {
    throw new Error("❌ Librairie pako non chargée. Vérifiez le <script> dans le HTML.");
  }

  // ✅ CORRECTION : validation AVANT compression
  try {
    validateFicheBeforeCompression(fiche);
  } catch (e) {
    console.error("❌ Validation échouée :", e);
    throw e;
  }

  // 1) JSON compact (structure minimale)
  const jsonString = JSON.stringify(toCompact(fiche));
  console.log("📏 Taille JSON compacté :", jsonString.length, "caractères");

  if (jsonString.length > WARN_JSON_CHARS) {
    console.warn(
      `⚠️ JSON volumineux (${jsonString.length} caractères). ` +
      `Le QR Code sera dense et difficile à scanner.`
    );
  }

  // 2) UTF-8 + Compression + Base64
  let utf8, compressed, b64;

  try {
    utf8 = new TextEncoder().encode(jsonString);
    compressed = window.pako.deflate(utf8, { level: 9 }); // meilleure compression
    b64 = uint8ToBase64(compressed);
  } catch (e) {
    console.error("❌ Erreur compression pako :", e);
    throw new Error("Erreur lors de la compression : " + e.message);
  }

  const wrapper = { z: WRAPPER_VERSION, d: b64 };

  return {
    wrapper,
    wrapperString: JSON.stringify(wrapper),
    stats: {
      jsonLength: jsonString.length,
      deflated: compressed.length,
      base64: b64.length,
      wrapperTotal: JSON.stringify(wrapper).length
    }
  };
}

// ------------------------------------------------------
// Normalisation du wrapper (sécurisé + simplifié)
// ------------------------------------------------------
function normaliseWrapper(raw) {
  if (!raw) {
    throw new Error("❌ QR Code vide ou illisible");
  }

  // Cas : déjà un objet
  if (typeof raw === "object") {
    if (!raw.d) {
      console.error("Wrapper reçu :", raw);
      throw new Error("Wrapper JSON invalide : champ 'd' manquant");
    }
    return raw;
  }

  // Cas : string
  if (typeof raw !== "string") {
    throw new Error("QR Code non reconnu (type invalide)");
  }

  const trimmed = raw.trim();

  // On tente JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.d) return parsed;
  } catch (e) {
    console.warn("⚠️ Pas un JSON valide, tentative format legacy...");
  }

  // Cas legacy : le QR contient directement la base64
  return { z: "legacy", d: trimmed };
}

// ------------------------------------------------------
// Décodage Wrapper → fiche JSON reconstruite
// ------------------------------------------------------
export function decodeFiche(raw) {
  console.log("[DECODE] Entrée brute :", typeof raw, raw);

  if (!window.pako) {
    throw new Error("❌ Librairie pako non chargée");
  }

  let wrapper;
  try {
    wrapper = normaliseWrapper(raw);
    console.log("[DECODE] Wrapper normalisé :", wrapper);
  } catch (e) {
    console.error("❌ Erreur normalisation wrapper :", e);
    throw new Error("QR Code illisible : " + e.message);
  }

  let compressed;
  try {
    compressed = base64ToUint8(wrapper.d);
    console.log("[DECODE] Données décompressées (length) :", compressed.length);
  } catch (e) {
    console.error("❌ Erreur décodage Base64 :", e);
    throw new Error("QR Code corrompu (Base64 invalide)");
  }

  let inflated;
  try {
    inflated = window.pako.inflate(compressed);
    console.log("[DECODE] Données inflatées (length) :", inflated.length);
  } catch (e) {
    console.error("❌ Erreur DEFLATE :", e);
    throw new Error("QR Code corrompu (décompression échouée). Le QR a peut-être été généré avec une version différente.");
  }

  let obj;
  try {
    const jsonString = new TextDecoder().decode(inflated);
    console.log("[DECODE] JSON string :", jsonString.substring(0, 100) + "...");
    obj = JSON.parse(jsonString);
  } catch (e) {
    console.error("❌ Erreur parsing JSON décompressé :", e);
    throw new Error("QR Code invalide (JSON corrompu)");
  }

  // Reconstruction de la fiche complète
  try {
    const fiche = fromCompact(obj);
    console.log("[DECODE] Fiche reconstruite :", fiche);
    return fiche;
  } catch (e) {
    console.error("❌ Erreur reconstruction fiche :", e);
    throw new Error("Structure de fiche invalide : " + e.message);
  }
}
