// ======================================================
// urlEncoder.js — Encodage fiche vers URL cliquable
// ======================================================

import { encodeFiche } from "./compression.js";

/**
 * Génère une URL cliquable pour ouvrir directement une fiche
 * @param {Object} fiche - La fiche à encoder
 * @param {string} baseUrl - URL de base de l'application
 * @returns {string} URL complète avec paramètres
 */
export function generateFicheUrl(fiche, baseUrl = null) {
  // ✅ CORRECTION : Construction correcte de l'URL de base
  if (!baseUrl) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // Supprimer le nom du fichier pour garder seulement le dossier
    const directory = pathname.substring(0, pathname.lastIndexOf('/'));
    
    baseUrl = origin + directory;
  }
  
  console.log("🌐 URL de base détectée :", baseUrl);
  
  // Encoder la fiche
  const encoded = encodeFiche(fiche);
  
  // Encoder en Base64 URL-safe (remplacement des caractères problématiques)
  const urlSafeData = encoded.wrapperString
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // Construire l'URL
  const url = `${baseUrl}/scan.html?fiche=${encodeURIComponent(urlSafeData)}`;
  
  console.log("🔗 URL générée :", url);
  console.log("📏 Longueur URL :", url.length);
  
  // Avertissement si URL trop longue
  if (url.length > 2000) {
    console.warn("⚠️ URL très longue (" + url.length + " caractères), peut poser problème dans certains navigateurs");
  }
  
  return url;
}

/**
 * Génère un lien court (optionnel - nécessite service externe)
 * Pour l'instant, retourne l'URL complète
 */
export async function generateShortUrl(ficheUrl) {
  // À implémenter avec un service comme bit.ly, tinyurl, etc.
  // Exemple d'implémentation future :
  /*
  try {
    const response = await fetch('https://api.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ long_url: ficheUrl })
    });
    const data = await response.json();
    return data.link;
  } catch (e) {
    console.error("Erreur raccourcissement URL :", e);
    return ficheUrl;
  }
  */
  
  return ficheUrl;
}
