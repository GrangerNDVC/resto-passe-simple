# Chantier 7d — prompts des images des restos 2 à 4 et de la carte

7 images (3 salles et la carte déjà reçues et intégrées ; restent les 3 façades), toutes en **16:9 (1920×1080)**, sans fond bleu (ce sont des scènes pleines page) :

| # | Fichier à déposer dans `assets/` | Quoi | Format |
|---|---|---|---|
| 1 | `bg_titre_2.jpg` | Façade de la Brasserie de la ville | JPG |
| 2 | `bg_titre_3.jpg` | Façade du Grand restaurant | JPG |
| 3 | `bg_titre_4.jpg` | Façade du Palace | JPG |
| 4 | `bg_salle_2.png` | Salle de la Brasserie | PNG |
| 5 | `bg_salle_3.png` | Salle du Grand restaurant | PNG |
| 6 | `bg_salle_4.png` | Salle du Palace | PNG |
| 7 | `bg_carte.jpg` | Carte « La route du Palace » | JPG |

**Aucun code à toucher** : le jeu lit ces fichiers dès qu'ils sont présents (sinon il garde les images du village teintées). Le texte des pancartes, le panneau OUVERT, la route et les médaillons de la carte sont dessinés par le code : les images restent **vierges**.

## Comment générer (important)
- **Joins toujours l'image de référence indiquée** (façades : `bg_titre.jpg` ; salles : `bg_salle.png`) et ajoute en tête du prompt : « Garde exactement la même composition, les mêmes proportions et le même style que l'image jointe ; change seulement ce qui est décrit ci-dessous. » Les emplacements ci-dessous sont mesurés sur ces références : si la composition bouge, la pancarte, la porte ou le passe-plats ne tomberont plus au bon endroit.
- Colle ensuite le **bloc STYLE**, puis le prompt de l'image.
- Si le résultat n'est pas en 1920×1080, lance `python3 -I tools/preparer_7d.py <fichier> <nom_cible> .` (recadre en 16:9, redimensionne, convertit dans le bon format et vérifie les zones sensibles).
- Après dépôt, ouvre le jeu : carte → clic sur le resto → l'animation d'accueil (pancarte, panneau OUVERT) puis la salle.

## Bloc STYLE (à coller dans chaque prompt)
Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. Aucun texte, aucune lettre, aucun chiffre dans l'image.

## Règles communes aux 3 façades (à ajouter à chaque prompt de façade)
Même cadrage que l'image jointe, vue de face, caméra à hauteur d'yeux. Emplacements obligatoires (en pourcentage de l'image) :
- **Enseigne VIDE** (aucune lettre) en bois ou métal, centrée horizontalement (50 %) et à 31 % de la hauteur ; environ 20 % de la largeur de l'image sur 14 % de la hauteur (comme dans l'image jointe).
- **Double porte vitrée** au centre, de 43 % à 57 % de la largeur, entre 56 % et 90 % de la hauteur ; la partie haute de la porte reste claire et vitrée (un panneau y sera accroché en code).
- **Trottoir** sur le bas de l'image (à partir de 93 % de la hauteur), continu et lisible.
- À **gauche de la porte, devant la façade**, laisse le trottoir dégagé (aucun grand objet entre 0 et 35 % de la largeur sur les 30 % du bas) : le serveur y marche.
- Ciel pêche et doré (cohérent avec l'image jointe), pas de bleu dominant. Le tiers supérieur reste relativement calme.

## 1. `bg_titre_2.jpg` — Brasserie de la ville
Référence à joindre : `bg_titre.jpg`. Prompt :
> Façade d'une grande brasserie de ville, dans une rue d'immeubles en pierre crème à balcons en fer forgé (la ville, un cran au-dessus du village). Façade et boiseries **vert sapin foncé** avec filets dorés, auvent à rayures **vert sapin et crème**, grandes vitrines chaleureuses éclairées de l'intérieur (silhouettes de clients), terrasse avec chaises en rotin et petites tables rondes, lanternes de rue en fer forgé, jardinières fleuries, guirlande d'ampoules chaudes. Enseigne en bois vernis VIDE. Ambiance de fin de journée dorée, ciel pêche et rose. [+ règles communes aux façades]

## 2. `bg_titre_3.jpg` — Grand restaurant
Référence à joindre : `bg_titre.jpg`. Prompt :
> Façade d'un grand restaurant de la grande ville, élégante et accueillante : façade en pierre de taille crème avec deux colonnes et une arche au-dessus de la double porte vitrée, auvent droit **rouge bordeaux** à franges dorées, tapis rouge sur trois marches basses devant la porte, grandes fenêtres cintrées chaudement éclairées, deux petits arbres taillés en pots, deux lampadaires à lanternes dorées, balcons en pierre aux étages avec quelques fenêtres allumées, immeubles de la grande ville de part et d'autre. Enseigne en laiton doré VIDE dans un cadre ouvragé. Crépuscule doré, ciel pêche et violet clair. [+ règles communes aux façades]

## 3. `bg_titre_4.jpg` — Le Palace
Référence à joindre : `bg_titre.jpg`. Prompt :
> Façade monumentale d'un palace de la capitale : grande façade en pierre blanche et or, quatre hautes colonnes, fronton sculpté, large escalier à tapis rouge menant à une imposante **double porte vitrée dorée** (garde la porte aux mêmes proportions), lustres de cristal visibles à travers les hautes fenêtres, drapeaux sans motif ni lettre sur des mâts dorés, lampadaires dorés à globes lumineux, deux grandes jardinières à topiaires, immeubles prestigieux et un dôme doré au loin dans la capitale. Cartouche d'enseigne doré et richement orné, VIDE. Soir de fête, ciel pêche, doré et violet clair, petites lumières scintillantes. [+ règles communes aux façades]

## Règles communes aux 3 salles (à ajouter à chaque prompt de salle)
Reprends **exactement** la structure de la salle jointe : mêmes proportions (bande de mur du fond étroite en haut ≈ 25 % de la hauteur sur ≈ 75 % de la largeur, deux fines bandes de murs latéraux en diagonale, immense sol en perspective douce ≈ trois quarts de la hauteur), mêmes limites entre lambris et mur, **mêmes deux fenêtres arrondies dans la moitié droite du mur du fond avec l'applique entre elles**, quart gauche du mur du fond lisse. Pièce TOTALEMENT VIDE : aucune table, chaise, personne, meuble ni porte, **ni horloge, ni lampe suspendue, ni plante, ni tableau, ni ardoise** (ces objets s'achètent dans le jeu). **Le papier peint du mur reste CLAIR (crème ou ivoire)**, avec ses fines rayures : le joueur le recolorera dans l'atelier, une teinte foncée donnerait des couleurs sales. Le sol doit rester **assez clair et peu contrasté** pour que les clients et les plats restent lisibles. Pas de texte, pas de reflets marqués sur le sol.

## 4. `bg_salle_2.png` — Brasserie (✅ reçue le 21/10, version sans porte, intégrée)
Référence à joindre : `bg_salle.png`. Changements :
> Brasserie de ville : lambris de bois brun **foncé** avec fine moulure dorée ; papier peint ivoire à fines rayures **vert pâle** ; sol en damier **vert sapin et crème** ; stores des deux fenêtres rayés vert et crème ; poutre en bois sombre en haut. [+ règles communes aux salles]

## 5. `bg_salle_3.png` — Grand restaurant (✅ reçue le 21/10, version sans porte, intégrée)
Référence à joindre : `bg_salle.png`. Changements :
> Salle d'un grand restaurant : lambris en bois clair à panneaux moulurés ; papier peint ivoire à fines rayures tissées **dorées** ; corniche en stuc crème sous la poutre ; fenêtres cintrées à rideaux **rouge bordeaux** drapés, la même position que les fenêtres de la référence ; sol en **parquet à chevrons** brun miel, clair ; fine bande de moulure dorée en haut du lambris. [+ règles communes aux salles]

## 6. `bg_salle_4.png` — Palace (✅ reçue le 21/10, version sans porte, intégrée)
Référence à joindre : `bg_salle.png`. Changements :
> Salle d'apparat d'un palace : lambris en bois ivoire laqué à filets **dorés** ; papier peint ivoire à rayures moirées crème et or très discrètes ; moulures et corniche dorées en haut des murs ; hautes fenêtres cintrées aux rideaux de velours **prune** à franges dorées, même position que la référence ; sol en **damier de marbre crème et beige rosé** à veines très douces, avec un fin liseré doré le long des murs. Aucun lustre visible (le plafond n'est pas dans le cadre). [+ règles communes aux salles]

## 7. `bg_carte.jpg` — la carte « La route du Palace » (✅ reçue le 22/10, intégrée ; prompt refait le 21/10)
**Pourquoi la première version ne marchait pas** : le prompt parlait de « médaillons ronds posés dessus » et de « zones calmes », et les IA ont **peint des ronds vides** dans l'image. Ce nouveau prompt ne parle plus de ronds : il décrit une vraie carte illustrée, avec une route peinte et quatre lieux bien distincts. **C'est moi qui adapterai ensuite le jeu à l'image obtenue** (position des 4 médaillons, route du jeu coupée) : n'essaie donc pas d'obtenir des positions parfaites, vise une belle image où les 4 lieux se reconnaissent.

Référence à joindre (facultatif) : `bg_titre.jpg`, pour la lumière dorée et le style. Prompt à coller tel quel :
> Illustration de carte de jeu vidéo pour enfants, style cartoon 2D à plat avec contours bruns épais et réguliers, couleurs chaudes et douces, ambiance de fin de journée dorée. Format paysage 16:9. Vue en légère plongée sur un grand paysage de campagne française qui monte en diagonale du **bas-gauche** vers le **haut-droite**, avec une **route sinueuse beige doré** qui relie quatre lieux, dans cet ordre, en partant du coin bas-gauche :
> 1. **un tout petit village de campagne** (quelques maisons à toits rouges, un petit clocher, des champs de blé et de lavande, deux ou trois peupliers), en bas à gauche, vers 15 % de la largeur et 70 % de la hauteur ;
> 2. **une petite ville** (maisons serrées autour d'une place, toits rouges et orange, une église), vers 36 % de la largeur et 54 % de la hauteur ;
> 3. **une grande ville** (hauts immeubles en pierre crème à toits gris et lucarnes, une cathédrale), vers 60 % de la largeur et 42 % de la hauteur ;
> 4. **la capitale**, au loin sur une colline en haut à droite, vers 82 % de la largeur et 28 % de la hauteur : de grands monuments dorés, un dôme doré, des tours élégantes.
> Chaque lieu est posé sur sa propre colline, bien séparé des autres par de la campagne vide (champs en patchwork, prairies, bosquets). Au-dessus et autour de chaque lieu, garde le ciel ou la prairie **simples et peu chargés** (on y ajoutera des étiquettes). Le ciel occupe le haut de l'image : dégradé pêche et doré, violet clair en haut à droite, quelques nuages crème, un soleil bas et doux en haut à droite derrière la capitale. Palette : crème, ocre, orange, vert sapin atténué, rouge brique, doré ; aucun bleu franc.
> **À ne surtout pas dessiner** : aucun cercle, aucun rond, aucun médaillon, aucune pastille, aucun cadre, aucun bouton, aucune icône, aucune flèche, aucun panneau, aucun drapeau de carte, aucun texte, aucune lettre, aucun chiffre, aucune personne.

*Pour les outils qui ont un champ « prompt négatif »* : `cercle, rond, médaillon, pastille, cadre, bouton, icône, flèche, texte, lettres, chiffres, personnages, bleu`.

**Si le résultat n'est pas encore bon** : envoie-moi la meilleure image obtenue (même avec une route ou des lieux pas parfaits) ; je peux déplacer les médaillons sur les lieux de l'image, effacer la route du jeu si l'image en a une, et recadrer. Mieux vaut une belle image dont les lieux sont n'importe où qu'une image « aux bonnes positions » mais pauvre.

## À vérifier après génération
- Façades : pancarte vierge au même endroit que le village (centre ≈ 50 % / 31 %), porte au centre, pas de texte parasite.
- Salles : mur du fond, lambris et fenêtres aux mêmes endroits que `bg_salle.png` (le papier peint acheté ne se pose que sur les murs : la teinte doit coller aux murs sans déborder sur le lambris), aucun objet ni meuble, murs clairs.
- Carte : aucun rond ni médaillon peint, quatre lieux bien distincts reliés par une route, pas de texte, bandeau du haut calme.
- Aucune couleur bleue dans les objets.
