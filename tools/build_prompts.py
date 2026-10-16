#!/usr/bin/env python3
"""Génère PROMPTS_ASSETS.md et assets_manifest.json pour le Jeu de commande."""
import json, os

OUT = os.path.dirname(os.path.abspath(__file__))

STYLE = (
    "Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux et petits reflets brillants, "
    "gros contours brun foncé réguliers (épaisseur constante), formes arrondies et sympathiques. "
    "Ambiance bistrot français rétro années 50, nostalgique mais propre et moderne : PAS de pixel art, PAS de texture vieillie ou abîmée, PAS de sépia. "
    "Palette chaude limitée : crème #F6E9CF, rouge tomate #D9473B, jaune moutarde #E8B33F, orange #E8833A, vert sapin #4C8C4A, "
    "violet prune #7B4B94, brun café #5A3A29, gris neutre chaud. "
    "Aucune couleur bleue, cyan ou turquoise dans les objets ni dans les vêtements. "
    "Aucun texte, aucune lettre, aucun chiffre dans l'image."
)

FOND = (
    "FOND : aplat bleu uni parfaitement uniforme (bleu pur #0000FF) sur toute l'image, sans dégradé, sans ombre portée, "
    "sans sol, sans reflet, sans bordure ni vignettage. Le bleu ne déborde jamais sur l'objet : pas de halo bleu sur les contours."
)

def planche(cols, rows, n):
    return (
        f"PLANCHE DE SPRITES : {n} éléments distincts rangés dans une grille de {cols} colonne(s) × {rows} ligne(s), "
        "chacun centré dans sa case, séparés par de larges marges bleues (au moins 10 % de la largeur) ; "
        "aucun élément ne touche un autre élément ni le bord de l'image. Même style et même épaisseur de contour pour tous. "
        "Ordre de lecture : gauche→droite, puis haut→bas."
    )

# ----------------------------------------------------------------------------
# 1) DÉCORS PLEINE SCÈNE (pas de fond bleu)
# ----------------------------------------------------------------------------
BACKGROUNDS = [
    dict(
        id="bg_titre", file="bg_titre.png", ratio="16:9 (1920×1080)", prio="P3",
        usage="Écran titre. Le nom du jeu est ajouté en code dans l'espace laissé libre en haut.",
        prompt=(
            f"{STYLE} Scène pleine page, SANS fond bleu. Façade d'un petit bistrot français vue de face, au crépuscule doré : "
            "grande vitrine chaleureuse, auvent à rayures rouges et crème, porte vitrée, deux petites tables de terrasse avec chaises, "
            "pots de fleurs, guirlande de petites ampoules chaudes. Au-dessus de la porte, une enseigne en bois VIDE (aucune lettre). "
            "Ciel pêche et doré (pas de bleu dominant). Laisse le tiers supérieur de l'image relativement calme et dégagé "
            "(un titre sera ajouté plus tard par-dessus). Format paysage 16:9."
        ),
    ),
    dict(
        id="bg_salle", file="bg_salle.png", ratio="16:9 (1920×1080)", prio="P1",
        usage="Écran de jeu principal (salle). Tables, chaises, clients et serveur sont ajoutés par-dessus en code.",
        prompt=(
            f"{STYLE} Scène pleine page, SANS fond bleu. Intérieur d'une GRANDE salle de bistrot français en PERSPECTIVE CENTRALE SYMÉTRIQUE "
            "(un seul point de fuite, au centre de l'image), caméra SURÉLEVÉE qui regarde légèrement vers le bas, comme une scène de théâtre vue du premier balcon : "
            "la ligne d'horizon est dans le tiers supérieur de l'image. On voit le mur du fond bien en face, et les DEUX murs latéraux (gauche ET droite) "
            "qui sont BAS et étroits, et qui sortent du cadre sur les bords de l'image. "
            "PROPORTIONS IMPORTANTES : le mur du fond occupe environ 70 % de la largeur de l'image mais seulement le tiers supérieur de sa hauteur ; "
            "chaque mur latéral occupe environ 15 % de la largeur ; le SOL occupe environ 60 % de la hauteur de l'image. "
            "La pièce est très large et très profonde, l'image n'est pas vue en biais. "
            "Pièce TOTALEMENT VIDE : aucune table, aucune chaise, aucune personne, aucun meuble au sol, aucune porte. "
            "Les trois murs ont le même style : partie basse en lambris de bois brun chaud, partie haute crème avec fines rayures verticales vert sapin. "
            "Le plafond n'est presque pas visible : seule une fine poutre en bois brun court en haut des trois murs, le haut des murs est coupé par le cadre. "
            "Mur du fond : deux grandes fenêtres arrondies avec stores rayés rouge et crème (ciel pêche doré derrière), placées dans sa moitié droite ; "
            "le quart gauche du mur du fond reste lisse, sans fenêtre ni applique (un guichet passe-plats y sera ajouté plus tard). "
            "Chaque mur latéral porte une fenêtre arrondie vue en perspective et une applique murale allumée en laiton. "
            "Sol : carrelage damier crème et rouge-brique en perspective DOUCE (carreaux assez grands, lisibles et réguliers, "
            "pas de fuite exagérée, environ 8 rangées de carreaux visibles en profondeur), le sol occupe environ 60 % de la hauteur de l'image, "
            "sur toute la largeur en bas de l'image, et reste entièrement dégagé "
            "(les tables seront posées au milieu, le serveur marchera devant). "
            "Pas de décoration accrochée au mur (ajoutée à part), pas de reflets sur le sol, pas de texte. Format paysage 16:9."
        ),
    ),
    dict(
        id="bg_cuisine", file="bg_cuisine.png", ratio="16:9 (1920×1080)", prio="P2",
        usage="Écran cuisine (phase 2). Les postes de travail sont ajoutés par-dessus en code.",
        prompt=(
            f"{STYLE} Scène pleine page, SANS fond bleu. Cuisine de restaurant vue de face, caméra frontale, pièce VIDE : "
            "aucun ustensile, aucune personne, aucun poste de travail, aucune casserole. "
            "Mur du fond en carreaux de faïence métro crème avec une bande de carreaux vert sapin à mi-hauteur. "
            "Grande ouverture murale sombre et chaude à gauche pour une porte (laissée vide), "
            "un carrelage de sol damier crème et brun, éclairage chaleureux. "
            "Garde libres : le haut du mur (pour une hotte et des casseroles ajoutées à part) et le tiers inférieur de l'image "
            "(les postes de travail y seront posés). Pas de texte. Format paysage 16:9."
        ),
    ),
]

# ----------------------------------------------------------------------------
# 2) PLANCHES D'OBJETS (fond bleu)
# ----------------------------------------------------------------------------
BG_SALLE_V4 = (
    f"{STYLE} Scène pleine page, SANS fond bleu. Décor 2D d'un jeu de gestion de restaurant (dans l'esprit des jeux mobiles type « Diner Dash »), "
    "vu de FACE, caméra légèrement surélevée, pièce TOTALEMENT VIDE (aucune table, chaise, personne, meuble ni porte). "
    "COMPOSITION EN DEUX ZONES, de haut en bas. "
    "ZONE 1, tout en haut : une bande étroite de mur du fond, qui ne fait qu'environ 25 % de la hauteur de l'image et occupe environ 75 % de la largeur ; "
    "papier peint crème à fines rayures verticales vert sapin sur TOUTE sa largeur (aucune zone lisse), bas du mur en lambris de bois brun, "
    "fine poutre en bois brun tout en haut, deux petites fenêtres arrondies avec stores rayés rouge et crème vues de face, "
    "placées côte à côte dans la moitié droite du mur, et une applique murale en laiton entre elles. Pas de plafond visible. "
    "ZONE 2, tout le reste : les TROIS QUARTS inférieurs de l'image sont un IMMENSE sol en damier crème et rouge-brique, "
    "avec une perspective douce (environ 8 rangées de grands carreaux lisibles en profondeur), qui remplit toute la largeur de l'image en bas. "
    "Les deux murs latéraux ne sont que deux FINES bandes en diagonale (lambris brun et papier rayé), qui partent des deux coins du mur du fond "
    "et sortent du cadre en bas à gauche et en bas à droite ; ils n'ont ni fenêtre ni lampe. "
    "Aucune décoration au sol, pas de reflets sur le sol, pas de texte. Format paysage 16:9."
)
BG_CUISINE_V2 = (
    f"{STYLE} Scène pleine page, SANS fond bleu. Décor 2D d'un jeu de gestion de restaurant (dans l'esprit des jeux mobiles type « Diner Dash »), "
    "vu de FACE, caméra légèrement surélevée, cuisine de restaurant TOTALEMENT VIDE (aucun ustensile, poste de travail, meuble ni personne, "
    "aucune porte et aucune ouverture sombre dans les murs). "
    "COMPOSITION EN DEUX ZONES, de haut en bas. "
    "ZONE 1, tout en haut : une bande étroite de mur du fond, qui ne fait qu'environ 30 % de la hauteur de l'image et occupe environ 80 % de la largeur ; "
    "carreaux de faïence « métro » crème avec joints bruns, une bande horizontale de carreaux vert sapin à mi-hauteur du mur, "
    "plinthe brune en bas du mur, fine poutre brune tout en haut. Pas de plafond visible. "
    "ZONE 2, tout le reste : les SEPT DIXIÈMES inférieurs de l'image sont un IMMENSE sol en damier crème et brun chocolat, "
    "avec une perspective douce (environ 8 rangées de grands carreaux lisibles en profondeur), qui remplit toute la largeur de l'image en bas. "
    "Les deux murs latéraux ne sont que deux FINES bandes en diagonale (carreaux métro crème avec la même bande verte), "
    "qui partent des deux coins du mur du fond et sortent du cadre en bas à gauche et en bas à droite ; ils n'ont ni fenêtre ni lampe. "
    "Éclairage chaud et doux, pas de reflets sur le sol, pas de texte. Format paysage 16:9."
)
for _b in BACKGROUNDS:
    if _b["id"] == "bg_salle":
        _b["prompt"] = BG_SALLE_V4
    elif _b["id"] == "bg_cuisine":
        _b["prompt"] = BG_CUISINE_V2

SHEETS = [
    dict(
        id="salle_mobilier", file="salle_mobilier.png", cols=2, rows=2, ratio="1:1 (2048×2048)", prio="P1",
        usage="Mobilier de la salle. table_nappe est répétée 6 fois (teinte variable en code).",
        items=[
            ("table_nappe", "Table ronde de bistrot vue de face, très légèrement en plongée. Nappe à carreaux vichy rouge et crème qui retombe sur les côtés. "
                            "Plateau en forme d'ellipse DÉGAGÉ au centre (rien dessus, car les plats y seront posés en code). "
                            "Sur le bord gauche du plateau seulement : petit vase avec une fleur jaune et une salière-poivrière. Aucun couvert."),
            ("chaise_dos", "Dossier de chaise de bistrot en bois courbé brun clair, vu de face, assez large pour dépasser de chaque côté d'un client assis. "
                           "Haut dossier arrondi avec petit coussin rouge. On voit uniquement le dossier et ses deux montants, pas l'assise, pas de pieds."),
            ("passe_plats", "Guichet passe-plats de cuisine vu de face : ouverture rectangulaire dans un mur de carreaux crème, cadre en bois brun, "
                            "comptoir en bois au premier plan avec un dessus plat bien visible où poser des assiettes, "
                            "lampe chauffante rouge suspendue au-dessus, intérieur de cuisine sombre et chaud (brun) derrière. Personne dedans."),
            ("plaque_numero", "Petit panneau ovale en bois clair avec liseré doré, complètement vierge (aucun chiffre), vu de face, "
                              "sur un petit pied discret. Un numéro de table y sera écrit en code."),
        ],
    ),
    dict(
        id="salle_deco", file="salle_deco.png", cols=2, rows=2, ratio="1:1 (2048×2048)", prio="P3",
        usage="Décor d'ambiance de la salle, posé en code sur le mur (cadres, plantes, lampes).",
        items=[
            ("plante_verte", "Grande plante verte (ficus) dans un pot en terre cuite orange, vue de face."),
            ("lampe_suspendue", "Lampe suspendue avec abat-jour vert sapin en forme de cloche, fil court en haut, ampoule chaude allumée visible dessous."),
            ("horloge_murale", "Horloge murale ronde, cadre en bois brun, cadran crème avec simples traits à la place des chiffres, aiguilles sur 10 h 10."),
            ("ardoise_menu", "Ardoise de menu noire avec cadre en bois clair, complètement vierge (aucun texte), avec un petit bout de craie blanche posé en bas."),
        ],
    ),
    dict(
        id="cuisine_deco", file="cuisine_deco.png", cols=2, rows=2, ratio="1:1 (2048×2048)", prio="P2",
        usage="Décor de la cuisine, posé en code sur le mur du fond.",
        items=[
            ("etagere_bocaux", "Étagère murale en bois à deux niveaux garnie de bocaux en verre remplis d'ingrédients colorés (pâtes jaunes, lentilles brunes, haricots rouges, herbes vertes). Aucun texte sur les bocaux."),
            ("casseroles_suspendues", "Barre horizontale en laiton avec quatre casseroles et deux louches en cuivre suspendues par des crochets."),
            ("hotte_inox", "Grande hotte de cuisine en inox gris chaud, vue de face, avec un petit voyant orange allumé."),
            ("porte_battante", "Porte de cuisine battante à double battant, en bois brun avec deux hublots ronds et des plaques de poussée en laiton, vue de face, fermée."),
        ],
    ),
    dict(
        id="postes", file="postes.png", cols=3, rows=2, ratio="3:2 (3072×2048)", prio="P2",
        usage="Postes de travail de la cuisine. Ligne 1 = au repos, ligne 2 = en action (alterner les deux images en code + particules de vapeur).",
        items=[
            ("marmite_repos", "Grosse marmite métallique avec couvercle fermé, posée sur un réchaud, flammes éteintes, vue de face légèrement en plongée."),
            ("plan_travail_repos", "Plan de travail en bois avec une planche à découper, un couteau posé à côté et un petit tas de légumes, vue de face légèrement en plongée."),
            ("plaque_repos", "Grande plaque à four rectangulaire en métal posée sur un support bas, vue de face légèrement en plongée, vide, propre."),
            ("marmite_actif", "EXACTEMENT la même marmite et le même réchaud que la case 1, mais couvercle légèrement soulevé, flammes vives dessous, bulles et petite vapeur qui s'échappe."),
            ("plan_travail_actif", "EXACTEMENT le même plan de travail que la case 2, mais couteau en l'air au-dessus de la planche, éclats de légumes qui sautent, petites étincelles de mouvement."),
            ("plaque_actif", "EXACTEMENT la même plaque que la case 3, mais chaude : lueur orange en dessous, petites étincelles et un peu de fumée, un morceau de nourriture qui grésille dessus."),
        ],
        note="Dans chaque colonne, les deux images (repos / action) doivent avoir exactement la même taille, la même position et la même perspective.",
    ),
    dict(
        id="plats", file="plats.png", cols=3, rows=2, ratio="3:2 (3072×2048)", prio="P1",
        usage="Plats servis. Superposés en code sur la table du client ou sur le plateau du serveur. Bord d'assiette = couleur du groupe verbal.",
        items=[
            ("assiette_vide", "Assiette ronde crème avec un liseré brun foncé, vue en ellipse (angle 3/4 plongeant), vide."),
            ("plat_g1_salade", "Même assiette que la case 1 mais avec un bord VERT sapin, contenant une belle salade composée (feuilles vertes, tomate, petit œuf)."),
            ("plat_g2_soupe", "Même assiette creuse que la case 1 mais avec un bord ORANGE, contenant une soupe de potiron orange crémeuse avec un filet de crème et un peu de vapeur."),
            ("plat_g3_ragout", "Même assiette que la case 1 mais avec un bord ROUGE tomate, contenant un ragoût de viande avec carottes et pommes de terre, un peu de vapeur."),
            ("plat_cloche", "Assiette avec une cloche de service argentée (gris chaud brillant) posée dessus, poignée sur le dessus, qui cache le plat."),
            ("plat_rate", "Même assiette que la case 1 avec un plat carbonisé noir fumant, petite fumée grise, léger air comique."),
        ],
        note="Les 6 assiettes doivent avoir la même taille et le même angle de vue, pour être interchangeables en code.",
    ),
    dict(
        id="briques", file="briques.png", cols=3, rows=2, ratio="3:2 (3072×2048)", prio="P2",
        usage="Briques « mots-ingrédients ». Le verbe est écrit en code dessus. Une couleur par groupe verbal.",
        items=[
            ("brique_g1_verte", "Étiquette-brique rectangulaire VERT vif, très allongée (rapport largeur/hauteur environ 3:1), bords arrondis, effet brillant en relief, petit rivet doré à chaque extrémité. TOTALEMENT VIERGE (aucun texte)."),
            ("brique_g2_orange", "Même brique, même taille exacte, mais ORANGE vif."),
            ("brique_g3_rouge", "Même brique, même taille exacte, mais ROUGE tomate."),
            ("brique_aux_violette", "Même brique, même taille exacte, mais VIOLET prune (verbes auxiliaires et irréguliers)."),
            ("brique_slot_vide", "Même forme et même taille exacte, mais emplacement vide : fond crème clair et bord en pointillés brun foncé, aucun relief, aucun rivet."),
        ],
        note="La case 6 reste vide. Les 5 briques doivent avoir exactement la même taille.",
    ),
    dict(
        id="ui", file="ui.png", cols=3, rows=2, ratio="3:2 (3072×2048)", prio="P1",
        usage="Éléments d'interface (bulles, tickets, cadres). Tout texte et tout chiffre est ajouté en code.",
        items=[
            ("bulle_commande", "Grande bulle de dialogue arrondie, crème, contour brun épais, avec une petite queue pointant vers le bas à gauche. Complètement vierge."),
            ("ticket_commande", "Ticket de commande en papier crème, bord supérieur dentelé en zigzag, petit trou rond centré en haut, quelques fines lignes pâles horizontales. Aucun texte. Format vertical."),
            ("rail_tickets", "Longue barre horizontale en laiton (rapport environ 6:1) avec petits crochets et clous aux extrémités, vue de face, pour accrocher des tickets."),
            ("panneau_bois", "Cadre rectangulaire en bois brun aux coins arrondis, bordure d'épaisseur uniforme, intérieur crème uni VIDE. Sert de cadre extensible."),
            ("cloche_service", "Petite cloche de comptoir dorée avec un bouton poussoir sur le dessus, vue de face."),
            ("carnet_commande", "Carnet à spirale ouvert avec un crayon posé en travers, pages vierges. Aucun texte."),
        ],
    ),
    dict(
        id="smileys", file="smileys.png", cols=3, rows=2, ratio="3:2 (3072×2048)", prio="P1",
        usage="Humeur des clients (6 niveaux de patience). Affichés au-dessus de la tête du client, avec un petit rebond en code.",
        items=[
            ("smiley_1_ravi", "Visage rond VERT vif, très grand sourire, yeux en forme de cœurs ou d'étoiles. Visage seulement, sans corps."),
            ("smiley_2_content", "Visage rond VERT-JAUNE, sourire doux, yeux ouverts, joues roses."),
            ("smiley_3_neutre", "Visage rond JAUNE, bouche en ligne droite, yeux normaux, regard attentif."),
            ("smiley_4_presse", "Visage rond ORANGE clair, bouche ondulée inquiète, une goutte de sueur sur le front, sourcils relevés."),
            ("smiley_5_mecontent", "Visage rond ORANGE-ROUGE, bouche tournée vers le bas, sourcils froncés."),
            ("smiley_6_furieux", "Visage rond ROUGE, sourcils très froncés, bouche grimaçante avec les dents, petits nuages de vapeur de chaque côté."),
        ],
        note="Les 6 visages ont la même taille et le même contour. Les émotions doivent se distinguer par les traits du visage, pas seulement par la couleur (accessibilité daltonisme).",
    ),
    dict(
        id="fx", file="fx.png", cols=3, rows=2, ratio="3:2 (3072×2048)", prio="P1",
        usage="Icônes de score et d'effets (récompenses, erreurs, temps).",
        items=[
            ("fx_piece", "Pièce de monnaie dorée brillante avec un liseré, sans symbole ni chiffre (juste une étoile en relief au centre)."),
            ("fx_etoile", "Étoile jaune brillante à cinq branches arrondies, avec petits éclats autour."),
            ("fx_coeur", "Cœur rouge brillant (vie), reflet blanc en haut à gauche."),
            ("fx_coche", "Grande coche verte épaisse (validation), contour brun."),
            ("fx_croix", "Grande croix rouge épaisse (erreur), contour brun."),
            ("fx_sablier", "Sablier en bois et verre avec du sable orange, vu de face (le verre est crème pâle, pas bleu)."),
        ],
    ),
]

# ----------------------------------------------------------------------------
# 3) PERSONNAGES
# ----------------------------------------------------------------------------
# La planche du mobilier de salle est déjà faite (extraite des images de Julie) : on la retire des générations restantes.
SHEETS = [s for s in SHEETS if s["id"] != "salle_mobilier"]

CLIENTS = [
    ("client_01_garcon", "P1", "garçon d'environ 10 ans, cheveux bruns courts en épis, grands yeux curieux, t-shirt orange moutarde à col rond"),
    ("client_02_papy", "P1", "grand-père à barbe grise fournie, lunettes rondes, crâne dégarni, veste vert sapin sur chemise crème, nœud papillon bordeaux"),
    ("client_03_bouclee", "P1", "jeune femme aux cheveux bruns très bouclés et volumineux, boucles d'oreilles dorées, pull rouge bordeaux"),
    ("client_04_blonde", "P1", "femme blonde aux cheveux mi-longs avec frange, serre-tête rose, chemisier rose pâle à col claudine"),
    ("client_05_mamie", "P2", "grand-mère aux cheveux gris argent en chignon, lunettes papillon, châle violet lilas sur robe crème, collier de perles"),
    ("client_06_moustachu", "P2", "homme costaud à grosse moustache brune, béret noir, chemise à carreaux jaune et rouge, bretelles brunes"),
    ("client_07_critique", "P3", "critique gastronomique élégant et hautain (sourcil levé), chapeau melon noir, monocle, nœud papillon rouge, costume gris anthracite. Personnage VIP à bonus"),
]

def client_prompt(slug, desc):
    return (
        f"{STYLE} {FOND} "
        f"PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre. "
        f"Personnage : {desc}. "
        "Il est assis, vu de face, cadré à la taille : on dessine la tête, le buste, les bras et les mains ; le corps est simplement coupé net "
        "par un bord horizontal à hauteur de la taille (le bas sera caché derrière une table dans le jeu). "
        "Pose GAUCHE « attente » : les mains jointes ou posées l'une sur l'autre devant le ventre, regard vers le spectateur, expression calme, bouche fermée. "
        "Pose DROITE « appel » : le bras droit (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, "
        "l'autre main posée devant le ventre, bouche légèrement ouverte. "
        "TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position de la tête dans la case "
        "(même hauteur, même centre) sont STRICTEMENT identiques ; seuls les bras changent. "
        "Le bord du bas est parfaitement plat et horizontal, sans ombre, sans bout de table ni de chaise dessiné. "
        "Le buste (bras compris, en pose « attente ») reste compact : pas plus large que 1,4 fois la hauteur de la tête et demie ; "
        "en pose « appel », seul le bras levé dépasse sur le côté. "
        "L'humeur n'est pas dessinée dans le visage (expression neutre) : elle sera ajoutée par un smiley en code. "
        "Format paysage 2:1 (ou 16:9 à défaut), un personnage par moitié."
    )

SERVEUR_DESC = (
    "jeune serveur de bistrot français : cheveux bruns avec petite mèche, fine moustache, nœud papillon rouge, chemise blanche aux manches retroussées, "
    "gilet noir, long tablier blanc de bistrot qui descend aux chevilles, pantalon noir, chaussures noires cirées. "
    "Il porte sur sa main levée, à hauteur d'épaule, un plateau rond argenté (gris chaud) VIDE, tenu à plat à l'horizontale."
)

SERVEUR_MARCHE = (
    f"{STYLE} {FOND} "
    "PLANCHE D'ANIMATION : cycle de marche en 6 images du MÊME personnage, grille de 3 colonnes × 2 lignes, une image par case, "
    f"séparées par de larges marges bleues. Personnage : {SERVEUR_DESC} "
    "Il est vu de PROFIL, marchant vers la DROITE de l'image, corps entier visible de la tête aux pieds. "
    "Ordre de lecture gauche→droite puis haut→bas. "
    "Image 1 CONTACT : jambes écartées, le pied avant pose le talon au sol, le bras libre balancé vers l'arrière. "
    "Image 2 DESCENTE : corps au plus bas, jambe avant fléchie. "
    "Image 3 PASSAGE : la jambe arrière est ramenée à hauteur de la jambe d'appui, corps un peu plus haut. "
    "Image 4 CONTACT inversé : c'est l'autre jambe qui est devant, le bras libre balancé vers l'avant. "
    "Image 5 DESCENTE inversée. "
    "Image 6 PASSAGE inversé. "
    "CONTRAINTES : même taille de personnage dans les 6 cases, les pieds sont toujours sur la même ligne horizontale imaginaire (ligne de sol), "
    "le plateau reste EXACTEMENT à la même hauteur et au même endroit devant lui dans les 6 images (un plat y sera superposé en code), "
    "le visage, les vêtements et les couleurs sont identiques dans toutes les images. Aucun sol ni ombre dessinés."
)

SERVEUR_POSES = (
    f"{STYLE} {FOND} "
    "PLANCHE DE 4 POSES du MÊME personnage, grille de 2 colonnes × 2 lignes, corps entier, séparées par de larges marges bleues, "
    "même taille et mêmes vêtements que dans la planche de marche. "
    f"Personnage : {SERVEUR_DESC} "
    "Case 1 « serveur_idle » : debout, vu de face légèrement de trois quarts, sourire aimable, plateau vide à hauteur d'épaule sur la main levée. "
    "Case 2 « serveur_depose » : vu de PROFIL vers la droite, légèrement penché en avant, bras tendu vers l'avant avec le plateau à hauteur de la taille, "
    "comme pour déposer une assiette sur une table. "
    "Case 3 « serveur_content » : de trois quarts, clin d'œil, pouce levé de la main libre, plateau tenu de l'autre main. "
    "Case 4 « serveur_oups » : de face, haussement d'épaules, mains ouvertes, expression gênée avec une goutte de sueur, plateau posé sur une main. "
    "Aucun sol ni ombre dessinés."
)

CHEF = (
    f"{STYLE} {FOND} "
    "PLANCHE DE 4 POSES du MÊME personnage, grille de 2 colonnes × 2 lignes, cadré à la taille (buste et bras), séparées par de larges marges bleues. "
    "Personnage : chef cuisinier rondouillard et jovial, grande toque blanche, moustache grise à la française, veste blanche à double boutonnage, "
    "foulard rouge autour du cou. "
    "Case 1 « chef_neutre » : bras le long du corps, sourire aimable. "
    "Case 2 « chef_explique » : un doigt levé, bouche ouverte, comme pour expliquer une règle. "
    "Case 3 « chef_bravo » : grand sourire, pouce levé. "
    "Case 4 « chef_fache » : bras croisés, sourcils froncés, bouche en moue (fâché mais drôle, pas effrayant). "
    "Même taille, même visage et mêmes vêtements dans les 4 cases."
)

# ----------------------------------------------------------------------------
# Assemblage
# ----------------------------------------------------------------------------
def sheet_prompt(s):
    n = len(s["items"])
    lines = [f"{STYLE} {FOND} {planche(s['cols'], s['rows'], n)}"]
    for i, (name, desc) in enumerate(s["items"], 1):
        lines.append(f"Case {i} « {name} » : {desc}")
    if s.get("note"):
        lines.append("IMPORTANT : " + s["note"])
    return "\n".join(lines)

manifest = {"chroma_key": "#0000FF", "backgrounds": [], "sheets": [], "characters": []}
md = []

# -- Architecture ------------------------------------------------------------
md.append("""# Jeu de commande — Architecture des assets et prompts

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

""")

# computed counts
n_bg = len(BACKGROUNDS)
n_sheet_items = sum(len(s["items"]) for s in SHEETS)
n_clients = len(CLIENTS) * 2
n_serv = 6 + 4
n_chef = 4
total_final = n_bg + n_sheet_items + n_clients + n_serv + n_chef
total_gen = n_bg + len(SHEETS) + len(CLIENTS) + 2 + 1
md.append(f"- **{total_gen} images à générer** (décors, planches et planches de personnages), qui donnent environ **{total_final} sprites** une fois découpés.")
md.append(f"- Priorité **P1** = salle jouable avec le 1er groupe. **P2** = cuisine et phase de fabrication. **P3** = finitions (titre, déco, client VIP).")
md.append("- **Déjà faits et intégrés** : `bg_salle`, `bg_cuisine`, mobilier de salle (6 tables de couleur, chaise, passe-plats, plaque de numéro). La nappe bleue est exclue (confondue avec le fond bleu) et remplacée par une nappe rose.\n")

md.append("""## 5. Technique : fond bleu, découpe, noms

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

""")

# order list
order = []
for b in BACKGROUNDS:
    order.append((b["prio"], b["file"]))
for s in SHEETS:
    order.append((s["prio"], s["file"]))
for slug, prio, _ in CLIENTS:
    order.append((prio, slug + ".png"))
order += [("P1", "serveur_marche.png"), ("P1", "serveur_poses.png"), ("P2", "chef.png")]
for p in ("P1", "P2", "P3"):
    names = ", ".join(f"`{f}`" for q, f in order if q == p)
    md.append(f"- **{p}** : {names}")
md.append("\n---\n\n# PROMPTS\n")

# -- Backgrounds -------------------------------------------------------------
md.append("## A. Décors pleine scène (pas de fond bleu)\n")
for b in BACKGROUNDS:
    md.append(f"### `{b['file']}` — {b['prio']} — {b['ratio']}\n")
    md.append(f"*Utilisation :* {b['usage']}\n")
    md.append("```\n" + b["prompt"] + "\n```\n")
    manifest["backgrounds"].append(dict(id=b["id"], file=b["file"], prio=b["prio"]))

# -- Sheets ------------------------------------------------------------------
md.append("## B. Planches d'objets (fond bleu)\n")
for s in SHEETS:
    md.append(f"### `{s['file']}` — {s['prio']} — {s['ratio']} — grille {s['cols']}×{s['rows']}\n")
    md.append(f"*Utilisation :* {s['usage']}\n")
    md.append("*Contenu (ordre de lecture) :* " + ", ".join(f"`{n}`" for n, _ in s["items"]) + "\n")
    md.append("```\n" + sheet_prompt(s) + "\n```\n")
    manifest["sheets"].append(dict(id=s["id"], file=s["file"], cols=s["cols"], rows=s["rows"],
                                   prio=s["prio"], items=[n for n, _ in s["items"]]))

# -- Characters --------------------------------------------------------------
md.append("## C. Personnages (fond bleu)\n")
md.append("### C1. Clients (2 poses par client, 1 image par client)\n")
md.append("Chaque image contient 2 poses : **gauche = `attente`**, **droite = `appel`**. Après découpe : `<nom>_attente.png` et `<nom>_appel.png`.\n")
for slug, prio, desc in CLIENTS:
    md.append(f"#### `{slug}.png` — {prio} — format 2:1 ou 16:9\n")
    md.append("```\n" + client_prompt(slug, desc) + "\n```\n")
    manifest["characters"].append(dict(id=slug, file=slug + ".png", kind="client", prio=prio,
                                       layout="2 colonnes", poses=["attente", "appel"]))

md.append("### C2. Serveur\n")
md.append("#### `serveur_marche.png` — P1 — format 3:2 — grille 3×2\n")
md.append("Après découpe : `serveur_marche_1.png` … `serveur_marche_6.png` (cycle en boucle ; miroir pour la gauche).\n")
md.append("```\n" + SERVEUR_MARCHE + "\n```\n")
manifest["characters"].append(dict(id="serveur_marche", file="serveur_marche.png", kind="serveur", prio="P1",
                                   cols=3, rows=2, poses=[f"serveur_marche_{i}" for i in range(1, 7)]))
md.append("#### `serveur_poses.png` — P1 — format 1:1 — grille 2×2\n")
md.append("Après découpe : `serveur_idle`, `serveur_depose`, `serveur_content`, `serveur_oups`.\n")
md.append("```\n" + SERVEUR_POSES + "\n```\n")
manifest["characters"].append(dict(id="serveur_poses", file="serveur_poses.png", kind="serveur", prio="P1",
                                   cols=2, rows=2, poses=["serveur_idle", "serveur_depose", "serveur_content", "serveur_oups"]))

md.append("### C3. Chef-conseiller\n")
md.append("#### `chef.png` — P2 — format 1:1 — grille 2×2\n")
md.append("Après découpe : `chef_neutre`, `chef_explique`, `chef_bravo`, `chef_fache`.\n")
md.append("```\n" + CHEF + "\n```\n")
manifest["characters"].append(dict(id="chef", file="chef.png", kind="chef", prio="P2",
                                   cols=2, rows=2, poses=["chef_neutre", "chef_explique", "chef_bravo", "chef_fache"]))

with open(os.path.join(OUT, "PROMPTS_ASSETS.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(md) + "\n")
with open(os.path.join(OUT, "assets_manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("generations:", total_gen, "sprites:", total_final)
