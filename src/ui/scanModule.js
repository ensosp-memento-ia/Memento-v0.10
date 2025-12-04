// ======================================================================
// scanModule.js — Gestion de la lecture QR fichier + caméra
// ======================================================================

import { decodeFiche } from "../core/compression.js";

// -------- Lecture via fichier -----------------------------------------
const qrInput = document.getElementById("qrFileInput");
const qrFileResult = document.getElementById("qrFileResult");

if (qrInput) {
    qrInput.addEventListener("change", async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;

        qrFileResult.textContent = "Lecture en cours…";

        try {
            const raw = await window.QrScanner.scanImage(file);

            // raw = soit string, soit detailed { data: "...", ... }
            const text = (typeof raw === "string") ? raw : raw.data;

            const fiche = decodeFiche(text);
            qrFileResult.textContent = JSON.stringify(fiche, null, 2);
        } 
        catch (err) {
            qrFileResult.textContent = "❌ Erreur : " + err.message;
        }
    });
}

// -------- Lecture via caméra -----------------------------------------
let scanner = null;

const btnStart = document.getElementById("btnStartCam");
const btnStop = document.getElementById("btnStopCam");
const videoEl = document.getElementById("qrVideo");
const camResult = document.getElementById("qrCamResult");

if (btnStart && btnStop && videoEl) {

    btnStart.addEventListener("click", async () => {
        camResult.textContent = "Activation caméra…";

        scanner = new window.QrScanner(
            videoEl,
            async (result) => {

                // -------- Correction MAJEURE : extraction du texte --------
                const text = (typeof result === "string") ? result : result.data;
                camResult.textContent = "QR détecté :\n" + text;

                try {
                    const fiche = decodeFiche(text);
                    camResult.textContent +=
                        "\n\nJSON décodé :\n" + JSON.stringify(fiche, null, 2);
                } 
                catch (e) {
                    camResult.textContent +=
                        "\n\n❌ Erreur decodeFiche : " + e.message;
                }

                // Optionnel : arrêt auto après scan
                await scanner.stop();
                btnStart.disabled = false;
                btnStop.disabled = true;
            },
            {
                returnDetailedScanResult: true,
                inversionMode: "original"
            }
        );

        await scanner.start();
        btnStart.disabled = true;
        btnStop.disabled = false;

        camResult.textContent = "Caméra activée — Scanne un QR.";
    });

    btnStop.addEventListener("click", async () => {
        if (scanner) await scanner.stop();
        btnStart.disabled = false;
        btnStop.disabled = true;
        camResult.textContent = "Caméra arrêtée.";
    });
}
