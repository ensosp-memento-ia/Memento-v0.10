// ======================================================================
// uiMeta.js — Gestion des métadonnées de la fiche IA
// Version corrigée : ajout du champ version
// ======================================================================

export function getMetaFromUI() {
    const categorie = document.getElementById("meta_categorie")?.value.trim() || "";
    const titre = document.getElementById("meta_titre")?.value.trim() || "";
    const objectif = document.getElementById("meta_objectif")?.value.trim() || "";
    const concepteur = document.getElementById("meta_concepteur")?.value.trim() || "";
    const version = document.getElementById("meta_version")?.value.trim() || "1.0";
    const date = document.getElementById("meta_date")?.value.trim() || "";

    // Validations
    if (!categorie) throw new Error("La catégorie est obligatoire.");
    if (!titre) throw new Error("Le titre est obligatoire.");
    if (!objectif) throw new Error("L'objectif est obligatoire.");
    if (!date) throw new Error("La date est obligatoire.");

    return {
        categorie,
        titre,
        objectif,
        concepteur,
        version,
        date
    };
}

// ======================================================================
// Réinitialisation des métadonnées
// ======================================================================
export function resetMetaUI() {
    const fields = [
        "meta_categorie",
        "meta_titre",
        "meta_objectif",
        "meta_concepteur"
    ];

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // Version par défaut
    const versionField = document.getElementById("meta_version");
    if (versionField) versionField.value = "1.0";

    // Date du jour automatiquement
    const dateField = document.getElementById("meta_date");
    if (dateField) {
        const today = new Date().toISOString().slice(0, 10);
        dateField.value = today;
    }
}
