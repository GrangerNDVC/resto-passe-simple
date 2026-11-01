# CHANTIER 11 — Porte de cuisine au sol, objets sur les meubles, nappes (31/10/2026)

Version : « Version du 31/10, 22 h » (`?v=20261031-22`). Fait suite au chantier 10 (Firebase), indépendant de lui.

## Demandes de Julie (retours du mode essai, dernier resto)
1. Porte de cuisine en l'air, trop petite, passe-plats resté → **grande porte au sol qui remplace le passe-plats** (décision : « il disparaît, la grande porte le remplace »).
2. Vitrines/présentoirs impossibles à poser sur un meuble (desserte, console).
3. Plantes et bustes : au choix sur un meuble ou au sol.
4. Nappes blanches « recolorables » (frustrant) → **on retire** (décision : « on la retire pour les nappes blanches »).

## Ce qui a changé (js/game.js)
- **Porte** : dès que la cuisine s'ouvre en service, le passe-plats n'est plus dessiné ; une grande porte (400 px, plus haute que le serveur de 370) est posée pile à la ligne du sol de chaque resto (restos 2 à 4). Au bistrot, le mur est bas : porte de 200 px posée au bas du mur (y = 320). La zone cliquable, la position du serveur, les plats qui attendent (sur une tablette devant la porte) et le liseré jaune suivent la porte. Clic / Espace sur la porte : choix des assiettes s'il y en a, sinon la cuisine. Message « Va à la porte ! » au lieu de « Va au passe-plats ! ». Cuisine fermée : tout est comme avant.
- **Pose sur les meubles** : plantes, bustes (sauf le monument), vitrine et présentoir à gâteaux se posent sur le plateau des dessertes (`PLATEAUX`, par image). L'objet se réduit pour tenir ; un seul objet par endroit ; pose à la souris (il « s'accroche » au plateau), ← → le déplacent, ↓ le redescend. Sauvegarde : champ `s:1` sur l'exemplaire posé. Si on reprend la desserte, ce qui était dessus redescend au sol (ou en réserve s'il n'y a plus de place).
- **Nappes** : l'onglet « Nappes » n'existe qu'au bistrot (nappes à carreaux colorées). Les nappes déjà achetées ailleurs restent affichées.
- Zone réservée à la porte dans chaque salle (les objets posés au sol ne cachent plus la porte).

## Fichiers
index.html, js/game.js, js/compte.js (version), tools/test_11.py (nouveau, 41 contrôles), tools/test_8d.py (adapté), docs/CHANTIER11.md.

## Tests
test_11 41/41 ; régression : jeu 169, 8a 11, 8b 23, 8c 24, 8d 44, 7e 27, 9 40, cuisine 33, mobile 42, chantier 10 : 102.

## À vérifier par Julie (pas testable ici)
Le rendu à l'œil sur iPad ; la position exacte des plateaux sur les 4 dessertes (réglable dans `PLATEAUX`) ; la grande porte en jeu avec des assiettes en attente.
