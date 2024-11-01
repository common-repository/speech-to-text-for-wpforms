'use strict';

document.addEventListener('DOMContentLoaded', function () {

    let mediaRecorder;
    let audioChunks = [];
    let hasMicrophonePermission = false;
    let currentStream;

    // Ajouter l'info-bulle au bouton micro avec des instructions améliorées
    const microButton = document.getElementById("stt4wpforms_demarrer");
    microButton.title = "Click to start recording. Speak clearly, then click again to stop and process all fields at once.";

    document.getElementById("stt4wpforms_demarrer").onclick = function () {
        if (!hasMicrophonePermission) {
            navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                hasMicrophonePermission = true;
                currentStream = stream;
                startRecording(stream);
            });
        } else {
            if (currentStream) {
                startRecording(currentStream);
            } else {
                navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    currentStream = stream;
                    startRecording(stream);
                });
            }
        }
    };

    document.getElementById("stt4wpforms_arreter").onclick = function () {
        mediaRecorder.stop();
        if (currentStream) {
            const tracks = currentStream.getTracks();
            tracks.forEach(track => track.stop());
            currentStream = null;
        }
        document.getElementById("stt4wpforms_arreter").disabled = true;
    };

/*    function remplirFormulaireHtmlDepuisJson(formulaire, donnees) {
        if (!donnees) {
            console.error("Aucune donnée fournie pour remplir le formulaire.");
            return;
        }

        Object.entries(donnees).forEach(([cle, valeur]) => {
            if (cle.startsWith('wpforms[fields][8]') && typeof valeur === 'boolean') {
                const index = cle.match(/\[(\d+)\]$/)[1];
                const checkboxName = `wpforms[fields][8][]`;
                const checkboxes = formulaire.querySelectorAll(`input[name="${checkboxName}"]`);
                if (checkboxes[index]) {
                    checkboxes[index].checked = valeur;
                }
            } else if (typeof valeur === 'object' && valeur !== null) {
                Object.entries(valeur).forEach(([subKey, subValue]) => {
                    remplirChamp(formulaire, subKey, subValue);
                });
            } else {
                remplirChamp(formulaire, cle, valeur);
            }
        });
    }
*/

function remplirFormulaireHtmlDepuisJson(formulaire, donnees) {
    if (!donnees) {
        console.error("Aucune donnée fournie pour remplir le formulaire.");
        return;
    }

    Object.entries(donnees).forEach(([cle, valeur]) => {
        const checkboxMatch = cle.match(/wpforms\[fields\]\[(\d+)\]\[(\d+)\]$/);
        if (checkboxMatch && typeof valeur === 'boolean') {
            const fieldId = checkboxMatch[1];
            const index = checkboxMatch[2];
            const checkboxName = `wpforms[fields][${fieldId}][]`;
            const checkboxes = formulaire.querySelectorAll(`input[name="${checkboxName}"]`);
            if (checkboxes[index]) {
                checkboxes[index].checked = valeur;
            }
        } else if (typeof valeur === 'object' && valeur !== null) {
            Object.entries(valeur).forEach(([subKey, subValue]) => {
                remplirChamp(formulaire, subKey, subValue);
            });
        } else {
            remplirChamp(formulaire, cle, valeur);
        }
    });
}


    function remplirChamp(formulaire, cle, valeur) {
        let inputs = formulaire.querySelectorAll(`[name="${cle}"]`);
        if (inputs.length === 0) {
            return;
        }

        let input = inputs[0];

        switch (input.type) {
            case 'checkbox':
                if (Array.isArray(valeur)) {
                    inputs.forEach(input => {
                        input.checked = valeur.includes(input.value);
                    });
                } else if (cle.endsWith('[]')) {
                    let checkboxValues = Array.isArray(valeur) ? valeur : [valeur];
                    inputs.forEach(input => {
                        input.checked = checkboxValues.includes(input.value);
                    });
                } else {
                    input.checked = valeur === true || valeur === 'true' || valeur === '1';
                }
                break;
            case 'radio':
                let radioInput = formulaire.querySelector(`[name="${cle}"][value="${valeur}"]`);
                if (radioInput) radioInput.checked = true;
                break;
            case 'select-one':
            case 'select-multiple':
                if (Array.isArray(valeur)) {
                    Array.from(input.options).forEach(option => {
                        option.selected = valeur.includes(option.value);
                    });
                } else {
                    input.value = valeur;
                }
                break;
            default:
                input.value = valeur;
        }
    }

    function startRecording(stream = null) {
        if (!stream) {
            stream = currentStream;
        }
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = function () {
            const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
            var formulaire = document.querySelector('.wpforms-form');
            if (formulaire) {
                var codeHTML = formulaire.innerHTML;
                const donneesFormulaire = new FormData();
                donneesFormulaire.append("fichierAudio", audioBlob, "audio.mp3");
                donneesFormulaire.append("html", codeHTML);
                fetch('https://boite0.com:8080/voxInputDev', { method: 'POST', body: donneesFormulaire })
                .then(reponse => {
                    if (!reponse.ok) {
                        throw new Error('La requête a échoué avec le statut ' + reponse.status);
                    }
                    return reponse.json();
                })
                .then(donnees => {
                    remplirFormulaireHtmlDepuisJson(formulaire, donnees);
                })
                .catch(erreur => {
                    console.error('Erreur lors de la récupération des données:', erreur);
                });
            } else {
                console.log('Formulaire WPForms non trouvé');
            }
        };
        audioChunks = [];
        mediaRecorder.start();
        document.getElementById("stt4wpforms_arreter").disabled = false;
    }
});
