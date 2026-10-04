// Moteur canonique (Battle Point) et import des profils lostark.bible.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- 4c. MOTEUR CANONIQUE & IMPORTATION LIVE (LOSTARK.BIBLE) ---


// --- DICTIONNAIRES OFFICIELS CANONIQUES (Smilegate & lostark.bible) ---
const BIBLE_BRACELET_PERKS = {"11011":{"name":"Précision (Taux Critique +5% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +5%. Crit Hit Damage +1.5%."},"11012":{"name":"Précision (Taux Critique +4.2% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +4.2%. Crit Hit Damage +1.5%."},"11013":{"name":"Précision (Taux Critique +3.4% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +3.4%. Crit Hit Damage +1.5%."},"11014":{"name":"Précision (Taux Critique +2.6% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +2.6%. Crit Hit Damage +1.5%."},"11021":{"name":"Marteau (Dégâts Critiques +10% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +10%. Crit Hit Damage +1.5%."},"11022":{"name":"Marteau (Dégâts Critiques +8.4% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +8.4%. Crit Hit Damage +1.5%."},"11023":{"name":"Marteau (Dégâts Critiques +6.8% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +6.8%. Crit Hit Damage +1.5%."},"11024":{"name":"Marteau (Dégâts Critiques +5.2% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +5.2%. Crit Hit Damage +1.5%."},"11041":{"name":"Coinçage (Dégâts Additionnels +3.5% & Démons +2.5%)","desc":"Additional Damage +3.5%. Bonus vs. Demon/Archdemon +2.5%."},"11042":{"name":"Coinçage (Dégâts Additionnels +3% & Démons +2.5%)","desc":"Additional Damage +3%. Bonus vs. Demon/Archdemon +2.5%."},"11043":{"name":"Coinçage (Dégâts Additionnels +2.5% & Démons +2.5%)","desc":"Additional Damage +2.5%. Bonus vs. Demon/Archdemon +2.5%."},"11044":{"name":"Coinçage (Dégâts Additionnels +2% & Démons +2.5%)","desc":"Additional Damage +2%. Bonus vs. Demon/Archdemon +2.5%."},"11051":{"name":"Ferveur (Dégâts Sortants +5.5% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +5.5%."},"11052":{"name":"Ferveur (Dégâts Sortants +5% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +5%."},"11053":{"name":"Ferveur (Dégâts Sortants +4.5% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +4.5%."},"11054":{"name":"Ferveur (Dégâts Sortants +4% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +4%."},"11061":{"name":"Poignard / Faiblesse (Défense -2.5% & AP Allié +3%)","desc":"On hit, target's Defense -2.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +3%."},"11062":{"name":"Poignard / Faiblesse (Défense -2.1% & AP Allié +2.5%)","desc":"On hit, target's Defense -2.1% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2.5%."},"11063":{"name":"Poignard / Faiblesse (Défense -1.8% & AP Allié +2%)","desc":"On hit, target's Defense -1.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."},"11064":{"name":"Poignard / Faiblesse (Défense -1.5% & AP Allié +1.5%)","desc":"On hit, target's Defense -1.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +1.5%."},"11071":{"name":"Exposition Crit (Résistance Crit -2.5% & AP Allié +3%)","desc":"On hit, target's Crit Resistance -2.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +3%."},"11072":{"name":"Exposition Crit (Résistance Crit -2.1% & AP Allié +2.5%)","desc":"On hit, target's Crit Resistance -2.1% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2.5%."},"11073":{"name":"Exposition Crit (Résistance Crit -1.8% & AP Allié +2%)","desc":"On hit, target's Crit Resistance -1.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."},"11074":{"name":"Exposition Crit (Résistance Crit -1.5% & AP Allié +1.5%)","desc":"On hit, target's Crit Resistance -1.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +1.5%."},"11081":{"name":"Ferveur (Dégâts Sortants +1.3%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +1.3% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +3%."},"11082":{"name":"Ferveur (Dégâts Sortants +1.1%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +1.1% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +2.5%."},"11083":{"name":"Ferveur (Dégâts Sortants +0.9%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +0.9% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +2%."},"11084":{"name":"Ferveur (Dégâts Sortants +0.7%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +0.7% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +1.5%."},"11091":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -4.8% & AP Allié +3%)","desc":"On hit, target's Crit Damage -4.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +3%."},"11092":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -4.2% & AP Allié +2.5%)","desc":"On hit, target's Crit Damage -4.2% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2.5%."},"11093":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -3.6% & AP Allié +2%)","desc":"On hit, target's Crit Damage -3.6% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."},"11094":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -3% & AP Allié +1.5%)","desc":"On hit, target's Crit Damage -3% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +1.5%."},"11111":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +9,000. When your HP is 50% or higher, upon hit, Weapon Power +2,400 for 5s."},"11112":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +8,100. When your HP is 50% or higher, upon hit, Weapon Power +2,200 for 5s."},"11113":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +7,200. When your HP is 50% or higher, upon hit, Weapon Power +2,000 for 5s."},"11114":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +6,300. When your HP is 50% or higher, upon hit, Weapon Power +1,800 for 5s."},"11121":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +8,700. Upon hit, Weapon Power +150 for 120s every 30s. (Max. 30 stacks)"},"11122":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +7,800. Upon hit, Weapon Power +140 for 120s every 30s. (Max. 30 stacks)"},"11123":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +6,900. Upon hit, Weapon Power +130 for 120s every 30s. (Max. 30 stacks)"},"11124":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +6,000. Upon hit, Weapon Power +120 for 120s every 30s. (Max. 30 stacks)"},"11181":{"name":"Protection & Soins d'Allié (+3.5%)","desc":"Party Member protection and recovery effect +3.5%."},"11182":{"name":"Protection & Soins d'Allié (+3%)","desc":"Party Member protection and recovery effect +3%."},"11183":{"name":"Protection & Soins d'Allié (+2.5%)","desc":"Party Member protection and recovery effect +2.5%."},"11184":{"name":"Protection & Soins d'Allié (+2%)","desc":"Party Member protection and recovery effect +2%."},"11261":{"name":"Vitesse d'Attaque & Déplacement (+6%)","desc":"Atk./Move Speed +6%."},"11262":{"name":"Vitesse d'Attaque & Déplacement (+5%)","desc":"Atk./Move Speed +5%."},"11263":{"name":"Vitesse d'Attaque & Déplacement (+4%)","desc":"Atk./Move Speed +4%."},"11264":{"name":"Vitesse d'Attaque & Déplacement (+3%)","desc":"Atk./Move Speed +3%."},"11341":{"name":"Rechargement Esquive / Relèvement (-12%)","desc":"Movement Skill/Stand Up cooldown -12%."},"11342":{"name":"Rechargement Esquive / Relèvement (-10%)","desc":"Movement Skill/Stand Up cooldown -10%."},"11343":{"name":"Rechargement Esquive / Relèvement (-8%)","desc":"Movement Skill/Stand Up cooldown -8%."},"11344":{"name":"Rechargement Esquive / Relèvement (-6%)","desc":"Movement Skill/Stand Up cooldown -6%."},"77300001":{"name":"Shield and Healing effectiveness on all Party Memb","desc":"Shield and Healing effectiveness on all Party Members +6%. If target's HP is 50% or lower, +3% additional effectiveness."},"77300002":{"name":"When HP falls below 30%, gain a shield equal to 20","desc":"When HP falls below 30%, gain a shield equal to 20% of Max HP for 6s. If the shield is not destroyed after 6s, recover 50% of the remaining shield as HP. (Cooldown: 300s.)"},"605100031":{"name":"Embuscade (Dégâts Sortants +3% / Neutralisation)","desc":"Outgoing Damage +3%. Outgoing Damage +5% to Staggered foes."},"605100032":{"name":"Embuscade (Dégâts Sortants +2.5% / Neutralisation)","desc":"Outgoing Damage +2.5%. Outgoing Damage +4.5% to Staggered foes."},"605100033":{"name":"Embuscade (Dégâts Sortants +2% / Neutralisation)","desc":"Outgoing Damage +2%. Outgoing Damage +4% to Staggered foes."},"605100034":{"name":"Embuscade (Dégâts Sortants +1.5% / Neutralisation)","desc":"Outgoing Damage +1.5%. Outgoing Damage +3.5% to Staggered foes."},"605100101":{"name":"Ardeur (Puissance d'Arme +1,480, & Vitesse)","desc":"On hit, Weapon Power +1,480, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100102":{"name":"Ardeur (Puissance d'Arme +1,320, & Vitesse)","desc":"On hit, Weapon Power +1,320, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100103":{"name":"Ardeur (Puissance d'Arme +1,160, & Vitesse)","desc":"On hit, Weapon Power +1,160, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100104":{"name":"Ardeur (Puissance d'Arme +1,000, & Vitesse)","desc":"On hit, Weapon Power +1,000, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100131":{"name":"Dégâts Sortants (+3%)","desc":"Outgoing Damage +3%."},"605100132":{"name":"Dégâts Sortants (+2.5%)","desc":"Outgoing Damage +2.5%."},"605100133":{"name":"Dégâts Sortants (+2%)","desc":"Outgoing Damage +2%."},"605100134":{"name":"Dégâts Sortants (+1.5%)","desc":"Outgoing Damage +1.5%."},"605100151":{"name":"Attaque par l'Arrière (Back Attack +3.5%)","desc":"Back Attack Damage +3.5%."},"605100152":{"name":"Attaque par l'Arrière (Back Attack +3%)","desc":"Back Attack Damage +3%."},"605100153":{"name":"Attaque par l'Arrière (Back Attack +2.5%)","desc":"Back Attack Damage +2.5%."},"605100154":{"name":"Attaque par l'Arrière (Back Attack +2%)","desc":"Back Attack Damage +2%."},"605100161":{"name":"Attaque Frontale (Frontal Attack +3.5%)","desc":"Frontal Attack Damage +3.5%."},"605100162":{"name":"Attaque Frontale (Frontal Attack +3%)","desc":"Frontal Attack Damage +3%."},"605100163":{"name":"Attaque Frontale (Frontal Attack +2.5%)","desc":"Frontal Attack Damage +2.5%."},"605100164":{"name":"Attaque Frontale (Frontal Attack +2%)","desc":"Frontal Attack Damage +2%."},"605100171":{"name":"Compétences Non Directionnelles (+3.5%)","desc":"Non-directional Skill Damage +3.5%. Awakening Skills do not apply."},"605100172":{"name":"Compétences Non Directionnelles (+3%)","desc":"Non-directional Skill Damage +3%. Awakening Skills do not apply."},"605100173":{"name":"Compétences Non Directionnelles (+2.5%)","desc":"Non-directional Skill Damage +2.5%. Awakening Skills do not apply."},"605100174":{"name":"Compétences Non Directionnelles (+2%)","desc":"Non-directional Skill Damage +2%. Awakening Skills do not apply."},"605100271":{"name":"Dégâts Monstres Inférieurs (+6%)","desc":"Damage to Challenge or lower monsters +6%."},"605100272":{"name":"Dégâts Monstres Inférieurs (+5%)","desc":"Damage to Challenge or lower monsters +5%."},"605100273":{"name":"Dégâts Monstres Inférieurs (+4%)","desc":"Damage to Challenge or lower monsters +4%."},"605100274":{"name":"Dégâts Monstres Inférieurs (+3%)","desc":"Damage to Challenge or lower monsters +3%."},"605100281":{"name":"Réduction Dégâts Monstres Inférieurs (-10%)","desc":"Incoming Damage from Challenge or lower monsters -10%."},"605100282":{"name":"Réduction Dégâts Monstres Inférieurs (-8%)","desc":"Incoming Damage from Challenge or lower monsters -8%."},"605100283":{"name":"Réduction Dégâts Monstres Inférieurs (-6%)","desc":"Incoming Damage from Challenge or lower monsters -6%."},"605100284":{"name":"Réduction Dégâts Monstres Inférieurs (-4%)","desc":"Incoming Damage from Challenge or lower monsters -4%."},"605100351":{"name":"Immunité Paralysie / Repoussement (60s)","desc":"On hit, Paralysis and Push Immunity for 60s. (Cooldown: 60s) The effect is removed upon getting hit 1 time."},"605100352":{"name":"Immunité Paralysie / Repoussement (70s)","desc":"On hit, Paralysis and Push Immunity for 70s. (Cooldown: 70s) The effect is removed upon getting hit 1 time."},"605100353":{"name":"Immunité Paralysie / Repoussement (80s)","desc":"On hit, Paralysis and Push Immunity for 80s. (Cooldown: 80s) The effect is removed upon getting hit 1 time."},"605100354":{"name":"Immunité Paralysie / Repoussement (90s)","desc":"On hit, Paralysis and Push Immunity for 90s. (Cooldown: 90s) The effect is removed upon getting hit 1 time."}};
const BIBLE_ACCESSORY_PASSIVES = {"6000":{"name":"Gain de Jauge d'Identité (+1.60%)","desc":"Effet passif Collier Support T4 (Rang 1) : Meter Gain +1.60%."},"6001":{"name":"Gain de Jauge d'Identité (+3.60%)","desc":"Effet passif Collier Support T4 (Rang 2) : Meter Gain +3.60%."},"6002":{"name":"Gain de Jauge d'Identité (+6.00%)","desc":"Effet passif Collier Support T4 (Rang 3) : Meter Gain +6.00%."},"6010":{"name":"Gain de Jauge d'Identité (+0.72%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 1) : Meter Gain +0.72%."},"6011":{"name":"Gain de Jauge d'Identité (+1.62%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 2) : Meter Gain +1.62%."},"6012":{"name":"Gain de Jauge d'Identité (+2.70%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 3) : Meter Gain +2.70%."},"6020":{"name":"Gain de Jauge d'Identité (+0.90%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 1) : Meter Gain +0.90%."},"6021":{"name":"Gain de Jauge d'Identité (+2.07%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 2) : Meter Gain +2.07%."},"6022":{"name":"Gain de Jauge d'Identité (+3.45%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 3) : Meter Gain +3.45%."},"6030":{"name":"Gain de Jauge d'Identité (+1.11%)","desc":"Effet passif Anneau Support T4 (Rang 1) : Meter Gain +1.11%."},"6031":{"name":"Gain de Jauge d'Identité (+2.52%)","desc":"Effet passif Anneau Support T4 (Rang 2) : Meter Gain +2.52%."},"6032":{"name":"Gain de Jauge d'Identité (+4.20%)","desc":"Effet passif Anneau Support T4 (Rang 3) : Meter Gain +4.20%."},"621000000":{"name":"Dégâts infligés (+0.55%)","desc":"Effet passif Collier T4 (Rang 1) : Outgoing Damage +0.55%."},"621000001":{"name":"Dégâts infligés (+1.20%)","desc":"Effet passif Collier T4 (Rang 2) : Outgoing Damage +1.20%."},"621000002":{"name":"Dégâts infligés (+2.00%)","desc":"Effet passif Collier T4 (Rang 3) : Outgoing Damage +2.00%."},"621000010":{"name":"Dégâts aux ennemis (+0.24%)","desc":"Effet passif Boucle d'oreille T4 (Rang 1) : Damage to foes +0.24%."},"621000011":{"name":"Dégâts aux ennemis (+0.54%)","desc":"Effet passif Boucle d'oreille T4 (Rang 2) : Damage to foes +0.54%."},"621000012":{"name":"Dégâts aux ennemis (+0.90%)","desc":"Effet passif Boucle d'oreille T4 (Rang 3) : Damage to foes +0.90%."},"621000020":{"name":"Dégâts aux ennemis (+0.30%)","desc":"Effet passif Boucle d'oreille T4 (Rang 1) : Damage to foes +0.30%."},"621000021":{"name":"Dégâts aux ennemis (+0.69%)","desc":"Effet passif Boucle d'oreille T4 (Rang 2) : Damage to foes +0.69%."},"621000022":{"name":"Dégâts aux ennemis (+1.15%)","desc":"Effet passif Boucle d'oreille T4 (Rang 3) : Damage to foes +1.15%."},"621000030":{"name":"Dégâts aux ennemis (+0.37%)","desc":"Effet passif Anneau T4 (Rang 1) : Damage to foes +0.37%."},"621000031":{"name":"Dégâts aux ennemis (+0.84%)","desc":"Effet passif Anneau T4 (Rang 2) : Damage to foes +0.84%."},"621000032":{"name":"Dégâts aux ennemis (+1.40%)","desc":"Effet passif Anneau T4 (Rang 3) : Damage to foes +1.40%."}};
const BIBLE_ENGRAVINGS = {"107":"Disrespect (Mépris)","109":"Spirit Absorption (Absorption d'Esprit)","110":"Ether Predator (Prédateur d'Éther)","111":"Stabilized Status (Statut Stabilisé)","112":"Master of Slashes","114":"Twinkle Twinkle","116":"Servant","118":"Grudge (Rancune)","119":"Invincible Evasion","121":"Super Charge (Super Charge)","123":"Strong Will","125":"Mayhem (Carnage)","127":"Esoteric Skill Enhancement","129":"Enhanced Weapon (Arme Améliorée)","130":"Firepower Enhancement (Renforcement de Puissance de Feu)","133":"Balanced Defense","134":"Drops of Ether (Gouttes d'Éther)","140":"Crisis Evasion (Évasion d'Urgence)","141":"Keen Blunt Weapon (Arme Affûtée)","142":"Vital Point Hit (Frappe aux Points Vitaux)","157":"Master of Piercing","158":"Master of Destruction","167":"Max MP Increase (Augmentation Max de PM)","168":"MP Efficiency Increase","188":"Berserker Technique","189":"First Intention","190":"Ultimate Skill: Taijutsu","191":"Shock Training (Entraînement au Choc)","192":"Pistoleer (Pistolero)","193":"Barrage Enhancement (Renforcement de Barrage)","194":"True Courage (Vrai Courage)","195":"Desperate Salvation (Salut Désespéré)","196":"Rage Hammer (Marteau de Rage)","197":"Gravity Training (Entraînement Gravitationnel)","198":"Master Summoner","199":"Communication Overflow","200":"Grace of the Empress","201":"Order of the Emperor (Ordre de l'Empereur)","202":"Master of Escape","206":"Telescope","207":"Dynamite","211":"Master Net Caster","213":"Giant Tree","214":"Sapling","215":"4-Leaf Clover","217":"Entomologist","219":"Butcher","221":"Delicate Brush","224":"Combat Readiness (Préparation au Combat)","225":"Lone Knight (Chevalier Solitaire)","235":"Fortitude","236":"Crushing Fist","237":"Shield Piercing","238":"Master's Tenacity (Ténacité du Maître)","239":"Divine Protection","240":"Heavy Armor (Armure Lourde)","241":"Explosive Expert","242":"Enhanced Shield","243":"Necromancy","244":"Preemptive Strike (Frappe Préventive)","245":"Broken Bone","246":"Lightning Fury","247":"Cursed Doll (Poupée Maudite)","248":"Contender (Prétendant)","249":"Ambush Master (Maître des Arrières)","251":"Magick Stream (Flux Magique)","253":"Barricade (Barricade)","254":"Raid Captain (Capitaine de Raid)","255":"Awakening (Éveil)","256":"Energy Overflow","257":"Robust Spirit","258":"Loyal Companion (Compagnon Fidèle)","259":"Death Strike (Frappe Mortelle)","260":"Increase Mining Tools","261":"Relentless Miner","262":"Bomb Enthusiast","263":"Fishing Tools Increase","264":"Double Points","265":"Golden Bait","266":"Logging Tool Rank Boost","267":"Rapid Kick","268":"Increase Foraging Tools","269":"Deceptive Foraging","270":"Increase Hunting Tools","271":"Deadly Poison","272":"Golden Rabbit","273":"Increase Excavation Tools","274":"Loot Hunter","275":"Master Tamer","276":"Pinnacle (Pinacle)","277":"Control (Contrôle)","278":"Remaining Energy (Énergie Résiduelle)","279":"Surge (Déferlement)","280":"Perfect Suppression (Suppression Parfaite)","281":"Demonic Impulse (Impulsion Démoniaque)","282":"Judgment (Jugement)","283":"Blessed Aura (Aura Bénie)","284":"Arthetinean Skill (Compétence d'Arthetine)","285":"Evolutionary Legacy (Héritage de l'Évolution)","286":"Hunger","287":"Lunar Voice","288":"Master Brawler (Maître Bagarreur)","289":"Peacemaker","290":"Time to Hunt (Heure de la Chasse)","291":"Deathblow","292":"Esoteric Flurry","293":"Igniter (Ignition)","294":"Reflux (Reflux)","295":"Mass Increase (Augmentation de Masse)","296":"Propulsion (Propulsion)","297":"Hit Master (Maître de l'Embuscade)","298":"Sight Focus (Focalisation)","299":"Adrenaline (Adrénaline)","300":"All-Out Attack (Attaque Totale)","301":"Expert (Expert)","302":"Emergency Rescue (Sauvetage d'Urgence)","303":"Precise Dagger (Dague Précise)","305":"Recurrence (Récurrence)","306":"Full Bloom (Pleine Floraison)","307":"Wind Fury","308":"Drizzle","309":"Predator (Prédatrice)","310":"Punisher (Punitrice)","311":"Full Moon Harvester (Faucheuse de la Pleine Lune)","312":"Night's Edge (Lame de la Nuit)","314":"Brawl King Storm","315":"Asura's Path","800":"Atk. Power Reduction","801":"Defense Reduction","802":"Atk. Speed Reduction","803":"Move Speed Reduction","1107":"Disrespect (Mépris)","1109":"Spirit Absorption (Absorption d'Esprit)","1110":"Ether Predator (Prédateur d'Éther)","1111":"Stabilized Status (Statut Stabilisé)","1118":"Grudge (Rancune)","1121":"Super Charge (Super Charge)","1123":"Strong Will","1134":"Drops of Ether (Gouttes d'Éther)","1140":"Crisis Evasion (Évasion d'Urgence)","1141":"Keen Blunt Weapon (Arme Affûtée)","1142":"Vital Point Hit (Frappe aux Points Vitaux)","1167":"Max MP Increase (Augmentation Max de PM)","1168":"MP Efficiency Increase","1202":"Master of Escape","1235":"Fortitude","1236":"Crushing Fist","1237":"Shield Piercing","1238":"Master's Tenacity (Ténacité du Maître)","1239":"Divine Protection","1240":"Heavy Armor (Armure Lourde)","1241":"Explosive Expert","1242":"Enhanced Shield","1243":"Necromancy","1244":"Preemptive Strike (Frappe Préventive)","1245":"Broken Bone","1246":"Lightning Fury","1247":"Cursed Doll (Poupée Maudite)","1248":"Contender (Prétendant)","1249":"Ambush Master (Maître des Arrières)","1251":"Magick Stream (Flux Magique)","1253":"Barricade (Barricade)","1254":"Raid Captain (Capitaine de Raid)","1255":"Awakening (Éveil)","1288":"Master Brawler (Maître Bagarreur)","1295":"Mass Increase (Augmentation de Masse)","1296":"Propulsion (Propulsion)","1297":"Hit Master (Maître de l'Embuscade)","1298":"Sight Focus (Focalisation)","1299":"Adrenaline (Adrénaline)","1300":"All-Out Attack (Attaque Totale)","1301":"Expert (Expert)","1302":"Emergency Rescue (Sauvetage d'Urgence)","1303":"Precise Dagger (Dague Précise)","1800":"Atk. Power Reduction","1801":"Defense Reduction","1802":"Atk. Speed Reduction","1803":"Move Speed Reduction","10007":"","1000001":"","1000002":"","1000003":"","1000004":"","1000101":"","1000102":"","1000103":"","1000104":"","1000201":"","1000202":"","1000203":"","1000204":""};
const BIBLE_CORES = {"673000003":"Order Sun Core: Combination","673000004":"Order Sun Core: Combination","673000005":"Order Sun Core: Combination","673000006":"Order Sun Core: Combination","673000013":"Order Sun Core: Singularity","673000014":"Order Sun Core: Singularity","673000015":"Order Sun Core: Singularity","673000016":"Order Sun Core: Singularity","673000023":"Order Sun Core: Tactical Control","673000024":"Order Sun Core: Tactical Control","673000025":"Order Sun Core: Tactical Control","673000026":"Order Sun Core: Tactical Control","673000033":"Order Sun Core: Divine Power","673000034":"Order Sun Core: Divine Power","673000035":"Order Sun Core: Divine Power","673000036":"Order Sun Core: Divine Power","673000063":"Order Sun Core: Guillotine","673000064":"Order Sun Core: Guillotine","673000065":"Order Sun Core: Guillotine","673000066":"Order Sun Core: Guillotine","673000073":"Order Sun Core: Final Words","673000074":"Order Sun Core: Final Words","673000075":"Order Sun Core: Final Words","673000076":"Order Sun Core: Final Words","673000103":"Order Sun Core: Bloodhound","673000104":"Order Sun Core: Bloodhound","673000105":"Order Sun Core: Bloodhound","673000106":"Order Sun Core: Bloodhound","673000113":"Order Sun Core: TA-09 Piercing Arrow","673000114":"Order Sun Core: TA-09 Piercing Arrow","673000115":"Order Sun Core: TA-09 Piercing Arrow","673000116":"Order Sun Core: TA-09 Piercing Arrow","673000123":"Order Sun Core: Quantum Operative","673000124":"Order Sun Core: Quantum Operative","673000125":"Order Sun Core: Quantum Operative","673000126":"Order Sun Core: Quantum Operative","673000133":"Order Sun Core: Bombardment","673000134":"Order Sun Core: Bombardment","673000135":"Order Sun Core: Bombardment","673000136":"Order Sun Core: Bombardment","673000163":"Order Sun Core: Eye of the Tigress","673000164":"Order Sun Core: Eye of the Tigress","673000165":"Order Sun Core: Eye of the Tigress","673000166":"Order Sun Core: Eye of the Tigress","673000203":"Order Sun Core: Shock Burst","673000204":"Order Sun Core: Shock Burst","673000205":"Order Sun Core: Shock Burst","673000206":"Order Sun Core: Shock Burst","673000213":"Order Sun Core: Sky Shattering Strike","673000214":"Order Sun Core: Sky Shattering Strike","673000215":"Order Sun Core: Sky Shattering Strike","673000216":"Order Sun Core: Sky Shattering Strike","673000223":"Order Sun Core: Smite Barrage","673000224":"Order Sun Core: Smite Barrage","673000225":"Order Sun Core: Smite Barrage","673000226":"Order Sun Core: Smite Barrage","673000233":"Order Sun Core: Red Dragon Energy","673000234":"Order Sun Core: Red Dragon Energy","673000235":"Order Sun Core: Red Dragon Energy","673000236":"Order Sun Core: Red Dragon Energy","673000263":"Order Sun Core: Tiger's Roar","673000264":"Order Sun Core: Tiger's Roar","673000265":"Order Sun Core: Tiger's Roar","673000266":"Order Sun Core: Tiger's Roar","673000273":"Order Sun Core: True Brawl King","673000274":"Order Sun Core: True Brawl King","673000275":"Order Sun Core: True Brawl King","673000276":"Order Sun Core: True Brawl King","673000303":"Order Sun Core: Elemental Entwinement","673000304":"Order Sun Core: Elemental Entwinement","673000305":"Order Sun Core: Elemental Entwinement","673000306":"Order Sun Core: Elemental Entwinement","673000313":"Order Sun Core: Edge of Fate","673000314":"Order Sun Core: Edge of Fate","673000315":"Order Sun Core: Edge of Fate","673000316":"Order Sun Core: Edge of Fate","673000323":"Order Sun Core: Serenade of Fortitude","673000324":"Order Sun Core: Serenade of Fortitude","673000325":"Order Sun Core: Serenade of Fortitude","673000326":"Order Sun Core: Serenade of Fortitude","673000333":"Order Sun Core: Magick Catalyst","673000334":"Order Sun Core: Magick Catalyst","673000335":"Order Sun Core: Magick Catalyst","673000336":"Order Sun Core: Magick Catalyst","673000403":"Order Sun Core: Deathblade Surge","673000404":"Order Sun Core: Deathblade Surge","673000405":"Order Sun Core: Deathblade Surge","673000406":"Order Sun Core: Deathblade Surge","673000413":"Order Sun Core: Blood Massacre","673000414":"Order Sun Core: Blood Massacre","673000415":"Order Sun Core: Blood Massacre","673000416":"Order Sun Core: Blood Massacre","673000423":"Order Sun Core: Moonscent","673000424":"Order Sun Core: Moonscent","673000425":"Order Sun Core: Moonscent","673000426":"Order Sun Core: Moonscent","673000433":"Order Sun Core: Another Dimension","673000434":"Order Sun Core: Another Dimension","673000435":"Order Sun Core: Another Dimension","673000436":"Order Sun Core: Another Dimension","673000503":"Order Sun Core: Wind Wielder","673000504":"Order Sun Core: Wind Wielder","673000505":"Order Sun Core: Wind Wielder","673000506":"Order Sun Core: Wind Wielder","673000513":"Order Sun Core: Unstoppable Force","673000514":"Order Sun Core: Unstoppable Force","673000515":"Order Sun Core: Unstoppable Force","673000516":"Order Sun Core: Unstoppable Force","673000523":"Order Sun Core: Shapeshifter!","673000524":"Order Sun Core: Shapeshifter!","673000525":"Order Sun Core: Shapeshifter!","673000526":"Order Sun Core: Shapeshifter!","673000603":"Order Sun Core: Finisher","673000604":"Order Sun Core: Finisher","673000605":"Order Sun Core: Finisher","673000606":"Order Sun Core: Finisher","673000703":"Order Sun Core: Timekeeper","673000704":"Order Sun Core: Timekeeper","673000705":"Order Sun Core: Timekeeper","673000706":"Order Sun Core: Timekeeper","673001003":"Order Sun Core: Overpower","673001004":"Order Sun Core: Overpower","673001005":"Order Sun Core: Overpower","673001006":"Order Sun Core: Overpower","673001013":"Order Sun Core: Dimensional Collapse","673001014":"Order Sun Core: Dimensional Collapse","673001015":"Order Sun Core: Dimensional Collapse","673001016":"Order Sun Core: Dimensional Collapse","673001023":"Order Sun Core: Spear Arts","673001024":"Order Sun Core: Spear Arts","673001025":"Order Sun Core: Spear Arts","673001026":"Order Sun Core: Spear Arts","673001033":"Order Sun Core: Sacred Strike","673001034":"Order Sun Core: Sacred Strike","673001035":"Order Sun Core: Sacred Strike","673001036":"Order Sun Core: Sacred Strike","673001063":"Order Sun Core: Compressed Fury","673001064":"Order Sun Core: Compressed Fury","673001065":"Order Sun Core: Compressed Fury","673001066":"Order Sun Core: Compressed Fury","673001073":"Order Sun Core: Prayer","673001074":"Order Sun Core: Prayer","673001075":"Order Sun Core: Prayer","673001076":"Order Sun Core: Prayer","673001103":"Order Sun Core: Deadshot","673001104":"Order Sun Core: Deadshot","673001105":"Order Sun Core: Deadshot","673001106":"Order Sun Core: Deadshot","673001113":"Order Sun Core: ATB-07 Piercing Rain","673001114":"Order Sun Core: ATB-07 Piercing Rain","673001115":"Order Sun Core: ATB-07 Piercing Rain","673001116":"Order Sun Core: ATB-07 Piercing Rain","673001123":"Order Sun Core: SMG Agent","673001124":"Order Sun Core: SMG Agent","673001125":"Order Sun Core: SMG Agent","673001126":"Order Sun Core: SMG Agent","673001133":"Order Sun Core: Shoot & Scoot","673001134":"Order Sun Core: Shoot & Scoot","673001135":"Order Sun Core: Shoot & Scoot","673001136":"Order Sun Core: Shoot & Scoot","673001163":"Order Sun Core: Echoes of the Banquet","673001164":"Order Sun Core: Echoes of the Banquet","673001165":"Order Sun Core: Echoes of the Banquet","673001166":"Order Sun Core: Echoes of the Banquet","673001203":"Order Sun Core: Shockwave","673001204":"Order Sun Core: Shockwave","673001205":"Order Sun Core: Shockwave","673001206":"Order Sun Core: Shockwave","673001213":"Order Sun Core: Brilliant Rush","673001214":"Order Sun Core: Brilliant Rush","673001215":"Order Sun Core: Brilliant Rush","673001216":"Order Sun Core: Brilliant Rush","673001223":"Order Sun Core: Enlightened Origin","673001224":"Order Sun Core: Enlightened Origin","673001225":"Order Sun Core: Enlightened Origin","673001226":"Order Sun Core: Enlightened Origin","673001233":"Order Sun Core: Red Dragon Barrage","673001234":"Order Sun Core: Red Dragon Barrage","673001235":"Order Sun Core: Red Dragon Barrage","673001236":"Order Sun Core: Red Dragon Barrage","673001263":"Order Sun Core: Utter Carnage","673001264":"Order Sun Core: Utter Carnage","673001265":"Order Sun Core: Utter Carnage","673001266":"Order Sun Core: Utter Carnage","673001273":"Order Sun Core: Skybreaker","673001274":"Order Sun Core: Skybreaker","673001275":"Order Sun Core: Skybreaker","673001276":"Order Sun Core: Skybreaker","673001303":"Order Sun Core: Enhanced Burst","673001304":"Order Sun Core: Enhanced Burst","673001305":"Order Sun Core: Enhanced Burst","673001306":"Order Sun Core: Enhanced Burst","673001313":"Order Sun Core: Infinity Deck","673001314":"Order Sun Core: Infinity Deck","673001315":"Order Sun Core: Infinity Deck","673001316":"Order Sun Core: Infinity Deck","673001323":"Order Sun Core: Tempest Refrain","673001324":"Order Sun Core: Tempest Refrain","673001325":"Order Sun Core: Tempest Refrain","673001326":"Order Sun Core: Tempest Refrain","673001333":"Order Sun Core: Incomplete Combustion","673001334":"Order Sun Core: Incomplete Combustion","673001335":"Order Sun Core: Incomplete Combustion","673001336":"Order Sun Core: Incomplete Combustion","673001403":"Order Sun Core: Slaughter Spectacle","673001404":"Order Sun Core: Slaughter Spectacle","673001405":"Order Sun Core: Slaughter Spectacle","673001406":"Order Sun Core: Slaughter Spectacle","673001413":"Order Sun Core: Eternal Blood","673001414":"Order Sun Core: Eternal Blood","673001415":"Order Sun Core: Eternal Blood","673001416":"Order Sun Core: Eternal Blood","673001423":"Order Sun Core: Falling Moon","673001424":"Order Sun Core: Falling Moon","673001425":"Order Sun Core: Falling Moon","673001426":"Order Sun Core: Falling Moon","673001433":"Order Sun Core: Swift Demise","673001434":"Order Sun Core: Swift Demise","673001435":"Order Sun Core: Swift Demise","673001436":"Order Sun Core: Swift Demise","673001503":"Order Sun Core: Current Control","673001504":"Order Sun Core: Current Control","673001505":"Order Sun Core: Current Control","673001506":"Order Sun Core: Current Control","673001513":"Order Sun Core: Single Stroke","673001514":"Order Sun Core: Single Stroke","673001515":"Order Sun Core: Single Stroke","673001516":"Order Sun Core: Single Stroke","673001523":"Order Sun Core: Bear Frenzy","673001524":"Order Sun Core: Bear Frenzy","673001525":"Order Sun Core: Bear Frenzy","673001526":"Order Sun Core: Bear Frenzy","673001603":"Order Sun Core: Manifest","673001604":"Order Sun Core: Manifest","673001605":"Order Sun Core: Manifest","673001606":"Order Sun Core: Manifest","673001703":"Order Sun Core: Twisted Timeline","673001704":"Order Sun Core: Twisted Timeline","673001705":"Order Sun Core: Twisted Timeline","673001706":"Order Sun Core: Twisted Timeline","673002003":"Order Sun Core: Power Core","673002004":"Order Sun Core: Power Core","673002005":"Order Sun Core: Power Core","673002006":"Order Sun Core: Power Core","673002013":"Order Sun Core: Earth Wave","673002014":"Order Sun Core: Earth Wave","673002015":"Order Sun Core: Earth Wave","673002016":"Order Sun Core: Earth Wave","673002023":"Order Sun Core: End of War","673002024":"Order Sun Core: End of War","673002025":"Order Sun Core: End of War","673002026":"Order Sun Core: End of War","673002033":"Order Sun Core: Forewarned Judgment","673002034":"Order Sun Core: Forewarned Judgment","673002035":"Order Sun Core: Forewarned Judgment","673002036":"Order Sun Core: Forewarned Judgment","673002063":"Order Sun Core: Rage Explosion","673002064":"Order Sun Core: Rage Explosion","673002065":"Order Sun Core: Rage Explosion","673002066":"Order Sun Core: Rage Explosion","673002073":"Order Sun Core: Whispering Sword","673002074":"Order Sun Core: Whispering Sword","673002075":"Order Sun Core: Whispering Sword","673002076":"Order Sun Core: Whispering Sword","673002103":"Order Sun Core: Shotgun Overload","673002104":"Order Sun Core: Shotgun Overload","673002105":"Order Sun Core: Shotgun Overload","673002106":"Order Sun Core: Shotgun Overload","673002113":"Order Sun Core: TA-12 Bursting Arrow","673002114":"Order Sun Core: TA-12 Bursting Arrow","673002115":"Order Sun Core: TA-12 Bursting Arrow","673002116":"Order Sun Core: TA-12 Bursting Arrow","673002123":"Order Sun Core: Pulse Nova","673002124":"Order Sun Core: Pulse Nova","673002125":"Order Sun Core: Pulse Nova","673002126":"Order Sun Core: Pulse Nova","673002133":"Order Sun Core: Bombardier Tank","673002134":"Order Sun Core: Bombardier Tank","673002135":"Order Sun Core: Bombardier Tank","673002136":"Order Sun Core: Bombardier Tank","673002163":"Order Sun Core: True Aim","673002164":"Order Sun Core: True Aim","673002165":"Order Sun Core: True Aim","673002166":"Order Sun Core: True Aim","673002203":"Order Sun Core: Shock Suppression","673002204":"Order Sun Core: Shock Suppression","673002205":"Order Sun Core: Shock Suppression","673002206":"Order Sun Core: Shock Suppression","673002213":"Order Sun Core: Hundred Chain Strike","673002214":"Order Sun Core: Hundred Chain Strike","673002215":"Order Sun Core: Hundred Chain Strike","673002216":"Order Sun Core: Hundred Chain Strike","673002223":"Order Sun Core: Opening Three Gates","673002224":"Order Sun Core: Opening Three Gates","673002225":"Order Sun Core: Opening Three Gates","673002226":"Order Sun Core: Opening Three Gates","673002233":"Order Sun Core: Yeon-Style Spear Technique","673002234":"Order Sun Core: Yeon-Style Spear Technique","673002235":"Order Sun Core: Yeon-Style Spear Technique","673002236":"Order Sun Core: Yeon-Style Spear Technique","673002263":"Order Sun Core: Lightning Tiger","673002264":"Order Sun Core: Lightning Tiger","673002265":"Order Sun Core: Lightning Tiger","673002266":"Order Sun Core: Lightning Tiger","673002273":"Order Sun Core: Charged Shock","673002274":"Order Sun Core: Charged Shock","673002275":"Order Sun Core: Charged Shock","673002276":"Order Sun Core: Charged Shock","673002303":"Order Sun Core: Basic Training","673002304":"Order Sun Core: Basic Training","673002305":"Order Sun Core: Basic Training","673002306":"Order Sun Core: Basic Training","673002313":"Order Sun Core: Ruin Subset","673002314":"Order Sun Core: Ruin Subset","673002315":"Order Sun Core: Ruin Subset","673002316":"Order Sun Core: Ruin Subset","673002323":"Order Sun Core: Shock Loop","673002324":"Order Sun Core: Shock Loop","673002325":"Order Sun Core: Shock Loop","673002326":"Order Sun Core: Shock Loop","673002333":"Order Sun Core: Beginning of the End","673002334":"Order Sun Core: Beginning of the End","673002335":"Order Sun Core: Beginning of the End","673002336":"Order Sun Core: Beginning of the End","673002403":"Order Sun Core: Deathblade Rush","673002404":"Order Sun Core: Deathblade Rush","673002405":"Order Sun Core: Deathblade Rush","673002406":"Order Sun Core: Deathblade Rush","673002413":"Order Sun Core: Ominous","673002414":"Order Sun Core: Ominous","673002415":"Order Sun Core: Ominous","673002416":"Order Sun Core: Ominous","673002423":"Order Sun Core: The Two Moons","673002424":"Order Sun Core: The Two Moons","673002425":"Order Sun Core: The Two Moons","673002426":"Order Sun Core: The Two Moons","673002433":"Order Sun Core: Footsteps of the Dead","673002434":"Order Sun Core: Footsteps of the Dead","673002435":"Order Sun Core: Footsteps of the Dead","673002436":"Order Sun Core: Footsteps of the Dead","673002503":"Order Sun Core: Wind Blade","673002504":"Order Sun Core: Wind Blade","673002505":"Order Sun Core: Wind Blade","673002506":"Order Sun Core: Wind Blade","673002513":"Order Sun Core: Inkbloom","673002514":"Order Sun Core: Inkbloom","673002515":"Order Sun Core: Inkbloom","673002516":"Order Sun Core: Inkbloom","673002523":"Order Sun Core: Fox-To-Be!","673002524":"Order Sun Core: Fox-To-Be!","673002525":"Order Sun Core: Fox-To-Be!","673002526":"Order Sun Core: Fox-To-Be!","673002603":"Order Sun Core: Red Wings","673002604":"Order Sun Core: Red Wings","673002605":"Order Sun Core: Red Wings","673002606":"Order Sun Core: Red Wings","673002703":"Order Sun Core: Dimensional Annihilation","673002704":"Order Sun Core: Dimensional Annihilation","673002705":"Order Sun Core: Dimensional Annihilation","673002706":"Order Sun Core: Dimensional Annihilation","673003003":"Order Sun Core: Dark Power","673003004":"Order Sun Core: Dark Power","673003005":"Order Sun Core: Dark Power","673003006":"Order Sun Core: Dark Power","673003013":"Order Sun Core: Gravity Reversal","673003014":"Order Sun Core: Gravity Reversal","673003015":"Order Sun Core: Gravity Reversal","673003016":"Order Sun Core: Gravity Reversal","673003023":"Order Sun Core: Shield Combo","673003024":"Order Sun Core: Shield Combo","673003025":"Order Sun Core: Shield Combo","673003026":"Order Sun Core: Shield Combo","673003033":"Order Sun Core: Heavenly Agent","673003034":"Order Sun Core: Heavenly Agent","673003035":"Order Sun Core: Heavenly Agent","673003036":"Order Sun Core: Heavenly Agent","673003063":"Order Sun Core: Seething Fury","673003064":"Order Sun Core: Seething Fury","673003065":"Order Sun Core: Seething Fury","673003066":"Order Sun Core: Seething Fury","673003073":"Order Sun Core: Light's Grace","673003074":"Order Sun Core: Light's Grace","673003075":"Order Sun Core: Light's Grace","673003076":"Order Sun Core: Light's Grace","673003103":"Order Sun Core: Shadow Bullet","673003104":"Order Sun Core: Shadow Bullet","673003105":"Order Sun Core: Shadow Bullet","673003106":"Order Sun Core: Shadow Bullet","673003113":"Order Sun Core: ATB-03 Bolt Raptor","673003114":"Order Sun Core: ATB-03 Bolt Raptor","673003115":"Order Sun Core: ATB-03 Bolt Raptor","673003116":"Order Sun Core: ATB-03 Bolt Raptor","673003123":"Order Sun Core: Astral Suit","673003124":"Order Sun Core: Astral Suit","673003125":"Order Sun Core: Astral Suit","673003126":"Order Sun Core: Astral Suit","673003133":"Order Sun Core: Ammo Collector","673003134":"Order Sun Core: Ammo Collector","673003135":"Order Sun Core: Ammo Collector","673003136":"Order Sun Core: Ammo Collector","673003163":"Order Sun Core: Midnight Rose","673003164":"Order Sun Core: Midnight Rose","673003165":"Order Sun Core: Midnight Rose","673003166":"Order Sun Core: Midnight Rose","673003203":"Order Sun Core: Earth Collapse","673003204":"Order Sun Core: Earth Collapse","673003205":"Order Sun Core: Earth Collapse","673003206":"Order Sun Core: Earth Collapse","673003213":"Order Sun Core: Shadowless","673003214":"Order Sun Core: Shadowless","673003215":"Order Sun Core: Shadowless","673003216":"Order Sun Core: Shadowless","673003223":"Order Sun Core: Undefeated Overlord","673003224":"Order Sun Core: Undefeated Overlord","673003225":"Order Sun Core: Undefeated Overlord","673003226":"Order Sun Core: Undefeated Overlord","673003233":"Order Sun Core: Galewind Barrage","673003234":"Order Sun Core: Galewind Barrage","673003235":"Order Sun Core: Galewind Barrage","673003236":"Order Sun Core: Galewind Barrage","673003263":"Order Sun Core: Speed of Light","673003264":"Order Sun Core: Speed of Light","673003265":"Order Sun Core: Speed of Light","673003266":"Order Sun Core: Speed of Light","673003273":"Order Sun Core: Sky-Rending Aura","673003274":"Order Sun Core: Sky-Rending Aura","673003275":"Order Sun Core: Sky-Rending Aura","673003276":"Order Sun Core: Sky-Rending Aura","673003303":"Order Sun Core: Inherited Power","673003304":"Order Sun Core: Inherited Power","673003305":"Order Sun Core: Inherited Power","673003306":"Order Sun Core: Inherited Power","673003313":"Order Sun Core: High Tempo","673003314":"Order Sun Core: High Tempo","673003315":"Order Sun Core: High Tempo","673003316":"Order Sun Core: High Tempo","673003323":"Order Sun Core: Seraphic Accent","673003324":"Order Sun Core: Seraphic Accent","673003325":"Order Sun Core: Seraphic Accent","673003326":"Order Sun Core: Seraphic Accent","673003333":"Order Sun Core: Bias","673003334":"Order Sun Core: Bias","673003335":"Order Sun Core: Bias","673003336":"Order Sun Core: Bias","673003403":"Order Sun Core: Art Master","673003404":"Order Sun Core: Art Master","673003405":"Order Sun Core: Art Master","673003406":"Order Sun Core: Art Master","673003413":"Order Sun Core: Devil Suppression","673003414":"Order Sun Core: Devil Suppression","673003415":"Order Sun Core: Devil Suppression","673003416":"Order Sun Core: Devil Suppression","673003423":"Order Sun Core: Ravening Nightmare","673003424":"Order Sun Core: Ravening Nightmare","673003425":"Order Sun Core: Ravening Nightmare","673003426":"Order Sun Core: Ravening Nightmare","673003433":"Order Sun Core: Dark Moon","673003434":"Order Sun Core: Dark Moon","673003435":"Order Sun Core: Dark Moon","673003436":"Order Sun Core: Dark Moon","673003503":"Order Sun Core: Graupel","673003504":"Order Sun Core: Graupel","673003505":"Order Sun Core: Graupel","673003506":"Order Sun Core: Graupel","673003513":"Order Sun Core: Sun's Embrace","673003514":"Order Sun Core: Sun's Embrace","673003515":"Order Sun Core: Sun's Embrace","673003516":"Order Sun Core: Sun's Embrace","673003523":"Order Sun Core: Infinite Awakening","673003524":"Order Sun Core: Infinite Awakening","673003525":"Order Sun Core: Infinite Awakening","673003526":"Order Sun Core: Infinite Awakening","673003603":"Order Sun Core: Charge Enhancement","673003604":"Order Sun Core: Charge Enhancement","673003605":"Order Sun Core: Charge Enhancement","673003606":"Order Sun Core: Charge Enhancement","673003703":"Order Sun Core: Spatial Swordcraft","673003704":"Order Sun Core: Spatial Swordcraft","673003705":"Order Sun Core: Spatial Swordcraft","673003706":"Order Sun Core: Spatial Swordcraft","673004003":"Order Sun Core: Power Drive","673004004":"Order Sun Core: Power Drive","673004005":"Order Sun Core: Power Drive","673004006":"Order Sun Core: Power Drive","673004013":"Order Sun Core: Gravity Destruction","673004014":"Order Sun Core: Gravity Destruction","673004015":"Order Sun Core: Gravity Destruction","673004016":"Order Sun Core: Gravity Destruction","673004023":"Order Sun Core: Chain Charge","673004024":"Order Sun Core: Chain Charge","673004025":"Order Sun Core: Chain Charge","673004026":"Order Sun Core: Chain Charge","673004033":"Order Sun Core: True Justice","673004034":"Order Sun Core: True Justice","673004035":"Order Sun Core: True Justice","673004036":"Order Sun Core: True Justice","673004063":"Order Sun Core: Unpredictable","673004064":"Order Sun Core: Unpredictable","673004065":"Order Sun Core: Unpredictable","673004066":"Order Sun Core: Unpredictable","673004073":"Order Sun Core: Sacred Oath","673004074":"Order Sun Core: Sacred Oath","673004075":"Order Sun Core: Sacred Oath","673004076":"Order Sun Core: Sacred Oath","673004103":"Order Sun Core: Hidden Fang","673004104":"Order Sun Core: Hidden Fang","673004105":"Order Sun Core: Hidden Fang","673004106":"Order Sun Core: Hidden Fang","673004113":"Order Sun Core: TA-64 Reaper Bolt","673004114":"Order Sun Core: TA-64 Reaper Bolt","673004115":"Order Sun Core: TA-64 Reaper Bolt","673004116":"Order Sun Core: TA-64 Reaper Bolt","673004123":"Order Sun Core: Quasar Cannon Suit","673004124":"Order Sun Core: Quasar Cannon Suit","673004125":"Order Sun Core: Quasar Cannon Suit","673004126":"Order Sun Core: Quasar Cannon Suit","673004133":"Order Sun Core: Demon Fire","673004134":"Order Sun Core: Demon Fire","673004135":"Order Sun Core: Demon Fire","673004136":"Order Sun Core: Demon Fire","673004163":"Order Sun Core: Lawless Land","673004164":"Order Sun Core: Lawless Land","673004165":"Order Sun Core: Lawless Land","673004166":"Order Sun Core: Lawless Land","673004203":"Order Sun Core: Repeated Leap","673004204":"Order Sun Core: Repeated Leap","673004205":"Order Sun Core: Repeated Leap","673004206":"Order Sun Core: Repeated Leap","673004213":"Order Sun Core: Supreme Connection","673004214":"Order Sun Core: Supreme Connection","673004215":"Order Sun Core: Supreme Connection","673004216":"Order Sun Core: Supreme Connection","673004223":"Order Sun Core: Undying Fire Dragon","673004224":"Order Sun Core: Undying Fire Dragon","673004225":"Order Sun Core: Undying Fire Dragon","673004226":"Order Sun Core: Undying Fire Dragon","673004233":"Order Sun Core: Yeon-Style Slash","673004234":"Order Sun Core: Yeon-Style Slash","673004235":"Order Sun Core: Yeon-Style Slash","673004236":"Order Sun Core: Yeon-Style Slash","673004263":"Order Sun Core: Lord of Tigers","673004264":"Order Sun Core: Lord of Tigers","673004265":"Order Sun Core: Lord of Tigers","673004266":"Order Sun Core: Lord of Tigers","673004273":"Order Sun Core: Eye of Asura","673004274":"Order Sun Core: Eye of Asura","673004275":"Order Sun Core: Eye of Asura","673004276":"Order Sun Core: Eye of Asura","673004303":"Order Sun Core: Ancient Legacy","673004304":"Order Sun Core: Ancient Legacy","673004305":"Order Sun Core: Ancient Legacy","673004306":"Order Sun Core: Ancient Legacy","673004313":"Order Sun Core: Normal Enhancement","673004314":"Order Sun Core: Normal Enhancement","673004315":"Order Sun Core: Normal Enhancement","673004316":"Order Sun Core: Normal Enhancement","673004323":"Order Sun Core: Brave Accent","673004324":"Order Sun Core: Brave Accent","673004325":"Order Sun Core: Brave Accent","673004326":"Order Sun Core: Brave Accent","673004333":"Order Sun Core: Circulate","673004334":"Order Sun Core: Circulate","673004335":"Order Sun Core: Circulate","673004336":"Order Sun Core: Circulate","673004403":"Order Sun Core: Focused Strike","673004404":"Order Sun Core: Focused Strike","673004405":"Order Sun Core: Focused Strike","673004406":"Order Sun Core: Focused Strike","673004413":"Order Sun Core: Surging Storm","673004414":"Order Sun Core: Surging Storm","673004415":"Order Sun Core: Surging Storm","673004416":"Order Sun Core: Surging Storm","673004423":"Order Sun Core: Lethal Step","673004424":"Order Sun Core: Lethal Step","673004425":"Order Sun Core: Lethal Step","673004426":"Order Sun Core: Lethal Step","673004433":"Order Sun Core: Deathlord's Call","673004434":"Order Sun Core: Deathlord's Call","673004435":"Order Sun Core: Deathlord's Call","673004436":"Order Sun Core: Deathlord's Call","673004503":"Order Sun Core: Bolt From the Blue","673004504":"Order Sun Core: Bolt From the Blue","673004505":"Order Sun Core: Bolt From the Blue","673004506":"Order Sun Core: Bolt From the Blue","673004513":"Order Sun Core: Unspeakably Soft","673004514":"Order Sun Core: Unspeakably Soft","673004515":"Order Sun Core: Unspeakably Soft","673004516":"Order Sun Core: Unspeakably Soft","673004523":"Order Sun Core: Bear Fist","673004524":"Order Sun Core: Bear Fist","673004525":"Order Sun Core: Bear Fist","673004526":"Order Sun Core: Bear Fist","673004603":"Order Sun Core: Brandish","673004604":"Order Sun Core: Brandish","673004605":"Order Sun Core: Brandish","673004606":"Order Sun Core: Brandish","673004703":"Order Sun Core: Master Impaler","673004704":"Order Sun Core: Master Impaler","673004705":"Order Sun Core: Master Impaler","673004706":"Order Sun Core: Master Impaler","673005003":"Order Sun Core: Holding Edge","673005004":"Order Sun Core: Holding Edge","673005005":"Order Sun Core: Holding Edge","673005006":"Order Sun Core: Holding Edge","673005013":"Order Sun Core: Gravity Core","673005014":"Order Sun Core: Gravity Core","673005015":"Order Sun Core: Gravity Core","673005016":"Order Sun Core: Gravity Core","673005023":"Order Sun Core: Thunder","673005024":"Order Sun Core: Thunder","673005025":"Order Sun Core: Thunder","673005026":"Order Sun Core: Thunder","673005033":"Order Sun Core: Blessing of Light","673005034":"Order Sun Core: Blessing of Light","673005035":"Order Sun Core: Blessing of Light","673005036":"Order Sun Core: Blessing of Light","673005063":"Order Sun Core: Tornado","673005064":"Order Sun Core: Tornado","673005065":"Order Sun Core: Tornado","673005066":"Order Sun Core: Tornado","673005073":"Order Sun Core: Light Carves Life","673005074":"Order Sun Core: Light Carves Life","673005075":"Order Sun Core: Light Carves Life","673005076":"Order Sun Core: Light Carves Life","673005103":"Order Sun Core: Deadly Tracker","673005104":"Order Sun Core: Deadly Tracker","673005105":"Order Sun Core: Deadly Tracker","673005106":"Order Sun Core: Deadly Tracker","673005113":"Order Sun Core: ATB-19 Rapidfire","673005114":"Order Sun Core: ATB-19 Rapidfire","673005115":"Order Sun Core: ATB-19 Rapidfire","673005116":"Order Sun Core: ATB-19 Rapidfire","673005123":"Order Sun Core: Titan Suit","673005124":"Order Sun Core: Titan Suit","673005125":"Order Sun Core: Titan Suit","673005126":"Order Sun Core: Titan Suit","673005133":"Order Sun Core: Jumper","673005134":"Order Sun Core: Jumper","673005135":"Order Sun Core: Jumper","673005136":"Order Sun Core: Jumper","673005163":"Order Sun Core: Black Belt","673005164":"Order Sun Core: Black Belt","673005165":"Order Sun Core: Black Belt","673005166":"Order Sun Core: Black Belt","673005203":"Order Sun Core: Tenacity Suppression","673005204":"Order Sun Core: Tenacity Suppression","673005205":"Order Sun Core: Tenacity Suppression","673005206":"Order Sun Core: Tenacity Suppression","673005213":"Order Sun Core: Force Cycle","673005214":"Order Sun Core: Force Cycle","673005215":"Order Sun Core: Force Cycle","673005216":"Order Sun Core: Force Cycle","673005223":"Order Sun Core: Quintuple Resilience","673005224":"Order Sun Core: Quintuple Resilience","673005225":"Order Sun Core: Quintuple Resilience","673005226":"Order Sun Core: Quintuple Resilience","673005233":"Order Sun Core: Raging Dragon Quintuple Strike","673005234":"Order Sun Core: Raging Dragon Quintuple Strike","673005235":"Order Sun Core: Raging Dragon Quintuple Strike","673005236":"Order Sun Core: Raging Dragon Quintuple Strike","673005263":"Order Sun Core: External Power","673005264":"Order Sun Core: External Power","673005265":"Order Sun Core: External Power","673005266":"Order Sun Core: External Power","673005273":"Order Sun Core: Shadow Fist","673005274":"Order Sun Core: Shadow Fist","673005275":"Order Sun Core: Shadow Fist","673005276":"Order Sun Core: Shadow Fist","673005303":"Order Sun Core: Power Circulation","673005304":"Order Sun Core: Power Circulation","673005305":"Order Sun Core: Power Circulation","673005306":"Order Sun Core: Power Circulation","673005313":"Order Sun Core: Impact Check","673005314":"Order Sun Core: Impact Check","673005315":"Order Sun Core: Impact Check","673005316":"Order Sun Core: Impact Check","673005323":"Order Sun Core: Aria Accent","673005324":"Order Sun Core: Aria Accent","673005325":"Order Sun Core: Aria Accent","673005326":"Order Sun Core: Aria Accent","673005333":"Order Sun Core: Condense","673005334":"Order Sun Core: Condense","673005335":"Order Sun Core: Condense","673005336":"Order Sun Core: Condense","673005403":"Order Sun Core: Levin Slash","673005404":"Order Sun Core: Levin Slash","673005405":"Order Sun Core: Levin Slash","673005406":"Order Sun Core: Levin Slash","673005413":"Order Sun Core: Mass Absorption","673005414":"Order Sun Core: Mass Absorption","673005415":"Order Sun Core: Mass Absorption","673005416":"Order Sun Core: Mass Absorption","673005423":"Order Sun Core: Blood Thirst","673005424":"Order Sun Core: Blood Thirst","673005425":"Order Sun Core: Blood Thirst","673005426":"Order Sun Core: Blood Thirst","673005433":"Order Sun Core: Ghastly Evening","673005434":"Order Sun Core: Ghastly Evening","673005435":"Order Sun Core: Ghastly Evening","673005436":"Order Sun Core: Ghastly Evening","673005503":"Order Sun Core: Sun and Wind","673005504":"Order Sun Core: Sun and Wind","673005505":"Order Sun Core: Sun and Wind","673005506":"Order Sun Core: Sun and Wind","673005513":"Order Sun Core: Sun's Protection","673005514":"Order Sun Core: Sun's Protection","673005515":"Order Sun Core: Sun's Protection","673005516":"Order Sun Core: Sun's Protection","673005523":"Order Sun Core: Crow King","673005524":"Order Sun Core: Crow King","673005525":"Order Sun Core: Crow King","673005526":"Order Sun Core: Crow King","673005603":"Order Sun Core: Apex","673005604":"Order Sun Core: Apex","673005605":"Order Sun Core: Apex","673005606":"Order Sun Core: Apex","673005703":"Order Sun Core: Severed Dimension","673005704":"Order Sun Core: Severed Dimension","673005705":"Order Sun Core: Severed Dimension","673005706":"Order Sun Core: Severed Dimension","673010003":"Order Moon Core: Blood Circulation","673010004":"Order Moon Core: Blood Circulation","673010005":"Order Moon Core: Blood Circulation","673010006":"Order Moon Core: Blood Circulation","673010013":"Order Moon Core: Absolute Control","673010014":"Order Moon Core: Absolute Control","673010015":"Order Moon Core: Absolute Control","673010016":"Order Moon Core: Absolute Control","673010023":"Order Moon Core: Defense Tactics","673010024":"Order Moon Core: Defense Tactics","673010025":"Order Moon Core: Defense Tactics","673010026":"Order Moon Core: Defense Tactics","673010033":"Order Moon Core: Hour of Punishment","673010034":"Order Moon Core: Hour of Punishment","673010035":"Order Moon Core: Hour of Punishment","673010036":"Order Moon Core: Hour of Punishment","673010063":"Order Moon Core: Blade of Judgment","673010064":"Order Moon Core: Blade of Judgment","673010065":"Order Moon Core: Blade of Judgment","673010066":"Order Moon Core: Blade of Judgment","673010073":"Order Moon Core: Knight of Finality","673010074":"Order Moon Core: Knight of Finality","673010075":"Order Moon Core: Knight of Finality","673010076":"Order Moon Core: Knight of Finality","673010103":"Order Moon Core: Buckshot Enhancement","673010104":"Order Moon Core: Buckshot Enhancement","673010105":"Order Moon Core: Buckshot Enhancement","673010106":"Order Moon Core: Buckshot Enhancement","673010113":"Order Moon Core: HSU-98 Avian Strike","673010114":"Order Moon Core: HSU-98 Avian Strike","673010115":"Order Moon Core: HSU-98 Avian Strike","673010116":"Order Moon Core: HSU-98 Avian Strike","673010123":"Order Moon Core: Bio Modification Technique","673010124":"Order Moon Core: Bio Modification Technique","673010125":"Order Moon Core: Bio Modification Technique","673010126":"Order Moon Core: Bio Modification Technique","673010133":"Order Moon Core: Rapid Tank","673010134":"Order Moon Core: Rapid Tank","673010135":"Order Moon Core: Rapid Tank","673010136":"Order Moon Core: Rapid Tank","673010163":"Order Moon Core: Jack-of-All-Trades","673010164":"Order Moon Core: Jack-of-All-Trades","673010165":"Order Moon Core: Jack-of-All-Trades","673010166":"Order Moon Core: Jack-of-All-Trades","673010203":"Order Moon Core: Shock Enhancement","673010204":"Order Moon Core: Shock Enhancement","673010205":"Order Moon Core: Shock Enhancement","673010206":"Order Moon Core: Shock Enhancement","673010213":"Order Moon Core: Chain Annihilation","673010214":"Order Moon Core: Chain Annihilation","673010215":"Order Moon Core: Chain Annihilation","673010216":"Order Moon Core: Chain Annihilation","673010223":"Order Moon Core: Mighty Wind Kick","673010224":"Order Moon Core: Mighty Wind Kick","673010225":"Order Moon Core: Mighty Wind Kick","673010226":"Order Moon Core: Mighty Wind Kick","673010233":"Order Moon Core: Pinpoint Focus","673010234":"Order Moon Core: Pinpoint Focus","673010235":"Order Moon Core: Pinpoint Focus","673010236":"Order Moon Core: Pinpoint Focus","673010263":"Order Moon Core: Storm's Roar","673010264":"Order Moon Core: Storm's Roar","673010265":"Order Moon Core: Storm's Roar","673010266":"Order Moon Core: Storm's Roar","673010273":"Order Moon Core: Brawl King Stance","673010274":"Order Moon Core: Brawl King Stance","673010275":"Order Moon Core: Brawl King Stance","673010276":"Order Moon Core: Brawl King Stance","673010303":"Order Moon Core: Amplified Entwinement","673010304":"Order Moon Core: Amplified Entwinement","673010305":"Order Moon Core: Amplified Entwinement","673010306":"Order Moon Core: Amplified Entwinement","673010313":"Order Moon Core: Edge Combo","673010314":"Order Moon Core: Edge Combo","673010315":"Order Moon Core: Edge Combo","673010316":"Order Moon Core: Edge Combo","673010323":"Order Moon Core: Pious Serenade","673010324":"Order Moon Core: Pious Serenade","673010325":"Order Moon Core: Pious Serenade","673010326":"Order Moon Core: Pious Serenade","673010333":"Order Moon Core: Ignition Emblem","673010334":"Order Moon Core: Ignition Emblem","673010335":"Order Moon Core: Ignition Emblem","673010336":"Order Moon Core: Ignition Emblem","673010403":"Order Moon Core: Surge Core","673010404":"Order Moon Core: Surge Core","673010405":"Order Moon Core: Surge Core","673010406":"Order Moon Core: Surge Core","673010413":"Order Moon Core: Bloody Demon","673010414":"Order Moon Core: Bloody Demon","673010415":"Order Moon Core: Bloody Demon","673010416":"Order Moon Core: Bloody Demon","673010423":"Order Moon Core: Persona","673010424":"Order Moon Core: Persona","673010425":"Order Moon Core: Persona","673010426":"Order Moon Core: Persona","673010433":"Order Moon Core: Otherworldly Power","673010434":"Order Moon Core: Otherworldly Power","673010435":"Order Moon Core: Otherworldly Power","673010436":"Order Moon Core: Otherworldly Power","673010503":"Order Moon Core: Umbrella Dance","673010504":"Order Moon Core: Umbrella Dance","673010505":"Order Moon Core: Umbrella Dance","673010506":"Order Moon Core: Umbrella Dance","673010513":"Order Moon Core: Perfect Harmony","673010514":"Order Moon Core: Perfect Harmony","673010515":"Order Moon Core: Perfect Harmony","673010516":"Order Moon Core: Perfect Harmony","673010523":"Order Moon Core: Forbidden Sorcery","673010524":"Order Moon Core: Forbidden Sorcery","673010525":"Order Moon Core: Forbidden Sorcery","673010526":"Order Moon Core: Forbidden Sorcery","673010603":"Order Moon Core: Nova Flame","673010604":"Order Moon Core: Nova Flame","673010605":"Order Moon Core: Nova Flame","673010606":"Order Moon Core: Nova Flame","673010703":"Order Moon Core: Combine Weapon","673010704":"Order Moon Core: Combine Weapon","673010705":"Order Moon Core: Combine Weapon","673010706":"Order Moon Core: Combine Weapon","673011003":"Order Moon Core: Over Surge","673011004":"Order Moon Core: Over Surge","673011005":"Order Moon Core: Over Surge","673011006":"Order Moon Core: Over Surge","673011013":"Order Moon Core: Gravity Enhancement","673011014":"Order Moon Core: Gravity Enhancement","673011015":"Order Moon Core: Gravity Enhancement","673011016":"Order Moon Core: Gravity Enhancement","673011023":"Order Moon Core: Strike Point","673011024":"Order Moon Core: Strike Point","673011025":"Order Moon Core: Strike Point","673011026":"Order Moon Core: Strike Point","673011033":"Order Moon Core: Heavenly Sword","673011034":"Order Moon Core: Heavenly Sword","673011035":"Order Moon Core: Heavenly Sword","673011036":"Order Moon Core: Heavenly Sword","673011063":"Order Moon Core: Condensed Power","673011064":"Order Moon Core: Condensed Power","673011065":"Order Moon Core: Condensed Power","673011066":"Order Moon Core: Condensed Power","673011073":"Order Moon Core: Light's Rest","673011074":"Order Moon Core: Light's Rest","673011075":"Order Moon Core: Light's Rest","673011076":"Order Moon Core: Light's Rest","673011103":"Order Moon Core: Flawless Aim","673011104":"Order Moon Core: Flawless Aim","673011105":"Order Moon Core: Flawless Aim","673011106":"Order Moon Core: Flawless Aim","673011113":"Order Moon Core: HSU-21 Silver Rain","673011114":"Order Moon Core: HSU-21 Silver Rain","673011115":"Order Moon Core: HSU-21 Silver Rain","673011116":"Order Moon Core: HSU-21 Silver Rain","673011123":"Order Moon Core: Bullet Tempest","673011124":"Order Moon Core: Bullet Tempest","673011125":"Order Moon Core: Bullet Tempest","673011126":"Order Moon Core: Bullet Tempest","673011133":"Order Moon Core: Overheated Shell","673011134":"Order Moon Core: Overheated Shell","673011135":"Order Moon Core: Overheated Shell","673011136":"Order Moon Core: Overheated Shell","673011163":"Order Moon Core: Weapon Switch","673011164":"Order Moon Core: Weapon Switch","673011165":"Order Moon Core: Weapon Switch","673011166":"Order Moon Core: Weapon Switch","673011203":"Order Moon Core: Earth Combo","673011204":"Order Moon Core: Earth Combo","673011205":"Order Moon Core: Earth Combo","673011206":"Order Moon Core: Earth Combo","673011213":"Order Moon Core: Heavenly Squall","673011214":"Order Moon Core: Heavenly Squall","673011215":"Order Moon Core: Heavenly Squall","673011216":"Order Moon Core: Heavenly Squall","673011223":"Order Moon Core: Origin State","673011224":"Order Moon Core: Origin State","673011225":"Order Moon Core: Origin State","673011226":"Order Moon Core: Origin State","673011233":"Order Moon Core: Focus Enhancement","673011234":"Order Moon Core: Focus Enhancement","673011235":"Order Moon Core: Focus Enhancement","673011236":"Order Moon Core: Focus Enhancement","673011263":"Order Moon Core: Roaring Formation","673011264":"Order Moon Core: Roaring Formation","673011265":"Order Moon Core: Roaring Formation","673011266":"Order Moon Core: Roaring Formation","673011273":"Order Moon Core: Ultimate Eye of the Storm","673011274":"Order Moon Core: Ultimate Eye of the Storm","673011275":"Order Moon Core: Ultimate Eye of the Storm","673011276":"Order Moon Core: Ultimate Eye of the Storm","673011303":"Order Moon Core: Burst Focus","673011304":"Order Moon Core: Burst Focus","673011305":"Order Moon Core: Burst Focus","673011306":"Order Moon Core: Burst Focus","673011313":"Order Moon Core: Chain Draw","673011314":"Order Moon Core: Chain Draw","673011315":"Order Moon Core: Chain Draw","673011316":"Order Moon Core: Chain Draw","673011323":"Order Moon Core: Second Impact","673011324":"Order Moon Core: Second Impact","673011325":"Order Moon Core: Second Impact","673011326":"Order Moon Core: Second Impact","673011333":"Order Moon Core: Burn Acceleration","673011334":"Order Moon Core: Burn Acceleration","673011335":"Order Moon Core: Burn Acceleration","673011336":"Order Moon Core: Burn Acceleration","673011403":"Order Moon Core: Twin Swords Dance","673011404":"Order Moon Core: Twin Swords Dance","673011405":"Order Moon Core: Twin Swords Dance","673011406":"Order Moon Core: Twin Swords Dance","673011413":"Order Moon Core: Gore Bleeding","673011414":"Order Moon Core: Gore Bleeding","673011415":"Order Moon Core: Gore Bleeding","673011416":"Order Moon Core: Gore Bleeding","673011423":"Order Moon Core: Silent","673011424":"Order Moon Core: Silent","673011425":"Order Moon Core: Silent","673011426":"Order Moon Core: Silent","673011433":"Order Moon Core: Eternal One","673011434":"Order Moon Core: Eternal One","673011435":"Order Moon Core: Eternal One","673011436":"Order Moon Core: Eternal One","673011503":"Order Moon Core: Upward Current","673011504":"Order Moon Core: Upward Current","673011505":"Order Moon Core: Upward Current","673011506":"Order Moon Core: Upward Current","673011513":"Order Moon Core: Master Calligrapher","673011514":"Order Moon Core: Master Calligrapher","673011515":"Order Moon Core: Master Calligrapher","673011516":"Order Moon Core: Master Calligrapher","673011523":"Order Moon Core: Strong Bear","673011524":"Order Moon Core: Strong Bear","673011525":"Order Moon Core: Strong Bear","673011526":"Order Moon Core: Strong Bear","673011603":"Order Moon Core: Liberation","673011604":"Order Moon Core: Liberation","673011605":"Order Moon Core: Liberation","673011606":"Order Moon Core: Liberation","673011703":"Order Moon Core: Timeline","673011704":"Order Moon Core: Timeline","673011705":"Order Moon Core: Timeline","673011706":"Order Moon Core: Timeline","673012003":"Order Moon Core: Break Dash","673012004":"Order Moon Core: Break Dash","673012005":"Order Moon Core: Break Dash","673012006":"Order Moon Core: Break Dash","673012013":"Order Moon Core: Gravity Run","673012014":"Order Moon Core: Gravity Run","673012015":"Order Moon Core: Gravity Run","673012016":"Order Moon Core: Gravity Run","673012023":"Order Moon Core: Gunlance Charge","673012024":"Order Moon Core: Gunlance Charge","673012025":"Order Moon Core: Gunlance Charge","673012026":"Order Moon Core: Gunlance Charge","673012033":"Order Moon Core: Hour of Judgment","673012034":"Order Moon Core: Hour of Judgment","673012035":"Order Moon Core: Hour of Judgment","673012036":"Order Moon Core: Hour of Judgment","673012063":"Order Moon Core: Converging Power","673012064":"Order Moon Core: Converging Power","673012065":"Order Moon Core: Converging Power","673012066":"Order Moon Core: Converging Power","673012073":"Order Moon Core: Dazzling Justice","673012074":"Order Moon Core: Dazzling Justice","673012075":"Order Moon Core: Dazzling Justice","673012076":"Order Moon Core: Dazzling Justice","673012103":"Order Moon Core: Frenzied Specialist","673012104":"Order Moon Core: Frenzied Specialist","673012105":"Order Moon Core: Frenzied Specialist","673012106":"Order Moon Core: Frenzied Specialist","673012113":"Order Moon Core: HSU-13 Special High Explosive","673012114":"Order Moon Core: HSU-13 Special High Explosive","673012115":"Order Moon Core: HSU-13 Special High Explosive","673012116":"Order Moon Core: HSU-13 Special High Explosive","673012123":"Order Moon Core: Apocalyptic Energy","673012124":"Order Moon Core: Apocalyptic Energy","673012125":"Order Moon Core: Apocalyptic Energy","673012126":"Order Moon Core: Apocalyptic Energy","673012133":"Order Moon Core: Safehouse","673012134":"Order Moon Core: Safehouse","673012135":"Order Moon Core: Safehouse","673012136":"Order Moon Core: Safehouse","673012163":"Order Moon Core: Shield Targeting","673012164":"Order Moon Core: Shield Targeting","673012165":"Order Moon Core: Shield Targeting","673012166":"Order Moon Core: Shield Targeting","673012203":"Order Moon Core: Stamina Conservation","673012204":"Order Moon Core: Stamina Conservation","673012205":"Order Moon Core: Stamina Conservation","673012206":"Order Moon Core: Stamina Conservation","673012213":"Order Moon Core: Recovery Bullet","673012214":"Order Moon Core: Recovery Bullet","673012215":"Order Moon Core: Recovery Bullet","673012216":"Order Moon Core: Recovery Bullet","673012223":"Order Moon Core: Hypercirculation","673012224":"Order Moon Core: Hypercirculation","673012225":"Order Moon Core: Hypercirculation","673012226":"Order Moon Core: Hypercirculation","673012233":"Order Moon Core: Azure Dragon Energy","673012234":"Order Moon Core: Azure Dragon Energy","673012235":"Order Moon Core: Azure Dragon Energy","673012236":"Order Moon Core: Azure Dragon Energy","673012263":"Order Moon Core: Thunderclap Strike","673012264":"Order Moon Core: Thunderclap Strike","673012265":"Order Moon Core: Thunderclap Strike","673012266":"Order Moon Core: Thunderclap Strike","673012273":"Order Moon Core: Shock Charge","673012274":"Order Moon Core: Shock Charge","673012275":"Order Moon Core: Shock Charge","673012276":"Order Moon Core: Shock Charge","673012303":"Order Moon Core: Ever-Changing Gale","673012304":"Order Moon Core: Ever-Changing Gale","673012305":"Order Moon Core: Ever-Changing Gale","673012306":"Order Moon Core: Ever-Changing Gale","673012313":"Order Moon Core: Ruin Full Set","673012314":"Order Moon Core: Ruin Full Set","673012315":"Order Moon Core: Ruin Full Set","673012316":"Order Moon Core: Ruin Full Set","673012323":"Order Moon Core: Harmonious Confluence","673012324":"Order Moon Core: Harmonious Confluence","673012325":"Order Moon Core: Harmonious Confluence","673012326":"Order Moon Core: Harmonious Confluence","673012333":"Order Moon Core: Repeated Apocalypse","673012334":"Order Moon Core: Repeated Apocalypse","673012335":"Order Moon Core: Repeated Apocalypse","673012336":"Order Moon Core: Repeated Apocalypse","673012403":"Order Moon Core: Death Blitz","673012404":"Order Moon Core: Death Blitz","673012405":"Order Moon Core: Death Blitz","673012406":"Order Moon Core: Death Blitz","673012413":"Order Moon Core: Demonic Clone","673012414":"Order Moon Core: Demonic Clone","673012415":"Order Moon Core: Demonic Clone","673012416":"Order Moon Core: Demonic Clone","673012423":"Order Moon Core: Double Core","673012424":"Order Moon Core: Double Core","673012425":"Order Moon Core: Double Core","673012426":"Order Moon Core: Double Core","673012433":"Order Moon Core: Soul Core","673012434":"Order Moon Core: Soul Core","673012435":"Order Moon Core: Soul Core","673012436":"Order Moon Core: Soul Core","673012503":"Order Moon Core: Swift","673012504":"Order Moon Core: Swift","673012505":"Order Moon Core: Swift","673012506":"Order Moon Core: Swift","673012513":"Order Moon Core: Wolf Moon","673012514":"Order Moon Core: Wolf Moon","673012515":"Order Moon Core: Wolf Moon","673012516":"Order Moon Core: Wolf Moon","673012523":"Order Moon Core: Strong Fox","673012524":"Order Moon Core: Strong Fox","673012525":"Order Moon Core: Strong Fox","673012526":"Order Moon Core: Strong Fox","673012603":"Order Moon Core: Avenger","673012604":"Order Moon Core: Avenger","673012605":"Order Moon Core: Avenger","673012606":"Order Moon Core: Avenger","673012703":"Order Moon Core: Minute Tempo","673012704":"Order Moon Core: Minute Tempo","673012705":"Order Moon Core: Minute Tempo","673012706":"Order Moon Core: Minute Tempo","673013003":"Order Moon Core: Dark Torrent","673013004":"Order Moon Core: Dark Torrent","673013005":"Order Moon Core: Dark Torrent","673013006":"Order Moon Core: Dark Torrent","673013013":"Order Moon Core: Event Horizon","673013014":"Order Moon Core: Event Horizon","673013015":"Order Moon Core: Event Horizon","673013016":"Order Moon Core: Event Horizon","673013023":"Order Moon Core: Shield Arts","673013024":"Order Moon Core: Shield Arts","673013025":"Order Moon Core: Shield Arts","673013026":"Order Moon Core: Shield Arts","673013033":"Order Moon Core: Heavenly Resolve","673013034":"Order Moon Core: Heavenly Resolve","673013035":"Order Moon Core: Heavenly Resolve","673013036":"Order Moon Core: Heavenly Resolve","673013063":"Order Moon Core: Core Impact","673013064":"Order Moon Core: Core Impact","673013065":"Order Moon Core: Core Impact","673013066":"Order Moon Core: Core Impact","673013073":"Order Moon Core: Epic of Light","673013074":"Order Moon Core: Epic of Light","673013075":"Order Moon Core: Epic of Light","673013076":"Order Moon Core: Epic of Light","673013103":"Order Moon Core: Midair Maven","673013104":"Order Moon Core: Midair Maven","673013105":"Order Moon Core: Midair Maven","673013106":"Order Moon Core: Midair Maven","673013113":"Order Moon Core: HSU-99 Avian Storm","673013114":"Order Moon Core: HSU-99 Avian Storm","673013115":"Order Moon Core: HSU-99 Avian Storm","673013116":"Order Moon Core: HSU-99 Avian Storm","673013123":"Order Moon Core: Perfect Sync","673013124":"Order Moon Core: Perfect Sync","673013125":"Order Moon Core: Perfect Sync","673013126":"Order Moon Core: Perfect Sync","673013133":"Order Moon Core: Galewind Artillerist","673013134":"Order Moon Core: Galewind Artillerist","673013135":"Order Moon Core: Galewind Artillerist","673013136":"Order Moon Core: Galewind Artillerist","673013163":"Order Moon Core: Armor-Piercing Shell","673013164":"Order Moon Core: Armor-Piercing Shell","673013165":"Order Moon Core: Armor-Piercing Shell","673013166":"Order Moon Core: Armor-Piercing Shell","673013203":"Order Moon Core: Fighting Spirit Enhancement","673013204":"Order Moon Core: Fighting Spirit Enhancement","673013205":"Order Moon Core: Fighting Spirit Enhancement","673013206":"Order Moon Core: Fighting Spirit Enhancement","673013213":"Order Moon Core: True Rising Fist","673013214":"Order Moon Core: True Rising Fist","673013215":"Order Moon Core: True Rising Fist","673013216":"Order Moon Core: True Rising Fist","673013223":"Order Moon Core: Way of the Overlord","673013224":"Order Moon Core: Way of the Overlord","673013225":"Order Moon Core: Way of the Overlord","673013226":"Order Moon Core: Way of the Overlord","673013233":"Order Moon Core: Raging Dragon Energy","673013234":"Order Moon Core: Raging Dragon Energy","673013235":"Order Moon Core: Raging Dragon Energy","673013236":"Order Moon Core: Raging Dragon Energy","673013263":"Order Moon Core: Storm Step","673013264":"Order Moon Core: Storm Step","673013265":"Order Moon Core: Storm Step","673013266":"Order Moon Core: Storm Step","673013273":"Order Moon Core: Awakened Eye of the Storm","673013274":"Order Moon Core: Awakened Eye of the Storm","673013275":"Order Moon Core: Awakened Eye of the Storm","673013276":"Order Moon Core: Awakened Eye of the Storm","673013303":"Order Moon Core: Concentration of Power","673013304":"Order Moon Core: Concentration of Power","673013305":"Order Moon Core: Concentration of Power","673013306":"Order Moon Core: Concentration of Power","673013313":"Order Moon Core: Emperor's Heart","673013314":"Order Moon Core: Emperor's Heart","673013315":"Order Moon Core: Emperor's Heart","673013316":"Order Moon Core: Emperor's Heart","673013323":"Order Moon Core: Seraphic Pulse","673013324":"Order Moon Core: Seraphic Pulse","673013325":"Order Moon Core: Seraphic Pulse","673013326":"Order Moon Core: Seraphic Pulse","673013333":"Order Moon Core: Current","673013334":"Order Moon Core: Current","673013335":"Order Moon Core: Current","673013336":"Order Moon Core: Current","673013403":"Order Moon Core: Arts Core","673013404":"Order Moon Core: Arts Core","673013405":"Order Moon Core: Arts Core","673013406":"Order Moon Core: Arts Core","673013413":"Order Moon Core: Trinity Core","673013414":"Order Moon Core: Trinity Core","673013415":"Order Moon Core: Trinity Core","673013416":"Order Moon Core: Trinity Core","673013423":"Order Moon Core: Fatal Nightmare","673013424":"Order Moon Core: Fatal Nightmare","673013425":"Order Moon Core: Fatal Nightmare","673013426":"Order Moon Core: Fatal Nightmare","673013433":"Order Moon Core: Luminous Crescent","673013434":"Order Moon Core: Luminous Crescent","673013435":"Order Moon Core: Luminous Crescent","673013436":"Order Moon Core: Luminous Crescent","673013503":"Order Moon Core: Stormy Sea","673013504":"Order Moon Core: Stormy Sea","673013505":"Order Moon Core: Stormy Sea","673013506":"Order Moon Core: Stormy Sea","673013513":"Order Moon Core: Sun's Warmth","673013514":"Order Moon Core: Sun's Warmth","673013515":"Order Moon Core: Sun's Warmth","673013516":"Order Moon Core: Sun's Warmth","673013523":"Order Moon Core: Phantom Beast Liberation","673013524":"Order Moon Core: Phantom Beast Liberation","673013525":"Order Moon Core: Phantom Beast Liberation","673013526":"Order Moon Core: Phantom Beast Liberation","673013603":"Order Moon Core: Overwhelm","673013604":"Order Moon Core: Overwhelm","673013605":"Order Moon Core: Overwhelm","673013606":"Order Moon Core: Overwhelm","673013703":"Order Moon Core: Swordcraft Enhancement","673013704":"Order Moon Core: Swordcraft Enhancement","673013705":"Order Moon Core: Swordcraft Enhancement","673013706":"Order Moon Core: Swordcraft Enhancement","673014003":"Order Moon Core: Rapid Slash","673014004":"Order Moon Core: Rapid Slash","673014005":"Order Moon Core: Rapid Slash","673014006":"Order Moon Core: Rapid Slash","673014013":"Order Moon Core: Gravitational Circulation","673014014":"Order Moon Core: Gravitational Circulation","673014015":"Order Moon Core: Gravitational Circulation","673014016":"Order Moon Core: Gravitational Circulation","673014023":"Order Moon Core: War Cry Charge","673014024":"Order Moon Core: War Cry Charge","673014025":"Order Moon Core: War Cry Charge","673014026":"Order Moon Core: War Cry Charge","673014033":"Order Moon Core: Divine Cause","673014034":"Order Moon Core: Divine Cause","673014035":"Order Moon Core: Divine Cause","673014036":"Order Moon Core: Divine Cause","673014063":"Order Moon Core: Fury Escalation","673014064":"Order Moon Core: Fury Escalation","673014065":"Order Moon Core: Fury Escalation","673014066":"Order Moon Core: Fury Escalation","673014073":"Order Moon Core: Pledge of Salvation","673014074":"Order Moon Core: Pledge of Salvation","673014075":"Order Moon Core: Pledge of Salvation","673014076":"Order Moon Core: Pledge of Salvation","673014103":"Order Moon Core: Emergency Specialist","673014104":"Order Moon Core: Emergency Specialist","673014105":"Order Moon Core: Emergency Specialist","673014106":"Order Moon Core: Emergency Specialist","673014113":"Order Moon Core: HSU-08 Reinforced Cable","673014114":"Order Moon Core: HSU-08 Reinforced Cable","673014115":"Order Moon Core: HSU-08 Reinforced Cable","673014116":"Order Moon Core: HSU-08 Reinforced Cable","673014123":"Order Moon Core: Zero Pulse Energy","673014124":"Order Moon Core: Zero Pulse Energy","673014125":"Order Moon Core: Zero Pulse Energy","673014126":"Order Moon Core: Zero Pulse Energy","673014133":"Order Moon Core: Infinite Combustion","673014134":"Order Moon Core: Infinite Combustion","673014135":"Order Moon Core: Infinite Combustion","673014136":"Order Moon Core: Infinite Combustion","673014163":"Order Moon Core: Bullet Blitz","673014164":"Order Moon Core: Bullet Blitz","673014165":"Order Moon Core: Bullet Blitz","673014166":"Order Moon Core: Bullet Blitz","673014203":"Order Moon Core: Fatal Leap","673014204":"Order Moon Core: Fatal Leap","673014205":"Order Moon Core: Fatal Leap","673014206":"Order Moon Core: Fatal Leap","673014213":"Order Moon Core: Divine Extermination","673014214":"Order Moon Core: Divine Extermination","673014215":"Order Moon Core: Divine Extermination","673014216":"Order Moon Core: Divine Extermination","673014223":"Order Moon Core: Fire Dragon Skyshaker","673014224":"Order Moon Core: Fire Dragon Skyshaker","673014225":"Order Moon Core: Fire Dragon Skyshaker","673014226":"Order Moon Core: Fire Dragon Skyshaker","673014233":"Order Moon Core: Apotheosis","673014234":"Order Moon Core: Apotheosis","673014235":"Order Moon Core: Apotheosis","673014236":"Order Moon Core: Apotheosis","673014263":"Order Moon Core: Lightning Tiger Break","673014264":"Order Moon Core: Lightning Tiger Break","673014265":"Order Moon Core: Lightning Tiger Break","673014266":"Order Moon Core: Lightning Tiger Break","673014273":"Order Moon Core: Asura War","673014274":"Order Moon Core: Asura War","673014275":"Order Moon Core: Asura War","673014276":"Order Moon Core: Asura War","673014303":"Order Moon Core: Osh's Support","673014304":"Order Moon Core: Osh's Support","673014305":"Order Moon Core: Osh's Support","673014306":"Order Moon Core: Osh's Support","673014313":"Order Moon Core: Stack Hold","673014314":"Order Moon Core: Stack Hold","673014315":"Order Moon Core: Stack Hold","673014316":"Order Moon Core: Stack Hold","673014323":"Order Moon Core: Brave Pulse","673014324":"Order Moon Core: Brave Pulse","673014325":"Order Moon Core: Brave Pulse","673014326":"Order Moon Core: Brave Pulse","673014333":"Order Moon Core: Exchange","673014334":"Order Moon Core: Exchange","673014335":"Order Moon Core: Exchange","673014336":"Order Moon Core: Exchange","673014403":"Order Moon Core: Recharge","673014404":"Order Moon Core: Recharge","673014405":"Order Moon Core: Recharge","673014406":"Order Moon Core: Recharge","673014413":"Order Moon Core: Dual Core","673014414":"Order Moon Core: Dual Core","673014415":"Order Moon Core: Dual Core","673014416":"Order Moon Core: Dual Core","673014423":"Order Moon Core: Final Spear","673014424":"Order Moon Core: Final Spear","673014425":"Order Moon Core: Final Spear","673014426":"Order Moon Core: Final Spear","673014433":"Order Moon Core: Moonlit Midnight","673014434":"Order Moon Core: Moonlit Midnight","673014435":"Order Moon Core: Moonlit Midnight","673014436":"Order Moon Core: Moonlit Midnight","673014503":"Order Moon Core: Drizzling Rain","673014504":"Order Moon Core: Drizzling Rain","673014505":"Order Moon Core: Drizzling Rain","673014506":"Order Moon Core: Drizzling Rain","673014513":"Order Moon Core: Illusory Door","673014514":"Order Moon Core: Illusory Door","673014515":"Order Moon Core: Illusory Door","673014516":"Order Moon Core: Illusory Door","673014523":"Order Moon Core: Spiral","673014524":"Order Moon Core: Spiral","673014525":"Order Moon Core: Spiral","673014526":"Order Moon Core: Spiral","673014603":"Order Moon Core: Flourish","673014604":"Order Moon Core: Flourish","673014605":"Order Moon Core: Flourish","673014606":"Order Moon Core: Flourish","673014703":"Order Moon Core: Point Attack","673014704":"Order Moon Core: Point Attack","673014705":"Order Moon Core: Point Attack","673014706":"Order Moon Core: Point Attack","673015003":"Order Moon Core: Cyclone Slash","673015004":"Order Moon Core: Cyclone Slash","673015005":"Order Moon Core: Cyclone Slash","673015006":"Order Moon Core: Cyclone Slash","673015013":"Order Moon Core: Gravitational Rush","673015014":"Order Moon Core: Gravitational Rush","673015015":"Order Moon Core: Gravitational Rush","673015016":"Order Moon Core: Gravitational Rush","673015023":"Order Moon Core: Lightning Storm","673015024":"Order Moon Core: Lightning Storm","673015025":"Order Moon Core: Lightning Storm","673015026":"Order Moon Core: Lightning Storm","673015033":"Order Moon Core: Divine War","673015034":"Order Moon Core: Divine War","673015035":"Order Moon Core: Divine War","673015036":"Order Moon Core: Divine War","673015063":"Order Moon Core: Spiral Tempest","673015064":"Order Moon Core: Spiral Tempest","673015065":"Order Moon Core: Spiral Tempest","673015066":"Order Moon Core: Spiral Tempest","673015073":"Order Moon Core: Break of Dawn","673015074":"Order Moon Core: Break of Dawn","673015075":"Order Moon Core: Break of Dawn","673015076":"Order Moon Core: Break of Dawn","673015103":"Order Moon Core: Eternal Revolver","673015104":"Order Moon Core: Eternal Revolver","673015105":"Order Moon Core: Eternal Revolver","673015106":"Order Moon Core: Eternal Revolver","673015113":"Order Moon Core: HSU-37 Rapid Fire Support","673015114":"Order Moon Core: HSU-37 Rapid Fire Support","673015115":"Order Moon Core: HSU-37 Rapid Fire Support","673015116":"Order Moon Core: HSU-37 Rapid Fire Support","673015123":"Order Moon Core: Assault Titan","673015124":"Order Moon Core: Assault Titan","673015125":"Order Moon Core: Assault Titan","673015126":"Order Moon Core: Assault Titan","673015133":"Order Moon Core: Momentous Leap","673015134":"Order Moon Core: Momentous Leap","673015135":"Order Moon Core: Momentous Leap","673015136":"Order Moon Core: Momentous Leap","673015163":"Order Moon Core: Way of the Gun","673015164":"Order Moon Core: Way of the Gun","673015165":"Order Moon Core: Way of the Gun","673015166":"Order Moon Core: Way of the Gun","673015203":"Order Moon Core: Continuous Enhancement","673015204":"Order Moon Core: Continuous Enhancement","673015205":"Order Moon Core: Continuous Enhancement","673015206":"Order Moon Core: Continuous Enhancement","673015213":"Order Moon Core: Protective Cycle","673015214":"Order Moon Core: Protective Cycle","673015215":"Order Moon Core: Protective Cycle","673015216":"Order Moon Core: Protective Cycle","673015223":"Order Moon Core: Third Eye","673015224":"Order Moon Core: Third Eye","673015225":"Order Moon Core: Third Eye","673015226":"Order Moon Core: Third Eye","673015233":"Order Moon Core: Chain Hit","673015234":"Order Moon Core: Chain Hit","673015235":"Order Moon Core: Chain Hit","673015236":"Order Moon Core: Chain Hit","673015263":"Order Moon Core: Void Ascension","673015264":"Order Moon Core: Void Ascension","673015265":"Order Moon Core: Void Ascension","673015266":"Order Moon Core: Void Ascension","673015273":"Order Moon Core: Unhindered Stride","673015274":"Order Moon Core: Unhindered Stride","673015275":"Order Moon Core: Unhindered Stride","673015276":"Order Moon Core: Unhindered Stride","673015303":"Order Moon Core: Elemental Ring","673015304":"Order Moon Core: Elemental Ring","673015305":"Order Moon Core: Elemental Ring","673015306":"Order Moon Core: Elemental Ring","673015313":"Order Moon Core: Dark Check","673015314":"Order Moon Core: Dark Check","673015315":"Order Moon Core: Dark Check","673015316":"Order Moon Core: Dark Check","673015323":"Order Moon Core: Aria Pulse","673015324":"Order Moon Core: Aria Pulse","673015325":"Order Moon Core: Aria Pulse","673015326":"Order Moon Core: Aria Pulse","673015333":"Order Moon Core: Vortex","673015334":"Order Moon Core: Vortex","673015335":"Order Moon Core: Vortex","673015336":"Order Moon Core: Vortex","673015403":"Order Moon Core: Deathblade Wave","673015404":"Order Moon Core: Deathblade Wave","673015405":"Order Moon Core: Deathblade Wave","673015406":"Order Moon Core: Deathblade Wave","673015413":"Order Moon Core: Substorm","673015414":"Order Moon Core: Substorm","673015415":"Order Moon Core: Substorm","673015416":"Order Moon Core: Substorm","673015423":"Order Moon Core: Exsanguinating Poison","673015424":"Order Moon Core: Exsanguinating Poison","673015425":"Order Moon Core: Exsanguinating Poison","673015426":"Order Moon Core: Exsanguinating Poison","673015433":"Order Moon Core: Energy Theft","673015434":"Order Moon Core: Energy Theft","673015435":"Order Moon Core: Energy Theft","673015436":"Order Moon Core: Energy Theft","673015503":"Order Moon Core: Scorching Sun","673015504":"Order Moon Core: Scorching Sun","673015505":"Order Moon Core: Scorching Sun","673015506":"Order Moon Core: Scorching Sun","673015513":"Order Moon Core: Lunar Prophecy","673015514":"Order Moon Core: Lunar Prophecy","673015515":"Order Moon Core: Lunar Prophecy","673015516":"Order Moon Core: Lunar Prophecy","673015523":"Order Moon Core: Crow's Descent","673015524":"Order Moon Core: Crow's Descent","673015525":"Order Moon Core: Crow's Descent","673015526":"Order Moon Core: Crow's Descent","673015603":"Order Moon Core: Dominant","673015604":"Order Moon Core: Dominant","673015605":"Order Moon Core: Dominant","673015606":"Order Moon Core: Dominant","673015703":"Order Moon Core: Precise Control","673015704":"Order Moon Core: Precise Control","673015705":"Order Moon Core: Precise Control","673015706":"Order Moon Core: Precise Control","673020003":"Order Star Core: Crushing Storm","673020004":"Order Star Core: Crushing Storm","673020005":"Order Star Core: Crushing Storm","673020006":"Order Star Core: Crushing Storm","673020013":"Order Star Core: Broken Chains","673020014":"Order Star Core: Broken Chains","673020015":"Order Star Core: Broken Chains","673020016":"Order Star Core: Broken Chains","673020023":"Order Star Core: Defensive Barrage","673020024":"Order Star Core: Defensive Barrage","673020025":"Order Star Core: Defensive Barrage","673020026":"Order Star Core: Defensive Barrage","673020033":"Order Star Core: Punishing Sword","673020034":"Order Star Core: Punishing Sword","673020035":"Order Star Core: Punishing Sword","673020036":"Order Star Core: Punishing Sword","673020063":"Order Star Core: Execution","673020064":"Order Star Core: Execution","673020065":"Order Star Core: Execution","673020066":"Order Star Core: Execution","673020073":"Order Star Core: True End","673020074":"Order Star Core: True End","673020075":"Order Star Core: True End","673020076":"Order Star Core: True End","673020103":"Order Star Core: Bullet Explosion","673020104":"Order Star Core: Bullet Explosion","673020105":"Order Star Core: Bullet Explosion","673020106":"Order Star Core: Bullet Explosion","673020113":"Order Star Core: HSU-04 Smart Scope","673020114":"Order Star Core: HSU-04 Smart Scope","673020115":"Order Star Core: HSU-04 Smart Scope","673020116":"Order Star Core: HSU-04 Smart Scope","673020123":"Order Star Core: Battery Output Enhancement","673020124":"Order Star Core: Battery Output Enhancement","673020125":"Order Star Core: Battery Output Enhancement","673020126":"Order Star Core: Battery Output Enhancement","673020133":"Order Star Core: Sea of Fire","673020134":"Order Star Core: Sea of Fire","673020135":"Order Star Core: Sea of Fire","673020136":"Order Star Core: Sea of Fire","673020163":"Order Star Core: All-Rounder","673020164":"Order Star Core: All-Rounder","673020165":"Order Star Core: All-Rounder","673020166":"Order Star Core: All-Rounder","673020203":"Order Star Core: Orb Explosion","673020204":"Order Star Core: Orb Explosion","673020205":"Order Star Core: Orb Explosion","673020206":"Order Star Core: Orb Explosion","673020213":"Order Star Core: Blinding Obliteration","673020214":"Order Star Core: Blinding Obliteration","673020215":"Order Star Core: Blinding Obliteration","673020216":"Order Star Core: Blinding Obliteration","673020223":"Order Star Core: Ultimate Wind Kick","673020224":"Order Star Core: Ultimate Wind Kick","673020225":"Order Star Core: Ultimate Wind Kick","673020226":"Order Star Core: Ultimate Wind Kick","673020233":"Order Star Core: Evolution's End","673020234":"Order Star Core: Evolution's End","673020235":"Order Star Core: Evolution's End","673020236":"Order Star Core: Evolution's End","673020263":"Order Star Core: Lightning Tiger Fist","673020264":"Order Star Core: Lightning Tiger Fist","673020265":"Order Star Core: Lightning Tiger Fist","673020266":"Order Star Core: Lightning Tiger Fist","673020273":"Order Star Core: Brawl King Twelve Forms","673020274":"Order Star Core: Brawl King Twelve Forms","673020275":"Order Star Core: Brawl King Twelve Forms","673020276":"Order Star Core: Brawl King Twelve Forms","673020303":"Order Star Core: Amplified Resonance","673020304":"Order Star Core: Amplified Resonance","673020305":"Order Star Core: Amplified Resonance","673020306":"Order Star Core: Amplified Resonance","673020313":"Order Star Core: Lightstream","673020314":"Order Star Core: Lightstream","673020315":"Order Star Core: Lightstream","673020316":"Order Star Core: Lightstream","673020323":"Order Star Core: Sonic Enhancement","673020324":"Order Star Core: Sonic Enhancement","673020325":"Order Star Core: Sonic Enhancement","673020326":"Order Star Core: Sonic Enhancement","673020333":"Order Star Core: Elemental Echo","673020334":"Order Star Core: Elemental Echo","673020335":"Order Star Core: Elemental Echo","673020336":"Order Star Core: Elemental Echo","673020403":"Order Star Core: Strike","673020404":"Order Star Core: Strike","673020405":"Order Star Core: Strike","673020406":"Order Star Core: Strike","673020413":"Order Star Core: Bloody Explosion","673020414":"Order Star Core: Bloody Explosion","673020415":"Order Star Core: Bloody Explosion","673020416":"Order Star Core: Bloody Explosion","673020423":"Order Star Core: Delusory Sights","673020424":"Order Star Core: Delusory Sights","673020425":"Order Star Core: Delusory Sights","673020426":"Order Star Core: Delusory Sights","673020433":"Order Star Core: Otherworldly Monarch","673020434":"Order Star Core: Otherworldly Monarch","673020435":"Order Star Core: Otherworldly Monarch","673020436":"Order Star Core: Otherworldly Monarch","673020503":"Order Star Core: Driving Hit","673020504":"Order Star Core: Driving Hit","673020505":"Order Star Core: Driving Hit","673020506":"Order Star Core: Driving Hit","673020513":"Order Star Core: Endless Shattering Strike","673020514":"Order Star Core: Endless Shattering Strike","673020515":"Order Star Core: Endless Shattering Strike","673020516":"Order Star Core: Endless Shattering Strike","673020523":"Order Star Core: Tandem Charge","673020524":"Order Star Core: Tandem Charge","673020525":"Order Star Core: Tandem Charge","673020526":"Order Star Core: Tandem Charge","673020603":"Order Star Core: Last Stand","673020604":"Order Star Core: Last Stand","673020605":"Order Star Core: Last Stand","673020606":"Order Star Core: Last Stand","673020703":"Order Star Core: Fusion Enhancement","673020704":"Order Star Core: Fusion Enhancement","673020705":"Order Star Core: Fusion Enhancement","673020706":"Order Star Core: Fusion Enhancement","673021003":"Order Star Core: Overflow","673021004":"Order Star Core: Overflow","673021005":"Order Star Core: Overflow","673021006":"Order Star Core: Overflow","673021013":"Order Star Core: Turbulent Release","673021014":"Order Star Core: Turbulent Release","673021015":"Order Star Core: Turbulent Release","673021016":"Order Star Core: Turbulent Release","673021023":"Order Star Core: Confirmed Attack","673021024":"Order Star Core: Confirmed Attack","673021025":"Order Star Core: Confirmed Attack","673021026":"Order Star Core: Confirmed Attack","673021033":"Order Star Core: Divine Sword","673021034":"Order Star Core: Divine Sword","673021035":"Order Star Core: Divine Sword","673021036":"Order Star Core: Divine Sword","673021063":"Order Star Core: Pulverize","673021064":"Order Star Core: Pulverize","673021065":"Order Star Core: Pulverize","673021066":"Order Star Core: Pulverize","673021073":"Order Star Core: Holy Blade's Execution","673021074":"Order Star Core: Holy Blade's Execution","673021075":"Order Star Core: Holy Blade's Execution","673021076":"Order Star Core: Holy Blade's Execution","673021103":"Order Star Core: Iron Sights","673021104":"Order Star Core: Iron Sights","673021105":"Order Star Core: Iron Sights","673021106":"Order Star Core: Iron Sights","673021113":"Order Star Core: HSU-17 Electric Nova","673021114":"Order Star Core: HSU-17 Electric Nova","673021115":"Order Star Core: HSU-17 Electric Nova","673021116":"Order Star Core: HSU-17 Electric Nova","673021123":"Order Star Core: Incinerating Execution","673021124":"Order Star Core: Incinerating Execution","673021125":"Order Star Core: Incinerating Execution","673021126":"Order Star Core: Incinerating Execution","673021133":"Order Star Core: Time on Target","673021134":"Order Star Core: Time on Target","673021135":"Order Star Core: Time on Target","673021136":"Order Star Core: Time on Target","673021163":"Order Star Core: Blowback","673021164":"Order Star Core: Blowback","673021165":"Order Star Core: Blowback","673021166":"Order Star Core: Blowback","673021203":"Order Star Core: Ground Smasher","673021204":"Order Star Core: Ground Smasher","673021205":"Order Star Core: Ground Smasher","673021206":"Order Star Core: Ground Smasher","673021213":"Order Star Core: Piercing Spiral","673021214":"Order Star Core: Piercing Spiral","673021215":"Order Star Core: Piercing Spiral","673021216":"Order Star Core: Piercing Spiral","673021223":"Order Star Core: Heaven Splitter","673021224":"Order Star Core: Heaven Splitter","673021225":"Order Star Core: Heaven Splitter","673021226":"Order Star Core: Heaven Splitter","673021233":"Order Star Core: Single Point Breakthrough","673021234":"Order Star Core: Single Point Breakthrough","673021235":"Order Star Core: Single Point Breakthrough","673021236":"Order Star Core: Single Point Breakthrough","673021263":"Order Star Core: Dual Berserk Circle","673021264":"Order Star Core: Dual Berserk Circle","673021265":"Order Star Core: Dual Berserk Circle","673021266":"Order Star Core: Dual Berserk Circle","673021273":"Order Star Core: Skyshatter","673021274":"Order Star Core: Skyshatter","673021275":"Order Star Core: Skyshatter","673021276":"Order Star Core: Skyshatter","673021303":"Order Star Core: Command Awakening","673021304":"Order Star Core: Command Awakening","673021305":"Order Star Core: Command Awakening","673021306":"Order Star Core: Command Awakening","673021313":"Order Star Core: Fatal Hand","673021314":"Order Star Core: Fatal Hand","673021315":"Order Star Core: Fatal Hand","673021316":"Order Star Core: Fatal Hand","673021323":"Order Star Core: Sound Blitz","673021324":"Order Star Core: Sound Blitz","673021325":"Order Star Core: Sound Blitz","673021326":"Order Star Core: Sound Blitz","673021333":"Order Star Core: Triple Wave","673021334":"Order Star Core: Triple Wave","673021335":"Order Star Core: Triple Wave","673021336":"Order Star Core: Triple Wave","673021403":"Order Star Core: Swift Resolution","673021404":"Order Star Core: Swift Resolution","673021405":"Order Star Core: Swift Resolution","673021406":"Order Star Core: Swift Resolution","673021413":"Order Star Core: Critical Claws","673021414":"Order Star Core: Critical Claws","673021415":"Order Star Core: Critical Claws","673021416":"Order Star Core: Critical Claws","673021423":"Order Star Core: Assassin's Shadow","673021424":"Order Star Core: Assassin's Shadow","673021425":"Order Star Core: Assassin's Shadow","673021426":"Order Star Core: Assassin's Shadow","673021433":"Order Star Core: Deathly Harvest","673021434":"Order Star Core: Deathly Harvest","673021435":"Order Star Core: Deathly Harvest","673021436":"Order Star Core: Deathly Harvest","673021503":"Order Star Core: Breakthrough","673021504":"Order Star Core: Breakthrough","673021505":"Order Star Core: Breakthrough","673021506":"Order Star Core: Breakthrough","673021513":"Order Star Core: Swift Brush","673021514":"Order Star Core: Swift Brush","673021515":"Order Star Core: Swift Brush","673021516":"Order Star Core: Swift Brush","673021523":"Order Star Core: Deadly Bear","673021524":"Order Star Core: Deadly Bear","673021525":"Order Star Core: Deadly Bear","673021526":"Order Star Core: Deadly Bear","673021603":"Order Star Core: Executioner","673021604":"Order Star Core: Executioner","673021605":"Order Star Core: Executioner","673021606":"Order Star Core: Executioner","673021703":"Order Star Core: Distortion","673021704":"Order Star Core: Distortion","673021705":"Order Star Core: Distortion","673021706":"Order Star Core: Distortion","673022003":"Order Star Core: Break Out","673022004":"Order Star Core: Break Out","673022005":"Order Star Core: Break Out","673022006":"Order Star Core: Break Out","673022013":"Order Star Core: Reckless Blow","673022014":"Order Star Core: Reckless Blow","673022015":"Order Star Core: Reckless Blow","673022016":"Order Star Core: Reckless Blow","673022023":"Order Star Core: Cross Gunlance","673022024":"Order Star Core: Cross Gunlance","673022025":"Order Star Core: Cross Gunlance","673022026":"Order Star Core: Cross Gunlance","673022033":"Order Star Core: Piercer","673022034":"Order Star Core: Piercer","673022035":"Order Star Core: Piercer","673022036":"Order Star Core: Piercer","673022063":"Order Star Core: Deliberate Smite","673022064":"Order Star Core: Deliberate Smite","673022065":"Order Star Core: Deliberate Smite","673022066":"Order Star Core: Deliberate Smite","673022073":"Order Star Core: Greater Justice","673022074":"Order Star Core: Greater Justice","673022075":"Order Star Core: Greater Justice","673022076":"Order Star Core: Greater Justice","673022103":"Order Star Core: Dominator Shell","673022104":"Order Star Core: Dominator Shell","673022105":"Order Star Core: Dominator Shell","673022106":"Order Star Core: Dominator Shell","673022113":"Order Star Core: HSU-36 Dot Sight","673022114":"Order Star Core: HSU-36 Dot Sight","673022115":"Order Star Core: HSU-36 Dot Sight","673022116":"Order Star Core: HSU-36 Dot Sight","673022123":"Order Star Core: Accelerated Burst","673022124":"Order Star Core: Accelerated Burst","673022125":"Order Star Core: Accelerated Burst","673022126":"Order Star Core: Accelerated Burst","673022133":"Order Star Core: Vanquish","673022134":"Order Star Core: Vanquish","673022135":"Order Star Core: Vanquish","673022136":"Order Star Core: Vanquish","673022163":"Order Star Core: Pinpoint","673022164":"Order Star Core: Pinpoint","673022165":"Order Star Core: Pinpoint","673022166":"Order Star Core: Pinpoint","673022203":"Order Star Core: Counter Burst","673022204":"Order Star Core: Counter Burst","673022205":"Order Star Core: Counter Burst","673022206":"Order Star Core: Counter Burst","673022213":"Order Star Core: Energy Burst","673022214":"Order Star Core: Energy Burst","673022215":"Order Star Core: Energy Burst","673022216":"Order Star Core: Energy Burst","673022223":"Order Star Core: Dragon Style Enhancement","673022224":"Order Star Core: Dragon Style Enhancement","673022225":"Order Star Core: Dragon Style Enhancement","673022226":"Order Star Core: Dragon Style Enhancement","673022233":"Order Star Core: Raging Dragon Slash","673022234":"Order Star Core: Raging Dragon Slash","673022235":"Order Star Core: Raging Dragon Slash","673022236":"Order Star Core: Raging Dragon Slash","673022263":"Order Star Core: Thunderflash Strike","673022264":"Order Star Core: Thunderflash Strike","673022265":"Order Star Core: Thunderflash Strike","673022266":"Order Star Core: Thunderflash Strike","673022273":"Order Star Core: Force Gauntlet","673022274":"Order Star Core: Force Gauntlet","673022275":"Order Star Core: Force Gauntlet","673022276":"Order Star Core: Force Gauntlet","673022303":"Order Star Core: Tactical Command","673022304":"Order Star Core: Tactical Command","673022305":"Order Star Core: Tactical Command","673022306":"Order Star Core: Tactical Command","673022313":"Order Star Core: Ruin Minor Set","673022314":"Order Star Core: Ruin Minor Set","673022315":"Order Star Core: Ruin Minor Set","673022316":"Order Star Core: Ruin Minor Set","673022323":"Order Star Core: Binary Shock","673022324":"Order Star Core: Binary Shock","673022325":"Order Star Core: Binary Shock","673022326":"Order Star Core: Binary Shock","673022333":"Order Star Core: Apocalyptic Poem","673022334":"Order Star Core: Apocalyptic Poem","673022335":"Order Star Core: Apocalyptic Poem","673022336":"Order Star Core: Apocalyptic Poem","673022403":"Order Star Core: Frostfire Blade","673022404":"Order Star Core: Frostfire Blade","673022405":"Order Star Core: Frostfire Blade","673022406":"Order Star Core: Frostfire Blade","673022413":"Order Star Core: Chaos Demon","673022414":"Order Star Core: Chaos Demon","673022415":"Order Star Core: Chaos Demon","673022416":"Order Star Core: Chaos Demon","673022423":"Order Star Core: Death Loop","673022424":"Order Star Core: Death Loop","673022425":"Order Star Core: Death Loop","673022426":"Order Star Core: Death Loop","673022433":"Order Star Core: Possession","673022434":"Order Star Core: Possession","673022435":"Order Star Core: Possession","673022436":"Order Star Core: Possession","673022503":"Order Star Core: Gale Slash","673022504":"Order Star Core: Gale Slash","673022505":"Order Star Core: Gale Slash","673022506":"Order Star Core: Gale Slash","673022513":"Order Star Core: Torrent of Cranes","673022514":"Order Star Core: Torrent of Cranes","673022515":"Order Star Core: Torrent of Cranes","673022516":"Order Star Core: Torrent of Cranes","673022523":"Order Star Core: Starlight Fox","673022524":"Order Star Core: Starlight Fox","673022525":"Order Star Core: Starlight Fox","673022526":"Order Star Core: Starlight Fox","673022603":"Order Star Core: Start Pursuit","673022604":"Order Star Core: Start Pursuit","673022605":"Order Star Core: Start Pursuit","673022606":"Order Star Core: Start Pursuit","673022703":"Order Star Core: Conversion","673022704":"Order Star Core: Conversion","673022705":"Order Star Core: Conversion","673022706":"Order Star Core: Conversion","673023003":"Order Star Core: Frenzy","673023004":"Order Star Core: Frenzy","673023005":"Order Star Core: Frenzy","673023006":"Order Star Core: Frenzy","673023013":"Order Star Core: Collapse","673023014":"Order Star Core: Collapse","673023015":"Order Star Core: Collapse","673023016":"Order Star Core: Collapse","673023023":"Order Star Core: Shield Strike","673023024":"Order Star Core: Shield Strike","673023025":"Order Star Core: Shield Strike","673023026":"Order Star Core: Shield Strike","673023033":"Order Star Core: Sword's Prayer","673023034":"Order Star Core: Sword's Prayer","673023035":"Order Star Core: Sword's Prayer","673023036":"Order Star Core: Sword's Prayer","673023063":"Order Star Core: Swift Execution","673023064":"Order Star Core: Swift Execution","673023065":"Order Star Core: Swift Execution","673023066":"Order Star Core: Swift Execution","673023073":"Order Star Core: Declaration of Protection","673023074":"Order Star Core: Declaration of Protection","673023075":"Order Star Core: Declaration of Protection","673023076":"Order Star Core: Declaration of Protection","673023103":"Order Star Core: Bullet Shower","673023104":"Order Star Core: Bullet Shower","673023105":"Order Star Core: Bullet Shower","673023106":"Order Star Core: Bullet Shower","673023113":"Order Star Core: HSU-06 Laser Sight","673023114":"Order Star Core: HSU-06 Laser Sight","673023115":"Order Star Core: HSU-06 Laser Sight","673023116":"Order Star Core: HSU-06 Laser Sight","673023123":"Order Star Core: Extrasensory Synchronization","673023124":"Order Star Core: Extrasensory Synchronization","673023125":"Order Star Core: Extrasensory Synchronization","673023126":"Order Star Core: Extrasensory Synchronization","673023133":"Order Star Core: Iron Rain","673023134":"Order Star Core: Iron Rain","673023135":"Order Star Core: Iron Rain","673023136":"Order Star Core: Iron Rain","673023163":"Order Star Core: Precision Fire","673023164":"Order Star Core: Precision Fire","673023165":"Order Star Core: Precision Fire","673023166":"Order Star Core: Precision Fire","673023203":"Order Star Core: Ground-Breaker","673023204":"Order Star Core: Ground-Breaker","673023205":"Order Star Core: Ground-Breaker","673023206":"Order Star Core: Ground-Breaker","673023213":"Order Star Core: Annihilating Void","673023214":"Order Star Core: Annihilating Void","673023215":"Order Star Core: Annihilating Void","673023216":"Order Star Core: Annihilating Void","673023223":"Order Star Core: Ultimate Azure Gale","673023224":"Order Star Core: Ultimate Azure Gale","673023225":"Order Star Core: Ultimate Azure Gale","673023226":"Order Star Core: Ultimate Azure Gale","673023233":"Order Star Core: Dual Technique","673023234":"Order Star Core: Dual Technique","673023235":"Order Star Core: Dual Technique","673023236":"Order Star Core: Dual Technique","673023263":"Order Star Core: Divine King's Manifestation","673023264":"Order Star Core: Divine King's Manifestation","673023265":"Order Star Core: Divine King's Manifestation","673023266":"Order Star Core: Divine King's Manifestation","673023273":"Order Star Core: Divine Axis","673023274":"Order Star Core: Divine Axis","673023275":"Order Star Core: Divine Axis","673023276":"Order Star Core: Divine Axis","673023303":"Order Star Core: Balance of Power","673023304":"Order Star Core: Balance of Power","673023305":"Order Star Core: Balance of Power","673023306":"Order Star Core: Balance of Power","673023313":"Order Star Core: Dark Collection","673023314":"Order Star Core: Dark Collection","673023315":"Order Star Core: Dark Collection","673023316":"Order Star Core: Dark Collection","673023323":"Order Star Core: Prosperous Zephyr","673023324":"Order Star Core: Prosperous Zephyr","673023325":"Order Star Core: Prosperous Zephyr","673023326":"Order Star Core: Prosperous Zephyr","673023333":"Order Star Core: Lightning Blaze","673023334":"Order Star Core: Lightning Blaze","673023335":"Order Star Core: Lightning Blaze","673023336":"Order Star Core: Lightning Blaze","673023403":"Order Star Core: Basics","673023404":"Order Star Core: Basics","673023405":"Order Star Core: Basics","673023406":"Order Star Core: Basics","673023413":"Order Star Core: Lethal Strike","673023414":"Order Star Core: Lethal Strike","673023415":"Order Star Core: Lethal Strike","673023416":"Order Star Core: Lethal Strike","673023423":"Order Star Core: Nightmarish Plunge","673023424":"Order Star Core: Nightmarish Plunge","673023425":"Order Star Core: Nightmarish Plunge","673023426":"Order Star Core: Nightmarish Plunge","673023433":"Order Star Core: Dark Moon Monarch","673023434":"Order Star Core: Dark Moon Monarch","673023435":"Order Star Core: Dark Moon Monarch","673023436":"Order Star Core: Dark Moon Monarch","673023503":"Order Star Core: Snow Shower Tempest","673023504":"Order Star Core: Snow Shower Tempest","673023505":"Order Star Core: Snow Shower Tempest","673023506":"Order Star Core: Snow Shower Tempest","673023513":"Order Star Core: Bouncing Brushwork","673023514":"Order Star Core: Bouncing Brushwork","673023515":"Order Star Core: Bouncing Brushwork","673023516":"Order Star Core: Bouncing Brushwork","673023523":"Order Star Core: Illusory Bear","673023524":"Order Star Core: Illusory Bear","673023525":"Order Star Core: Illusory Bear","673023526":"Order Star Core: Illusory Bear","673023603":"Order Star Core: Grand Finale","673023604":"Order Star Core: Grand Finale","673023605":"Order Star Core: Grand Finale","673023606":"Order Star Core: Grand Finale","673023703":"Order Star Core: Minute Hand Calibration","673023704":"Order Star Core: Minute Hand Calibration","673023705":"Order Star Core: Minute Hand Calibration","673023706":"Order Star Core: Minute Hand Calibration","673024003":"Order Star Core: Chain Slash","673024004":"Order Star Core: Chain Slash","673024005":"Order Star Core: Chain Slash","673024006":"Order Star Core: Chain Slash","673024013":"Order Star Core: Rock Blade","673024014":"Order Star Core: Rock Blade","673024015":"Order Star Core: Rock Blade","673024016":"Order Star Core: Rock Blade","673024023":"Order Star Core: Chariot Charge","673024024":"Order Star Core: Chariot Charge","673024025":"Order Star Core: Chariot Charge","673024026":"Order Star Core: Chariot Charge","673024033":"Order Star Core: Prayer of Divine Surge","673024034":"Order Star Core: Prayer of Divine Surge","673024035":"Order Star Core: Prayer of Divine Surge","673024036":"Order Star Core: Prayer of Divine Surge","673024063":"Order Star Core: Finishing Strike","673024064":"Order Star Core: Finishing Strike","673024065":"Order Star Core: Finishing Strike","673024066":"Order Star Core: Finishing Strike","673024073":"Order Star Core: Ring of Protection","673024074":"Order Star Core: Ring of Protection","673024075":"Order Star Core: Ring of Protection","673024076":"Order Star Core: Ring of Protection","673024103":"Order Star Core: Silver Bullet","673024104":"Order Star Core: Silver Bullet","673024105":"Order Star Core: Silver Bullet","673024106":"Order Star Core: Silver Bullet","673024113":"Order Star Core: HSU-57 Strength Support Gloves","673024114":"Order Star Core: HSU-57 Strength Support Gloves","673024115":"Order Star Core: HSU-57 Strength Support Gloves","673024116":"Order Star Core: HSU-57 Strength Support Gloves","673024123":"Order Star Core: Artillery Stance","673024124":"Order Star Core: Artillery Stance","673024125":"Order Star Core: Artillery Stance","673024126":"Order Star Core: Artillery Stance","673024133":"Order Star Core: Absolutely Cooking","673024134":"Order Star Core: Absolutely Cooking","673024135":"Order Star Core: Absolutely Cooking","673024136":"Order Star Core: Absolutely Cooking","673024163":"Order Star Core: Full Magazine","673024164":"Order Star Core: Full Magazine","673024165":"Order Star Core: Full Magazine","673024166":"Order Star Core: Full Magazine","673024203":"Order Star Core: Black Dragon's Leap","673024204":"Order Star Core: Black Dragon's Leap","673024205":"Order Star Core: Black Dragon's Leap","673024206":"Order Star Core: Black Dragon's Leap","673024213":"Order Star Core: Shadowsweep","673024214":"Order Star Core: Shadowsweep","673024215":"Order Star Core: Shadowsweep","673024216":"Order Star Core: Shadowsweep","673024223":"Order Star Core: Rising Fiery Dragon","673024224":"Order Star Core: Rising Fiery Dragon","673024225":"Order Star Core: Rising Fiery Dragon","673024226":"Order Star Core: Rising Fiery Dragon","673024233":"Order Star Core: Illusion","673024234":"Order Star Core: Illusion","673024235":"Order Star Core: Illusion","673024236":"Order Star Core: Illusion","673024263":"Order Star Core: Cloudburst Barrage","673024264":"Order Star Core: Cloudburst Barrage","673024265":"Order Star Core: Cloudburst Barrage","673024266":"Order Star Core: Cloudburst Barrage","673024273":"Order Star Core: Asura","673024274":"Order Star Core: Asura","673024275":"Order Star Core: Asura","673024276":"Order Star Core: Asura","673024303":"Order Star Core: Power of Creation","673024304":"Order Star Core: Power of Creation","673024305":"Order Star Core: Power of Creation","673024306":"Order Star Core: Power of Creation","673024313":"Order Star Core: Shuffle Dance","673024314":"Order Star Core: Shuffle Dance","673024315":"Order Star Core: Shuffle Dance","673024316":"Order Star Core: Shuffle Dance","673024323":"Order Star Core: Sound Deluge","673024324":"Order Star Core: Sound Deluge","673024325":"Order Star Core: Sound Deluge","673024326":"Order Star Core: Sound Deluge","673024333":"Order Star Core: Null Element","673024334":"Order Star Core: Null Element","673024335":"Order Star Core: Null Element","673024336":"Order Star Core: Null Element","673024403":"Order Star Core: Downtime","673024404":"Order Star Core: Downtime","673024405":"Order Star Core: Downtime","673024406":"Order Star Core: Downtime","673024413":"Order Star Core: Deadly Boomerang","673024414":"Order Star Core: Deadly Boomerang","673024415":"Order Star Core: Deadly Boomerang","673024416":"Order Star Core: Deadly Boomerang","673024423":"Order Star Core: Critical Combination","673024424":"Order Star Core: Critical Combination","673024425":"Order Star Core: Critical Combination","673024426":"Order Star Core: Critical Combination","673024433":"Order Star Core: Deathlord's Power","673024434":"Order Star Core: Deathlord's Power","673024435":"Order Star Core: Deathlord's Power","673024436":"Order Star Core: Deathlord's Power","673024503":"Order Star Core: Kra-kow!","673024504":"Order Star Core: Kra-kow!","673024505":"Order Star Core: Kra-kow!","673024506":"Order Star Core: Kra-kow!","673024513":"Order Star Core: Dimensional Gate","673024514":"Order Star Core: Dimensional Gate","673024515":"Order Star Core: Dimensional Gate","673024516":"Order Star Core: Dimensional Gate","673024523":"Order Star Core: Boom Boom Punch","673024524":"Order Star Core: Boom Boom Punch","673024525":"Order Star Core: Boom Boom Punch","673024526":"Order Star Core: Boom Boom Punch","673024603":"Order Star Core: Army of One","673024604":"Order Star Core: Army of One","673024605":"Order Star Core: Army of One","673024606":"Order Star Core: Army of One","673024703":"Order Star Core: Chain Thrust","673024704":"Order Star Core: Chain Thrust","673024705":"Order Star Core: Chain Thrust","673024706":"Order Star Core: Chain Thrust","673025003":"Order Star Core: Hell Flip","673025004":"Order Star Core: Hell Flip","673025005":"Order Star Core: Hell Flip","673025006":"Order Star Core: Hell Flip","673025013":"Order Star Core: Shattered Earth","673025014":"Order Star Core: Shattered Earth","673025015":"Order Star Core: Shattered Earth","673025016":"Order Star Core: Shattered Earth","673025023":"Order Star Core: Resounding Thunder","673025024":"Order Star Core: Resounding Thunder","673025025":"Order Star Core: Resounding Thunder","673025026":"Order Star Core: Resounding Thunder","673025033":"Order Star Core: Prayer of Light","673025034":"Order Star Core: Prayer of Light","673025035":"Order Star Core: Prayer of Light","673025036":"Order Star Core: Prayer of Light","673025063":"Order Star Core: Wind of Destruction","673025064":"Order Star Core: Wind of Destruction","673025065":"Order Star Core: Wind of Destruction","673025066":"Order Star Core: Wind of Destruction","673025073":"Order Star Core: Holy Blade's Ashes","673025074":"Order Star Core: Holy Blade's Ashes","673025075":"Order Star Core: Holy Blade's Ashes","673025076":"Order Star Core: Holy Blade's Ashes","673025103":"Order Star Core: Endless Spiral","673025104":"Order Star Core: Endless Spiral","673025105":"Order Star Core: Endless Spiral","673025106":"Order Star Core: Endless Spiral","673025113":"Order Star Core: HSU-22 Limb Stabilizer","673025114":"Order Star Core: HSU-22 Limb Stabilizer","673025115":"Order Star Core: HSU-22 Limb Stabilizer","673025116":"Order Star Core: HSU-22 Limb Stabilizer","673025123":"Order Star Core: Core Reactor Amplification","673025124":"Order Star Core: Core Reactor Amplification","673025125":"Order Star Core: Core Reactor Amplification","673025126":"Order Star Core: Core Reactor Amplification","673025133":"Order Star Core: Auto Lock-On","673025134":"Order Star Core: Auto Lock-On","673025135":"Order Star Core: Auto Lock-On","673025136":"Order Star Core: Auto Lock-On","673025163":"Order Star Core: Heel Strike","673025164":"Order Star Core: Heel Strike","673025165":"Order Star Core: Heel Strike","673025166":"Order Star Core: Heel Strike","673025203":"Order Star Core: Barrage","673025204":"Order Star Core: Barrage","673025205":"Order Star Core: Barrage","673025206":"Order Star Core: Barrage","673025213":"Order Star Core: Yin Yang Technique","673025214":"Order Star Core: Yin Yang Technique","673025215":"Order Star Core: Yin Yang Technique","673025216":"Order Star Core: Yin Yang Technique","673025223":"Order Star Core: Supreme Fist","673025224":"Order Star Core: Supreme Fist","673025225":"Order Star Core: Supreme Fist","673025226":"Order Star Core: Supreme Fist","673025233":"Order Star Core: Wild Barrage","673025234":"Order Star Core: Wild Barrage","673025235":"Order Star Core: Wild Barrage","673025236":"Order Star Core: Wild Barrage","673025263":"Order Star Core: Limit Smasher","673025264":"Order Star Core: Limit Smasher","673025265":"Order Star Core: Limit Smasher","673025266":"Order Star Core: Limit Smasher","673025273":"Order Star Core: Sanction","673025274":"Order Star Core: Sanction","673025275":"Order Star Core: Sanction","673025276":"Order Star Core: Sanction","673025303":"Order Star Core: Elemental Guide","673025304":"Order Star Core: Elemental Guide","673025305":"Order Star Core: Elemental Guide","673025306":"Order Star Core: Elemental Guide","673025313":"Order Star Core: Speed Check","673025314":"Order Star Core: Speed Check","673025315":"Order Star Core: Speed Check","673025316":"Order Star Core: Speed Check","673025323":"Order Star Core: Buckshot Acceleration","673025324":"Order Star Core: Buckshot Acceleration","673025325":"Order Star Core: Buckshot Acceleration","673025326":"Order Star Core: Buckshot Acceleration","673025333":"Order Star Core: Lightning Torrent","673025334":"Order Star Core: Lightning Torrent","673025335":"Order Star Core: Lightning Torrent","673025336":"Order Star Core: Lightning Torrent","673025403":"Order Star Core: Death Sword Energy","673025404":"Order Star Core: Death Sword Energy","673025405":"Order Star Core: Death Sword Energy","673025406":"Order Star Core: Death Sword Energy","673025413":"Order Star Core: Destruction Beam","673025414":"Order Star Core: Destruction Beam","673025415":"Order Star Core: Destruction Beam","673025416":"Order Star Core: Destruction Beam","673025423":"Order Star Core: Approaching Death","673025424":"Order Star Core: Approaching Death","673025425":"Order Star Core: Approaching Death","673025426":"Order Star Core: Approaching Death","673025433":"Order Star Core: Reality's Faded Edge","673025434":"Order Star Core: Reality's Faded Edge","673025435":"Order Star Core: Reality's Faded Edge","673025436":"Order Star Core: Reality's Faded Edge","673025503":"Order Star Core: Hearth and Hospitality","673025504":"Order Star Core: Hearth and Hospitality","673025505":"Order Star Core: Hearth and Hospitality","673025506":"Order Star Core: Hearth and Hospitality","673025513":"Order Star Core: Ink Spray","673025514":"Order Star Core: Ink Spray","673025515":"Order Star Core: Ink Spray","673025516":"Order Star Core: Ink Spray","673025523":"Order Star Core: Crow Brawl","673025524":"Order Star Core: Crow Brawl","673025525":"Order Star Core: Crow Brawl","673025526":"Order Star Core: Crow Brawl","673025603":"Order Star Core: Destruction","673025604":"Order Star Core: Destruction","673025605":"Order Star Core: Destruction","673025606":"Order Star Core: Destruction","673025703":"Order Star Core: Multislash","673025704":"Order Star Core: Multislash","673025705":"Order Star Core: Multislash","673025706":"Order Star Core: Multislash","673100003":"Chaos Sun Core: Flashy Attack","673100004":"Chaos Sun Core: Flashy Attack","673100005":"Chaos Sun Core: Flashy Attack","673100006":"Chaos Sun Core: Flashy Attack","673101003":"Chaos Sun Core: Stable Attack","673101004":"Chaos Sun Core: Stable Attack","673101005":"Chaos Sun Core: Stable Attack","673101006":"Chaos Sun Core: Stable Attack","673102003":"Chaos Sun Core: Swift Attack","673102004":"Chaos Sun Core: Swift Attack","673102005":"Chaos Sun Core: Swift Attack","673102006":"Chaos Sun Core: Swift Attack","673103003":"Chaos Sun Core: Faith Enhancement","673103004":"Chaos Sun Core: Faith Enhancement","673103005":"Chaos Sun Core: Faith Enhancement","673103006":"Chaos Sun Core: Faith Enhancement","673104003":"Chaos Sun Core: Flowing Magick","673104004":"Chaos Sun Core: Flowing Magick","673104005":"Chaos Sun Core: Flowing Magick","673104006":"Chaos Sun Core: Flowing Magick","673105003":"Chaos Sun Core: Fortitude Enhancement","673105004":"Chaos Sun Core: Fortitude Enhancement","673105005":"Chaos Sun Core: Fortitude Enhancement","673105006":"Chaos Sun Core: Fortitude Enhancement","673110003":"Chaos Moon Core: Smoldering Strike","673110004":"Chaos Moon Core: Smoldering Strike","673110005":"Chaos Moon Core: Smoldering Strike","673110006":"Chaos Moon Core: Smoldering Strike","673111003":"Chaos Moon Core: Absorbing Strike","673111004":"Chaos Moon Core: Absorbing Strike","673111005":"Chaos Moon Core: Absorbing Strike","673111006":"Chaos Moon Core: Absorbing Strike","673112003":"Chaos Moon Core: Crushing Strike","673112004":"Chaos Moon Core: Crushing Strike","673112005":"Chaos Moon Core: Crushing Strike","673112006":"Chaos Moon Core: Crushing Strike","673113003":"Chaos Moon Core: Echoing Brand","673113004":"Chaos Moon Core: Echoing Brand","673113005":"Chaos Moon Core: Echoing Brand","673113006":"Chaos Moon Core: Echoing Brand","673114003":"Chaos Moon Core: Echoing Steel","673114004":"Chaos Moon Core: Echoing Steel","673114005":"Chaos Moon Core: Echoing Steel","673114006":"Chaos Moon Core: Echoing Steel","673115003":"Chaos Moon Core: Echoing Death","673115004":"Chaos Moon Core: Echoing Death","673115005":"Chaos Moon Core: Echoing Death","673115006":"Chaos Moon Core: Echoing Death","673120003":"Chaos Star Core: Attack","673120004":"Chaos Star Core: Attack","673120005":"Chaos Star Core: Attack","673120006":"Chaos Star Core: Attack","673121003":"Chaos Star Core: Weapon","673121004":"Chaos Star Core: Weapon","673121005":"Chaos Star Core: Weapon","673121006":"Chaos Star Core: Weapon","673122003":"Chaos Star Core: Salvation","673122004":"Chaos Star Core: Salvation","673122005":"Chaos Star Core: Salvation","673122006":"Chaos Star Core: Salvation","673123003":"Chaos Star Core: Life","673123004":"Chaos Star Core: Life","673123005":"Chaos Star Core: Life","673123006":"Chaos Star Core: Life","673124003":"Chaos Star Core: Speed","673124004":"Chaos Star Core: Speed","673124005":"Chaos Star Core: Speed","673124006":"Chaos Star Core: Speed","673125003":"Chaos Star Core: Defense","673125004":"Chaos Star Core: Defense","673125005":"Chaos Star Core: Defense","673125006":"Chaos Star Core: Defense"};
const BIBLE_GEMS = {"65001010":"Gemme Niv. 1 (Lv. 1 Apprentice's Gem (Bound))","65001020":"Gemme Niv. 2 (Lv. 2 Apprentice's Gem (Bound))","65011010":"Gemme Niv. 1 (Level 1 Azure Gem)","65011020":"Gemme Niv. 2 (Level 2 Azure Gem)","65011030":"Gemme Niv. 3 (Level 3 Azure Gem)","65011040":"Gemme Niv. 4 (Level 4 Azure Gem)","65011050":"Gemme Niv. 5 (Level 5 Azure Gem)","65011060":"Gemme Niv. 6 (Level 6 Azure Gem)","65011070":"Gemme Niv. 7 (Level 7 Azure Gem)","65011080":"Gemme Niv. 8 (Level 8 Azure Gem)","65011090":"Gemme Niv. 9 (Level 9 Azure Gem)","65011100":"Gemme Niv. 10 (Level 10 Azure Gem)","65012010":"Gemme Niv. 1 (Level 1 Farsea Gem)","65012020":"Gemme Niv. 2 (Level 2 Farsea Gem)","65012030":"Gemme Niv. 3 (Level 3 Farsea Gem)","65012040":"Gemme Niv. 4 (Level 4 Farsea Gem)","65012050":"Gemme Niv. 5 (Level 5 Farsea Gem)","65012060":"Gemme Niv. 6 (Level 6 Farsea Gem)","65012070":"Gemme Niv. 7 (Level 7 Farsea Gem)","65012080":"Gemme Niv. 8 (Level 8 Farsea Gem)","65012090":"Gemme Niv. 9 (Level 9 Farsea Gem)","65012100":"Gemme Niv. 10 (Level 10 Farsea Gem)","65021010":"Gemme Niv. 1 (Lv. 1 Annihilation Gem)","65021020":"Gemme Niv. 2 (Lv. 2 Annihilation Gem)","65021030":"Gemme Niv. 3 (Lv. 3 Annihilation Gem)","65021040":"Gemme Niv. 4 (Lv. 4 Annihilation Gem)","65021050":"Gemme Niv. 5 (Lv. 5 Annihilation Gem)","65021060":"Gemme Niv. 6 (Lv. 6 Annihilation Gem)","65021070":"Gemme Niv. 7 (Lv. 7 Annihilation Gem)","65021080":"Gemme Niv. 8 (Lv. 8 Annihilation Gem)","65021090":"Gemme Niv. 9 (Lv. 9 Annihilation Gem)","65021100":"Gemme Niv. 10 (Lv. 10 Annihilation Gem)","65022010":"Gemme Niv. 1 (Lv. 1 Crimson Flame Gem)","65022020":"Gemme Niv. 2 (Lv. 2 Crimson Flame Gem)","65022030":"Gemme Niv. 3 (Lv. 3 Crimson Flame Gem)","65022040":"Gemme Niv. 4 (Lv. 4 Crimson Flame Gem)","65022050":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem)","65022060":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem)","65022070":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem)","65022080":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem)","65022090":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem)","65022100":"Gemme Niv. 10 (Lv. 10 Crimson Flame Gem)","65031010":"Gemme T4 Niv. 1 (Dégâts Majeurs)","65031020":"Gemme T4 Niv. 2 (Dégâts Majeurs)","65031030":"Gemme T4 Niv. 3 (Dégâts Majeurs)","65031040":"Gemme T4 Niv. 4 (Dégâts Majeurs)","65031050":"Gemme T4 Niv. 5 (Dégâts Majeurs)","65031060":"Gemme T4 Niv. 6 (Dégâts Majeurs)","65031061":"Gemme T4 Niv. 6 (Dégâts Majeurs)","65031070":"Gemme T4 Niv. 7 (Dégâts Majeurs)","65031080":"Gemme T4 Niv. 8 (Dégâts Majeurs)","65031090":"Gemme T4 Niv. 9 (Dégâts Majeurs)","65031100":"Gemme T4 Niv. 10 (Dégâts Majeurs)","65032010":"Gemme T4 Niv. 1 (Dégâts)","65032020":"Gemme T4 Niv. 2 (Dégâts)","65032030":"Gemme T4 Niv. 3 (Dégâts)","65032040":"Gemme T4 Niv. 4 (Dégâts)","65032050":"Gemme T4 Niv. 5 (Dégâts)","65032060":"Gemme T4 Niv. 6 (Dégâts)","65032061":"Gemme T4 Niv. 6 (Dégâts)","65032070":"Gemme T4 Niv. 7 (Dégâts)","65032080":"Gemme T4 Niv. 8 (Dégâts)","65032090":"Gemme T4 Niv. 9 (Dégâts)","65032100":"Gemme T4 Niv. 10 (Dégâts)","65041010":"Gemme T4 Niv. 1 (Rechargement)","65041020":"Gemme T4 Niv. 2 (Rechargement)","65041030":"Gemme T4 Niv. 3 (Rechargement)","65041040":"Gemme T4 Niv. 4 (Rechargement)","65041050":"Gemme T4 Niv. 5 (Rechargement)","65041051":"Gemme T4 Niv. 5 (Rechargement)","65041060":"Gemme T4 Niv. 6 (Rechargement)","65041061":"Gemme T4 Niv. 6 (Rechargement)","65041070":"Gemme T4 Niv. 7 (Rechargement)","65041071":"Gemme T4 Niv. 7 (Rechargement)","65041072":"Gemme T4 Niv. 7 (Rechargement)","65041073":"Gemme T4 Niv. 7 (Rechargement)","65041080":"Gemme T4 Niv. 8 (Rechargement)","65041082":"Gemme T4 Niv. 8 (Rechargement)","65041090":"Gemme T4 Niv. 9 (Rechargement)","65041100":"Gemme T4 Niv. 10 (Rechargement)","65042010":"Gemme T4 Niv. 1 (Rechargement)","65042020":"Gemme T4 Niv. 2 (Rechargement)","65042030":"Gemme T4 Niv. 3 (Rechargement)","65042040":"Gemme T4 Niv. 4 (Rechargement)","65042050":"Gemme T4 Niv. 5 (Rechargement)","65042060":"Gemme T4 Niv. 6 (Rechargement)","65042070":"Gemme T4 Niv. 7 (Rechargement)","65042080":"Gemme T4 Niv. 8 (Rechargement)","65042090":"Gemme T4 Niv. 9 (Rechargement)","65042100":"Gemme T4 Niv. 10 (Rechargement)","65091010":"Gemme Niv. 1 (Lv. 1 Annihilation Gem (Bound))","65091020":"Gemme Niv. 2 (Lv. 2 Annihilation Gem (Bound))","65091030":"Gemme Niv. 3 (Lv. 3 Annihilation Gem (Bound))","65091040":"Gemme Niv. 4 (Lv. 4 Annihilation Gem (Bound))","65091050":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091051":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091052":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091053":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091054":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091055":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091056":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091057":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091058":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091059":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091060":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091061":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091062":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091063":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091064":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091065":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091066":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091067":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091068":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091069":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091070":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091071":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091072":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091073":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091074":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091075":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091076":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091077":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091078":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091079":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091080":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091090":"Gemme Niv. 9 (Lv. 9 Annihilation Gem (Bound))","65091100":"Gemme Niv. 10 (Lv. 10 Annihilation Gem (Bound))","65091171":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091172":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091173":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091174":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091175":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091176":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091177":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091178":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091181":"Gemme Niv. 9 (Lv. 9 Annihilation Gem (Bound))","65091191":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091192":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091193":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091194":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091195":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091196":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091197":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091198":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091201":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091202":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091203":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091204":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091205":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091206":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091207":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091208":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091211":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091212":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091213":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091214":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091215":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091216":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091217":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091218":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091221":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091222":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091223":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091224":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091225":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091226":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091227":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091228":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091231":"Gemme T4 Niv. 7 (Dégâts Majeurs)","65091241":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091242":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091243":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091244":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091245":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091246":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091247":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091248":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091251":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091252":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091253":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091254":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091255":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091256":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091257":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091258":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091261":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091262":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091263":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091264":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091265":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091266":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091267":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091268":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091281":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091282":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091283":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091284":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091285":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091286":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091287":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091288":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091291":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091292":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091293":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091294":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091295":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091296":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091297":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091298":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091301":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091302":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091303":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091304":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091305":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091306":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091307":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091308":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091311":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091312":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091313":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091314":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091315":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091316":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091317":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091318":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091321":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091322":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091323":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091324":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091325":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091326":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091327":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091328":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091331":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091332":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091333":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091334":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091335":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091336":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091337":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091338":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091341":"Gemme T4 Niv. 6 (Rechargement)","65091342":"Gemme T4 Niv. 6 (Rechargement)","65091343":"Gemme T4 Niv. 6 (Rechargement)","65091344":"Gemme T4 Niv. 6 (Rechargement)","65091345":"Gemme T4 Niv. 6 (Rechargement)","65091346":"Gemme T4 Niv. 6 (Rechargement)","65091347":"Gemme T4 Niv. 6 (Rechargement)","65091348":"Gemme T4 Niv. 6 (Rechargement)","65091351":"Gemme T4 Niv. 6 (Rechargement)","65091352":"Gemme T4 Niv. 6 (Rechargement)","65091353":"Gemme T4 Niv. 6 (Rechargement)","65091354":"Gemme T4 Niv. 6 (Rechargement)","65091355":"Gemme T4 Niv. 6 (Rechargement)","65091356":"Gemme T4 Niv. 6 (Rechargement)","65091357":"Gemme T4 Niv. 6 (Rechargement)","65091358":"Gemme T4 Niv. 6 (Rechargement)","65091361":"Gemme T4 Niv. 5 (Rechargement)","65091362":"Gemme T4 Niv. 5 (Rechargement)","65091363":"Gemme T4 Niv. 5 (Rechargement)","65091364":"Gemme T4 Niv. 5 (Rechargement)","65091365":"Gemme T4 Niv. 5 (Rechargement)","65091366":"Gemme T4 Niv. 5 (Rechargement)","65091367":"Gemme T4 Niv. 5 (Rechargement)","65091368":"Gemme T4 Niv. 5 (Rechargement)","65091371":"Gemme T4 Niv. 5 (Rechargement)","65091372":"Gemme T4 Niv. 5 (Rechargement)","65091373":"Gemme T4 Niv. 5 (Rechargement)","65091374":"Gemme T4 Niv. 5 (Rechargement)","65091375":"Gemme T4 Niv. 5 (Rechargement)","65091376":"Gemme T4 Niv. 5 (Rechargement)","65091377":"Gemme T4 Niv. 5 (Rechargement)","65091378":"Gemme T4 Niv. 5 (Rechargement)","65091381":"Gemme T4 Niv. 6 (Rechargement)","65091382":"Gemme T4 Niv. 6 (Rechargement)","65091383":"Gemme T4 Niv. 6 (Rechargement)","65091384":"Gemme T4 Niv. 6 (Rechargement)","65091385":"Gemme T4 Niv. 6 (Rechargement)","65091386":"Gemme T4 Niv. 6 (Rechargement)","65091387":"Gemme T4 Niv. 6 (Rechargement)","65091388":"Gemme T4 Niv. 6 (Rechargement)","65091391":"Gemme T4 Niv. 6 (Rechargement)","65091392":"Gemme T4 Niv. 6 (Rechargement)","65091393":"Gemme T4 Niv. 6 (Rechargement)","65091394":"Gemme T4 Niv. 6 (Rechargement)","65091395":"Gemme T4 Niv. 6 (Rechargement)","65091396":"Gemme T4 Niv. 6 (Rechargement)","65091397":"Gemme T4 Niv. 6 (Rechargement)","65091398":"Gemme T4 Niv. 6 (Rechargement)","65092010":"Gemme Niv. 1 (Lv. 1 Crimson Flame Gem (Bound))","65092020":"Gemme Niv. 2 (Lv. 2 Crimson Flame Gem (Bound))","65092030":"Gemme Niv. 3 (Lv. 3 Crimson Flame Gem (Bound))","65092040":"Gemme Niv. 4 (Lv. 4 Crimson Flame Gem (Bound))","65092050":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092051":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092052":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092053":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092054":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092055":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092056":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092057":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092058":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092059":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092060":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092061":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092062":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092063":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092064":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092065":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092066":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092067":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092068":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092069":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092070":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092071":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092072":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092073":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092074":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092075":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092076":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092077":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092078":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092079":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092080":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092090":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem (Bound))","65092100":"Gemme Niv. 10 (Lv. 10 Crimson Flame Gem (Bound))","65092171":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092172":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092173":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092174":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092175":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092176":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092177":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092178":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092181":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem (Bound))","65092191":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092192":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092193":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092194":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092195":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092196":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092197":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092198":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092201":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092202":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092203":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092204":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092205":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092206":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092207":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092208":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092211":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092212":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092213":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092214":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092215":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092216":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092217":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092218":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092221":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092222":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092223":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092224":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092225":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092226":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092227":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092228":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092231":"Gemme T4 Niv. 7 (Dégâts)","65092241":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092242":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092243":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092244":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092245":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092246":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092247":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092248":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092251":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092252":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092253":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092254":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092255":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092256":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092257":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092258":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092261":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092262":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092263":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092264":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092265":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092266":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092267":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092268":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092281":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092282":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092283":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092284":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092285":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092286":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092287":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092288":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092291":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092292":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092293":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092294":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092295":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092296":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092297":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092298":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092301":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092302":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092303":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092304":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092305":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092306":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092307":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092308":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092311":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092312":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092313":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092314":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092315":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092316":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092317":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092318":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092321":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092322":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092323":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092324":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092325":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092326":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092327":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092328":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092331":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092332":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092333":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092334":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092335":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092336":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092337":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092338":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092341":"Gemme T4 Niv. 6 (Rechargement)","65092342":"Gemme T4 Niv. 6 (Rechargement)","65092343":"Gemme T4 Niv. 6 (Rechargement)","65092344":"Gemme T4 Niv. 6 (Rechargement)","65092345":"Gemme T4 Niv. 6 (Rechargement)","65092346":"Gemme T4 Niv. 6 (Rechargement)","65092347":"Gemme T4 Niv. 6 (Rechargement)","65092348":"Gemme T4 Niv. 6 (Rechargement)","65092351":"Gemme T4 Niv. 6 (Rechargement)","65092352":"Gemme T4 Niv. 6 (Rechargement)","65092353":"Gemme T4 Niv. 6 (Rechargement)","65092354":"Gemme T4 Niv. 6 (Rechargement)","65092355":"Gemme T4 Niv. 6 (Rechargement)","65092356":"Gemme T4 Niv. 6 (Rechargement)","65092357":"Gemme T4 Niv. 6 (Rechargement)","65092358":"Gemme T4 Niv. 6 (Rechargement)","65092361":"Gemme T4 Niv. 5 (Rechargement)","65092362":"Gemme T4 Niv. 5 (Rechargement)","65092363":"Gemme T4 Niv. 5 (Rechargement)","65092364":"Gemme T4 Niv. 5 (Rechargement)","65092365":"Gemme T4 Niv. 5 (Rechargement)","65092366":"Gemme T4 Niv. 5 (Rechargement)","65092367":"Gemme T4 Niv. 5 (Rechargement)","65092368":"Gemme T4 Niv. 5 (Rechargement)","65092371":"Gemme T4 Niv. 5 (Rechargement)","65092372":"Gemme T4 Niv. 5 (Rechargement)","65092373":"Gemme T4 Niv. 5 (Rechargement)","65092374":"Gemme T4 Niv. 5 (Rechargement)","65092375":"Gemme T4 Niv. 5 (Rechargement)","65092376":"Gemme T4 Niv. 5 (Rechargement)","65092377":"Gemme T4 Niv. 5 (Rechargement)","65092378":"Gemme T4 Niv. 5 (Rechargement)","65092381":"Gemme T4 Niv. 6 (Rechargement)","65092382":"Gemme T4 Niv. 6 (Rechargement)","65092383":"Gemme T4 Niv. 6 (Rechargement)","65092384":"Gemme T4 Niv. 6 (Rechargement)","65092385":"Gemme T4 Niv. 6 (Rechargement)","65092386":"Gemme T4 Niv. 6 (Rechargement)","65092387":"Gemme T4 Niv. 6 (Rechargement)","65092388":"Gemme T4 Niv. 6 (Rechargement)","65092391":"Gemme T4 Niv. 6 (Rechargement)","65092392":"Gemme T4 Niv. 6 (Rechargement)","65092393":"Gemme T4 Niv. 6 (Rechargement)","65092394":"Gemme T4 Niv. 6 (Rechargement)","65092395":"Gemme T4 Niv. 6 (Rechargement)","65092396":"Gemme T4 Niv. 6 (Rechargement)","65092397":"Gemme T4 Niv. 6 (Rechargement)","65092398":"Gemme T4 Niv. 6 (Rechargement)","65093003":"Gemme Niv. 9 (Lv. 9 Annihilation Gem (Bound))","65093007":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem (Bound))","65093010":"Gemme T4 Niv. 7 (Dégâts Majeurs)","65093015":"Gemme T4 Niv. 7 (Dégâts)","65093019":"Gemme T4 Niv. 7 (Rechargement)","65093020":"Gemme T4 Niv. 7 (Rechargement)","65093021":"Gemme T4 Niv. 8 (Rechargement)"};





let activeCanonicalKey = null;
let liveImportedProfile = null;

// Libellé d'une gemme du Battle Point (type 22) d'après les gemmes du profil, dans l'ordre :
// leur effet réel (dégâts type 5 / 34, recharge 27 / 35). La famille de l'ID ne dit pas le type
// (ex. 65041… porte aussi des gemmes de dégâts).
function canonGemLabeler(loadout) {
  const profileGems = ((loadout && loadout.gems) || []).slice();
  return id => {
    const i = profileGems.findIndex(g => g && g.id === id);
    if (i < 0) return null;
    const g = profileGems.splice(i, 1)[0];
    const ap = (g.effects || []).find(e => e.type === 2 && e.id === 150);
    const sk = (g.effects || []).find(e => [5, 34, 27, 35].includes(e.type));
    const lvl = ap ? GEM_AP_BY_VALUE[ap.value] : Math.floor((id % 1000) / 10);
    if (!sk || !lvl) return null;
    const cd = sk.type === 27 || sk.type === 35;
    return `Gemme T4 Niv. ${lvl} (${cd ? 'Recharge -' : 'Dégâts +'}${(sk.value / 100).toFixed(2)}%)`;
  };
}

// Profils importés avant la correction des libellés : gemmes relues sur le profil, notes sans source retirées
function refreshCanonicalItems(prof) {
  const loadout = prof && prof.loadout;
  if (!loadout || !Array.isArray(prof.items)) return;
  const bp = loadout.battlePoint || {};
  const label = canonGemLabeler(loadout);
  const gemLabels = (bp.parts || []).filter(p => p.type === 22).map(p => label(p.id));
  const gemItems = prof.items.filter(it => it.cat === 'Gemmes');
  if (gemItems.length === gemLabels.length) gemItems.forEach((it, i) => { if (gemLabels[i]) it.label = gemLabels[i]; });
  prof.items.forEach(it => {
    if (it.cat === 'Karma' && /transcendance/i.test(it.note || '')) it.note = null;
    if (it.cat === 'Familier') {
      it.label = 'Familier';
      it.note = 'Fourchette donnée par le Battle Point du profil (minimum ~ maximum).';
    }
  });
}

function renderCanonicalView() {
  const prof = liveImportedProfile;
  if (!prof) return;
  refreshCanonicalItems(prof);
  const isSupport = prof.role === 'support';

  // Recalcule le score canonique exact à partir des items pour garantir une fidélité mathématique absolue
  if (prof.items && prof.items.length > 0) {
    const baseIt = prof.items.find(it => it.cat === 'Base' || it.cat === 'Stat de Base');
    if (baseIt) {
      // Base Val est un entier format\u00e9 par formatNumber : "558,980" (en-US) ou "558 980" (fr-FR, U+202F/U+00A0)
      const bMatch = (baseIt.mult || '').match(/Base Val:\s*(\d[\d\s\u202f\u00a0,.]*)/);
      if (bMatch) {
        const baseVal = parseInt(bMatch[1].replace(/\D/g, ''), 10);
        let dynamicScore = baseVal / 1e4;
        prof.items.forEach(it => {
          if (it.cat === 'Base' || it.cat === 'Stat de Base') return;
          if (it.mult === '+0.00%') return;
          if (it.type && it.type.includes('Heal')) return;
          const mMatch = (it.mult || '').match(/\+([\d.]+)%/);
          if (mMatch) {
            const pct = parseFloat(mMatch[1]);
            dynamicScore *= (1 + pct / 100);
          }
        });
        if (isSupport) {
          prof.buffPower = parseFloat(dynamicScore.toFixed(2));
          prof.calculatedScore = parseFloat((prof.buffPower + (prof.healPower || 0)).toFixed(2));
        } else {
          prof.calculatedScore = parseFloat(dynamicScore.toFixed(2));
          prof.buffPower = prof.calculatedScore;
        }
      }
    }
  }

  const isEn = isEnLang();
  if (dom.canonRoleBadge) {
    dom.canonRoleBadge.textContent = isSupport 
      ? 'Support Split (Buff + Heal)' 
      : (isEn ? 'Canonical DPS' : 'DPS Canonique');
    dom.canonRoleBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
    dom.canonRoleBadge.style.borderColor = isSupport ? 'rgba(232, 230, 220, 0.3)' : 'rgba(224, 122, 99, 0.3)';
  }

  if (dom.canonInGameScore) dom.canonInGameScore.textContent = formatNumber(prof.inGameScore || prof.cp || 0);
  if (dom.canonInGameSub) dom.canonInGameSub.textContent = isEn
    ? `Official profile: ${prof.name} (${prof.ilvl.toFixed(2)} iLvl)`
    : `Profil officiel : ${prof.name} (${prof.ilvl.toFixed(2)} iLvl)`;

  if (dom.canonCalculatedScore) dom.canonCalculatedScore.textContent = formatNumber(prof.calculatedScore);
  if (dom.canonCalculatedRange) {
    const diff = Math.abs(prof.calculatedScore - (prof.inGameScore || prof.calculatedScore));
    const pct = (prof.inGameScore > 0) ? ((diff / prof.inGameScore) * 100).toFixed(1) : '0.3';
    dom.canonCalculatedRange.textContent = isEn
      ? `Observed deviation: ±${pct}% vs in-game value`
      : `Écart constaté : ±${pct}% vs valeur en jeu`;
  }

  if (dom.canonBuffPower) dom.canonBuffPower.textContent = formatNumber(prof.buffPower);
  if (dom.canonHealPower) dom.canonHealPower.textContent = isSupport ? formatNumber(prof.healPower) : '0';

  if (dom.canonBuffCard) {
    dom.canonBuffCard.style.display = isSupport ? 'flex' : 'none';
  }
  if (dom.canonHealCard) {
    dom.canonHealCard.style.display = isSupport ? 'flex' : 'none';
  }

  if (dom.canonPartsCount) {
    dom.canonPartsCount.textContent = isEn
      ? `${prof.partsCount || (prof.items ? prof.items.length : 0)} Broken Down Components`
      : `${prof.partsCount || (prof.items ? prof.items.length : 0)} Composants Décomposés`;
  }

  if (dom.canonTableBody && prof.items) {
    const catMapEn = {
      'Stat de Base': 'Base Stat',
      'Arme': 'Weapon',
      'Armure': 'Armor',
      'Accessoires': 'Accessories',
      'Bracelet': 'Bracelet',
      'Gravures': 'Engravings',
      'Karma': 'Karma',
      'Ark Grid': 'Ark Grid',
      'Qualité': 'Quality',
      'Effets Spéciaux': 'Special Effects'
    };

    let rows = '';
    prof.items.forEach(rawIt => {
      const it = (typeof translateCanonicalItem === 'function')
        ? translateCanonicalItem(rawIt, isEn)
        : (window.translateCanonicalItem ? window.translateCanonicalItem(rawIt, isEn) : rawIt);

      const displayCat = it.cat;
      const isQualSupport = (it.cat === 'Qualité' || it.cat === 'Quality' || it.label.includes('Qualité d\'Arme') || it.label.includes('Weapon Quality')) && isSupport;
      let subNote = '';
      if (isQualSupport) {
        subNote = isEn
          ? `<div style="font-size: 12px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">+28.5% solo personal damage, but 0% transferred to allies (excluded from Buff Power formula).</div>`
          : `<div style="font-size: 12px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">+28.5% dégâts solo perso, mais 0% transféré aux alliés (exclu de la formule de Buff Power).</div>`;
      } else if (it.note) {
        subNote = `<div style="font-size: 12px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">${it.note}</div>`;
      }

      let displayType = it.type;

      rows += `
          <tr>
            <td><span class="canon-badge ${it.badge}">${displayCat}</span></td>
            <td>
              <strong>${it.label}</strong>
              ${subNote}
            </td>
            <td style="font-family: var(--font-mono);">${it.val}</td>
            <td style="font-family: var(--font-mono); color: ${it.mult === '+0.00%' ? 'var(--text-muted)' : 'var(--accent-green)'};">${it.mult}</td>
            <td style="color: ${it.type.includes('Heal') ? '#E07A63' : it.type.includes('Buff') ? 'var(--support-color)' : 'var(--dps-color)'}; font-weight: 600;">
              ${displayType}
            </td>
          </tr>
        `;
    });
    dom.canonTableBody.innerHTML = rows;
  }
}

// --- Fonctions de Désérialisation & Parsing SvelteKit de lostark.bible ---

function unflattenDevalue(raw) {
  const pool = Array.isArray(raw) ? raw : Object.values(raw);
  const hydrated = new Array(pool.length);
  function hydrate(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'number') {
      if (hydrated[val] !== undefined) return hydrated[val];
      const item = pool[val];
      if (item === null || typeof item !== 'object') {
        hydrated[val] = item;
        return item;
      }
      if (Array.isArray(item)) {
        const arr = [];
        hydrated[val] = arr;
        for (const el of item) arr.push(hydrate(el));
        return arr;
      }
      const obj = {};
      hydrated[val] = obj;
      for (const [k, v] of Object.entries(item)) obj[k] = hydrate(v);
      return obj;
    }
    return val;
  }
  return hydrate(0);
}



function parseBibleCharacter(dataNode, preferredRole = 'support') {
  const root = unflattenDevalue(dataNode);
  if (!root || !root.loadouts || !root.loadouts.length) {
    throw new Error('Données de personnage invalides ou introuvables.');
  }

  // Sélectionne STRICTEMENT le loadout de Raid (exclut tout profil Donjon du Chaos / Cube / Trégion)
  const raidLoadouts = root.loadouts.filter(l => {
    const cls = (l.classification || '').toLowerCase();
    return !cls.includes('chaos') && !cls.includes('cube') && !cls.includes('trixion') && (l.combatPower?.score || 0) > 1000;
  });

  let loadout = raidLoadouts.find(l => l.classification === 'raid_merged');
  if (!loadout || !loadout.gems || loadout.gems.length < 5) {
    loadout = raidLoadouts.find(l => l.classification === 'most_recent_raid') || raidLoadouts[0];
  }
  raidLoadouts.forEach(l => {
    if ((l.combatPower?.score || 0) > (loadout?.combatPower?.score || 0)) {
      loadout = l;
    }
  });
  // Détection préalable du rôle natif de la classe
  const rawClassStr = root.characterInfo?.characterClassName || (root.header && root.header.class) || (loadout && loadout.classId) || (root.character && root.character.classId) || '';
  const charName = root.characterInfo?.characterName || (root.header && root.header.name) || '';
  const isSupportClass = detectCharacterRole(rawClassStr, '') === 'support';
  const effectivePrefRole = isSupportClass ? 'support' : preferredRole;

  // Si le rôle souhaité est support, privilégier explicitement un loadout support si présent
  if (effectivePrefRole === 'support') {
    const supLoadouts = raidLoadouts.filter(l => l.battlePoint?.isSupport === true || l.isSupport === true);
    if (supLoadouts.length > 0) {
      let bestSup = supLoadouts[0];
      supLoadouts.forEach(l => {
        if ((l.combatPower?.score || 0) > (bestSup?.combatPower?.score || 0)) {
          bestSup = l;
        }
      });
      loadout = bestSup;
    }
  }

  // Fallback de sécurité si aucun raidLoadout filtré
  if (!loadout) {
    loadout = root.loadouts.find(l => !(l.classification || '').toLowerCase().includes('chaos')) || root.loadouts[0];
  }
  let bp = loadout.battlePoint;
  if (!bp || !bp.parts) {
    throw new Error('Données Combat Power (Battle Point) absentes.');
  }

  const charRole = detectCharacterRole({
    className: rawClassStr,
    classId: loadout.classId,
    engravings: loadout.engravings,
    spec: loadout.spec,
    name: charName
  });

  // Support dont le profil raid a été enregistré en mode DPS (arbre d'Ark Passive périmé) : Battle Point recalculé en mode support
  if (charRole === 'support') {
    const rebuilt = rebuildSupportBattlePoint(loadout);
    if (rebuilt) { loadout.battlePoint = rebuilt; bp = rebuilt; }
  }

  const isSupport = charRole === 'support' || bp.isSupport === true || (effectivePrefRole === 'support' && isSupportClassName(rawClassStr));

  const parts = bp.parts;
  const atkPart = parts.find(p => p.type === 1);
  const hpPart = parts.find(p => p.type === 2);

  let atkMin = atkPart ? ((atkPart.value !== undefined ? atkPart.value : atkPart.min) / 1e4) : 0;
  let atkMax = atkPart ? ((atkPart.value !== undefined ? atkPart.value : atkPart.max) / 1e4) : 0;
  let defMin = hpPart ? ((hpPart.value !== undefined ? hpPart.value : hpPart.min) / 1e4) : 0;
  let defMax = hpPart ? ((hpPart.value !== undefined ? hpPart.value : hpPart.max) / 1e4) : 0;

  const defTypes = [11, 16, 18, 21, 30, 32, 35];
  const items = [];
  const gemLabelOf = canonGemLabeler(loadout);

  if (atkPart) {
    items.push({
      cat: 'Base',
      label: `Attaque de Base (Stat: ${formatNumber(atkPart.mainStat || 0)}, Arme: ${formatNumber(atkPart.weaponPower || 0)})`,
      val: `${formatNumber(Math.round(atkPart.baseAttackPower || 0))} AP`,
      mult: `Base Val: ${formatNumber(Math.round(atkPart.value || 0))}`,
      type: isSupport ? 'Buff Power' : 'DPS Net',
      badge: 'base'
    });
  }

  if (hpPart && isSupport) {
    items.push({
      cat: 'Base',
      label: `Points de Vie Maximum (Vitalité)`,
      val: `${formatNumber(hpPart.maxHp || 0)} HP`,
      mult: `Base Val: ${formatNumber(Math.round(hpPart.value || 0))}`,
      type: 'Heal / Shield',
      badge: 'base'
    });
  }

  // Extraction préalable du Bracelet complet depuis loadout.items
  const brItem = (loadout.items || []).find(i => i.slot === 'bracelet');
  const brParts = parts.filter(p => p.type === 19 || p.type === 20 || p.type === 21);
  let handledBracelet = false;
  let handledAstrogems = false;

  for (const p of parts) {
    if (p.type === 1 || p.type === 2) continue;

    // Gestion spéciale groupée du Bracelet
    if (p.type === 19 || p.type === 20 || p.type === 21) {
      if (!handledBracelet) {
        handledBracelet = true;
        if (brItem && brItem.data && brItem.data.stats && brItem.data.stats.length) {
          const mainStatName = getMainStatName(loadout.classId, false);

          brItem.data.stats.forEach(st => {
            const sIndex = st.index;
            const sVal = st.value;
            const bpPart = brParts.find(bp => bp.stat && bp.stat.index === sIndex);
            const partVal = bpPart ? bpPart.value : 0;
            const isPerk = st.type === 3 || sIndex > 1000;

            if (isPerk) {
              const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[sIndex]) || null;
              const pName = perk ? perk.name : `Roll Spécial (#${sIndex})`;
              const pDesc = perk ? perk.desc : null;
              const multStr = `+${(partVal / 100).toFixed(2)}%`;

              items.push({
                cat: 'Bracelet',
                label: `Bracelet Ancien — ${pName}`,
                val: `+${(partVal / 100).toFixed(2)}%`,
                mult: multStr,
                type: isSupport ? 'Buff Power' : 'DPS Net',
                badge: 'gear',
                note: pDesc ? `${pDesc}` : null
              });
            } else {
              const statInfo = BIBLE_STAT_MAP[sIndex] || null;
              const statName = (statInfo && statInfo.name) ? statInfo.name : mainStatName;
              const dest = (statInfo && statInfo.dest) ? statInfo.dest : "l'Attaque de Base";
              const isPercent = statInfo ? statInfo.isPercent : false;

              const displayVal = isPercent ? `+${(sVal / 100).toFixed(2)}%` : `+${formatNumber(sVal)}`;
              const multStr = `+${(partVal / 100).toFixed(2)}%`;

              items.push({
                cat: 'Bracelet',
                label: `Bracelet Ancien — ${statName} (${displayVal})`,
                val: displayVal,
                mult: multStr,
                type: isSupport ? 'Buff Power' : 'DPS Net',
                badge: 'gear',
                note: partVal === 0 ? `Stat brute de ${statName.toLowerCase()} déjà intégrée directement dans ${dest} en tête de liste.` : null
              });
            }
          });
        } else {
          // Fallback si items.stats non renseigné
          brParts.forEach(bpPart => {
            const sIndex = bpPart.stat ? bpPart.stat.index : 0;
            const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[sIndex]) || null;
            const pName = perk ? perk.name : `Roll (#${sIndex})`;
            const multStr = `+${(bpPart.value / 100).toFixed(2)}%`;
            items.push({
              cat: 'Bracelet',
              label: `Bracelet Ancien — ${pName}`,
              val: multStr,
              mult: multStr,
              type: isSupport ? 'Buff Power' : 'DPS Net',
              badge: 'gear',
              note: perk ? `${perk.desc}` : null
            });
          });
        }
      }
      // Accumule le multiplicateur de battlePoint
      const bval = p.value !== undefined ? p.value : 0;
      if (defTypes.includes(p.type)) {
        defMin *= (1 + bval / 1e4);
        defMax *= (1 + bval / 1e4);
      } else {
        atkMin *= (1 + bval / 1e4);
        atkMax *= (1 + bval / 1e4);
      }
      continue;
    }

    const isDef = defTypes.includes(p.type);
    const val = p.value !== undefined ? p.value : (p.min !== undefined ? p.min : 0);
    const maxVal = p.value !== undefined ? p.value : (p.max !== undefined ? p.max : 0);

    if (isDef) {
      defMin *= (1 + val / 1e4);
      defMax *= (1 + maxVal / 1e4);
    } else {
      atkMin *= (1 + val / 1e4);
      atkMax *= (1 + maxVal / 1e4);
    }

    let cat = 'Système';
    let label = `Composant Type #${p.type}`;
    let badge = isDef ? 'defense' : 'passive';
    let rawVal = `${val}`;
    let note = null;

    if (p.type === 3 || p.level) {
      cat = 'Niveau';
      label = `Niveau de Personnage ${p.level || 70}`;
      rawVal = `Niv. ${p.level || 70}`;
    } else if (p.type === 4 || p.quality !== undefined) {
      cat = 'Qualité';
      label = `Qualité d'Arme (${p.quality})`;
      rawVal = `Qualité ${p.quality}`;
      badge = 'gear';
      if (isSupport && val === 0) {
        note = "Bonus de dégâts solo perso : 0% transféré aux alliés (exclu du Buff Power).";
      }
    } else if (p.type === 5) {
      cat = 'Ark Passive';
      label = `Ark Passive — Évolution (${p.pointsSpent || 100} pts)`;
      rawVal = `${p.pointsSpent || 100} pts`;
    } else if (p.type === 6) {
      cat = 'Ark Passive';
      label = `Ark Passive — Illumination (${p.pointsSpent || 100} pts)`;
      rawVal = `${p.pointsSpent || 100} pts`;
    } else if (p.type === 7) {
      cat = 'Ark Passive';
      label = `Ark Passive — Bond (${p.pointsSpent || 70} pts)`;
      rawVal = `${p.pointsSpent || 70} pts`;
    } else if (p.type === 8) {
      cat = 'Karma';
      label = "Karma T4 — Rang d'Évolution (Rang 0 à 6)";
      rawVal = val > 0 ? `+${(val / 100).toFixed(2)}%` : 'Rang 0';
      badge = 'passive';
    } else if (p.type === 9) {
      cat = 'Karma';
      label = "Karma T4 — Niveau de Bond (Niv. 0 à 30)";
      rawVal = val > 0 ? `+${(val / 100).toFixed(2)}%` : '+0.00%';
      badge = 'passive';
      if (val === 0 || (isSupport && val < 50)) {
        note = isSupport
          ? "Dégâts de bond solo perso : exclu du Buff Power en Support."
          : "Progression de niveau de bond de karma.";
      }
    } else if (p.type === 10 || p.type === 11 || (p.grade && p.grade.includes('engrave'))) {
      cat = 'Gravures';
      const engName = (typeof BIBLE_ENGRAVINGS !== 'undefined' && BIBLE_ENGRAVINGS[p.id]) || `Gravure T4 (ID: ${p.id})`;
      const stoneBonus = p.stonePoints ? ` — Pierre +${p.stonePoints}` : '';
      label = `${engName}${stoneBonus}`;
      rawVal = `+${(val / 100).toFixed(2)}%`;
      badge = isDef ? 'defense' : 'passive';
    } else if (p.slot || p.type === 15 || p.type === 16 || p.type === 17 || p.type === 18) {
      cat = 'Accessoires';
      const slotNames = {
        neck: 'Collier',
        ear1: 'Boucle d\'oreille #1',
        ear2: 'Boucle d\'oreille #2',
        finger1: 'Anneau #1',
        finger2: 'Anneau #2',
        bracelet: 'Bracelet'
      };
      const sName = slotNames[p.slot] || `Accessoire (${p.slot || 'T4'})`;
      const sIndex = p.stat ? p.stat.index : 0;
      const sVal = p.stat ? p.stat.value : 0;
      const sType = p.stat ? p.stat.type : (p.type === 17 ? 4 : 2);
      let statDesc = '';
      if (sIndex === 152) statDesc = `Puissance d'Arme (+${(sVal / 100).toFixed(2)}%)`;
      else if (sIndex === 151) statDesc = `Puissance d'Arme (+${sVal})`;
      else if (sIndex === 49) statDesc = `Puissance d'Attaque (+${(sVal / 100).toFixed(2)}%)`;
      else if (sIndex === 50) statDesc = `Dégâts Additionnels (+${(sVal / 100).toFixed(2)}%)`;
      else if (sIndex === 124) statDesc = `Puissance d'Attaque (+${sVal})`;
      else if (sIndex === 46) statDesc = `Brand Power / Marque (+${(sVal / 100).toFixed(2)}%)`;
      else if (sIndex === 74) statDesc = `Taux Critique (+${(sVal / 100).toFixed(2)}%)`;
      else if (sIndex === 76) statDesc = `Dégâts Critiques (+${(sVal / 100).toFixed(2)}%)`;
      else if (sIndex === 27) statDesc = `Points de Vie Max (+${sVal})`;
      else if (sIndex === 28) statDesc = `Points de Mana Max (+${sVal})`;
      else if (sIndex === 34) statDesc = `Récupération PV en Combat (+${sVal})`;
      else if (sIndex === 106) statDesc = `Bonus Durée Altération État (+${(sVal / 100).toFixed(2)}%)`;
      else if (sIndex === 621000000 || sIndex === 621000001 || sIndex === 621000002 || (sType === 4 && p.type === 17)) {
        // Valeur lue sur la partie du Battle Point (type 17) ; repli sur les paliers connus si elle est nulle
        const pct = val > 0 ? (val / 100).toFixed(2) : (sIndex === 621000002 ? '2.00' : (sIndex === 621000001 ? '1.20' : '0.55'));
        statDesc = `Dégâts infligés (+${pct}%)`;
        note = `Effet passif Collier T4 : Outgoing Damage +${pct}%.`;
      }
      else if (sType === 50) statDesc = `Soins aux Membres du Groupe (+${(sVal / 100).toFixed(2)}%)`;
      else if (sType === 51) statDesc = `Boucliers aux Membres du Groupe (+${(sVal / 100).toFixed(2)}%)`;
      else if (sType === 54) statDesc = `Effet Amplification Puissance d'Attaque d'Allié (+${(sVal / 100).toFixed(2)}%)`;
      else if (sType === 59 || sIndex === 16000001) statDesc = `Effet Augmentation Dégâts d'Allié (+${(sVal / 100).toFixed(2)}%)`;
      else if (typeof BIBLE_ACCESSORY_PASSIVES !== 'undefined' && BIBLE_ACCESSORY_PASSIVES[sIndex]) {
        statDesc = BIBLE_ACCESSORY_PASSIVES[sIndex].name;
        note = `${BIBLE_ACCESSORY_PASSIVES[sIndex].desc}`;
      }
      else if (sVal > 0) statDesc = `Ligne Affinée (+${(sVal / 100).toFixed(2)}%)`;
      else statDesc = "Ligne d'Affinage";

      label = `${sName} — ${statDesc}`;
      rawVal = sVal > 0 ? ((sIndex === 124 || sIndex === 151 || sIndex === 27 || sIndex === 28 || sIndex === 34) ? `+${sVal}` : `+${(sVal / 100).toFixed(2)}%`) : (val > 0 ? `+${(val / 100).toFixed(2)}%` : 'Stat Brute');
      badge = 'gear';

      if (p.affectsBaseStats && val === 0) {
        if (sIndex === 151 || sIndex === 152) {
          note = "La Puissance d'Arme augmente directement votre Attaque de Base & Base Val en tête de liste. Elle est à +0.00% ici pour éviter un double comptage.";
        } else {
          note = (isSupport && (sIndex === 74 || sIndex === 76 || sIndex === 50))
            ? "Stat solo perso : non transférée aux alliés en Support (exclue du Buff Power)."
            : "Stat brute déjà agrégée directement dans l'Attaque de Base ou les PV Max en tête de liste.";
        }
      }
    } else if (p.type === 22 || (p.id && p.id.toString().startsWith('650'))) {
      cat = 'Gemmes';
      label = gemLabelOf(p.id) || (typeof BIBLE_GEMS !== 'undefined' && BIBLE_GEMS[p.id]) || `Gemme T4 (ID: ${p.id || 0})`;
      rawVal = `+${(val / 100).toFixed(2)}%`;
      badge = 'gear';
    } else if (p.type === 26 || p.total) {
      cat = 'Stats';
      label = `Stats de Combat (${p.total} pts)`;
      rawVal = `${p.total} stats`;
      badge = 'stat';
    } else if (p.type === 27 || p.rank) {
      cat = 'Cartes';
      const cName = (typeof BIBLE_CARDS !== 'undefined' && BIBLE_CARDS[p.id]) || 'Set de Cartes';
      label = `${cName} (Rang ${p.rank})`;
      rawVal = `Rang ${p.rank}`;
      badge = 'passive';
    } else if (p.type === 28) {
      cat = 'Familier';
      label = "Familier";
      rawVal = (p.min !== undefined && p.max !== undefined)
        ? `+${(p.min / 100).toFixed(2)}% ~ +${(p.max / 100).toFixed(2)}%`
        : `+${(val / 100).toFixed(2)}%`;
      badge = 'passive';
      note = "Fourchette donnée par le Battle Point du profil (minimum ~ maximum).";
    } else if (p.type === 29 || p.type === 30 || p.points) {
      cat = 'Grille d\'Ark';
      let coreName = (typeof BIBLE_CORES !== 'undefined' && BIBLE_CORES[p.id]) || null;
      if (!coreName) {
        coreName = `Cœur d'Ark Grid (${p.points || 17}P)`;
      } else {
        const match = coreName.match(/^([A-Za-z]+)\s+([A-Za-z]+)\s+Core:\s*(.+)$/i);
        if (match) {
          const [, orderOrChaos, sunOrMoonOrStar, name] = match;
          coreName = `${name} (${p.points || 17}P | ${orderOrChaos} ${sunOrMoonOrStar})`;
        } else {
          coreName = `${coreName} (${p.points || 17}P)`;
        }
      }
      label = coreName;
      rawVal = `${p.points || 17}P`;
      badge = 'passive';
    } else if (p.type === 31 || p.type === 32 || p.totalLevel) {
      if (!handledAstrogems) {
        handledAstrogems = true;
        const totals = {};
        if (loadout.arkGridCores) {
          for (const core of loadout.arkGridCores) {
            for (const gem of (core.gems || [])) {
              for (const opt of (gem.opts || [])) {
                totals[opt.id] = (totals[opt.id] || 0) + opt.level;
              }
            }
          }
        }
        const bp31Parts = parts.filter(pt => pt.type === 31 || pt.type === 32);
        const order = isSupport ? [2011, 2012, 2013, 2001, 2002, 2003] : [2001, 2002, 2003, 2011, 2012, 2013];

        for (const id of order) {
          const def = (typeof BIBLE_ARK_GRID_SUBSTATS !== 'undefined' && BIBLE_ARK_GRID_SUBSTATS[id]);
          if (!def) continue;
          const level = totals[id] || (bp31Parts.find(pt => pt.id === id)?.totalLevel) || 0;
          if (level === 0) continue;

          const bpPart = bp31Parts.find(pt => pt.id === id);
          const partVal = bpPart ? (bpPart.value !== undefined ? bpPart.value : 0) : 0;
          const multVal = (partVal / 100).toFixed(2);
          const inGameBp = (level > 0 && def.levels && def.levels[level - 1] !== undefined) ? def.levels[level - 1] : 0;
          const inGameVal = (inGameBp / 100).toFixed(2);

          let note = null;
          if (bpPart && partVal > 0) {
            note = `Effet in-game : +${inGameVal}% ${def.fr} (cumul des astrogemmes). Multiplicateur Smilegate CP : +${multVal}% ${isSupport ? 'Buff Power' : 'DPS Net'}.`;
          } else {
            note = isSupport
              ? `Stat brute ${def.fr.toLowerCase()} solo perso (+${inGameVal}%) : exclue du calcul du Buff Power en Support (Smilegate Battle Point).`
              : `Stat support (+${inGameVal}%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point).`;
          }

          items.push({
            cat: 'Grille d\'Ark',
            label: `${def.fullName} — Niv. ${level}`,
            val: `+${inGameVal}% (Niv. ${level})`,
            mult: `+${multVal}%`,
            type: isSupport ? 'Buff Power' : 'DPS Net',
            badge: 'stat',
            note
          });
        }
      }

      continue;
    } else if (p.type === 33 || p.type === 34 || p.paradisePoints) {
      cat = 'Paradise';
      label = `Orbe Trinity (${formatNumber(p.paradisePoints || 16483067)} pts)`;
      rawVal = `${formatNumber(p.paradisePoints || 16483067)} pts`;
      badge = 'gear';
    }

    let multStr = `+${(val / 100).toFixed(2)}%`;
    if (p.min !== undefined && p.max !== undefined && p.min !== p.max) {
      multStr = `+${(p.min / 100).toFixed(2)}% à +${(p.max / 100).toFixed(2)}%`;
    }

    items.push({
      cat,
      label,
      val: rawVal,
      mult: multStr,
      type: isSupport ? (isDef ? 'Heal / Shield' : 'Buff Power') : 'DPS Net',
      badge,
      note
    });
  }

  // Compléter les cœurs d'Ark Grid absents de battlePoint.parts (ex: Chaos Star en Support, ou profils sans type 29)
  if (Array.isArray(loadout.arkGridCores)) {
    loadout.arkGridCores.forEach(c => {
      const idStr = (c.id || '').toString();
      const alreadyInItems = items.some(it => {
        if (it.cat !== "Grille d'Ark") return false;
        const lbl = (it.label || '').toLowerCase();
        if (idStr.startsWith('67300') && (lbl.includes('order sun') || lbl.includes('ordre soleil'))) return true;
        if (idStr.startsWith('67301') && (lbl.includes('order moon') || lbl.includes('ordre lune'))) return true;
        if (idStr.startsWith('67302') && (lbl.includes('order star') || lbl.includes('ordre étoile') || lbl.includes('ordre etoile'))) return true;
        if (idStr.startsWith('67310') && (lbl.includes('chaos sun') || lbl.includes('chaos soleil'))) return true;
        if (idStr.startsWith('67311') && (lbl.includes('chaos moon') || lbl.includes('chaos lune'))) return true;
        if (idStr.startsWith('67312') && (lbl.includes('chaos star') || lbl.includes('chaos étoile') || lbl.includes('chaos etoile'))) return true;
        return false;
      });

      if (!alreadyInItems) {
        const pts = Array.isArray(c.gems)
          ? c.gems.reduce((sum, g) => sum + (g.corePoints || 0), 0)
          : (c.points || 17);
        const isAnc = ((c.id || 0) % 10 === 6);
        const multVal = getArkGridCoreBonus(idStr, pts, isSupport, isAnc);

        let coreName = (typeof BIBLE_CORES !== 'undefined' && BIBLE_CORES[c.id]) || '';
        let name = '';
        if (coreName) {
          const m = coreName.match(/^([A-Za-z]+)\s+([A-Za-z]+)\s+Core:\s*(.+)$/i);
          if (m && m[3]) name = m[3].trim();
        }
        if (!name) {
          if (idStr.startsWith('67300')) name = isSupport ? 'Heavenly Agent' : 'Shadow Fist';
          else if (idStr.startsWith('67301')) name = isSupport ? 'Heavenly Resolve' : 'Asura War';
          else if (idStr.startsWith('67302')) name = isSupport ? 'Prayer of Light' : 'Asura';
          else if (idStr.startsWith('67310')) name = isSupport ? 'Fortitude Enhancement' : 'Flashy Attack';
          else if (idStr.startsWith('67311')) name = isSupport ? 'Echoing Brand' : 'Smoldering Strike';
          else if (idStr.startsWith('67312')) name = 'Attack';
        }

        const groupLabel = idStr.startsWith('67300') ? 'Order Sun' :
          (idStr.startsWith('67301') ? 'Order Moon' :
          (idStr.startsWith('67302') ? 'Order Star' :
          (idStr.startsWith('67310') ? 'Chaos Sun' :
          (idStr.startsWith('67311') ? 'Chaos Moon' : 'Chaos Star'))));

        items.push({
          cat: "Grille d'Ark",
          label: `${name} (${pts}P | ${groupLabel})`,
          val: `${pts}P`,
          mult: `+${multVal.toFixed(2)}%`,
          type: isSupport ? 'Buff Power' : 'DPS Net',
          badge: 'passive',
          note: null
        });
      }
    });
  }

  const calculatedTotal = isSupport ? (atkMin + defMin) : atkMin;
  const inGameScore = loadout.combatPower?.score || calculatedTotal;

  // Détection automatique des Accessoires Polis (3+ accessoires avec bonus)
  let accRolledCount = 0;
  if (loadout.items) {
    loadout.items.forEach(it => {
      if (it.slot && (it.slot.includes('neck') || it.slot.includes('ear') || it.slot.includes('finger'))) {
        if (it.data && it.data.stats && it.data.stats.length >= 2) accRolledCount++;
      }
    });
  }

  const ilvl = loadout.itemLevel ? Math.floor(loadout.itemLevel) : 1750;
  const gear = { weapon: 17, head: 15, chest: 15, pants: 15, gloves: 15, shoulder: 15 };
  let advHoning = 40;
  let isSerkaWeapon = false;
  let serkaArmorCount = 0;

  if (loadout.items) {
    loadout.items.forEach(it => {
      const slot = it.slot;
      const d = it.data;
      if (!d) return;
      const isSerka = !!(it.id && it.id.toString().startsWith('13462'));
      // Type de chaque pièce (ID 13462… Serka, 13461… Aegir) : un set d'armures peut être mixte
      const gearKey = { weapon: 'weapon', head: 'head', upper_body: 'chest', lower_body: 'pants', hand: 'gloves', shoulder: 'shoulder' }[slot];
      if (gearKey && it.id && d.honing !== undefined) { gear.serka = gear.serka || {}; gear.serka[gearKey] = isSerka; }
      if (slot === 'weapon' && d.honing !== undefined) {
        gear.weapon = d.honing;
        if (isSerka) isSerkaWeapon = true;
      }
      if (slot === 'head' && d.honing !== undefined) {
        gear.head = d.honing;
        if (isSerka) serkaArmorCount++;
      }
      if (slot === 'upper_body' && d.honing !== undefined) {
        gear.chest = d.honing;
        if (isSerka) serkaArmorCount++;
      }
      if (slot === 'lower_body' && d.honing !== undefined) {
        gear.pants = d.honing;
        if (isSerka) serkaArmorCount++;
      }
      if (slot === 'hand' && d.honing !== undefined) {
        gear.gloves = d.honing;
        if (isSerka) serkaArmorCount++;
      }
      if (slot === 'shoulder' && d.honing !== undefined) {
        gear.shoulder = d.honing;
        if (isSerka) serkaArmorCount++;
      }
      if (d.advancedHoning !== undefined) {
        advHoning = d.advancedHoning;
        // Niveau d'affinage avancé par pièce (0 à 40), lu pour le GPD
        const advKey = { weapon: 'weapon', head: 'head', upper_body: 'chest', lower_body: 'pants', hand: 'gloves', shoulder: 'shoulder' }[slot];
        if (advKey) {
          gear.adv = gear.adv || {};
          gear.adv[advKey] = d.advancedHoning;
        }
      }
    });
  }

  // Heuristiques de sécurité pour profils sans items ID détaillés
  if (!isSerkaWeapon && (ilvl >= 1735 && gear.weapon <= 16)) {
    isSerkaWeapon = true;
  }
  const rawArmorAvg = Math.round(((gear.head || 14) + (gear.chest || 14) + (gear.pants || 14) + (gear.shoulder || 14) + (gear.gloves || 14)) / 5);
  if (serkaArmorCount === 0 && (ilvl >= 1735 && rawArmorAvg <= 14)) {
    serkaArmorCount = 5;
  }

  gear.isSerkaWeapon = isSerkaWeapon;
  gear.weaponTier = isSerkaWeapon ? 2 : 1;
  gear.effectiveWeapon = gear.weapon + (isSerkaWeapon ? 9 : 0);
  gear.serkaArmorCount = serkaArmorCount;
  gear.isSerkaArmors = serkaArmorCount >= 3;
  gear.effectiveAvgArmor = rawArmorAvg + (gear.isSerkaArmors ? 9 : 0);

  const resolvedClassId = loadout.classId || root.character?.classId || '';
  const resolvedClassName = normalizeClassName(resolvedClassId || root.characterInfo?.characterClassName || '');
  const resolvedRole = isSupport ? 'support' : 'dps';
  const resolvedSpec = getCharacterSpecName({
    className: resolvedClassName,
    role: resolvedRole,
    engravings: loadout.engravings,
    arkPassive: loadout.arkPassive,
    battlePoint: bp,
    loadout: loadout
  });

  return {
    name: root.characterInfo?.characterName || 'Personnage Importé',
    className: resolvedClassName,
    classId: resolvedClassId,
    spec: resolvedSpec,
    role: resolvedRole,
    ilvl,
    inGameScore: parseFloat(inGameScore.toFixed(2)),
    // CP du profil raid lu (loadout.combatPower) : celui qui correspond aux pièces comparées
    raidCombatPower: loadout.combatPower && loadout.combatPower.score ? parseFloat(loadout.combatPower.score.toFixed(2)) : null,
    calculatedScore: parseFloat(calculatedTotal.toFixed(2)),
    buffPower: parseFloat(atkMin.toFixed(2)),
    healPower: isSupport ? parseFloat(defMin.toFixed(2)) : 0,
    mainStat: atkPart ? atkPart.mainStat : 0,
    weaponPower: atkPart ? atkPart.weaponPower : 0,
    baseAtk: atkPart ? Math.round(atkPart.baseAttackPower || 0) : 0,
    maxHp: hpPart ? hpPart.maxHp : 0,
    partsCount: items.length,
    gear,
    advHoning,
    weaponQuality: (parts.find(p => p.type === 4 || p.quality !== undefined)?.quality) || 90,
    weaponQualityValue: (parts.find(p => p.type === 4 || p.quality !== undefined)?.value) || 2500,
    gemParts: (items.filter(it => it.cat === 'Gemmes').length > 0)
      ? items.filter(it => it.cat === 'Gemmes').map(it => parseFloat(it.mult.replace(/[^0-9.]/g, '')))
      : (Array.isArray(loadout.gems) && loadout.gems.length > 0
          ? loadout.gems.map(g => {
              const atkEff = (g.effects || []).find(e => e.type === 2 && e.id === 150);
              if (atkEff) {
                if (atkEff.value >= 120) return isSupport ? 12.0 : 7.0;
                if (atkEff.value >= 100) return isSupport ? 10.8 : 6.35;
                if (atkEff.value >= 80) return isSupport ? 9.6 : 5.7;
                if (atkEff.value >= 60) return isSupport ? 8.5 : 5.05;
                return isSupport ? 7.5 : 4.5;
              }
              const cdEff = (g.effects || []).find(e => e.type === 27 || e.type === 5);
              if (cdEff) {
                if (cdEff.value >= 2400) return isSupport ? 12.0 : 7.0;
                if (cdEff.value >= 2200) return isSupport ? 10.8 : 6.35;
                if (cdEff.value >= 2000) return isSupport ? 9.6 : 5.7;
                if (cdEff.value >= 1800) return isSupport ? 8.5 : 5.05;
                return isSupport ? 7.5 : 4.5;
              }
              return isSupport ? 8.5 : 5.05;
            })
          : null),
    engravings: loadout.engravings || [],
    arkGridCores: loadout.arkGridCores || [],
    battlePoint: bp,
    astrogems: (bp && bp.parts) ? bp.parts.filter(p => p.type === 31 || p.type === 32) : [],
    arkGrid: getArkGridStatus({ rawProfile: { arkGridCores: loadout.arkGridCores, battlePoint: bp }, ilvl: loadout.character?.ilvl || 1750 }),
    accRolled: accRolledCount >= 3,
    apPoints: loadout.apPoints || { enlightenment: 101, evolution: 140, leap: 70 },
    arkPassive: loadout.arkPassive || {},
    accessories: (loadout.items || []).filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)),
    bracelet: (loadout.items || []).find(i => i.slot === 'bracelet') || null,
    loadout: loadout,
    rawItems: loadout.items || [],
    items
  };
}

async function fetchBibleProfile(region, name, autoAdd = null) {
  const statusEl = dom.importStatus;
  const cleanName = name ? name.trim() : '';
  if (!cleanName) return null;

  const shouldAutoAdd = autoAdd !== null 
    ? autoAdd 
    : (dom.chkAutoAddToRoster ? dom.chkAutoAddToRoster.checked : true);

  if (statusEl) {
    statusEl.className = 'modal-status info';
    statusEl.style.display = 'block';
    statusEl.innerHTML = trLang(`Interrogation de <strong>${escapeHtml(cleanName)} (${escapeHtml(region.toUpperCase())})</strong> en cours…`, `Fetching <strong>${escapeHtml(cleanName)} (${escapeHtml(region.toUpperCase())})</strong>…`);
  }

  // Région venue de l'URL (?region=) ou de la modale : seulement les régions de lostark.bible, jamais un chemin
  const reg = BIBLE_REGIONS.includes(String(region).toUpperCase()) ? String(region).toUpperCase() : 'CE';
  const encodedName = encodeURIComponent(cleanName);
  const proxyUrl = `/api/bible/character/${reg}/${encodedName}/__data.json`;
  const directUrl = `https://lostark.bible/character/${reg}/${encodedName}/__data.json`;

  try {
    let response = null;
    // 1. Essai via le proxy Nginx (contourne CORS)
    try {
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        response = proxyRes;
      }
    } catch (e) {}

    // 2. Essai direct
    if (!response) {
      response = await fetch(directUrl, { mode: 'cors' });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    return applyLoadedProfile(json, cleanName, reg, shouldAutoAdd);
  } catch (err) {
    console.warn('fetchBibleProfile error:', err);
    if (statusEl) {
      statusEl.className = 'modal-status error';
      const link = `<a href="${escapeHtml(directUrl)}" target="_blank" rel="noopener noreferrer" style="color:#E8E6DC; text-decoration:underline;">${trLang('ce lien', 'this link')}</a>`;
      statusEl.innerHTML = trLang(`<strong>Impossible d'interroger lostark.bible pour ${escapeHtml(cleanName)} :</strong><br>
        1. Vérifie l'orthographe exacte du pseudo et la région (${escapeHtml(reg)}).<br>
        2. Option de secours : ouvre ${link}, copie tout le texte JSON et colle-le dans <strong>Option manuelle</strong> ci-dessous.`,
        `<strong>Could not reach lostark.bible for ${escapeHtml(cleanName)}:</strong><br>
        1. Check the exact spelling of the name and the region (${escapeHtml(reg)}).<br>
        2. Fallback: open ${link}, copy all the JSON text and paste it in <strong>Manual option</strong> below.`);
    }
    return null;
  }
}

function applyLoadedProfile(json, characterName = null, region = 'CE', autoAddToRoster = true) {
  const statusEl = dom.importStatus;
  const nodeData = json.nodes && json.nodes[2] && json.nodes[2].data ? json.nodes[2].data : json;

  // Détection préalable du rôle natif de la classe depuis node 1 (header)
  let nativeRole = state.role;
  if (json.nodes && json.nodes[1] && json.nodes[1].data) {
    try {
      const root1 = unflattenDevalue(json.nodes[1].data);
      if (root1 && root1.header && root1.header.class) {
        nativeRole = detectCharacterRole(root1.header.class);
      }
    } catch (e) {}
  }

  const profile = parseBibleCharacter(nodeData, nativeRole);

  if (!profile) {
    if (statusEl) {
      statusEl.className = 'modal-status error';
      statusEl.textContent = trLang('Données de profil introuvables ou format de raid invalide.', 'Profile data not found or invalid raid format.');
    }
    return null;
  }

  if (characterName) profile.name = capitalize(characterName);

  if (json.nodes && json.nodes[1] && json.nodes[1].data) {
    try {
      const root1 = unflattenDevalue(json.nodes[1].data);
      if (root1 && root1.header) {
        const h = root1.header;
        if (h.portrait && h.portrait.url) {
          profile.portraitUrl = h.portrait.url;
          DEFAULT_AVATARS[profile.name.toLowerCase()] = h.portrait.url;
        }
        if (h.world || h.server) {
          profile.server = `${h.world || h.server} (${region.toUpperCase()})`;
        }
        if (h.guild) {
          profile.guild = (h.guild && h.guild.name) || (typeof h.guild === 'string' ? h.guild : '');
        }
        if (h.rosterLevel) profile.rosterLevel = h.rosterLevel;
        if (h.class) profile.className = formatClassName(h.class);
        if (h.ilvl) profile.ilvl = parseFloat(h.ilvl.toFixed(2));
        // maxCombatPower est le maximum historique (ex. 4 930 contre 3 335 aujourd'hui sur un Paladin) :
        // le CP du profil raid lu passe avant, l'en-tête ne sert que de repli
        if (profile.raidCombatPower) {
          profile.inGameScore = profile.raidCombatPower;
        } else if (h.maxCombatPower && h.maxCombatPower.score) {
          profile.inGameScore = parseFloat(h.maxCombatPower.score.toFixed(2));
        } else if (h.combatPower && h.combatPower.score) {
          profile.inGameScore = parseFloat(h.combatPower.score.toFixed(2));
        }
      }
    } catch (e) {}
  }

  const resolvedRole = detectCharacterRole({
    className: profile.className,
    classId: profile.classId,
    spec: profile.spec,
    role: profile.role,
    name: profile.name
  });
  profile.role = resolvedRole;

  const arkStatus = getArkGridStatus({ rawProfile: profile, arkGridCores: profile.arkGridCores, name: profile.name, id: profile.name.toLowerCase(), ilvl: profile.ilvl });
  const charObj = {
    id: profile.name.toLowerCase(),
    name: profile.name,
    className: profile.className || (resolvedRole === 'support' ? 'Support' : 'DPS'),
    spec: profile.spec || '',
    role: resolvedRole,
    server: profile.server || `${region.toUpperCase()}`,
    guild: profile.guild || '',
    rosterLevel: profile.rosterLevel || 300,
    ilvl: profile.ilvl,
    cp: parseFloat((profile.inGameScore || profile.calculatedScore).toFixed(2)),
    target: Math.ceil((profile.ilvl + 0.1) / 10) * 10,
    advHoning: profile.advHoning !== undefined ? profile.advHoning : 40,
    portraitUrl: profile.portraitUrl || '',
    gear: profile.gear || { weapon: 17, head: 15, shoulder: 15, chest: 15, pants: 15, gloves: 15 },
    weaponQuality: profile.weaponQuality !== undefined ? profile.weaponQuality : 90,
    weaponQualityValue: profile.weaponQualityValue !== undefined ? profile.weaponQualityValue : 2500,
    gemParts: profile.gemParts || null,
    arkGrid: { 
      hasSun17: arkStatus.hasSun17, 
      hasMoon17: arkStatus.hasMoon17, 
      sun17: arkStatus.hasSun17, 
      moon17: arkStatus.hasMoon17, 
      star17: arkStatus.starTier >= 3, 
      starTier: arkStatus.starTier 
    },
    arkGridCores: profile.arkGridCores || [],
    astrogems: profile.astrogems || [],
    accRolled: !!profile.accRolled,
    accessories: profile.accessories || [],
    loadout: profile.loadout || null,
    apPoints: profile.apPoints || (profile.ilvl >= 1740 ? { evolution: 140, enlightenment: 101, leap: 70 } : { evolution: 120, enlightenment: 88, leap: 50 }),
    opt: null,
    rawProfile: profile
  };

  if (autoAddToRoster) {
    addCharacterToUserRoster(charObj);
  } else {
    liveImportedProfile = profile;
    loadCharacter(charObj);
  }

  if (statusEl) {
    statusEl.className = 'modal-status success';
    statusEl.innerHTML = `<strong>${escapeHtml(charObj.name)}</strong> (${escapeHtml(charObj.className)} ${charObj.ilvl.toFixed(1)}) ${trLang('chargé', 'loaded')}.<br>
      Combat Power : <strong>${formatNumber(charObj.cp)} CP</strong>`;
  }

  // Basculer sur l'onglet Moteur Canonique si on est dans la page principale
  const tabCanonBtn = document.querySelector('[data-tab="tab-canonical"]');
  const tabCanonPane = document.getElementById('tab-canonical');
  if (tabCanonBtn && tabCanonPane && !autoAddToRoster) {
    dom.tabBtns.forEach(b => b.classList.remove('active'));
    dom.tabPanes.forEach(p => p.classList.remove('active'));
    tabCanonBtn.classList.add('active');
    tabCanonPane.classList.add('active');
  }

  return charObj;
}
