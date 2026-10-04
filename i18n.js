// Comprehensive i18n dictionary and runtime for Lost Ark CP Calculator
(function(root) {
  'use strict';

  const STORAGE_KEY = 'lostark_cp_lang';

  const DICTIONARY = {
  "fr": {
    "app_badge": "LOST ARK T4",
    "astro_preset_fodder": "Gemme fodder / recyclage",
    "astro_model_badge": "Modèle Ark Grid (loseii.com)",
    "app_title": "Calculateur & Prédicteur de CP",
    "app_subtitle": "Simulateur d'iLvl et de Combat Power basé sur les courbes réelles de lostark.bible",
    "btn_import_bible": "Importer (lostark.bible)",
    "btn_help": "Guide & Tutoriel",
    "help_title": "Comment utiliser l'outil ?",
    "help_subtitle": "11 onglets ; importer ton personnage est le point de départ.",
    "help_intro": "Ce que fait chaque onglet :",
    "help_import_title": "Importation",
    "help_import": "Point de départ : importe ton personnage depuis lostark.bible (profil raid). Tous les onglets calculent sur ton vrai stuff ; sans personnage, rien n'est chiffré.",
    "help_predictor_title": "Prédicteur rapide",
    "help_predictor": "iLvl cible ➔ CP : chemin d'affinage le moins cher sur ton stuff (recettes du jeu, prix du marché), son coût en or et le CP gagné.",
    "help_advisor_title": "Smart Advisor",
    "help_advisor": "Toutes les améliorations chiffrées en or par +1 % de dégâts (DPS) ou +0,01 % de buff (support), comme le GPD de Loseii, et une feuille de route vers ton objectif.",
    "help_honing_title": "Affinage par pièce",
    "help_honing": "Affinage pièce par pièce (Serka ou Aegir) : coût attendu sur les recettes du jeu, CP gagné et prochain +1 le plus rentable.",
    "help_ark_title": "Simulateur Ark Passive",
    "help_ark": "CP selon les points dépensés dans chaque arbre (Évolution, Éclairage, Bond), sur le Battle Point du jeu. Évaluateur d'astrogemmes (note de Loseii).",
    "help_opti_title": "Optimisation T4",
    "help_opti": "Simule tes bijoux emplacement par emplacement et tes gemmes : gain et coût avec les modèles du GPD. Note de ton bracelet et palier suivant.",
    "help_canon_title": "Moteur canonique",
    "help_canon": "Ton Combat Power décomposé partie par partie, tel que le jeu le calcule (Battle Point du profil lostark.bible).",
    "help_raid_title": "Raids & Gold",
    "help_raid": "Tes raids à or de la semaine et tes revenus, cochés à la main ou synchronisés par l'agent local (LOA Logs).",
    "help_market_title": "Marché & Forteresse",
    "help_market": "Prix de l'hôtel des ventes EUC utilisés par les calculs, et rentabilité des fusions de Forteresse (recettes du jeu).",
    "help_benchmark_title": "Benchmark & Comparateur",
    "help_benchmark": "Compare-toi à de vrais joueurs de ta classe et de ton iLvl : écart par système en % et en CP, plan d'achat classé par or par % gagné.",
    "help_tip": "Sources : profil raid de lostark.bible, tables du jeu (Maxroll), modèles de dégâts et de buff de Loseii, prix EUC. Les simulations ne modifient pas ton personnage : réimporte-le après une amélioration en jeu.",
    "role_dps": "DPS",
    "roster_label": "Roster :",
    "btn_sync_roster": "Synchroniser mon Roster",
    "btn_manage_roster": "Gérer",
    "card_ilvl_label": "Item Level",
    "card_metric_cp": "Combat Power Réel",
    "card_level_prefix": "Niveau",
    "card_source_live": "Source : lostark.bible (Live)",
    "tab_predictor": "Prédicteur Rapide (iLvl ➔ CP)",
    "tab_advisor": "Smart Advisor (Rentabilité)",
    "tab_honing": "Simulateur d'Affinage par Pièce",
    "tab_arkpassive": "Simulateur Ark Passive (T4)",
    "tab_optimization": "Optimisation T4 (Accessoires, Bracelets & Gemmes)",
    "tab_canonical": "Moteur Canonique (lostark.bible)",
    "tab_raidtracker": "Suivi des Raids & Gold",
    "pred_input_title": "Paramètres Actuels & Objectif",
    "pred_realtime": "Temps réel",
    "pred_cur_ilvl": "Niveau d'Objet Actuel (iLvl)",
    "pred_cur_cp": "Combat Power Actuel (CP)",
    "pred_cp_helper": "CP actuel tel qu'affiché sur ta fiche lostark.bible.",
    "pred_target_ilvl": "iLvl Cible (Objectif)",
    "pred_gem_label": "Amélioration des Gemmes T4 (Simulation) :",
    "pred_gem_opt_current": "Garder les gemmes actuelles (aucun changement)",
    "pred_gem_opt_major8": "2-3 Gemmes clés Niv. 8 (Buffs AP / Top Skills) (+80 à +95 CP)",
    "pred_gem_opt_full8": "Deck Complet 11x Gemmes Niv. 8 (+200 à +355 CP)",
    "pred_gem_opt_full9": "Deck Complet 11x Gemmes Niv. 9 (+550 à +745 CP)",
    "pred_gem_opt_full10": "Deck Complet 11x Gemmes Niv. 10 Endgame (+1 000 à +1 250 CP)",
    "pred_res_title": "Résultat de la Prédiction",
    "pred_model_support": "Modèle Support",
    "pred_mode_honing": "Affinage Pur (Stuff Seul)",
    "pred_mode_global": "Évolution Globale (Endgame)",
    "pred_cp_at": "Combat Power Estimé à",
    "pred_diff_cp": "Gain de CP Net",
    "pred_diff_ilvl": "Progression iLvl",
    "pred_efficiency": "Efficacité Moyenne",
    "pred_bracket": "Tranche CP (Bracket)",
    "pred_analysis_title": "Analyse de ton saut d'iLvl :",
    "pred_gauge_start": "1640 (Départ T4)",
    "pred_gauge_end": "1800+ (Endgame)",
    "adv_badge": "Source : marché EUC",
    "adv_title": "Smart Upgrade Advisor — Planificateur Rentable",
    "adv_subtitle": "Calcule automatiquement le chemin optimal le moins cher en Gold pour maximiser vos CP et atteindre vos paliers de raid.",
    "adv_btn_apply": "Appliquer ce Plan au Simulateur",
    "honing_title": "Simulateur d'Affinage par Pièce (Stuff T4)",
    "honing_adv_select_label": "Affinage Avancé :",
    "honing_gear_weapon": "Arme T4",
    "honing_gear_weapon_desc": "Bonus Puissance d'Attaque élevé",
    "honing_gear_head": "Casque",
    "honing_gear_shoulder": "Épaulières",
    "honing_gear_chest": "Plastron (Torse)",
    "honing_gear_pants": "Pantalon (Jambes)",
    "honing_gear_gloves": "Gants",
    "honing_gear_armor_desc": "Gros apport de Force brute",
    "honing_actions_collective": "Action collective :",
    "honing_btn_reset": "↺ Réinitialiser",
    "ark_badge": "Progression T4",
    "ark_title": "Simulateur Ark Passive (T4)",
    "ark_subtitle": "Faites varier les points dépensés dans chaque arbre et lisez leur effet sur le Combat Power, avec la valeur par point du Battle Point du jeu lue sur votre profil.",
    "ark_btn_apply_sim": "Injecter dans le Prédicteur de CP",
    "ark_tree_evo_title": "Arbre Évolution",
    "ark_tree_evo_sub": "Paliers 1 à 4 (le palier 0 = stats de combat)",
    "ark_tree_evo_points_label": "Points dépensés (paliers 1 à 4) :",
    "ark_tree_evo_mult_label": "Battle Point Évolution",
    "ark_tree_evo_cp_label": "Part du CP",
    "ark_tree_enlight_title": "Arbre Éclairage",
    "ark_tree_enlight_sub": "Nœuds de classe",
    "ark_tree_enlight_points_label": "Points dépensés en Éclairage :",
    "ark_tree_enlight_mult_label": "Battle Point Éclairage",
    "ark_tree_leap_title": "Arbre Saut (Leap)",
    "ark_tree_leap_sub": "Hyper Awakening & Compétences d'Éveil",
    "astro_subtitle": "Notez instantanément votre gemme astrale (0 à 100+), son rang (S+ à F), son gain réel en % dégâts ou buff groupe, et sa viabilité pour compléter les cœurs à 17 points de votre Grille d'Ark.",
    "astro_cost_label": "Coût de Base de la Gemme :",
    "astro_cost_8": "Coût 8 (Pool : Dégâts Add, Arme %, Marque, Dégâts Alliés)",
    "astro_cost_9": "Coût 9 (Pool : Boss Dmg, Arme %, Dégâts Alliés, PA Alliés)",
    "astro_cost_10": "Coût 10 (Pool : Boss Dmg, Dégâts Add, Marque, PA Alliés)",
    "astro_wp_label": "Ligne 1 : Volonté (Willpower) :",
    "astro_order_label": "Ligne 2 : Ordre / Chaos :",
    "astro_sec2_title": "2. Effets Secondaires Spécialisés",
    "astro_eff1_label": "Ligne 3 (Effet 1) :",
    "astro_eff2_label": "Ligne 4 (Effet 2) :",
    "astro_grade_label": "Grade Global Loseii",
    "astro_rarity_label": "Rareté de la Gemme",
    "astro_cost_core_label": "Coût dans le Cœur",
    "astro_viability_label": "Viabilité Ark Grid",
    "astro_verdict_title": "Verdict & Analyse de Placement (Modèle Loseii) :",
    "astro_presets_label": "Exemples types :",
    "opt_title": "Simulateur bijoux, gemmes & bracelet",
    "opt_matrix_pill": "Modèles du GPD",
    "opt_res_gold": "Or",
    "opt_subtitle": "Pars de ton vrai personnage : choisis un tier cible pour les lignes principales d'un bijou ou un niveau de gemmes, et lis le gain et l'or avec les mêmes modèles que le tableau GPD.",
    "opt_res_title": "Gain simulé",
    "opt_res_gain_acc": "Bijoux",
    "opt_res_gain_gems": "Gemmes",
    "eff_title": "Arbitrage de Rentabilité Gold / Dégâts (Marché EUC)",
    "eff_subtitle": "Toutes les façons de monter ton personnage, chiffrées en or (prix du marché EUC) et classées par coût du gain, comme le GPD de Loseii",
    "eff_rec_title": "Prochaine Amélioration Prioritaire Recommandée (ROI Max) :",
    "eff_col_name": "Amélioration / Système T4",
    "eff_col_cost": "Coût Moyen EUC",
    "eff_col_ratio_supp": "Coût / 0.01% Buff",
    "eff_col_prio": "Priorité ROI",
    "canon_badge": "lostark.bible",
    "canon_title": "Moteur Mathématique Canonique T4 (Smilegate & lostark.bible)",
    "canon_subtitle": "Formule du jeu : CP = valeur de base × ∏ (1 + partie ÷ 10 000) ÷ 10 000, sur les parties du Battle Point du profil lostark.bible.",
    "canon_score_ingame": "Score en Jeu (Réel)",
    "canon_score_calc": "Score Calculé Canonique",
    "canon_score_buff": "Buff Power (Support)",
    "canon_score_heal": "Puissance de Soin",
    "canon_sub_ingame": "Observé sur la fiche lostark.bible",
    "canon_sub_calc": "Précision : ±1.5% vs jeu",
    "canon_sub_buff": "Basé sur l'Attaque de Base & l'Arme",
    "canon_sub_heal": "Basé sur les PV Max & Vitalité Armures",
    "canon_breakdown_title": "Décomposition Analytique par Système",
    "canon_col_cat": "Catégorie",
    "canon_col_detail": "Composant / Système",
    "canon_col_val": "Valeur / Ligne",
    "canon_col_mult": "Multiplicateur",
    "canon_col_impact": "Impact Rôle",
    "modal_sync_title": "Synchronisation des Personnages lostark.bible",
    "modal_or_by_name": "ou ajout direct par pseudo",
    "modal_char_name_lbl": "Nom du personnage",
    "modal_char_name_ph": "Ex : Siwilpal",
    "modal_roster_lbl": "Personnages dans Mon Roster",
    "modal_manual_title": "Option manuelle : JSON brut ou Bearer Token",
    "modal_manual_help": "Si le navigateur bloque la requête directe (CORS/Cloudflare), colle ici le JSON brut de <code>https://lostark.bible/character/CE/TON_PERSO/__data.json</code> ou ton Bearer Token :",
    "modal_manual_ph": "Colle le JSON ou le Bearer Token uwo_... ici",
    "modal_manual_btn": "Charger depuis le texte",
    "modal_btn_login": "Se connecter avec lostark.bible",
    "modal_oauth_helper": "OAuth 2.0 PKCE officiel • Synchronisation instantanée de votre Roster et de vos logs",
    "modal_status_connected": "Connecté",
    "modal_btn_logout": "Déconnexion",
    "modal_btn_sync_roster": "Tout Synchroniser vers mon Roster (Top 6)",
    "modal_region_lbl": "Région",
    "modal_chk_auto_roster": "Ajouter et sauvegarder automatiquement dans Mon Roster",
    "modal_btn_fetch": "Importer & Charger le Personnage",
    "modal_btn_clear_roster": "Réinitialiser",
    "modal_btn_close": "✓ OK / Fermer",
    "footer_left": "Lost Ark Tier 4 • Profils réels de lostark.bible",
    "footer_right": "Tables du jeu (Maxroll) • Modèles DPS et support de Loseii • Prix EUC"
,
    "honing_impact_title": "Impact de l'Équipement",
    "honing_model_badge": "Simulateur Pièce",
    "honing_calc_ilvl_lbl": "iLvl Calculé de l'Équipement",
    "honing_est_cp_lbl": "Combat Power Estimé",
    "honing_diff_ilvl_lbl": "Gain iLvl vs Base",
    "honing_diff_cp_lbl": "Gain CP vs Base",
    "honing_cost_gold_lbl": "Coût Estimé (Gold)",
    "honing_roi_lbl": "Ratio Gold / CP",
    "honing_str_est_lbl": "Force (STR) estimée",
    "honing_base_atk_lbl": "Attaque de Base",
    "honing_advice_header": "Recommandation d'optimisation Rentabilité Gold / CP",
    "honing_btn_all_14": "Tout à +14",
    "honing_btn_all_16": "Tout à +16",
    "honing_btn_all_18": "Tout à +18",
    "honing_btn_all_20": "Tout à +20",
    "adv_btn_apply_plan": "Appliquer ce Plan dans le Simulateur d'Affinage",
    "ark_main_title": "Simulateur Ark Passive — Évolution, Éclairage & Bond",
    "ark_tree_leap_subtext": "Éveil supérieur",
    "ark_tree_leap_points_lbl": "Points dépensés en Bond :",
    "ark_mult_leap_lbl": "Battle Point Bond",
    "ark_summary_header": "Effet sur le Combat Power",
    "ark_kpi_proj_cp": "Combat Power Projeté",
    "ark_kpi_global_buff": "Multiplicateur Ark Passive",
    "ark_kpi_allocated_pts": "Points dépensés",
    "ark_kpi_setup_eff": "Reste à gagner",
    "ark_analysis_header": "Lecture du modèle :",
    "astro_header_title": "Évaluateur & Grader de Gemmes Astrales (Astrogem Grader T4)",
    "astro_sec1_heading": "1. Châssis & Lignes Fondamentales",
    "astro_eff_cost_lbl": "Coût effectif dans le cœur :",
    "astro_gain_sub": "Contribution nette par allié",
    "astro_viability_sub": "Pilier de cœur à 17 points",
    "opt_roi_advice_header": "Rentabilité de la simulation",
    "canon_analysis_title": "Analyse de la formule officielle :",
    "canon_analysis_dps": "Pour les <strong>DPS</strong>, la valeur de base vaut 2,88 × PA de base, avec PA de base = <code>√(stat principale × puissance d'arme ÷ 6) × (1 + % PA)</code> ; chaque autre partie du Battle Point la multiplie.",
    "canon_analysis_sup": "Pour les <strong>supports</strong>, le CP additionne une branche buff (1,24 × PA de base, multipliée par les parties offensives) et une branche défense (12 × PV max, multipliée par les parties défensives).",
    "canon_analysis_delta": "Rapport CP en jeu ÷ CP reconstitué, mesuré sur 70 profils : 0,99 à 1,04 (DPS), 0,96 à 0,99 (support). Cet écart n'est pas expliqué ; au-delà, des parties manquent sur lostark.bible.",
    "canon_col_detail": "Système & Détail",
    "canon_col_val": "Valeur Brute / Roll",
    "canon_col_mult": "Multiplicateur Net",
    "canon_col_impact": "Impact Rôle",
    "pred_gem_opt_full10": "Deck Complet 11x Gemmes Niv. 10 Endgame (+1 000 à +1 250 CP)",
    "honing_gear_levels_title": "Niveaux d'Affinage T4 (Honing)",
    "ark_btn_current_points": "Points Actuels du Personnage",
    "ark_btn_max_points": "Tous les points au maximum",
    "astro_order_sub": "Multiplicateur direct au-dessus du plancher de 17 points (+0.16% par point).",
    "astro_eff1_lvl_lbl": "Niveau de l'Effet 1 :",
    "astro_eff2_lvl_lbl": "Niveau de l'Effet 2 :",
    "astro_cost_sub": "8 Base − 5 Volonté",
    "opt_th_gain": "Gain Groupe",
    "canon_sub_ingame": "Relevé sur le profil lostark.bible",
    "canon_sub_calc": "Précision : ±1.7% vs jeu",
    "raid_badge": "Revenus en or des raids T4",
    "raid_title": "Suivi Hebdomadaire des Raids & Revenus Gold",
    "raid_subtitle": "Suivi automatique de vos 18 raids à gold (Horizon Cathedral, Serca, Final Act: Kazeros) synchronisé avec LOA Logs.",
    "raid_reset_lbl": "Prochain Reset :",
    "raid_btn_sync": "Actualiser",
    "raid_agent_online": "Agent Connecté (Temps Réel)",
    "raid_agent_offline": "Agent Non Détecté (Mode Cache)",
    "raid_agent_checking": "Connexion Agent...",
    "raid_kpi_earned_lbl": "Golds Hebdomadaires Encaissés",
    "raid_kpi_remaining_lbl": "Golds Restants à Gagner",
    "raid_kpi_progress_lbl": "Progression des Raids",
    "raid_kpi_potential_lbl": "Potentiel Hebdo Total",
    "raid_kpi_potential_sub": "6 personnages × 3 raids max",
    "raid_kpi_gates_sub": "{cleared} / {total} Portes Validées",
    "raid_kpi_earned_sub": "{pct}% du potentiel hebdomadaire",
    "raid_kpi_remaining_sub": "Sur les {raids} raids autorisés",
    "raid_chest_label": "Coffres (-{cost} g)",
    "raid_cathedral": "Horizon Cathedral",
    "raid_serca": "Serca",
    "raid_kazeros": "Final Act: Kazeros",
    "raid_cleared_at": "Validé le {time}",
    "raid_btn_agent_download": "Installer l'Agent",
    "raid_net_gold": "Golds Hebdomadaires Encaissés",
    "raid_btn_mark_all": "Tout Valider",
    "raid_btn_all_chests": "Tous les Coffres",
    "agent_modal_title": "Agent de Synchronisation en Direct (Local & Privé)",
    "agent_modal_subtitle": "Synchronisez automatiquement vos clears de raids et vos gains de golds depuis LOA Logs en temps réel.",
    "agent_step1_title": "1. Téléchargez",
    "agent_step1_desc": "Choisissez l'exécutable autonome (.exe) ou le script (.zip).",
    "agent_step2_title": "2. Lancez",
    "agent_step2_desc": "Double-cliquez pour démarrer l'agent local (port 4848).",
    "agent_step3_title": "3. C'est tout.",
    "agent_step3_desc": "Vos portes et golds se valident en direct sans aucune saisie manuelle.",
    "agent_dl_exe_title": "Exécutable Autonome (.exe)",
    "agent_dl_exe_badge": "Recommandé • Zéro installation",
    "agent_dl_exe_desc": "Prêt à l'emploi. Aucun logiciel tiers nécessaire, double-cliquez et jouez.",
    "agent_dl_exe_btn": "Télécharger LostArkRaidAgent.exe",
    "agent_dl_zip_title": "Archive Script (.zip)",
    "agent_dl_zip_badge": "Ultra-léger (6 Ko) • Open Source",
    "agent_dl_zip_desc": "Contient start-agent.bat et le code source JS. Nécessite Node.js.",
    "agent_dl_zip_btn": "Télécharger le Script (.zip)",
    "agent_privacy_notice": "100% Local & Privé : L'agent s'exécute exclusivement sur votre propre PC (http://127.0.0.1:4848). Vos identifiants et combats ne transitent jamais sur internet.",
    "agent_modal_close": "Fermer",
    "tab_market": "Marché & Forteresse",
    "card_title_acc": "Accessoires T4",
    "card_title_bracelet": "Bracelet T4",
    "card_title_astro": "Astrogemmes",
    "card_title_gpd": "Prochain +1%",
    "score_acc_dmg": "Dégâts Exacts",
    "score_gpd_per": "par 1% Dégâts",
    "gpd_chart_link": "GPD ➔",
    "mkt_title": "Marché & Forteresse",
    "mkt_subtitle": "Prix de l'hôtel des ventes EUC utilisés par les calculs, et rentabilité des fusions de l'atelier de Forteresse.",
    "mkt_prices_title": "Prix du marché (EUC)",
    "mkt_th_item": "Objet",
    "mkt_th_price": "Prix",
    "mkt_craft_title": "Fusions de Forteresse",
    "mkt_craft_desc": "Recettes du jeu (une par métier). Bonus à relever dans l'atelier de ta Forteresse.",
    "mkt_lbl_cost_red": "Réduction du coût en or (%)",
    "mkt_lbl_time_red": "Réduction du temps (%)",
    "mkt_lbl_gs": "Bonus de Grande réussite (%)",
    "mkt_lbl_mats": "Matériaux",
    "mkt_mats_buy": "Achetés à l'hôtel des ventes",
    "mkt_mats_own": "Récoltés (valeur de revente, taxe déduite)",
    "mkt_th_recipe": "Recette",
    "mkt_th_unit_cost": "Coût / unité",
    "mkt_th_profit": "Profit / craft",
    "mkt_th_roi": "ROI",
    "mkt_th_per_hour": "Or / heure",
    "gpd_upgrade_next_lbl": "Meilleur ratio",
    "gpd_filter_goal_lbl": "Objectif",
    "gpd_goal_all": "Tous",
    "gpd_table_title": "Classement par rentabilité",
    "gpd_table_sub": "Du moins cher au plus cher, sur ton équipement actuel. Les paliers de ton objectif sont surlignés.",
    "gpd_th_system": "Système",
    "gpd_th_next": "Étape",
    "gpd_th_rate": "Or / 1 %",
    "gpd_th_cpgain": "+CP",
    "gpd_th_status": "Statut",
    "gpd_th_rank": "#",
    "gpd_th_cost": "Coût (g)",
    "gpd_th_gain": "Gain",
    "gpd_th_tier": "Rang",
    "gpd_pieces_title": "Détail des Pièces & Accessoires (Piece by piece)",
    "gpd_pieces_sub": "Analyse des rolls et lignes lus sur chacun de vos bijoux et bracelet. Les anneaux et boucles d'oreilles sont évalués sur la pièce la plus faible.",
    "gpd_th_piece": "Pièce",
    "gpd_th_piece_ladder": "Lecture du Modèle",
    "gpd_th_piece_lines": "Lignes Présentes",
    "tab_benchmark": "Benchmark & Comparateur",
    "tab_belgardin": "Belgardin : préparation et brassard",
    "tab_badge_soon": "Bientôt",
    "tab_rotation": "Analyse de rotation",
    "tab_badge_beta": "Bêta",
    "rot_title": "Analyse de rotation (LOA Logs)",
    "rot_subtitle": "Une note d'exécution sur 100 et des conseils pour progresser, tirés de tes combats enregistrés par LOA Logs et comparés aux joueurs de ta spé sur le même boss : compétences, temps sans rien lancer, buffs du support, placement, build.",
    "rot_pick": "Choisir encounters.db",
    "rot_where": "Le fichier est dans le dossier de LOA Logs, à côté de <code>LOA Logs.exe</code>. Par défaut : colle <code>%LOCALAPPDATA%\\LOA Logs</code> dans la barre d'adresse de la fenêtre de sélection.",
    "rot_privacy": "Le fichier reste sur ton PC : il est lu par ton navigateur, rien n'est envoyé. Seules les pages utiles sont lues, même pour une base de plusieurs Go.",
    "rot_date_label": "Jour du raid",
    "rot_latest": "10 derniers raids",
    "rot_resume": "Reprendre encounters.db",
    "rot_sync": "Synchroniser",
    "belg_title": "Belgardin : préparation et brassard T4",
    "belg_subtitle": "Le brassard (완갑) arrive avec le raid de l'ombre Belgardin (Normal 1750, Hard 1770, Nightmare 1780). Il s'obtient en Héroïque au premier clear de la porte 2, s'affine de +0 à +25 et change de rareté à +10, +15 et +20. Cet onglet dit si tes personnages ont le CP pour chaque difficulté, ce qu'il reste à améliorer, et projette le brassard, qu'aucun joueur européen n'a encore.",
    "bracer_slider_title": "Niveau d'affinage projeté",
    "belg_from": "Point de départ",
    "belg_costs_title": "Plan de stockage",
    "belg_sources": "Sources :",
    "bracer_heroic": "Héroïque",
    "bracer_legendary": "Légendaire",
    "bracer_relic": "Relique",
    "bracer_ancient": "Ancien",
    "bench_badge": "Benchmark T4",
    "bench_title": "Comparateur de Profil & Benchmark de Référence",
    "bench_subtitle": "Comparez votre personnage à un profil de référence de même classe, même spécialisation et même iLvl pour identifier vos axes d'amélioration et combler l'écart de CP.",
    "bench_btn_auto": "Auto-Match Optimal",
    "bench_select_lbl": "Profils de référence :",
    "bench_gem_filter_lbl": "Palier Gemmes :",
    "bench_filter_all": "Tous les profils",
    "bench_filter_gem8": "Full Gemmes 8",
    "bench_filter_gem9": "Gemmes 9+",
    "bench_search_placeholder": "Rechercher un pseudo (ex: Siwilpal, Lavieenrosee, Lethimsmashh...)",
    "bench_btn_compare": "Comparer",
    "bench_card_player_title": "Mon Personnage",
    "bench_card_target_title": "Profil de Référence",
    "bench_delta_title": "Écart de Combat Power",
    "bench_same_ilvl_note": "Même tranche d'iLvl",
    "bench_view_bible": "Voir sur lostark.bible",
    "bench_gap_title": "Diagnostic des Écarts : Où gagner vos prochains points de CP ?",
    "bench_gap_sub": "Classement des systèmes par potentiel de gain pour atteindre ou dépasser le profil de référence.",
    "bench_table_title": "Tableau Comparatif Système par Système (% & Paliers)",
    "bench_th_system": "Système & Composant",
    "bench_th_player": "Mon Personnage",
    "bench_th_target": "Profil Référence",
    "bench_th_delta": "Écart Relatif",
    "bench_th_cp": "Impact CP",
    "bench_th_priority": "Conseil d'Optimisation",
    "bench_plan_title": "Plan d'Action Recommandé (Ordre de Rentabilité)",
    "bench_plan_sub": "Les étapes les plus rentables en golds pour combler l'écart avec la référence.",
    "bench_prio_high": "Haute Priorité",
    "bench_prio_med": "Rentable",
    "bench_prio_equal": "Équivalent",
    "bench_prio_opt": "Endgame / Coûteux",
    "bench_prio_derived": "Via l'équipement",
    "bench_toggle_show_equal": "Afficher les systèmes équivalents (0% d'écart) ▾",
    "bench_region_title": "Région du serveur",
    "bench_region_auto": "Région : Auto",
    "bench_region_ce": "Europe (CE)",
    "bench_region_nae": "Amérique Est (NAE)",
    "bench_region_naw": "Amérique Ouest (NAW)",
    "bench_region_sa": "Amérique Sud (SA)",
    "welcome_modal_title": "Bienvenue sur Lost Ark CP & Optimizer T4",
    "welcome_modal_sub": "Analysez votre personnage et calculez votre Combat Power réel en quelques clics",
    "welcome_modal_intro": "Entrez le pseudo de votre personnage pour charger instantanément ses statistiques, son affinage et son roster depuis lostark.bible :",
    "welcome_char_name_lbl": "Pseudo du Personnage",
    "welcome_btn_fetch": "Charger mon personnage",
    "welcome_more_options": "Autres options : connexion lostark.bible, import manuel",
    "btn_refresh_all_roster": "Tout réactualiser",
    "btn_share_char": "Partager",
    "tt_sync_roster": "Synchroniser votre propre Roster depuis lostark.bible",
    "tt_manage_roster": "Gérer ou actualiser vos personnages",
    "alt_char_portrait": "Portrait du personnage",
    "tt_share_char": "Copier le lien direct de ce personnage pour l'envoyer à un ami",
    "tt_card_acc": "Cliquez pour voir les Accessoires T4",
    "tt_card_bracelet": "Cliquez pour analyser le Bracelet",
    "tt_card_astro": "Cliquez pour voir les Astrogemmes",
    "tt_card_gpd": "Cliquez pour ouvrir le Smart Advisor / GPD",
    "tt_weekly_reset": "Reset hebdomadaire chaque mercredi à 12h00 CEST",
    "tt_refresh_sync": "Actualiser la synchronisation",
    "tt_install_agent": "Installer ou télécharger l'agent local",
    "tt_mark_all_cleared": "Valider tous les raids du roster",
    "tt_toggle_all_chests": "Activer / Désactiver tous les coffres bonus",
    "aria_bracer_level": "Niveau du brassard",
    "tt_bench_auto": "Sélectionne automatiquement le profil optimal (+1-3 iLvl, mêmes gemmes, même classe & spé)",
    "tt_close": "Fermer",
    "ph_welcome_name": "Ex : Àlphâ, Frieedhof, Siwilpal…",
    "page_title": "Calculateur & Prédicteur CP / iLvl - Lost Ark T4",
    "btn_close": "Compris.",
    "agent_compatibility_notice": "Compatible avec LOA Logs / Lost Ark Logs (%LOCALAPPDATA%\\LOA Logs\\encounters.db).",
    "help_belg_title": "Belgardin",
    "help_belg": "CP requis par difficulté (groupes publics KR, DPS minimum), état du roster et plan d'amélioration chiffré ; projection du brassard T4 avant sa sortie EU : coût et gain estimés par niveau, avec la source de chaque valeur.",
    "help_rotation_title": "Analyse de rotation",
    "help_rotation": "Charge ton encounters.db de LOA Logs (lu dans ton navigateur, jamais envoyé) : note d'exécution par raid comparée à ta spé, et conseils pour progresser.",
    "char_active_default": "Personnage Actif"
  },
  "en": {
    "app_badge": "LOST ARK T4",
    "astro_preset_fodder": "Fodder / recycle gem",
    "astro_model_badge": "Ark Grid model (loseii.com)",
    "app_title": "CP Calculator & Predictor",
    "app_subtitle": "iLvl & Combat Power Simulator calibrated from actual lostark.bible scaling curves",
    "btn_import_bible": "Import (lostark.bible)",
    "btn_help": "Guide & Tutorial",
    "help_title": "How to use the tool?",
    "help_subtitle": "11 tabs; importing your character is the starting point.",
    "help_intro": "What each tab does:",
    "help_import_title": "Import",
    "help_import": "Starting point: import your character from lostark.bible (raid profile). Every tab computes on your real gear; without a character, nothing is priced.",
    "help_predictor_title": "Quick Predictor",
    "help_predictor": "Target iLvl ➔ CP: cheapest honing path on your gear (game recipes, market prices), its gold cost and the CP gained.",
    "help_advisor_title": "Smart Advisor",
    "help_advisor": "Every upgrade priced in gold per +1% damage (DPS) or +0.01% buff (support), like Loseii's GPD, plus a roadmap to your goal.",
    "help_honing_title": "Piece-by-piece honing",
    "help_honing": "Piece-by-piece honing (Serka or Aegir): expected cost from the game recipes, CP gained and the most cost-efficient next +1.",
    "help_ark_title": "Ark Passive Simulator",
    "help_ark": "CP from the points spent in each tree (Evolution, Enlightenment, Leap), on the game Battle Point. Astrogem grader (Loseii grade).",
    "help_opti_title": "T4 Optimization",
    "help_opti": "Simulate your accessories slot by slot and your gems: gain and cost with the GPD models. Your bracelet grade and next step.",
    "help_canon_title": "Canonical engine",
    "help_canon": "Your Combat Power broken down part by part, as the game computes it (Battle Point of the lostark.bible profile).",
    "help_raid_title": "Raids & Gold",
    "help_raid": "Your weekly gold raids and income, checked by hand or synced by the local agent (LOA Logs).",
    "help_market_title": "Market & Stronghold",
    "help_market": "EUC auction house prices used by the calculations, and Stronghold fusion profitability (game recipes).",
    "help_benchmark_title": "Benchmark & Comparator",
    "help_benchmark": "Compare yourself with real players of your class and iLvl: gap per system in % and CP, purchase plan ranked by gold per % gained.",
    "help_tip": "Sources: lostark.bible raid profile, game tables (Maxroll), Loseii damage and buff models, EUC prices. Simulations never change your character: re-import it after an in-game upgrade.",
    "role_dps": "DPS",
    "roster_label": "Roster:",
    "btn_sync_roster": "Sync my Roster",
    "btn_manage_roster": "Manage",
    "card_ilvl_label": "Item Level",
    "card_metric_cp": "Actual Combat Power",
    "card_level_prefix": "Level",
    "card_source_live": "Source: lostark.bible (Live)",
    "tab_predictor": "Quick Predictor (iLvl ➔ CP)",
    "tab_advisor": "Smart Advisor (ROI Optimizer)",
    "tab_honing": "Piece-by-Piece Honing Simulator",
    "tab_arkpassive": "Ark Passive Simulator (T4)",
    "tab_optimization": "T4 Optimization (Accessories, Bracelets & Gems)",
    "tab_canonical": "Canonical Engine (lostark.bible)",
    "tab_raidtracker": "Raids & Gold Tracker",
    "pred_input_title": "Current Setup & Target Objective",
    "pred_realtime": "Real-time",
    "pred_cur_ilvl": "Current Item Level (iLvl)",
    "pred_cur_cp": "Current Combat Power (CP)",
    "pred_cp_helper": "Current CP as displayed on your lostark.bible sheet.",
    "pred_target_ilvl": "Target iLvl (Goal)",
    "pred_gem_label": "T4 Gems Upgrade (Simulation):",
    "pred_gem_opt_current": "Keep current gems (no change)",
    "pred_gem_opt_major8": "2-3 Key Lvl. 8 Gems (AP Buffs / Top Skills) (+80 to +95 CP)",
    "pred_gem_opt_full8": "Full 11x Lvl. 8 Gems Deck (+200 to +355 CP)",
    "pred_gem_opt_full9": "Full 11x Lvl. 9 Gems Deck (+550 to +745 CP)",
    "pred_gem_opt_full10": "Full 11x Lvl. 10 Endgame Gems Deck (+1,000 to +1,250 CP)",
    "pred_res_title": "Prediction Results",
    "pred_model_support": "Support Model",
    "pred_mode_honing": "Pure Honing (Gear Only)",
    "pred_mode_global": "Global Build Evolution (Endgame)",
    "pred_cp_at": "Estimated Combat Power at",
    "pred_diff_cp": "Net CP Gain",
    "pred_diff_ilvl": "iLvl Progression",
    "pred_efficiency": "Average Efficiency",
    "pred_bracket": "CP Bracket",
    "pred_analysis_title": "Analysis of your iLvl jump:",
    "pred_gauge_start": "1640 (T4 Start)",
    "pred_gauge_end": "1800+ (Endgame)",
    "adv_badge": "Source: EUC market",
    "adv_title": "Smart Upgrade Advisor — Cost-Efficiency Planner",
    "adv_subtitle": "Automatically calculates the cheapest gold path to maximize your CP and hit your raid thresholds.",
    "adv_btn_apply": "Apply Plan to Simulator",
    "honing_title": "Piece-by-Piece Honing Simulator (T4 Gear)",
    "honing_adv_select_label": "Advanced Honing:",
    "honing_gear_weapon": "T4 Weapon",
    "honing_gear_weapon_desc": "High Attack Power bonus",
    "honing_gear_head": "Helmet",
    "honing_gear_shoulder": "Shoulders",
    "honing_gear_chest": "Chestpiece (Torso)",
    "honing_gear_pants": "Pants (Legs)",
    "honing_gear_gloves": "Gloves",
    "honing_gear_armor_desc": "Substantial Main Stat increase",
    "honing_actions_collective": "Collective action:",
    "honing_btn_reset": "↺ Reset",
    "ark_badge": "T4 progression",
    "ark_title": "Ark Passive Simulator (T4)",
    "ark_subtitle": "Change the points spent in each tree and read their effect on Combat Power, using the per-point value of the game Battle Point read from your profile.",
    "ark_btn_apply_sim": "Apply to CP Predictor",
    "ark_tree_evo_title": "Evolution Tree",
    "ark_tree_evo_sub": "Tiers 1 to 4 (tier 0 = combat stats)",
    "ark_tree_evo_points_label": "Points spent (tiers 1 to 4):",
    "ark_tree_evo_mult_label": "Evolution Battle Point",
    "ark_tree_evo_cp_label": "Share of CP",
    "ark_tree_enlight_title": "Enlightenment Tree",
    "ark_tree_enlight_sub": "Class nodes",
    "ark_tree_enlight_points_label": "Enlightenment points spent:",
    "ark_tree_enlight_mult_label": "Enlightenment Battle Point",
    "ark_tree_leap_title": "Leap Tree",
    "ark_tree_leap_sub": "Hyper Awakening & Awakening Skills",
    "astro_subtitle": "Instantly score your astrogem (0 to 100+), its rank (S+ to F), net % damage/buff gain, and viability for 17-point Ark Grid cores.",
    "astro_cost_label": "Base Gem Cost:",
    "astro_cost_8": "Cost 8 (Pool: Additional Dmg, Weapon %, Brand, Ally Dmg)",
    "astro_cost_9": "Cost 9 (Pool: Boss Dmg, Weapon %, Ally Dmg, Ally AP)",
    "astro_cost_10": "Cost 10 (Pool: Boss Dmg, Additional Dmg, Brand, Ally AP)",
    "astro_wp_label": "Line 1: Willpower:",
    "astro_order_label": "Line 2: Order / Chaos:",
    "astro_sec2_title": "2. Specialized Secondary Effects",
    "astro_eff1_label": "Line 3 (Effect 1):",
    "astro_eff2_label": "Line 4 (Effect 2):",
    "astro_grade_label": "Loseii Global Grade",
    "astro_rarity_label": "Gem Rarity",
    "astro_cost_core_label": "Core Cost",
    "astro_viability_label": "Ark Grid Viability",
    "astro_verdict_title": "Verdict & Placement Analysis (Loseii Model):",
    "astro_presets_label": "Standard examples:",
    "opt_title": "Accessory, gem & bracelet simulator",
    "opt_matrix_pill": "GPD models",
    "opt_res_gold": "Gold",
    "opt_subtitle": "Start from your real character: pick a target tier for an accessory's main lines or a gem level, and read the gain and gold with the same models as the GPD table.",
    "opt_res_title": "Simulated gain",
    "opt_res_gain_acc": "Accessories",
    "opt_res_gain_gems": "Gems",
    "eff_title": "Gold / Damage Cost-Efficiency Arbitrage (EUC Market)",
    "eff_subtitle": "Every way to upgrade your character, priced in gold (EUC market prices) and ranked by cost per gain, like Loseii's GPD",
    "eff_rec_title": "Next Recommended Priority Upgrade (Max ROI):",
    "eff_col_name": "Upgrade / T4 System",
    "eff_col_cost": "Avg EUC Cost",
    "eff_col_ratio_supp": "Cost / 0.01% Buff",
    "eff_col_prio": "ROI Priority",
    "canon_badge": "lostark.bible",
    "canon_title": "Canonical Mathematical Engine T4 (Smilegate & lostark.bible)",
    "canon_subtitle": "Game formula: CP = base value × ∏ (1 + part ÷ 10,000) ÷ 10,000, over the Battle Point parts of the lostark.bible profile.",
    "canon_score_ingame": "In-Game Score (Actual)",
    "canon_score_calc": "Canonical Calculated Score",
    "canon_score_buff": "Buff Power (Support)",
    "canon_score_heal": "Heal / Shield Power",
    "canon_sub_ingame": "Observed on lostark.bible profile",
    "canon_sub_calc": "Accuracy: ±1.5% vs game",
    "canon_sub_buff": "Based on Base Attack & Weapon",
    "canon_sub_heal": "Based on Max HP & Armor Vitality",
    "canon_breakdown_title": "Analytical System Breakdown",
    "canon_col_cat": "Category",
    "canon_col_detail": "System & Detail",
    "canon_col_val": "Raw Value / Roll",
    "canon_col_mult": "Net Multiplier",
    "canon_col_impact": "Role Impact",
    "modal_sync_title": "lostark.bible Character Synchronization",
    "modal_or_by_name": "or add by character name",
    "modal_char_name_lbl": "Character name",
    "modal_char_name_ph": "e.g. Siwilpal",
    "modal_roster_lbl": "Characters in My Roster",
    "modal_manual_title": "Manual option: raw JSON or Bearer Token",
    "modal_manual_help": "If the browser blocks the direct request (CORS/Cloudflare), paste the raw JSON of <code>https://lostark.bible/character/CE/YOUR_CHARACTER/__data.json</code> or your Bearer Token here:",
    "modal_manual_ph": "Paste the JSON or Bearer Token uwo_... here",
    "modal_manual_btn": "Load from text",
    "modal_btn_login": "Sign in with lostark.bible",
    "modal_oauth_helper": "Official OAuth 2.0 PKCE • Instant synchronization of your Roster and raid logs",
    "modal_status_connected": "Connected",
    "modal_btn_logout": "Logout",
    "modal_btn_sync_roster": "Sync Everything to My Roster (Top 6)",
    "modal_region_lbl": "Region",
    "modal_chk_auto_roster": "Automatically add and save to My Roster",
    "modal_btn_fetch": "Import & Load Character",
    "modal_btn_clear_roster": "Reset",
    "modal_btn_close": "✓ OK / Close",
    "footer_left": "Lost Ark Tier 4 • Real lostark.bible profiles",
    "footer_right": "Game tables (Maxroll) • Loseii DPS and support models • EUC prices"
,
    "honing_impact_title": "Gear Impact & Scaling",
    "honing_model_badge": "Piece Simulator",
    "honing_calc_ilvl_lbl": "Calculated Gear iLvl",
    "honing_est_cp_lbl": "Estimated Combat Power",
    "honing_diff_ilvl_lbl": "iLvl Gain vs Base",
    "honing_diff_cp_lbl": "CP Gain vs Base",
    "honing_cost_gold_lbl": "Estimated Cost (Gold)",
    "honing_roi_lbl": "Gold / CP Ratio",
    "honing_str_est_lbl": "Estimated MainStat (STR/INT/DEX)",
    "honing_base_atk_lbl": "Base Attack Power",
    "honing_advice_header": "Optimization Recommendation (Gold / CP Efficiency)",
    "honing_btn_all_14": "All to +14",
    "honing_btn_all_16": "All to +16",
    "honing_btn_all_18": "All to +18",
    "honing_btn_all_20": "All to +20",
    "adv_btn_apply_plan": "Apply this Plan to Honing Simulator",
    "ark_main_title": "Ark Passive Simulator — Evolution, Enlightenment & Leap",
    "ark_tree_leap_subtext": "Hyper Awakening",
    "ark_tree_leap_points_lbl": "Leap points spent:",
    "ark_mult_leap_lbl": "Leap Battle Point",
    "ark_summary_header": "Effect on Combat Power",
    "ark_kpi_proj_cp": "Projected Combat Power",
    "ark_kpi_global_buff": "Ark Passive multiplier",
    "ark_kpi_allocated_pts": "Points spent",
    "ark_kpi_setup_eff": "Left to gain",
    "ark_analysis_header": "How it is computed:",
    "astro_header_title": "Astrogem Evaluator & Grader (T4 Astrogem Grader)",
    "astro_sec1_heading": "1. Chassis & Core Affixes",
    "astro_eff_cost_lbl": "Effective cost in core:",
    "astro_gain_sub": "Net contribution per party member",
    "astro_viability_sub": "17-point core cornerstone",
    "opt_roi_advice_header": "Simulation cost-efficiency",
    "canon_analysis_title": "Official Formula Analysis:",
    "canon_analysis_dps": "For <strong>DPS</strong>, the base value is 2.88 × base AP, with base AP = <code>√(main stat × weapon power ÷ 6) × (1 + AP %)</code>; every other Battle Point part multiplies it.",
    "canon_analysis_sup": "For <strong>supports</strong>, CP adds a buff branch (1.24 × base AP, multiplied by the offensive parts) and a defense branch (12 × max HP, multiplied by the defensive parts).",
    "canon_analysis_delta": "In-game CP ÷ rebuilt CP, measured on 70 profiles: 0.99 to 1.04 (DPS), 0.96 to 0.99 (support). This gap is unexplained; beyond it, parts are missing on lostark.bible.",
    "canon_col_detail": "System & Detail",
    "canon_col_val": "Raw Value / Roll",
    "canon_col_mult": "Net Multiplier",
    "canon_col_impact": "Role Impact",
    "pred_gem_opt_full10": "Full Deck 11x Lv. 10 Endgame Gems (+1,000 to +1,250 CP)",
    "honing_gear_levels_title": "T4 Honing Levels (Gear)",
    "ark_btn_current_points": "Current Character Points",
    "ark_btn_max_points": "All points at max",
    "astro_order_sub": "Direct multiplier above the 17-point threshold (+0.16% per point).",
    "astro_eff1_lvl_lbl": "Effect 1 Level:",
    "astro_eff2_lvl_lbl": "Effect 2 Level:",
    "astro_cost_sub": "8 Base − 5 Willpower",
    "opt_th_gain": "Party Gain",
    "canon_sub_ingame": "Tracked from lostark.bible profile",
    "canon_sub_calc": "Accuracy: ±1.7% vs in-game",
    "raid_badge": "T4 raid gold income",
    "raid_title": "Weekly Raid & Gold Revenue Tracker",
    "raid_subtitle": "Automated tracking for your 18 weekly gold raids (Horizon Cathedral, Serca, Final Act: Kazeros) synced with LOA Logs.",
    "raid_reset_lbl": "Next Reset:",
    "raid_btn_sync": "Refresh",
    "raid_agent_online": "Agent Connected (Live)",
    "raid_agent_offline": "Agent Offline (Cached Mode)",
    "raid_agent_checking": "Connecting Agent...",
    "raid_kpi_earned_lbl": "Weekly Gold Earned",
    "raid_kpi_remaining_lbl": "Gold Remaining to Claim",
    "raid_kpi_progress_lbl": "Raid Clears Progress",
    "raid_kpi_potential_lbl": "Total Weekly Potential",
    "raid_kpi_potential_sub": "6 characters × 3 max raids",
    "raid_kpi_gates_sub": "{cleared} / {total} Gates Cleared",
    "raid_kpi_earned_sub": "{pct}% of weekly potential",
    "raid_kpi_remaining_sub": "Across {raids} eligible raids",
    "raid_chest_label": "Chests (-{cost} g)",
    "raid_cathedral": "Horizon Cathedral",
    "raid_serca": "Serca",
    "raid_kazeros": "Final Act: Kazeros",
    "raid_cleared_at": "Cleared on {time}",
    "raid_btn_agent_download": "Install Agent",
    "raid_net_gold": "Weekly Gold Earned",
    "raid_btn_mark_all": "Clear All",
    "raid_btn_all_chests": "All Chests",
    "agent_modal_title": "Live Sync Agent (Local & Private)",
    "agent_modal_subtitle": "Automatically sync your raid clears and weekly gold rewards from LOA Logs in real time.",
    "agent_step1_title": "1. Download",
    "agent_step1_desc": "Choose the standalone executable (.exe) or the script (.zip).",
    "agent_step2_title": "2. Launch",
    "agent_step2_desc": "Double-click to start your local agent (port 4848).",
    "agent_step3_title": "3. That's it.",
    "agent_step3_desc": "Your gates and gold sync in real time without manual input.",
    "agent_dl_exe_title": "Standalone Executable (.exe)",
    "agent_dl_exe_badge": "Recommended • Zero Setup",
    "agent_dl_exe_desc": "Ready to run. No prerequisites required, just double-click and raid.",
    "agent_dl_exe_btn": "Download LostArkRaidAgent.exe",
    "agent_dl_zip_title": "Script Archive (.zip)",
    "agent_dl_zip_badge": "Ultra-light (6 KB) • Open Source",
    "agent_dl_zip_desc": "Includes start-agent.bat and open-source JS code. Requires Node.js.",
    "agent_dl_zip_btn": "Download Script (.zip)",
    "agent_privacy_notice": "100% Local & Private: The agent runs exclusively on your PC (http://127.0.0.1:4848). Your credentials and logs are never uploaded online.",
    "agent_modal_close": "Close",
    "tab_market": "Market & Stronghold",
    "card_title_acc": "T4 Accessories",
    "card_title_bracelet": "T4 Bracelet",
    "card_title_astro": "Astrogems",
    "card_title_gpd": "Cheapest Next 1%",
    "score_acc_dmg": "Exact Damage",
    "score_gpd_per": "per 1% Dmg",
    "gpd_chart_link": "GPD ➔",
    "mkt_title": "Market & Stronghold",
    "mkt_subtitle": "EUC auction house prices used by the calculations, and profitability of Stronghold workshop fusions.",
    "mkt_prices_title": "Market prices (EUC)",
    "mkt_th_item": "Item",
    "mkt_th_price": "Price",
    "mkt_craft_title": "Stronghold fusions",
    "mkt_craft_desc": "Game recipes (one per trade skill). Read your bonuses in your Stronghold workshop.",
    "mkt_lbl_cost_red": "Gold cost reduction (%)",
    "mkt_lbl_time_red": "Time reduction (%)",
    "mkt_lbl_gs": "Great Success bonus (%)",
    "mkt_lbl_mats": "Materials",
    "mkt_mats_buy": "Bought at the auction house",
    "mkt_mats_own": "Gathered (resale value, after tax)",
    "mkt_th_recipe": "Recipe",
    "mkt_th_unit_cost": "Cost / unit",
    "mkt_th_profit": "Profit / craft",
    "mkt_th_roi": "ROI",
    "mkt_th_per_hour": "Gold / hour",
    "gpd_upgrade_next_lbl": "Best ratio",
    "gpd_filter_goal_lbl": "Goal",
    "gpd_goal_all": "All",
    "gpd_table_title": "Ranked by efficiency",
    "gpd_table_sub": "Cheapest first, on your current gear. Steps in your goal plan are highlighted.",
    "gpd_th_system": "System",
    "gpd_th_next": "Step",
    "gpd_th_rate": "Gold / 1%",
    "gpd_th_cpgain": "+CP",
    "gpd_th_status": "Status",
    "gpd_th_rank": "#",
    "gpd_th_cost": "Cost (g)",
    "gpd_th_gain": "Gain",
    "gpd_th_tier": "Tier",
    "gpd_pieces_title": "Piece by piece (Accessories & Bracelet)",
    "gpd_pieces_sub": "Detected rolls and lines on each accessory piece. Rings and earrings are placed on the weaker of the two.",
    "gpd_th_piece": "Piece",
    "gpd_th_piece_ladder": "As the ladder reads it",
    "gpd_th_piece_lines": "Lines on it",
    "tab_benchmark": "Benchmark & Comparator",
    "tab_belgardin": "Belgardin: readiness and bracer",
    "tab_badge_soon": "Soon",
    "tab_rotation": "Rotation analysis",
    "tab_badge_beta": "Beta",
    "rot_title": "Rotation analysis (LOA Logs)",
    "rot_subtitle": "An execution score out of 100 and advice to improve, from your fights recorded by LOA Logs and compared with players of your spec on the same boss: skills, time spent doing nothing, support buffs, positioning, build.",
    "rot_pick": "Choose encounters.db",
    "rot_where": "The file is in the LOA Logs folder, next to <code>LOA Logs.exe</code>. Default location: paste <code>%LOCALAPPDATA%\\LOA Logs</code> into the address bar of the file picker.",
    "rot_privacy": "The file stays on your PC: your browser reads it, nothing is uploaded. Only the pages needed are read, even for a database of several GB.",
    "rot_date_label": "Raid day",
    "rot_latest": "Last 10 raids",
    "rot_resume": "Resume encounters.db",
    "rot_sync": "Sync now",
    "belg_title": "Belgardin: readiness and T4 bracer",
    "belg_subtitle": "The bracer (완갑) comes with the Belgardin shadow raid (Normal 1750, Hard 1770, Nightmare 1780). It drops as Heroic on the first Gate 2 clear, hones from +0 to +25 and changes grade at +10, +15 and +20. This tab tells whether your characters have the CP for each difficulty and what is left to upgrade, and projects the bracer, which no European player has yet.",
    "bracer_slider_title": "Projected Honing Level",
    "belg_from": "Starting point",
    "belg_costs_title": "Stockpile plan",
    "belg_sources": "Sources:",
    "bracer_heroic": "Heroic",
    "bracer_legendary": "Legendary",
    "bracer_relic": "Relic",
    "bracer_ancient": "Ancient",
    "bench_badge": "T4 benchmark",
    "bench_title": "Profile Comparator & Benchmark Reference",
    "bench_subtitle": "Compare your character to a peer reference profile with the same class, same specialization, and similar iLvl to spot differences and close the CP gap.",
    "bench_btn_auto": "Auto-Match Best",
    "bench_select_lbl": "Reference profiles:",
    "bench_gem_filter_lbl": "Gem Tier:",
    "bench_filter_all": "All Profiles",
    "bench_filter_gem8": "Full Level 8 Gems",
    "bench_filter_gem9": "Gems 9+",
    "bench_search_placeholder": "Search character (e.g. Siwilpal, Lavieenrosee, Lethimsmashh...)",
    "bench_btn_compare": "Compare",
    "bench_card_player_title": "My Character",
    "bench_card_target_title": "Benchmark Profile",
    "bench_delta_title": "Combat Power Gap",
    "bench_same_ilvl_note": "Similar iLvl bracket",
    "bench_view_bible": "View on lostark.bible",
    "bench_gap_title": "Gap Diagnostic: Where to gain your next CP points?",
    "bench_gap_sub": "Systems ranked by potential CP gain to reach or surpass the reference profile.",
    "bench_table_title": "System-by-System Comparative Breakdown (% & Tiers)",
    "bench_th_system": "System & Component",
    "bench_th_player": "My Character",
    "bench_th_target": "Reference Profile",
    "bench_th_delta": "Relative Gap",
    "bench_th_cp": "CP Impact",
    "bench_th_priority": "Optimization Advice",
    "bench_plan_title": "Recommended Action Plan (Best ROI Order)",
    "bench_plan_sub": "The most cost-effective upgrades in gold to close the gap with the benchmark.",
    "bench_prio_high": "High Priority",
    "bench_prio_med": "Cost Effective",
    "bench_prio_equal": "Equal",
    "bench_prio_opt": "Endgame / Expensive",
    "bench_prio_derived": "Via gear",
    "bench_toggle_show_equal": "Show equivalent systems (0% delta) ▾",
    "bench_region_title": "Server Region",
    "bench_region_auto": "Region: Auto",
    "bench_region_ce": "Europe (CE)",
    "bench_region_nae": "North America East (NAE)",
    "bench_region_naw": "North America West (NAW)",
    "bench_region_sa": "South America (SA)",
    "welcome_modal_title": "Welcome to Lost Ark CP & Optimizer T4",
    "welcome_modal_sub": "Analyze your character and calculate real Combat Power in a few clicks",
    "welcome_modal_intro": "Enter your main character name to instantly load stats, honing and roster from lostark.bible:",
    "welcome_char_name_lbl": "Character Name",
    "welcome_btn_fetch": "Load my character",
    "welcome_more_options": "More options: lostark.bible sign-in, manual import",
    "btn_refresh_all_roster": "Refresh All",
    "btn_share_char": "Share",
    "tt_sync_roster": "Sync your own roster from lostark.bible",
    "tt_manage_roster": "Manage or refresh your characters",
    "alt_char_portrait": "Character portrait",
    "tt_share_char": "Copy this character's direct link to send to a friend",
    "tt_card_acc": "Click to see the T4 accessories",
    "tt_card_bracelet": "Click to analyze the bracelet",
    "tt_card_astro": "Click to see the astrogems",
    "tt_card_gpd": "Click to open the Smart Advisor / GPD",
    "tt_weekly_reset": "Weekly reset every Wednesday at 12:00 CEST",
    "tt_refresh_sync": "Refresh the sync",
    "tt_install_agent": "Install or download the local agent",
    "tt_mark_all_cleared": "Mark every roster raid as cleared",
    "tt_toggle_all_chests": "Turn all bonus chests on / off",
    "aria_bracer_level": "Bracer level",
    "tt_bench_auto": "Automatically picks the best profile (+1-3 iLvl, same gems, same class & spec)",
    "tt_close": "Close",
    "ph_welcome_name": "e.g. Àlphâ, Frieedhof, Siwilpal…",
    "page_title": "Lost Ark T4 CP / iLvl Calculator & Predictor",
    "btn_close": "Got it.",
    "agent_compatibility_notice": "Compatible with LOA Logs / Lost Ark Logs (%LOCALAPPDATA%\\LOA Logs\\encounters.db).",
    "help_belg_title": "Belgardin",
    "help_belg": "CP needed per difficulty (KR public parties, minimum DPS), roster status and a priced upgrade plan; T4 bracer projection before its EU release: estimated cost and gain per level, with the source of each value.",
    "help_rotation_title": "Rotation analysis",
    "help_rotation": "Load your LOA Logs encounters.db (read in your browser, never uploaded): an execution score per raid compared with your spec, and advice to improve.",
    "char_active_default": "Active Character"
  }
};

  let currentLang = 'en';

  function getStoredLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'fr') return stored;
    } catch (e) {}
    
    return 'en';
  }

  function setLang(lang) {
    if (lang !== 'fr' && lang !== 'en') lang = 'en';
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}

    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.lang = lang;

      // Update Toggle Buttons
      const btnFr = document.getElementById('langFr');
      const btnEn = document.getElementById('langEn');
      if (btnFr) btnFr.classList.toggle('active', lang === 'fr');
      if (btnEn) btnEn.classList.toggle('active', lang === 'en');

      // Apply translations to static DOM elements
      applyTranslations();
    }

    // Dispatch event so dynamic JS views can refresh
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
  }

  function t(key, fallback = '') {
    const langDict = DICTIONARY[currentLang] || DICTIONARY.en;
    if (langDict[key] !== undefined) return langDict[key];
    // Clé absente d'une langue : l'anglais (langue par défaut du site), jamais le français en mode anglais
    const enDict = DICTIONARY.en;
    if (enDict[key] !== undefined) return enDict[key];
    return fallback || key;
  }

  const hasKey = key => DICTIONARY.en[key] !== undefined || DICTIONARY.fr[key] !== undefined;

  function applyTranslations() {
    // 1. Text elements
    // Clé inconnue : le texte du HTML reste (jamais le nom de la clé à l'écran)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (hasKey(key)) el.innerHTML = t(key);
    });

    // 2. Title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (hasKey(key)) el.setAttribute('title', t(key));
    });

    // 3. Placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (hasKey(key)) el.setAttribute('placeholder', t(key));
    });

    // 4. Texte alternatif et aria-label
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-alt');
      if (hasKey(key)) el.setAttribute('alt', t(key));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (hasKey(key)) el.setAttribute('aria-label', t(key));
    });

    // 5. Titre de l'onglet du navigateur et description
    if (hasKey('page_title')) document.title = t('page_title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta && hasKey('page_description')) meta.setAttribute('content', t('page_description'));
  }

  function init() {
    currentLang = getStoredLang();
    document.documentElement.lang = currentLang;

    // Attach click listeners to language buttons
    const btnFr = document.getElementById('langFr');
    const btnEn = document.getElementById('langEn');
    if (btnFr) btnFr.addEventListener('click', () => setLang('fr'));
    if (btnEn) btnEn.addEventListener('click', () => setLang('en'));

    // Initial translation pass once DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setLang(currentLang);
      });
    } else {
      setLang(currentLang);
    }
  }

  function formatEngravingName(rawName, lang = currentLang) {
    if (!rawName) return '';
    if (lang === 'en') {
      const match = rawName.match(/^([^(]+)/);
      return match ? match[1].trim() : rawName;
    }
    return rawName;
  }

  function formatCardName(rawName, lang = currentLang) {
    if (!rawName) return '';
    if (lang === 'en') {
      const match = rawName.match(/^([^(]+)/);
      return match ? match[1].trim() : rawName;
    }
    return rawName;
  }

  function translateCanonicalItem(it, isEn = (currentLang === 'en')) {
    if (!it) return it;
    const clone = { ...it };
    if (!isEn) {
      // Effets passifs des bijoux : nom de la stat en anglais dans le dictionnaire du profil
      if (typeof clone.note === 'string') {
        clone.note = clone.note.replace(/: Meter Gain \+/g, ': Gain de jauge +').replace(/: Outgoing Damage \+/g, ': Dégâts infligés +')
          .replace(/: Damage to foes \+/g, ': Dégâts aux ennemis +');
      }
      return clone;
    }

    const catMap = {
      'Base': 'Base',
      'Stat de Base': 'Base Stat',
      'Niveau': 'Level',
      'Qualité': 'Quality',
      'Arme': 'Weapon',
      'Armure': 'Armor',
      'Accessoires': 'Accessories',
      'Bracelet': 'Bracelet',
      'Gravures': 'Engravings',
      'Karma': 'Karma',
      'Ark Passive': 'Ark Passive',
      'Grille d\'Ark': 'Ark Grid',
      'Ark Grid': 'Ark Grid',
      'Gemmes': 'Gems',
      'Cartes': 'Card Set',
      'Familier': 'Pet',
      'Élixir': 'Elixirs',
      'Elixirs': 'Elixirs',
      'Transcendance': 'Transcendence',
      'Effets Spéciaux': 'Special Effects'
    };

    const origCat = clone.cat;
    if (catMap[clone.cat]) clone.cat = catMap[clone.cat];

    if (clone.type) {
      let t = clone.type;
      t = t.replace('Buff Dégâts', 'Raid Buff')
           .replace('Soin & Bouclier', 'Heal & Shield')
           .replace('DPS Solo', 'Solo DPS')
           .replace('DPS Net', 'Net DPS');
      clone.type = t;
    }

    if (clone.val && typeof clone.val === 'string') {
      clone.val = clone.val
        .replace(/Niv\.\s*/g, 'Lv. ')
        .replace(/^Qualité\s*/, 'Quality ')
        .replace(/^Rang (\d+)/, 'Rank $1');
    }
    if (clone.mult && typeof clone.mult === 'string') clone.mult = clone.mult.replace(/% à \+/g, '% to +');

    if (clone.label && typeof clone.label === 'string') {
      let l = clone.label;
      l = l.replace(/(?:Puissance d'Attaque|Attack Power)\s+d'Allié/g, 'Ally Attack Power')
           .replace(/Attaque de Base/g, 'Base Attack Power')
           .replace(/Arme:/g, 'Weapon:')
           .replace(/Points de Vie Maximum \(Vitalité\)/g, 'Max HP (Vitality)')
           .replace(/Niveau de Personnage/g, 'Character Level')
           .replace(/Qualité d'Arme/g, 'Weapon Quality')
           .replace(/Ark Passive — Évolution/g, 'Ark Passive — Evolution')
           .replace(/Ark Passive — Illumination/g, 'Ark Passive — Enlightenment')
           .replace(/Ark Passive — Bond/g, 'Ark Passive — Leap')
           .replace(/Karma T4 — Rang d'Évolution/g, 'Karma T4 — Evolution Rank')
           .replace(/Rang (\d+) à (\d+)/g, 'Rank $1 to $2')
           .replace(/Karma T4 — Niveau de Bond/g, 'Karma T4 — Leap Level')
           .replace(/Niv\. (\d+) à (\d+)/g, 'Lv. $1 to $2')
           .replace(/Armure T4 — Plastron/g, 'T4 Armor — Chest')
           .replace(/Armure T4 — Pantalon/g, 'T4 Armor — Pants')
           .replace(/Armure T4 — Casque/g, 'T4 Armor — Helmet')
           .replace(/Armure T4 — Épaulières/g, 'T4 Armor — Pauldrons')
           .replace(/Armure T4 — Gants/g, 'T4 Armor — Gloves')
           .replace(/Arme T4/g, 'T4 Weapon')
           .replace(/Affinage Avancé/g, 'Advanced Honing')
           .replace(/Collier\s*—\s*/g, 'Necklace — ')
           .replace(/Boucle d'oreille #(\d+)\s*—\s*/g, 'Earring #$1 — ')
           .replace(/Anneau #(\d+)\s*—\s*/g, 'Ring #$1 — ')
           .replace(/Efficacité Bouclier \/ Soins/g, 'Shield / Heal Effectiveness')
           .replace(/Dégâts Critiques/g, 'Crit Damage')
           .replace(/Dégâts Additionnels/g, 'Additional Damage')
           .replace(/Puissance d'Arme/g, 'Weapon Power')
           .replace(/Dégâts d'Allié/g, 'Ally Damage')
           .replace(/Dégâts d'Évolution/g, 'Evolution Damage')
           .replace(/Dégâts de Compétence/g, 'Skill Damage')
           .replace(/Dégâts Sortants/g, 'Outgoing Damage')
           .replace(/Dégâts infligés/g, 'Outgoing Damage')
           .replace(/Puissance d'Attaque/g, 'Attack Power')
           .replace(/Bracelet Ancien\s*—\s*/g, 'Ancient Bracelet — ')
           .replace(/Marteau/g, 'Hammer')
           .replace(/Dégâts Coup Crit/g, 'Crit Hit Damage')
           .replace(/Précision/g, 'Precision')
           .replace(/Taux Critique/g, 'Crit Rate')
           .replace(/Dextérité/g, 'Dexterity')
           .replace(/Force/g, 'Strength')
           .replace(/Intelligence/g, 'Intelligence')
           .replace(/Rapidité/g, 'Swiftness')
           .replace(/Spécialisation/g, 'Specialization')
           .replace(/Critique/g, 'Crit')
           .replace(/Vitalité/g, 'Vitality')
           .replace(/Défense Magique/g, 'Mag. Defense')
           .replace(/Défense Physique/g, 'Phys. Defense')
           .replace(/Points de Vie/g, 'Max HP')
           .replace(/Roll Spécial \(#(\d+)\)/g, 'Special Roll (#$1)')
           .replace(/Coinçage \/ Dégâts Additionnels/g, 'Wedge / Additional Damage')
           .replace(/Ovation \/ Vulnérabilité Crit/g, 'Cheers / Crit Vulnerability')
           .replace(/Exposition Crit/g, 'Crit Exposure')
           .replace(/Poignard \/ Faiblesse/g, 'Dagger / Weakness')
           .replace(/Ferveur/g, 'Fervor')
           .replace(/Dégâts Crit/g, 'Crit Dmg')
           .replace(/Résistance Crit/g, 'Crit Resistance')
           .replace(/Défense/g, 'Defense')
           .replace(/AP Allié/g, 'Ally AP')
           .replace(/Grille d'Ark\s*—\s*/g, 'Ark Grid — ')
           .replace(/Astrogemmes\s*—\s*/g, 'Astrogems — ')
           .replace(/Ally Damage Enh\. \((?![^)]*\d)[^)]+\)/g, 'Ally Damage Enh.')
           .replace(/Brand Power \((?![^)]*\d)[^)]+\)/g, 'Brand Power')
           .replace(/Ally Attack Enh\. \((?![^)]*\d)[^)]+\)/g, 'Ally Attack Enh.')
           .replace(/Attack Power \((?![^)]*\d)[^)]+\)/g, 'Attack Power')
           .replace(/Additional Damage \((?![^)]*\d)[^)]+\)/g, 'Additional Damage')
           .replace(/Dégâts aux Boss \((?![^)]*\d)[^)]+\)/g, 'Boss Damage')
           .replace(/Cœur Solaire/g, 'Solar Core')
           .replace(/Cœur Lunaire/g, 'Lunar Core')
           .replace(/Gemme T4 Niv\.\s*(\d+)/g, 'T4 Gem Lv. $1')
           .replace(/\(Dégâts Majeurs\)/g, '(Major Damage)')
           .replace(/\(Dégâts \+/g, '(Damage +')
           .replace(/\(Recharge -/g, '(Cooldown -')
           .replace(/^Familier$/, 'Pet')
           .replace(/\(Dégâts\)/g, '(Damage)')
           .replace(/Gemme de Dégâts/g, 'Damage Gem')
           .replace(/Gemme de Recharge/g, 'Cooldown Gem');

      // Bijoux support, bracelet, astrogemmes, cartes : textes FR restants (relevés sur les 70 profils en cache)
      const braceletNames = {
        "Attaque par l'Arrière": 'Back Attack', 'Coinçage': 'Wedge', 'Compétences Non Directionnelles': 'Non-Directional Skills',
        'Dégâts Monstres Inférieurs': 'Damage to Lesser Monsters', 'Immunité Paralysie / Repoussement': 'Paralysis / Push Immunity',
        'Rechargement Esquive / Relèvement': 'Evade / Stand Up Cooldown'
      };
      l = l.replace(/^(Ancient Bracelet|Relic Bracelet|Bracelet) — ([^(]+?)\s*\(([^)]*)\)$/, (m, head, fr, inner) => {
        const name = braceletNames[fr.trim()];
        if (/[A-Za-z]{3,}/.test(inner) && !/Démons/.test(inner)) return `${head} — ${inner}`;
        return `${head} — ${name || fr.trim()} (${inner.replace(/\s*&\s*Démons/, ' & Demons')})`;
      });
      l = l.replace(/Max HP Max/g, 'Max HP')
           .replace(/Neutralisation/g, 'Stagger')
           .replace(/, & Vitesse/g, ' & Speed')
           .replace(/ Cumulable$/g, ' (stackable)')
           .replace(/ \/ Marque/g, '')
           .replace(/Boucliers aux Membres du Groupe/g, 'Party Shield')
           .replace(/Soins aux Membres du Groupe/g, 'Party Heal')
           .replace(/Gain de Jauge d'Identité/g, 'Identity Gauge Gain')
           .replace(/Effet Amplification (.+?)( \(|$)/g, '$1 Amplification$2')
           .replace(/Effet Augmentation (.+?)( \(|$)/g, '$1 Increase$2')
           .replace(/Récupération PV en Combat/g, 'Combat HP Recovery')
           .replace(/Points de Mana Max/g, 'Max MP')
           .replace(/Bonus Durée Altération État/g, 'Status Effect Duration Bonus')
           .replace(/Ligne Affinée/g, 'Refined Line')
           .replace(/Ligne d'Affinage/g, 'Refining Line')
           .replace(/Composant Type #/g, 'Component Type #')
           .replace(/Stats de Combat/g, 'Combat Stats')
           .replace(/ — Niv\. (\d+)$/g, ' — Lv. $1')
           // Cartes : « Nom EN (Nom FR) (Rang N) » → « Nom EN (Rank N) »
           .replace(/\s*\([^()]*\)\s*\(Rang (\d+)\)$/, ' (Rank $1)')
           .replace(/\(Rang (\d+)\)/g, '(Rank $1)');

      if (origCat === 'Gravures' || origCat === 'Engravings') {
        l = l.replace(/([A-Za-z' -]+)\s*\([^)]+\)(\s*—\s*Pierre\s*\+\d+)?/, (match, engName, stonePart) => {
          let res = engName.trim();
          if (stonePart) {
            res += stonePart.replace('Pierre', 'Stone');
          }
          return res;
        });
      }

      clone.label = l;
    }

    if (clone.note && typeof clone.note === 'string') {
      let n = clone.note;
      const statNames = {
        'force': 'Strength',
        'dextérité': 'Dexterity',
        'intelligence': 'Intelligence',
        'vitalité': 'Vitality',
        'rapidité': 'Swiftness',
        'spécialisation': 'Specialization',
        'critique': 'Crit',
        'expertise': 'Expertise'
      };

      n = n.replace(/Dégâts de bond solo perso : exclu du Buff Power en Support\./g,
                    'Solo leap damage: excluded from Buff Power for Support.');
      n = n.replace(/Dégâts Critiques solo perso : non transférés aux alliés en Support \(exclu du Buff Power\)\./g,
                    'Solo Crit Damage: not transferred to allies for Support (excluded from Buff Power).');
      n = n.replace(/Bonus de dégâts solo perso : 0% transféré aux alliés \(exclu du Buff Power\)\./g,
                    'Solo personal damage bonus: 0% transferred to allies (excluded from Buff Power).');
      n = n.replace(/Stat brute de ([a-zàâéèêëîïôöùûüç]+) déjà intégrée directement dans l'Attaque de Base(?:\s*\(Base AP\))? en tête de liste\./g,
                    (m, s) => `Raw ${statNames[s.toLowerCase()] || s} stat is already included directly in Base Attack (Base AP) at the top of the list.`);
      n = n.replace(/Stat brute de puissance d'arme déjà intégrée directement dans l'Attaque de Base(?:\s*\(Base AP\))? en tête de liste\./g,
                    'Raw Weapon Power stat is already included directly in Base Attack (Base AP) at the top of the list.');
      n = n.replace(/Stat brute de ([a-zàâéèêëîïôöùûüç]+) déjà intégrée directement dans les HP Maximum en tête de liste\./g,
                    (m, s) => `Raw ${statNames[s.toLowerCase()] || s} stat is already included directly in Max HP at the top of the list.`);
      n = n.replace(/Stat brute de ([a-zàâéèêëîïôöùûüç]+) déjà intégrée directement dans les Stats de Combat en tête de liste\./g,
                    (m, s) => `Raw ${statNames[s.toLowerCase()] || s} stat is already included directly in Combat Stats at the top of the list.`);
      n = n.replace(/Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste\./g,
                    'Raw stat is already included directly in Base Attack or Vitality at the top of the list.');
      n = n.replace(/Bonus passif d'accessoire T4 \(Rang (\d+)\) : Dégâts infligés \+([0-9.]+)% \(Outgoing Damage\)\./g,
                    'T4 accessory passive bonus (Rank $1): Outgoing Damage +$2%.');
      n = n.replace(/Fourchette donnée par le Battle Point du profil \(minimum ~ maximum\)\./g,
                    'Range given by the profile Battle Point (minimum ~ maximum).');
      n = n.replace(/Stat support \(\+([0-9.]+)%\) : non applicable aux dégâts solo en DPS \(Smilegate Battle Point\)\./g,
                    'Support stat (+$1%): not applicable to solo DPS (Smilegate Battle Point).');
      n = n.replace(/Effet in-game : \+([0-9.]+)% Puissance d'Attaque \(cumul des astrogemmes\)\. Multiplicateur Smilegate CP : \+([0-9.]+)% (DPS Net|Buff Power)\./g,
                    'In-game effect: +$1% Attack Power (astrogem sum). Smilegate CP multiplier: +$2% $3.');
      n = n.replace(/Effet in-game : \+([0-9.]+)% Dégâts Additionnels \(cumul des astrogemmes\)\. Multiplicateur Smilegate CP : \+([0-9.]+)% (DPS Net|Buff Power)\./g,
                    'In-game effect: +$1% Additional Damage (astrogem sum). Smilegate CP multiplier: +$2% $3.');
      n = n.replace(/Effet in-game : \+([0-9.]+)% Dégâts aux Boss \(cumul des astrogemmes\)\. Multiplicateur Smilegate CP : \+([0-9.]+)% (DPS Net|Buff Power)\./g,
                    'In-game effect: +$1% Boss Damage (astrogem sum). Smilegate CP multiplier: +$2% $3.');
      n = n.replace(/Effet in-game : \+([0-9.]+)% Amélioration Dégâts Alliés \(cumul des astrogemmes\)\. Multiplicateur Smilegate CP : \+([0-9.]+)% (DPS Net|Buff Power)\./g,
                    'In-game effect: +$1% Ally Damage Amplification (astrogem sum). Smilegate CP multiplier: +$2% $3.');
      n = n.replace(/Effet in-game : \+([0-9.]+)% Puissance de Marque \(cumul des astrogemmes\)\. Multiplicateur Smilegate CP : \+([0-9.]+)% (DPS Net|Buff Power)\./g,
                    'In-game effect: +$1% Brand Power (astrogem sum). Smilegate CP multiplier: +$2% $3.');
      n = n.replace(/Effet in-game : \+([0-9.]+)% Amélioration AP Allié \(cumul des astrogemmes\)\. Multiplicateur Smilegate CP : \+([0-9.]+)% (DPS Net|Buff Power)\./g,
                    'In-game effect: +$1% Ally Attack Power Amplification (astrogem sum). Smilegate CP multiplier: +$2% $3.');
      const rawStat = {
        'amélioration ap allié': 'ally AP amplification', 'amélioration dégâts alliés': 'ally damage amplification',
        'dégâts additionnels': 'additional damage', 'dégâts aux boss': 'boss damage', "puissance d'attaque": 'attack power',
        'puissance de marque': 'brand power', 'défense magique': 'magic defense', 'défense physique': 'physical defense',
        'points de vie max': 'max HP', 'vitalité': 'Vitality', 'force': 'Strength', 'dextérité': 'Dexterity',
        'intelligence': 'Intelligence', 'rapidité': 'Swiftness', 'spécialisation': 'Specialization', 'critique': 'Crit'
      };
      const dest = {
        'Défense Magique': 'Magic Defense', 'Défense Physique': 'Physical Defense', 'Points de Vie Maximum (HP)': 'Max HP',
        'HP Maximum': 'Max HP', 'Stats de Combat': 'Combat Stats', "Attaque de Base": 'Base Attack'
      };
      n = n.replace(/Stat brute (.+?) solo perso \(\+([0-9.]+)%\) : exclue du calcul du Buff Power en Support \(Smilegate Battle Point\)\./g,
                    (m, st, v) => `Raw solo ${rawStat[st.toLowerCase()] || st} stat (+${v}%): excluded from Support Buff Power (Smilegate Battle Point).`);
      n = n.replace(/Stat brute de (.+?) déjà intégrée directement dans (?:la |les |l')(.+?) en tête de liste\./g,
                    (m, st, d) => `Raw ${rawStat[st.toLowerCase()] || st} stat is already included directly in ${dest[d] || d} at the top of the list.`);
      n = n.replace(/Stat brute déjà agrégée directement dans l'Attaque de Base ou les PV Max en tête de liste\./g,
                    'Raw stat is already included directly in Base Attack or Max HP at the top of the list.');
      n = n.replace(/La Puissance d'Arme augmente directement votre Attaque de Base & Base Val en tête de liste\. Elle est à \+([0-9.]+)% ici pour éviter un double comptage\./g,
                    'Weapon Power directly raises your Base Attack & Base Val at the top of the list. It is at +$1% here to avoid double counting.');
      const slotEn = { 'Collier': 'necklace', "Boucle d'oreille": 'earring', 'Anneau': 'ring' };
      n = n.replace(/Effet passif (Collier|Boucle d'oreille|Anneau)( Support)? T(\d)(?: \(Rang (\d+)\))? : (.+?)\./g,
                    (m, slot, sup, tier, rank, eff) => `${sup ? 'Support ' : ''}T${tier} ${slotEn[slot]} passive effect${rank ? ` (Rank ${rank})` : ''}: ${eff}.`);
      n = n.replace(/Stat solo perso : non transférée aux alliés en Support \(exclue du Buff Power\)\./g,
                    'Solo stat: not transferred to allies for Support (excluded from Buff Power).');
      n = n.replace(/Progression de niveau de bond de karma\./g, 'Karma leap level progression.');
      n = n.replace(/DPS Net/g, 'Net DPS');
      clone.note = n;
    }

    return clone;
  }

  // Expose
  root.i18n = {
    t,
    getLang: () => currentLang,
    setLang,
    applyTranslations,
    formatEngravingName,
    formatCardName,
    translateCanonicalItem,
    DICTIONARY
  };
  root.t = t;
  root.formatEngravingName = formatEngravingName;
  root.formatCardName = formatCardName;
  root.translateCanonicalItem = translateCanonicalItem;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.i18n;
  }

  if (typeof document !== 'undefined') {
    init();
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
