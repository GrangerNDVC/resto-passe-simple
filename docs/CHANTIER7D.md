# Chantier 7d — images des restos 2 à 4 et de la carte (21/10/2026)

Complète `chantiers/07_campagne_restos.md` (§6) et `claude/CHANTIER7C.md`.

## Ce qui est fait
- `docs/PROMPTS_7D.md` : les **7 prompts** (façades 2-4, salles 2-4, carte), avec les emplacements mesurés sur les images du village : pancarte vierge (centre ≈ 50 % / 31 %, constantes `ACCU.ENS` du jeu), porte (`ACCU.PORTE`), trottoir où marche le serveur, géométrie des murs de la salle (`MURS` pour le papier peint), objets de déco à ne pas peindre (horloge, lampe, plante, ardoise s'achètent), murs **clairs** (le papier peint acheté est une teinte multiplicative), zones calmes de la carte (positions des 4 médaillons `CARTE`) et route non peinte (dessinée par le code).
- `tools/preparer_7d.py` : recadre en 16:9, met en 1920×1080, convertit (JPG façades et carte, PNG salles), écrit dans `assets/` et avertit si l'image contient du bleu franc, un mur trop sombre ou un sol très sombre.
- Aucune modification du jeu : il lit déjà `assets/bg_titre_2..4.jpg`, `bg_salle_2..4.png`, `bg_carte.jpg` (vérifié : dès qu'un fichier est présent, le jeu l'utilise à la place de l'image du village teintée, accueil, salle et aperçu de l'atelier compris).

## Salles 2 à 4 : reçues et intégrées (21/10, soir)
- Julie a fourni les 3 salles (brasserie : bois sombre, damier vert ; grand restaurant : parquet à chevrons, rideaux bordeaux ; palace : marbre, rideaux prune et or) en 1365×768, passées en 1920×1080 par `preparer_7d.py` → `assets/bg_salle_2.png`, `_3`, `_4`. Ce sont les versions **sans porte**.
- Ces salles ont un mur du fond bien plus haut que celui du village (le sol commence vers y 610 au lieu de 308) : le jeu s'y pose correctement (tables, clients, passe-plats et porte « CUISINE » du code sur le lambris). Le **papier peint** utilise maintenant des murs propres à chaque salle (`RESTOS[i].murs`, mesurés sur les images ; `mursDe(i)`), avec des « trous » pour ne pas teinter les rideaux. L'ardoise a été déplacée (`ARDOISE`, entre la porte de la cuisine et la fenêtre). 171 contrôles OK.
- **Versions avec porte (non utilisées)** : la porte peinte est à gauche du mur du fond, exactement là où le jeu pose le passe-plats (x 150-590) et la porte « CUISINE » ; elle serait cachée. Les utiliser demanderait de déplacer le passe-plats et ses positions (`HATCH*`, `DOOR*`) pour chaque resto. Le jeu possède déjà un accès cuisine : la porte battante « CUISINE » apparaît sur le mur quand la cuisine s'ouvre (après 10 clients servis d'affilée), dans tous les restos. **Décision à prendre par Julie** : garder ce système (recommandé), ou réserver la cuisine aux restos 2 à 4, ou déplacer le passe-plats pour utiliser les portes peintes.
- **22/10 : Palace refait** (le passe-plats tombait sur une fenêtre) : 2 fenêtres au lieu de 3, `MURS_SALON([[560, 815], [1000, 1250]])`.
- **22-23/10 : carte intégrée** (`assets/bg_carte.jpg`, route et 4 lieux peints). Avec cette image : la route dessinée par le jeu n'est plus tracée ; les médaillons sont posés sur les lieux (`CARTE_IMG`, repère 1920×1080 : village (372, 790), petite ville (759, 600), grande ville (1343, 425), capitale (1526, 232)) ; les plaques sont compactes (nom + état) et placées pour ne pas cacher les lieux ; les détails du resto sélectionné (contenu, pièces ×, tables) sont dans une bande en bas. Sans l'image, l'ancienne disposition (`CARTE_DEF`, route dessinée) reste utilisée. Le titre est décalé à gauche pour laisser la capitale libre.
- Les façades 2-4 restent à générer ; le prompt de la carte avait été refait (les IA peignaient des ronds vides à cause de « médaillons » dans le premier).

## Reste à faire par Julie
Générer les 3 façades, les passer dans `preparer_7d.py` (ou les renommer à la main), les déposer dans `assets/`, regarder l'accueil et la salle de chaque resto. Si la pancarte, la porte ou les fenêtres tombent au mauvais endroit, on ajuste `ACCU` / `MURS` dans une prochaine conversation (envoyer les images).

## Suite
7e : franchises, « Toque chef », diplôme, article final (prévoir quelques images : plateau de télé, diplôme).
