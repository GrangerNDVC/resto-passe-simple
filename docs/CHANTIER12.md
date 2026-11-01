# CHANTIER 12 — Retours du mode essai : cuisine, porte, objets plus près, couleurs (01/11/2026)

Version : « Version du 01/11, 19 h » (`?v=20261101-19`). Fait suite au chantier 11.

## Demandes de Julie (1er novembre)
1. Le serveur « descend du haut du mur » devant la porte de la cuisine.
2. En cuisine, l'assiette va au passe-plats alors qu'il n'y en a plus.
3. Temps trop court entre la commande à cuisiner et la cuisson.
4. Les meubles (objets au sol) ne doivent plus être bloqués devant une fenêtre.
5. Pouvoir rapprocher les objets (comme les tables), avec une légère perspective (plus gros quand plus proche).
6. Pouvoir recolorer les objets, notamment en rouge.
7. Le passe-plats s'affichait dans l'atelier en mode cuisine → **passe-plats toujours en mode facile, grande porte toujours en mode difficile**.

## Ce qui a changé (js/game.js)
- **Porte / passe-plats** : mode difficile = grande porte (en jeu, dans l'atelier, au titre), même cuisine pas encore ouverte (clic : « La cuisine n'est pas encore ouverte » si rien à servir) ; mode facile = passe-plats. Les assiettes se choisissent à la porte en difficile.
- **Serveur** : il se place et réapparaît dans le couloir, devant la porte (plus de descente depuis le haut du mur).
- **Cuisine** : plus de passe-plats vu de la cuisine ; les plats prêts attendent sur une tablette de service près de la porte, avec la cloche.
- **Patience** des commandes à cuisiner : ×2,3 (avant ×1,5) + 60/50/40/30 s selon le resto.
- **Objets au sol** : plus gênés par les fenêtres ; on peut les poser jusqu'à y = 800 (avant 745), avec perspective (+0,13 % de taille par pixel plus proche). Ils se dessinent devant les tables s'ils sont plus proches.
- **Couleurs d'objets** : bouton « Couleur (C) » dans l'atelier (rouge, bordeaux, bleu, vert, doré, noir, blanc) ; pour les plantes, seul le pot change.
- Reprend le chantier 11 : objets sur les meubles (dessertes), nappes recolorables seulement au bistrot.

## Fichiers
index.html, js/game.js, js/compte.js (version), tools/test_11.py (55 contrôles), tools/test_8a.py, test_8b.py, test_8c.py, test_jeu.py (adaptés à l'ancien comportement), docs/CHANTIER12.md.

## Tests
test_11 55/55 ; jeu 169, 8a 11, 8b 23, 8c 24, 8d 44, 7e 27, 9 40, cuisine 33, mobile 42, chantier 10 : 102.

## Non testé ici
Rendu sur iPad Mini 2 ; équilibrage réel du temps de cuisine avec les élèves (à ajuster dans `BAL.cuisinePatMul` / `cuisinePlus`).
