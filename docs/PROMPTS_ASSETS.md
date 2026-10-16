# Jeu de commande — Architecture des assets et prompts

> Document de travail. Les prompts sont **complets** (style + fond bleu déjà inclus) : il suffit de les copier-coller.
> Le fichier `assets_manifest.json` liste tous les noms, grilles et poses pour le code.

## 1. Principes de conception

1. **Vue frontale « théâtre » 2D** (pas de vue de dessus) : une seule rangée de 6 tables, les clients assis derrière, le serveur qui marche dans un couloir au premier plan. Résultat : le serveur n'a besoin que d'un cycle de marche de profil (la gauche s'obtient par miroir en code) au lieu de 4 directions.
2. **Économie d'images, richesse par le code.** Chaque élément animé = 2 poses maximum + effets en code (rebond, étirement, particules de vapeur, teinte, apparition en fondu).
3. **Tout texte, chiffre et jauge est fait en code** (verbes sur les briques, numéros de table, tickets, jauge de patience). Les images sont toujours vierges : le jeu reste modifiable sans regénérer.
4. **Couleur = groupe verbal**, partout : vert = 1er groupe, orange = 2e groupe, rouge = 3e groupe, violet = auxiliaires et irréguliers. Utilisée sur les briques, le bord des assiettes et les tickets : l'élève fait le lien sans lire.
5. **Style rétro « pas trop »** : le rétro vient du décor et de la palette (bistrot années 50, nappe vichy, damier, laiton, rayures), pas d'un effet vieilli. Cartoon propre, contours bruns épais, couleurs chaudes. Aucun bleu dans les objets (le bleu est réservé au détourage).
6. **Variations gratuites en code** : teinte des nappes, miroir gauche/droite, échelle, ambiance « soir » (filtre chaud sur le décor), clients répétés avec une autre table.

## 2. Écrans et ordre des couches (du fond vers l'avant)

### Écran Salle (1920×1080 de référence)

| Couche | Contenu | Fichier(s) |
|---|---|---|
| 1 | Décor de fond | `bg_salle` |
| 2 | Déco murale (plantes, lampes, horloge, ardoise) | `salle_deco` |
| 3 | Guichet passe-plats (à gauche) | `passe_plats` |
| 4 | Chaise (derrière le client) | `chaise` |
| 5 | Client assis (2 poses) | `client_XX_*` |
| 6 | Table à nappe (6 couleurs : rouge, vert, jaune, orange, violet, rose) + plaque de numéro | `table_<couleur>`, `plaque_numero` |
| 7 | Plat posé sur la table | `plats` |
| 8 | Serveur (marche / poses) + plat sur son plateau | `serveur_*` |
| 9 | Smiley d'humeur, bulle de commande (verbe + personne + forme) | `smiley_*`, `bulle_commande` |
| 10 | Interface : rail à tickets, panneau, score, effets | `rail_tickets`, `ticket_commande`, `panneau_bois`, `fx_*` |

Décor : perspective centrale symétrique (mur du fond en face, murs latéraux visibles des deux côtés). Les tables, posées sur le sol devant le mur du fond, peuvent s'étendre sur toute la largeur de l'écran.

Positions de référence (à ajuster en code) : 6 tables, centres en x = 420, 690, 960, 1230, 1500, 1770 environ ; mur du fond de y = 0 à 307 (le sol commence à y ≈ 307) ; bas des tables à y ≈ 620 ; couloir du serveur : pieds à y ≈ 790 ; panneau de réponses (verbe, personne, forme) en bas de l'écran : y de 850 à 1080, posé sur le sol ; passe-plats sur la partie gauche du mur du fond, posé par-dessus les rayures, comptoir au niveau du lambris : x de 300 à 620, y de 70 à 300 ; rail à tickets en haut de l'écran.

### Écran Cuisine (phase 2, 1920×1080)

| Couche | Contenu | Fichier(s) |
|---|---|---|
| 1 | Décor de fond | `bg_cuisine` |
| 2 | Hotte, étagère, casseroles, porte | `cuisine_deco` |
| 3 | 3 postes : marmite, plan de travail, plaque (repos ↔ action) | `postes` |
| 4 | Plat en cours (cloche à la fin) | `plats` |
| 5 | Briques de verbes à glisser (bac en bas de l'écran) | `briques` |
| 6 | Chef-conseiller (bulles d'aide) | `chef_*` |
| 7 | Tickets, score, effets | `ui`, `fx` |

Décor : mêmes proportions que la salle (mur du fond en bande étroite en haut, grand sol en dessous, deux fins murs latéraux). Positions de référence : mur du fond de y = 0 à environ 345 ; porte battante (`porte_battante`, bouton « retour en salle ») sur le mur du fond à gauche, x de 230 à 430 ; passe-plats (même sprite que la salle) sur le mur du fond à droite, avec la cloche de service ; postes en x = 520, 960, 1400, base à y ≈ 700 ; chef-conseiller à gauche sur le sol ; bac de briques de verbes en bas de l'écran, y de 850 à 1080.

### Écran Titre

`bg_titre` + titre en code + `serveur_idle` ou `chef_bravo`.

## 3. Découpage des mouvements

| Élément | Images | Technique |
|---|---|---|
| Serveur qui marche | 6 (profil droite) | Cycle 1→6→1 en boucle ; miroir pour aller à gauche ; vitesse = vitesse de déplacement |
| Serveur à l'arrêt | 1 (`serveur_idle`) | Petit balancement en code |
| Serveur qui pose le plat | 1 (`serveur_depose`) | Affichée 0,4 s à l'arrivée à la table |
| Serveur content / oups | 2 | Affichées après bonne / mauvaise réponse |
| Plat porté | superposé | Plat placé en code sur l'ancre du plateau (réglage par image) |
| Client qui attend | 1 pose (`attente`) | Respiration légère en code (léger étirement) |
| Client qui appelle | 1 pose (`appel`) | Alterne avec `attente` toutes les 0,5 s + petit saut |
| Humeur du client | 6 smileys | Change avec la jauge de patience, rebond à chaque changement |
| Postes de cuisine | 2 par poste | Alternance repos/action + particules de vapeur en code |
| Chef | 4 poses | Change selon le message (règle, bravo, erreur) |
| Briques | 4 couleurs + 1 emplacement vide | Texte du verbe en code ; glisser-déposer ; clignotement si erreur |

## 4. Bilan du budget d'images


- **21 images à générer** (décors, planches et planches de personnages), qui donnent environ **74 sprites** une fois découpés.
- Priorité **P1** = salle jouable avec le 1er groupe. **P2** = cuisine et phase de fabrication. **P3** = finitions (titre, déco, client VIP).
- **Déjà faits et intégrés** : `bg_salle`, `bg_cuisine`, mobilier de salle (6 tables de couleur, chaise, passe-plats, plaque de numéro). La nappe bleue est exclue (confondue avec le fond bleu) et remplacée par une nappe rose.

## 5. Technique : fond bleu, découpe, noms

- Le fond bleu est retiré en code (détourage par couleur avec tolérance + suppression du liseré bleu sur les bords). Pour que ça marche : fond **uni**, **pas d'ombre au sol**, **aucun bleu dans les objets**.
- Les images générées ne sont jamais d'un bleu parfaitement pur : ce n'est pas grave, le code échantillonne la couleur dans le coin de l'image.
- Je fournirai un petit script qui **découpe automatiquement** chaque planche (détection des formes séparées, lecture gauche→droite puis haut→bas) et nomme chaque sprite d'après la liste de ce document. Pour les planches de poses (clients, serveur), je découpe en cases égales.
- Enregistre chaque image sous **le nom de fichier indiqué** dans le titre de chaque prompt (ex. `postes.png`), dans un seul dossier. Rien d'autre à renommer.
- Formats : PNG. Taille conseillée indiquée pour chaque image (sinon la plus grande disponible).

## 6. Conseils de génération (cohérence)

1. Commence par **`client_01_garcon`** : quand il te plaît, donne-le comme **image de référence** (« même style, même épaisseur de contour ») pour tous les autres personnages et pour les planches d'objets.
2. Pour le **serveur** : si les 6 images de marche sont incohérentes, génère d'abord la pose 1, puis demande « le même personnage, même style, même taille, pose suivante : … » avec l'image 1 en référence, et assemble les 6 images dans une seule planche (je sais découper des images séparées aussi, dis-le-moi).
3. Vérifie à chaque image : **fond bleu uni**, **aucun texte** dans l'image, **pas de bleu sur l'objet**, marges suffisantes entre les éléments.
4. Si un générateur refuse de laisser les cases vides ou colle les éléments, ajoute : « beaucoup plus d'espace bleu entre les éléments ».

## 7. Ordre de production conseillé


- **P1** : `bg_salle.png`, `plats.png`, `ui.png`, `smileys.png`, `fx.png`, `client_01_garcon.png`, `client_02_papy.png`, `client_03_bouclee.png`, `client_04_blonde.png`, `serveur_marche.png`, `serveur_poses.png`
- **P2** : `bg_cuisine.png`, `cuisine_deco.png`, `postes.png`, `briques.png`, `client_05_mamie.png`, `client_06_moustachu.png`, `chef.png`
- **P3** : `bg_titre.png`, `salle_deco.png`, `client_07_critique.png`

---

# PROMPTS

## A. Décors pleine scène (pas de fond bleu)

### `bg_titre.png` — P3 — 16:9 (1920×1080)

*Utilisation :* Écran titre. Le nom du jeu est ajouté en code dans l'espace laissé libre en haut.

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. Scène pleine page, SANS fond bleu. Façade d'un petit bistrot français vue de face, au crépuscule doré : grande vitrine chaleureuse, auvent à rayures rouges et crème, porte vitrée, deux petites tables de terrasse avec chaises, pots de fleurs, guirlande de petites ampoules chaudes. Au-dessus de la porte, une enseigne en bois VIDE (aucune lettre). Ciel pêche et doré (pas de bleu dominant). Laisse le tiers supérieur de l'image relativement calme et dégagé (un titre sera ajouté plus tard par-dessus). Format paysage 16:9.
```

### `bg_salle.png` — P1 — 16:9 (1920×1080)

*Utilisation :* Écran de jeu principal (salle). Tables, chaises, clients et serveur sont ajoutés par-dessus en code.

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. Scène pleine page, SANS fond bleu. Décor 2D d'un jeu de gestion de restaurant (dans l'esprit des jeux mobiles type « Diner Dash »), vu de FACE, caméra légèrement surélevée, pièce TOTALEMENT VIDE (aucune table, chaise, personne, meuble ni porte). COMPOSITION EN DEUX ZONES, de haut en bas. ZONE 1, tout en haut : une bande étroite de mur du fond, qui ne fait qu'environ 25 % de la hauteur de l'image et occupe environ 75 % de la largeur ; papier peint crème à fines rayures verticales vert sapin sur TOUTE sa largeur (aucune zone lisse), bas du mur en lambris de bois brun, fine poutre en bois brun tout en haut, deux petites fenêtres arrondies avec stores rayés rouge et crème vues de face, placées côte à côte dans la moitié droite du mur, et une applique murale en laiton entre elles. Pas de plafond visible. ZONE 2, tout le reste : les TROIS QUARTS inférieurs de l'image sont un IMMENSE sol en damier crème et rouge-brique, avec une perspective douce (environ 8 rangées de grands carreaux lisibles en profondeur), qui remplit toute la largeur de l'image en bas. Les deux murs latéraux ne sont que deux FINES bandes en diagonale (lambris brun et papier rayé), qui partent des deux coins du mur du fond et sortent du cadre en bas à gauche et en bas à droite ; ils n'ont ni fenêtre ni lampe. Aucune décoration au sol, pas de reflets sur le sol, pas de texte. Format paysage 16:9.
```

### `bg_cuisine.png` — P2 — 16:9 (1920×1080)

*Utilisation :* Écran cuisine (phase 2). Les postes de travail sont ajoutés par-dessus en code.

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. Scène pleine page, SANS fond bleu. Décor 2D d'un jeu de gestion de restaurant (dans l'esprit des jeux mobiles type « Diner Dash »), vu de FACE, caméra légèrement surélevée, cuisine de restaurant TOTALEMENT VIDE (aucun ustensile, poste de travail, meuble ni personne, aucune porte et aucune ouverture sombre dans les murs). COMPOSITION EN DEUX ZONES, de haut en bas. ZONE 1, tout en haut : une bande étroite de mur du fond, qui ne fait qu'environ 30 % de la hauteur de l'image et occupe environ 80 % de la largeur ; carreaux de faïence « métro » crème avec joints bruns, une bande horizontale de carreaux vert sapin à mi-hauteur du mur, plinthe brune en bas du mur, fine poutre brune tout en haut. Pas de plafond visible. ZONE 2, tout le reste : les SEPT DIXIÈMES inférieurs de l'image sont un IMMENSE sol en damier crème et brun chocolat, avec une perspective douce (environ 8 rangées de grands carreaux lisibles en profondeur), qui remplit toute la largeur de l'image en bas. Les deux murs latéraux ne sont que deux FINES bandes en diagonale (carreaux métro crème avec la même bande verte), qui partent des deux coins du mur du fond et sortent du cadre en bas à gauche et en bas à droite ; ils n'ont ni fenêtre ni lampe. Éclairage chaud et doux, pas de reflets sur le sol, pas de texte. Format paysage 16:9.
```

## B. Planches d'objets (fond bleu)

### `salle_deco.png` — P3 — 1:1 (2048×2048) — grille 2×2

*Utilisation :* Décor d'ambiance de la salle, posé en code sur le mur (cadres, plantes, lampes).

*Contenu (ordre de lecture) :* `plante_verte`, `lampe_suspendue`, `horloge_murale`, `ardoise_menu`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 4 éléments distincts rangés dans une grille de 2 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « plante_verte » : Grande plante verte (ficus) dans un pot en terre cuite orange, vue de face.
Case 2 « lampe_suspendue » : Lampe suspendue avec abat-jour vert sapin en forme de cloche, fil court en haut, ampoule chaude allumée visible dessous.
Case 3 « horloge_murale » : Horloge murale ronde, cadre en bois brun, cadran crème avec simples traits à la place des chiffres, aiguilles sur 10 h 10.
Case 4 « ardoise_menu » : Ardoise de menu noire avec cadre en bois clair, complètement vierge (aucun texte), avec un petit bout de craie blanche posé en bas.
```

### `cuisine_deco.png` — P2 — 1:1 (2048×2048) — grille 2×2

*Utilisation :* Décor de la cuisine, posé en code sur le mur du fond.

*Contenu (ordre de lecture) :* `etagere_bocaux`, `casseroles_suspendues`, `hotte_inox`, `porte_battante`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 4 éléments distincts rangés dans une grille de 2 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « etagere_bocaux » : Étagère murale en bois à deux niveaux garnie de bocaux en verre remplis d'ingrédients colorés (pâtes jaunes, lentilles brunes, haricots rouges, herbes vertes). Aucun texte sur les bocaux.
Case 2 « casseroles_suspendues » : Barre horizontale en laiton avec quatre casseroles et deux louches en cuivre suspendues par des crochets.
Case 3 « hotte_inox » : Grande hotte de cuisine en inox gris chaud, vue de face, avec un petit voyant orange allumé.
Case 4 « porte_battante » : Porte de cuisine battante à double battant, en bois brun avec deux hublots ronds et des plaques de poussée en laiton, vue de face, fermée.
```

### `postes.png` — P2 — 3:2 (3072×2048) — grille 3×2

*Utilisation :* Postes de travail de la cuisine. Ligne 1 = au repos, ligne 2 = en action (alterner les deux images en code + particules de vapeur).

*Contenu (ordre de lecture) :* `marmite_repos`, `plan_travail_repos`, `plaque_repos`, `marmite_actif`, `plan_travail_actif`, `plaque_actif`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 6 éléments distincts rangés dans une grille de 3 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « marmite_repos » : Grosse marmite métallique avec couvercle fermé, posée sur un réchaud, flammes éteintes, vue de face légèrement en plongée.
Case 2 « plan_travail_repos » : Plan de travail en bois avec une planche à découper, un couteau posé à côté et un petit tas de légumes, vue de face légèrement en plongée.
Case 3 « plaque_repos » : Grande plaque à four rectangulaire en métal posée sur un support bas, vue de face légèrement en plongée, vide, propre.
Case 4 « marmite_actif » : EXACTEMENT la même marmite et le même réchaud que la case 1, mais couvercle légèrement soulevé, flammes vives dessous, bulles et petite vapeur qui s'échappe.
Case 5 « plan_travail_actif » : EXACTEMENT le même plan de travail que la case 2, mais couteau en l'air au-dessus de la planche, éclats de légumes qui sautent, petites étincelles de mouvement.
Case 6 « plaque_actif » : EXACTEMENT la même plaque que la case 3, mais chaude : lueur orange en dessous, petites étincelles et un peu de fumée, un morceau de nourriture qui grésille dessus.
IMPORTANT : Dans chaque colonne, les deux images (repos / action) doivent avoir exactement la même taille, la même position et la même perspective.
```

### `plats.png` — P1 — 3:2 (3072×2048) — grille 3×2

*Utilisation :* Plats servis. Superposés en code sur la table du client ou sur le plateau du serveur. Bord d'assiette = couleur du groupe verbal.

*Contenu (ordre de lecture) :* `assiette_vide`, `plat_g1_salade`, `plat_g2_soupe`, `plat_g3_ragout`, `plat_cloche`, `plat_rate`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 6 éléments distincts rangés dans une grille de 3 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « assiette_vide » : Assiette ronde crème avec un liseré brun foncé, vue en ellipse (angle 3/4 plongeant), vide.
Case 2 « plat_g1_salade » : Même assiette que la case 1 mais avec un bord VERT sapin, contenant une belle salade composée (feuilles vertes, tomate, petit œuf).
Case 3 « plat_g2_soupe » : Même assiette creuse que la case 1 mais avec un bord ORANGE, contenant une soupe de potiron orange crémeuse avec un filet de crème et un peu de vapeur.
Case 4 « plat_g3_ragout » : Même assiette que la case 1 mais avec un bord ROUGE tomate, contenant un ragoût de viande avec carottes et pommes de terre, un peu de vapeur.
Case 5 « plat_cloche » : Assiette avec une cloche de service argentée (gris chaud brillant) posée dessus, poignée sur le dessus, qui cache le plat.
Case 6 « plat_rate » : Même assiette que la case 1 avec un plat carbonisé noir fumant, petite fumée grise, léger air comique.
IMPORTANT : Les 6 assiettes doivent avoir la même taille et le même angle de vue, pour être interchangeables en code.
```

### `briques.png` — P2 — 3:2 (3072×2048) — grille 3×2

*Utilisation :* Briques « mots-ingrédients ». Le verbe est écrit en code dessus. Une couleur par groupe verbal.

*Contenu (ordre de lecture) :* `brique_g1_verte`, `brique_g2_orange`, `brique_g3_rouge`, `brique_aux_violette`, `brique_slot_vide`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 5 éléments distincts rangés dans une grille de 3 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « brique_g1_verte » : Étiquette-brique rectangulaire VERT vif, très allongée (rapport largeur/hauteur environ 3:1), bords arrondis, effet brillant en relief, petit rivet doré à chaque extrémité. TOTALEMENT VIERGE (aucun texte).
Case 2 « brique_g2_orange » : Même brique, même taille exacte, mais ORANGE vif.
Case 3 « brique_g3_rouge » : Même brique, même taille exacte, mais ROUGE tomate.
Case 4 « brique_aux_violette » : Même brique, même taille exacte, mais VIOLET prune (verbes auxiliaires et irréguliers).
Case 5 « brique_slot_vide » : Même forme et même taille exacte, mais emplacement vide : fond crème clair et bord en pointillés brun foncé, aucun relief, aucun rivet.
IMPORTANT : La case 6 reste vide. Les 5 briques doivent avoir exactement la même taille.
```

### `ui.png` — P1 — 3:2 (3072×2048) — grille 3×2

*Utilisation :* Éléments d'interface (bulles, tickets, cadres). Tout texte et tout chiffre est ajouté en code.

*Contenu (ordre de lecture) :* `bulle_commande`, `ticket_commande`, `rail_tickets`, `panneau_bois`, `cloche_service`, `carnet_commande`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 6 éléments distincts rangés dans une grille de 3 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « bulle_commande » : Grande bulle de dialogue arrondie, crème, contour brun épais, avec une petite queue pointant vers le bas à gauche. Complètement vierge.
Case 2 « ticket_commande » : Ticket de commande en papier crème, bord supérieur dentelé en zigzag, petit trou rond centré en haut, quelques fines lignes pâles horizontales. Aucun texte. Format vertical.
Case 3 « rail_tickets » : Longue barre horizontale en laiton (rapport environ 6:1) avec petits crochets et clous aux extrémités, vue de face, pour accrocher des tickets.
Case 4 « panneau_bois » : Cadre rectangulaire en bois brun aux coins arrondis, bordure d'épaisseur uniforme, intérieur crème uni VIDE. Sert de cadre extensible.
Case 5 « cloche_service » : Petite cloche de comptoir dorée avec un bouton poussoir sur le dessus, vue de face.
Case 6 « carnet_commande » : Carnet à spirale ouvert avec un crayon posé en travers, pages vierges. Aucun texte.
```

### `smileys.png` — P1 — 3:2 (3072×2048) — grille 3×2

*Utilisation :* Humeur des clients (6 niveaux de patience). Affichés au-dessus de la tête du client, avec un petit rebond en code.

*Contenu (ordre de lecture) :* `smiley_1_ravi`, `smiley_2_content`, `smiley_3_neutre`, `smiley_4_presse`, `smiley_5_mecontent`, `smiley_6_furieux`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 6 éléments distincts rangés dans une grille de 3 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « smiley_1_ravi » : Visage rond VERT vif, très grand sourire, yeux en forme de cœurs ou d'étoiles. Visage seulement, sans corps.
Case 2 « smiley_2_content » : Visage rond VERT-JAUNE, sourire doux, yeux ouverts, joues roses.
Case 3 « smiley_3_neutre » : Visage rond JAUNE, bouche en ligne droite, yeux normaux, regard attentif.
Case 4 « smiley_4_presse » : Visage rond ORANGE clair, bouche ondulée inquiète, une goutte de sueur sur le front, sourcils relevés.
Case 5 « smiley_5_mecontent » : Visage rond ORANGE-ROUGE, bouche tournée vers le bas, sourcils froncés.
Case 6 « smiley_6_furieux » : Visage rond ROUGE, sourcils très froncés, bouche grimaçante avec les dents, petits nuages de vapeur de chaque côté.
IMPORTANT : Les 6 visages ont la même taille et le même contour. Les émotions doivent se distinguer par les traits du visage, pas seulement par la couleur (accessibilité daltonisme).
```

### `fx.png` — P1 — 3:2 (3072×2048) — grille 3×2

*Utilisation :* Icônes de score et d'effets (récompenses, erreurs, temps).

*Contenu (ordre de lecture) :* `fx_piece`, `fx_etoile`, `fx_coeur`, `fx_coche`, `fx_croix`, `fx_sablier`

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE SPRITES : 6 éléments distincts rangés dans une grille de 3 colonne(s) × 2 ligne(s), chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. Ordre de lecture : gauche→droite, puis haut→bas.
Case 1 « fx_piece » : Pièce de monnaie dorée brillante avec un liseré, sans symbole ni chiffre (juste une étoile en relief au centre).
Case 2 « fx_etoile » : Étoile jaune brillante à cinq branches arrondies, avec petits éclats autour.
Case 3 « fx_coeur » : Cœur rouge brillant (vie), reflet blanc en haut à gauche.
Case 4 « fx_coche » : Grande coche verte épaisse (validation), contour brun.
Case 5 « fx_croix » : Grande croix rouge épaisse (erreur), contour brun.
Case 6 « fx_sablier » : Sablier en bois et verre avec du sable orange, vu de face (le verre est crème pâle, pas bleu).
```

## C. Personnages (fond bleu)

### C1. Clients (2 poses par client, 1 image par client)

Chaque image contient 2 poses : **gauche = `attente`**, **droite = `appel`**. Après découpe : `<nom>_attente.png` et `<nom>_appel.png`.

#### `client_01_garcon.png` — P1 — format 2:1 ou 16:9

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. Personnage : garçon d'environ 10 ans, cheveux bruns courts en épis, grands yeux curieux, t-shirt orange moutarde à col rond. Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, l'autre main posée devant le ventre, bouche légèrement ouverte. TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case (même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; en pose « appel », seul le bras levé dépasse sur le côté. L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié.
```

#### `client_02_papy.png` — P1 — format 2:1 ou 16:9

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. Personnage : grand-père à barbe grise fournie, lunettes rondes, crâne dégarni, veste vert sapin sur chemise crème, nœud papillon bordeaux. Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, l'autre main posée devant le ventre, bouche légèrement ouverte. TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case (même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; en pose « appel », seul le bras levé dépasse sur le côté. L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié.
```

#### `client_03_bouclee.png` — P1 — format 2:1 ou 16:9

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. Personnage : jeune femme aux cheveux bruns très bouclés et volumineux, boucles d'oreilles dorées, pull rouge bordeaux. Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, l'autre main posée devant le ventre, bouche légèrement ouverte. TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case (même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; en pose « appel », seul le bras levé dépasse sur le côté. L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié.
```

#### `client_04_blonde.png` — P1 — format 2:1 ou 16:9

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. Personnage : femme blonde aux cheveux mi-longs avec frange, serre-tête rose, chemisier rose pâle à col claudine. Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, l'autre main posée devant le ventre, bouche légèrement ouverte. TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case (même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; en pose « appel », seul le bras levé dépasse sur le côté. L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié.
```

#### `client_05_mamie.png` — P2 — format 2:1 ou 16:9

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. Personnage : grand-mère aux cheveux gris argent en chignon, lunettes papillon, châle violet lilas sur robe crème, collier de perles. Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, l'autre main posée devant le ventre, bouche légèrement ouverte. TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case (même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; en pose « appel », seul le bras levé dépasse sur le côté. L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié.
```

#### `client_06_moustachu.png` — P2 — format 2:1 ou 16:9

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. Personnage : homme costaud à grosse moustache brune, béret noir, chemise à carreaux jaune et rouge, bretelles brunes. Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, l'autre main posée devant le ventre, bouche légèrement ouverte. TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case (même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; en pose « appel », seul le bras levé dépasse sur le côté. L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié.
```

#### `client_07_critique.png` — P3 — format 2:1 ou 16:9

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. Personnage : critique gastronomique élégant et hautain (sourcil levé), chapeau melon noir, monocle, nœud papillon rouge, costume gris anthracite. Personnage VIP à bonus. Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, l'autre main posée devant le ventre, bouche légèrement ouverte. TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case (même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; en pose « appel », seul le bras levé dépasse sur le côté. L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié.
```

### C2. Serveur

#### `serveur_marche.png` — P1 — format 3:2 — grille 3×2

Après découpe : `serveur_marche_1.png` … `serveur_marche_6.png` (cycle en boucle ; miroir pour la gauche).

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE D'ANIMATION : cycle de marche en 6 images du MÊME personnage, grille de 3 colonnes × 2 lignes, une image par case, séparées par de larges marges bleues. Personnage : jeune serveur de bistrot français : cheveux bruns avec petite mèche, fine moustache, nœud papillon rouge, chemise blanche aux manches retroussées, gilet noir, long tablier blanc de bistrot qui descend aux chevilles, pantalon noir, chaussures noires cirées. Il porte sur sa main levée, à hauteur d'épaule, un plateau rond argenté (gris chaud) VIDE, tenu à plat à l'horizontale. Il est vu de PROFIL, marchant vers la DROITE de l'image, corps entier visible de la tête aux pieds. Ordre de lecture gauche→droite puis haut→bas. Image 1 CONTACT : jambes écartées, le pied avant pose le talon au sol, le bras libre balancé vers l'arrière. Image 2 DESCENTE : corps au plus bas, jambe avant fléchie. Image 3 PASSAGE : la jambe arrière est ramenée à hauteur de la jambe d'appui, corps un peu plus haut. Image 4 CONTACT inversé : c'est l'autre jambe qui est devant, le bras libre balancé vers l'avant. Image 5 DESCENTE inversée. Image 6 PASSAGE inversé. CONTRAINTES : même taille de personnage dans les 6 cases, les pieds sont toujours sur la même ligne horizontale imaginaire (ligne de sol), le plateau reste EXACTEMENT à la même hauteur et au même endroit devant lui dans les 6 images (un plat y sera superposé en code), le visage, les vêtements et les couleurs sont identiques dans toutes les images. Aucun sol ni ombre dessinés.
```

#### `serveur_poses.png` — P1 — format 1:1 — grille 2×2

Après découpe : `serveur_idle`, `serveur_depose`, `serveur_content`, `serveur_oups`.

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 4 POSES du MÊME personnage, grille de 2 colonnes × 2 lignes, corps entier, séparées par de larges marges bleues, même taille et mêmes vêtements que dans la planche de marche. Personnage : jeune serveur de bistrot français : cheveux bruns avec petite mèche, fine moustache, nœud papillon rouge, chemise blanche aux manches retroussées, gilet noir, long tablier blanc de bistrot qui descend aux chevilles, pantalon noir, chaussures noires cirées. Il porte sur sa main levée, à hauteur d'épaule, un plateau rond argenté (gris chaud) VIDE, tenu à plat à l'horizontale. Case 1 « serveur_idle » : debout, vu de face légèrement de trois quarts, sourire aimable, plateau vide à hauteur d'épaule sur la main levée. Case 2 « serveur_depose » : vu de PROFIL vers la droite, légèrement penché en avant, bras tendu vers l'avant avec le plateau à hauteur de la taille, comme pour déposer une assiette sur une table. Case 3 « serveur_content » : de trois quarts, clin d'œil, pouce levé de la main libre, plateau tenu de l'autre main. Case 4 « serveur_oups » : de face, haussement d'épaules, mains ouvertes, expression gênée avec une goutte de sueur, plateau posé sur une main. Aucun sol ni ombre dessinés.
```

### C3. Chef-conseiller

#### `chef.png` — P2 — format 1:1 — grille 2×2

Après découpe : `chef_neutre`, `chef_explique`, `chef_bravo`, `chef_fache`.

```
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image. FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours. PLANCHE DE 4 POSES du MÊME personnage, grille de 2 colonnes × 2 lignes, cadré à la taille (buste et bras), séparées par de larges marges bleues. Personnage : chef cuisinier rondouillard et jovial, grande toque blanche, moustache grise à la française, veste blanche à double boutonnage, foulard rouge autour du cou. Case 1 « chef_neutre » : bras le long du corps, sourire aimable. Case 2 « chef_explique » : un doigt levé, bouche ouverte, comme pour expliquer une règle. Case 3 « chef_bravo » : grand sourire, pouce levé. Case 4 « chef_fache » : bras croisés, sourcils froncés, bouche en moue (fâché mais drôle, pas effrayant). Même taille, même visage et mêmes vêtements dans les 4 cases.
```

