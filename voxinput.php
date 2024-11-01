<?php

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/*
Plugin Name: Speech To Text for Wpforms
Description: Filling out Wpforms-lite forms by voice.
Version: 1.1.0
Requires at least: 5.5
Tested up to: 6.6
Stable tag: 1.1.0
Requires PHP: 7.0
License: GPLv2 or later
Author: Boite0
*/

// Ajoute un bouton d'enregistrement pour permettre de remplir les formulaires avec la voix
add_action('wpforms_display_submit_before', 'stt4wpforms_ajouterIconeEnregistrement');

function stt4wpforms_ajouterIconeEnregistrement($form_data) {
    if ($form_data['id'] !== 346) {
        echo '<button type="button" id="stt4wpforms_demarrer" style="margin-right: 18px; font-size: 2em; background-color: white; color: #303030;"><span class="dashicons dashicons-microphone"></span></button>';
        echo '<button type="button" id="stt4wpforms_arreter"  style="margin-right: 18px; display: none; font-size: 2em; background-color: white; color: red;"><span class="dashicons dashicons-microphone"></span></button>';
    }
}

// Enregistre et met en file les scripts et styles nécessaires
add_action('wp_enqueue_scripts', 'stt4wpforms_enqueue_scripts_et_styles');

function stt4wpforms_enqueue_scripts_et_styles() {
    wp_enqueue_script('voxinput-script', plugins_url('voxinput.js', __FILE__), array(), '1.0.0', true);

    // Inline script pour gérer l'affichage des boutons, en évitant l'utilisation de HEREDOC
    $inline_script = "document.addEventListener('DOMContentLoaded', function () {" .
        "var demarrerBtn = document.getElementById('stt4wpforms_demarrer');" .
        "var arreterBtn = document.getElementById('stt4wpforms_arreter');" .

        "if (demarrerBtn && arreterBtn) {" .
            "demarrerBtn.addEventListener('click', function () {" .
                "this.style.display = 'none';" .
                "arreterBtn.style.display = 'inline-block';" .
            "});" .
            "arreterBtn.addEventListener('click', function () {" .
                "this.style.display = 'none';" .
                "demarrerBtn.style.display = 'inline-block';" .
            "});" .
        "}" .
    "});";

    wp_add_inline_script('voxinput-script', $inline_script);
    wp_enqueue_style('dashicons');
}
