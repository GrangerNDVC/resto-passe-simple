# Chantier 7E — Finale : légende du Palace, émission « Toque chef », franchises

## Ce qui est fait
- **Article 4 « Une légende de la gastronomie »** : publié à la 1re réussite du Palace (les articles 1 à 3 restent ceux des étoiles du guide ; l'article 4 ne compte pas dans « n étoiles sur 3 »). Pas d'article 4 en entraînement libre.
- **Émission « Toque chef »** (mode `finale`) : se lance toute seule au retour sur la carte après la 1re réussite du Palace. 6 phrases tirées au hasard parmi 16 (`PRESSE.EPREUVE` dans js/presse.js) : le joueur choisit entre la forme au passé simple et celle à l'imparfait. Après chaque réponse : bravo / pas tout à fait + la règle. Bilan : 0 faute = 3 étoiles, 1-2 fautes = 2, plus = 1. Étoiles qui s'allument une à une + confettis (pas de confettis si « animations calmes »). Clavier : 1/2 ou ←/→, Espace/Entrée, Échap.
- **Étoiles de franchise** : meilleur résultat conservé (`G.camp.franchise = {attente, etoiles, essais}`), l'émission se rejoue à volonté.
- **Écran « Mes franchises »** (bouton ou touche F sur la carte, visible une fois le Palace réussi) : les 4 restos avec leur enseigne, leurs étoiles de service et leur record, l'étoile de l'émission, et le total « étoiles de la maison : x sur 15 » (objectif de rejouabilité). Pas de diplôme, aucune donnée personnelle.
- **Sauvegarde** : champ `version: 2` + `franchise` ; les anciennes sauvegardes se relisent.
- **Plateau** : `assets/bg_tele.png` (facultatif) sinon plateau dessiné par le jeu (rideaux, arche dorée, projecteurs, tapis rouge). Prompts : claude/PROMPTS_7E.md.

## Décisions prises sans question (Julie : « ce qui fait le plus progresser et donne envie de jouer »)
Épreuve dans l'émission (récompense), pas dans le service ; courte, rejouable, avec la règle après chaque erreur ; les étoiles sont celles de la maison.

## Tests
test_jeu 170, test_8a 11, test_8b 23, test_8c 24, test_8d 44, test_cuisine 34, test_mobile 42, **test_7e 27 (nouveau)**, test_conjugaison OK.

## À relire par Julie
Les 16 phrases de l'épreuve et leurs règles (js/presse.js, `EPREUVE`) ; le texte de l'article 4.

## Reste (hors 7E)
Rythme avec 2 tables (à tester en classe), prix des 2es exemplaires/tables, deux attributions d'images, contours peaux foncées, façades 2/3/4 (chantier 9), Firebase (chantier 10).
