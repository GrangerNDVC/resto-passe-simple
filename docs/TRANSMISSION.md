# TRANSMISSION — Jeu de commande (Le Resto du Passé Simple)

Document de passation entre conversations. À relire au début de chaque chantier et à mettre à jour à la fin.
Dernière mise à jour : 16/10/2026 (fin du chantier 4 : cuisine).

## 1. Le projet en deux phrases
Jeu de restaurant (prototype 3) pour s'entraîner au **passé simple de l'indicatif**. En salle, un client appelle, son ticket indique « pronom + verbe », le joueur choisit la bonne forme parmi 4 briques, puis porte le plat à la bonne table avant que la patience (smileys) tombe à zéro. Quand la cuisine s'ouvre, une partie des commandes est « à cuisiner » : le joueur passe la porte, choisit le poste du groupe du verbe et **écrit lui-même la forme au clavier**, avec des verbes de plus en plus difficiles (1er, 2e, 3e groupe).

## 2. Décisions prises (ne pas rediscuter sans raison)
- **Mécanique salle validée** : ticket → choix de la forme parmi 4 briques → le serveur prend le plat au passe-plats → clic sur la bonne table (numéro du ticket).
- **Erreur de forme (salle)** : plat raté (noir fumant) à la table, patience du client réduite, la bonne forme s'affiche ; on peut recommencer la commande (mêmes verbe et personne, nouveaux distracteurs). L'erreur ne fait pas perdre de cœur.
- **Cœurs** : on perd un cœur quand un client part fâché (patience à zéro). 3 cœurs, puis fin de partie avec le bilan « à revoir ».
- **Vitesse** : Normal / Lent / Sans chrono (choix à l'écran titre).
- **Couleur = groupe verbal** : vert = 1er, orange = 2e, rouge = 3e, violet = auxiliaires.
- **Direction artistique** : rétro « pas trop », bistrot années 50 propre et moderne, contours bruns épais, palette chaude, aucun bleu dans les objets (le bleu est réservé au détourage).
- **Vue frontale « théâtre »** : mur du fond en bande étroite en haut, grand sol en damier en dessous, deux fins murs latéraux ; une rangée de 6 tables ; le serveur marche dans un couloir devant.
- **Tout le texte est écrit par le code** (verbes, numéros, tickets) : les images sont toujours vierges.
- **Nappes allongées de 44 px** (validé) pour mieux cacher la coupe des clients.
- Les clients sont **coupés à la taille**, avec un bord plat caché derrière la nappe.
- **Cuisine (chantier 4, validé par Julie le 15/10/2026)** : le joueur **écrit la forme conjuguée au clavier** (pas de briques à glisser) ; **un poste par groupe** (marmite = 1er, plan de travail = 2e, plaque = 3e ; auxiliaires à la plaque) ; **alternance salle / cuisine par la porte battante** (un écran à la fois, la salle continue de tourner).
- Chantiers 2 et 3 : pronom « on » conservé ; pas de subjonctif imparfait ; -tenir et -venir au programme ; 45 verbes du chantier 3 validés.

## 3. Mise en scène (canvas 1920×1080)
- Décor `bg_salle` (sol adouci : désaturé et éclairci en code, masque en polygone). Le sol commence à y ≈ 308.
- Tables : `S = 0.85`, haut du sprite à `y = 552`, centres `x = 330, 630, 930, 1230, 1530, 1780` (numérotées 1 à 6 de gauche à droite). Ordre d'ouverture : 3, 4, 2, 5, 1, 6 (3 tables au début, une de plus tous les 4 clients servis).
- Client : bord bas à `y = 552 + 120×0,85`, largeur `CLIENT_W = 175`. Smiley à `(x+100, 452)`.
- Serveur : couloir `y = 850`, passe-plats à `(470, 345)` avec échelle en perspective de 1,0 à 0,6, hauteur `SERVEUR_H = 300`, plateau `TRAY = (62, -232)` (repère local, serveur tourné vers la droite).
- Passe-plats (sprite) à `(300, 300)`, échelle 0,62 ; plats prêts posés à `(443 ± 72, 268)` (jusqu'à 3, avec le numéro de table).
- Rail à tickets en haut au centre (`x = 690, y = 14`, 445 px de large), jusqu'à 4 tickets. Un ticket « à cuisiner » affiche son état sous le ticket (à cuisiner / en cuisson… / prêt !).
- Panneau de choix en bas : `x = 150, y = 830, 1620×236`, 4 briques 300×120. Le même panneau sert à la saisie en cuisine.
- Les plats sont posés sur le plateau de chaque table : largeur = 92 % du plateau, écrasés de 28 % verticalement (perspective), bord avant calé sur le bord avant du plateau (mesures dans `js/geometrie.js`).
- **Porte de la cuisine (salle)** : `DOOR = (600, 112, 104×190)` sur le mur du fond, serveur devant la porte en `DOOR_STAND = (652, 345)`. N'apparaît qu'une fois la cuisine ouverte.
- **Cuisine** (`bg_cuisine`, mur du fond jusqu'à y ≈ 345) : postes `x = 520, 960, 1400`, base `y = 700`, plaque d'identification dessous ; chef `x = 335`, base 805, hauteur 310, bulle d'aide en haut à gauche ; porte de retour `CUIS_PORTE = (30, 235, 190×400)` ; passe-plats en miroir à droite `CUIS_PASSE = (1800, 290)` échelle 0,5 + cloche ; tableau « Salle » (smileys des tables) en haut à droite ; saisie en bas (même panneau que le QCM).

## 4. Fichiers
Code (dans le projet sous `code/`) :
- `index.html` : page, canvas 1920×1080 mis à l'échelle + champ `<input id="saisie">` invisible (reçoit le clavier pour la saisie en cuisine).
- `js/game.js` : moteur (état, mise à jour, dessin, entrées). Crochets de test dans `window.__jeu`. Bloc « cuisine (chantier 4) » : `posteActif`, `majCuisine`, `changerVue`, saisie (`ouvrirSaisie`, `validerSaisie`), `clicCuisine`, `dessinerCuisine` et dessins provisoires (`posteCode`, `silhouetteChef`, portes).
- `js/verbes.js` : conjugaison des 3 groupes (81 verbes, 10 niveaux), distracteurs, fabrique de commandes. Personnes : 0 = je, 1 = tu, 2 = il/elle, 3 = nous, 4 = vous, 5 = ils/elles.
- `js/geometrie.js` : mesures des tables (générées).
- `tools/chroma.py` : détourage du fond bleu **local** + découpe de planches en grille + contrôle de fuite.
- `tools/extract_salle.py`, `tools/extract_planches.py` : extraction des sprites existants (chemins d'origine à adapter).
- `tools/extract_cuisine.py` : **nouveau**, détoure et découpe `postes.png`, `chef.png`, `cuisine_deco.png` vers `assets/cuisine/` (usage dans l'en-tête du fichier).
- `tools/test_jeu.py` (salle, 48 contrôles), `tools/test_cuisine.py` (cuisine, 31 contrôles), `tools/test_profils.py`, `tools/test_conjugaison.js`.
- `build_prompts.py` + `docs/PROMPTS_ASSETS.md` + `docs/assets_manifest.json` : prompts et noms de tous les assets.

Images (**ne sont pas dans le projet**, à fournir par l'archive) :
`assets/bg_salle.png`, `bg_cuisine.png` ; `assets/salle/`, `plats/`, `briques/`, `ui/`, `smileys/`, `fx/` ; `assets/clients/`, `assets/serveur/`.
Facultatives (le code dessine une version provisoire tant qu'elles manquent) : `assets/cuisine/<nom>.png` avec `marmite_repos`, `marmite_actif`, `plan_travail_repos`, `plan_travail_actif`, `plaque_repos`, `plaque_actif`, `chef_neutre`, `chef_explique`, `chef_bravo`, `chef_fache`, `etagere_bocaux`, `casseroles_suspendues`, `hotte_inox`, `porte_battante`.

## 5. Règles de gameplay actuelles (réglages dans `BAL`, en haut de `game.js`)
- Patience : `max(34, 64 − 4×rythme)` secondes (×0,8 VIP, ×2 en mode Lent, gelée en Sans chrono) ; apparition, niveaux (+1 tous les 8 clients), tables, cœurs : voir `BAL`.
- Score : 10 + bonus selon la patience restante (×2 VIP, +5 si série de 2 bonnes réponses). Plat fait maison : +10 ; sans bonus de rapidité si « Aide du chef » utilisée.
- Niveaux 1 à 10 (1er groupe 1-5, 2e groupe 6, 3e groupe 7-10) ; choix du groupe à l'écran titre ; modes cœurs ou séance (3, 5, 10 min).
- **Cuisine** : s'ouvre après `cuisineApres` = 10 clients servis d'affilée sans client parti fâché ; ensuite `cuisineProba` = 60 % des commandes sont à cuisiner (patience ×`cuisinePatMul` 1,5) ; cuisson `cuisson` = 3,2 / 4,2 / 5,2 s ; plat raté : poste bloqué `rateDuree` 3 s, patience −20 % ; accent seul faux = « Presque » (1 seconde chance sans pénalité) ; bouton « Cuisine : oui/non » à l'écran titre.
- Ces valeurs de cuisine sont des réglages de départ, pas encore équilibrés par simulation.

## 6. Points connus / à améliorer
- Clients et serveur : le chantier 1 (intégration des personnages) n'est pas coché ; silhouettes ou sprites selon les fichiers fournis.
- Cuisine : dessins provisoires (postes, chef, porte, enseigne) ; sons de cuisson à faire (chantier 5) ; réglages `BAL.cuisine*` à tester en classe.
- Après une erreur en cuisine, la bonne forme reste affichée ~6 s : on peut la recopier (à observer).
- Reflets brillants du sol visibles en haut à droite de la salle (chantier 5). Son : 4 bips synthétisés (chantier 5).
- Aucune sauvegarde de progression (chantier 6).
- Restes du chantier 2 : « rejouer mes erreurs », « personne seule », fiche enseignante.

## 7. Comment tester
- `python3 -I tools/test_jeu.py <dossier_du_jeu> <dossier_captures>` : salle seule (le test désactive la cuisine).
- `python3 -I tools/test_cuisine.py <dossier_du_jeu> <dossier_captures>` : parcours salle → cuisine → service avec saisie au vrai clavier, erreurs, nettoyage, joueur parfait, cuisine désactivée.
Les deux vérifient l'absence d'erreur JavaScript et enregistrent des captures à regarder.

## 8. Chantiers
Voir `chantiers/00_INDEX.md`. Détail du chantier 4 : `claude/CHANTIER4.md`.
