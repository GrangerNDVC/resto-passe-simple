"""Génère docs/PROMPTS_7F.md : un prompt COMPLET (copier-coller direct) par image à générer.
Usage : python3 -I tools/build_prompts_7f.py docs/PROMPTS_7F.md"""
import sys

STYLE = ("Illustration de jeu vidéo 2D, style cartoon vectoriel à plat avec légers dégradés doux, gros contours brun foncé réguliers "
         "(épaisseur constante), formes arrondies et sympathiques, ambiance bistrot français rétro années 50 propre et moderne : "
         "PAS de pixel art, PAS de texture vieillie, PAS de sépia. Aucun texte, aucune lettre, aucun chiffre dans l'image. "
         "Aucune couleur bleue, cyan ou turquoise dans l'objet ni dans les vêtements.")
FOND = ("FOND : aplat bleu pur #0000FF parfaitement uniforme sur toute l'image, sans dégradé, sans ombre portée, sans sol, sans mur, "
        "sans reflet, sans bordure ; le bleu ne déborde jamais sur l'objet (aucun halo bleu sur les contours).")
ZONES = ("COULEURS EN APLATS POUR RECOLORATION PAR LE JEU : la peau est UN SEUL aplat #E0A878 avec UN SEUL ton d'ombre #C48A5E "
         "(pas de joues roses, pas de dégradé de peau). Les cheveux, la barbe, la moustache et les sourcils sont UN SEUL aplat #8A5A3C "
         "avec UNE ombre #6A4228. Le vêtement principal (le plus grand vêtement visible) est UN SEUL aplat #D9473B avec UNE ombre #B03528. "
         "Tous les autres éléments (chemise, nœud, bijoux, lunettes, chapeau, écharpe, foulard) utilisent des couleurs franchement "
         "différentes de ces trois-là. Bouche et yeux brun foncé, blanc des yeux crème.")
POSES = ("PLANCHE DE 2 POSES DU MÊME PERSONNAGE, côte à côte, séparées par une large bande bleue au centre (image paysage 2:1, un personnage par moitié). "
         "Il est assis, vu de face, cadré à la taille : tête, buste, bras et mains ; le corps est coupé net par un bord horizontal "
         "parfaitement plat à hauteur de la taille (sans ombre, sans table ni chaise dessinée). "
         "Pose GAUCHE « attente » : mains jointes devant le ventre, regard vers le spectateur, expression calme, bouche fermée. "
         "Pose DROITE « appel » : le bras droit du personnage (côté gauche de l'image) levé bien haut, main ouverte, comme pour appeler le serveur, "
         "l'autre main devant le ventre, bouche légèrement ouverte. "
         "TRÈS IMPORTANT : dans les deux poses, la tête, le visage, les vêtements, la taille et la position dans la case sont STRICTEMENT identiques ; "
         "seuls les bras changent. Expression neutre (l'humeur sera ajoutée en code). "
         "ÉCHELLE : tête haute d'environ 1/5 de la hauteur de la case, buste compact en pose « attente » (pas plus de 3 têtes de large).")
OBJ = ("OBJET SEUL centré, vu de FACE (aucune vue de dessus), entièrement visible avec une marge bleue d'environ 10 % autour, "
       "sans mur, sans sol, sans ombre portée.")
COULEUR = ("ZONE RECOLORABLE : la partie indiquée « COULEUR » est UN SEUL aplat #D9473B avec UNE ombre #B03528 (pas de dégradé) ; "
           "tout le reste utilise d'autres couleurs (bois brun, métal gris, crème, doré).")

P = []  # (fichier, titre, texte)

def client(slug, titre, desc, enfant=False):
    ech = (" ÉCHELLE : c'est un enfant, tête proportionnellement grosse, corps petit." if enfant else "")
    P.append((slug, titre, f"{STYLE} {FOND} {ZONES} {POSES} PERSONNAGE : {desc}"))

# --- Clients ---
client("client_08_afro", "Lot A — resto 1", "jeune homme d'une vingtaine d'années, cheveux crépus courts et arrondis, sourire franc, sweat à capuche (c'est le VÊTEMENT PRINCIPAL), petit écouteur filaire gris autour du cou.")
client("client_09_tresses", "Lot A — resto 1", "femme d'une trentaine d'années aux longues tresses tombant sur les épaules, boucles d'oreilles dorées, robe-chasuble sans manches (VÊTEMENT PRINCIPAL) sur un t-shirt crème à manches longues.")
client("client_10_costume", "Lot B — resto 2 (brasserie)", "homme d'affaires pressé, cheveux courts bien coiffés, petites lunettes rectangulaires, veste de costume (VÊTEMENT PRINCIPAL) sur chemise blanche, cravate jaune moutarde.")
client("client_11_foulard", "Lot B — resto 2 (brasserie)", "femme élégante portant un foulard noué sur la tête (le foulard est de couleur vert sapin, ce n'est PAS la zone cheveux ; aucun cheveu visible), visage ovale, lunettes de soleil relevées sur le foulard, manteau court (VÊTEMENT PRINCIPAL).")
client("client_12_artiste", "Lot B — resto 2 (brasserie)", "artiste décontracté, cheveux longs en chignon désordonné, barbe de trois jours, béret orange, écharpe à rayures crème et violettes, blouse de peintre (VÊTEMENT PRINCIPAL).")
client("client_13_soiree", "Lot C — resto 3 (grand restaurant)", "femme en robe de soirée à fines bretelles (VÊTEMENT PRINCIPAL), cheveux relevés en chignon haut, collier de perles, longs gants crème.")
client("client_14_smoking", "Lot C — resto 3 (grand restaurant)", "homme distingué, cheveux gominés plaqués sur le côté, fine moustache, smoking (la veste est le VÊTEMENT PRINCIPAL), chemise blanche, nœud papillon noir, œillet blanc à la boutonnière.")
client("client_15_tailleur", "Lot C — resto 3 (grand restaurant)", "femme âgée au port altier, cheveux courts bouclés, lunettes à chaîne dorée, tailleur (VÊTEMENT PRINCIPAL), broche dorée, sac à main crème dont seul le haut dépasse sur les genoux.")
client("client_16_diva", "Lot D — resto 4 (Palace)", "star de cinéma, cheveux ondulés mi-longs années 50, grandes lunettes papillon, grand chapeau à large bord vert sapin, étole de fourrure crème sur une robe (VÊTEMENT PRINCIPAL).")
client("client_17_ambassadeur", "Lot D — resto 4 (Palace)", "homme mûr à l'air solennel, cheveux grisonnants (dessinés en aplat cheveux) et grosse barbe taillée, habit à col montant brodé d'or (VÊTEMENT PRINCIPAL), médaille dorée sur la poitrine.")
client("client_18_heritiere", "Lot D — resto 4 (Palace)", "jeune femme excentrique, cheveux courts en carré avec grande mèche, diadème doré, boa de plumes rose pâle, haut à épaulettes (VÊTEMENT PRINCIPAL).")

# --- Tables et chaises ---
def table(slug, titre, desc):
    P.append((slug, titre, f"{STYLE} {FOND} UNE SEULE table de restaurant, vue de FACE, très légèrement en plongée, centrée, entièrement visible avec une marge bleue de 8 %, "
              f"format portrait environ 5:7 (largeur : hauteur). Forme générale identique à une table ronde à nappe qui retombe sur les côtés, sans plaque ni numéro, sans chaise, sans personne. "
              f"La NAPPE est d'un blanc crème très clair (#F6E9CF) avec des ombres gris chaud doux (le jeu la teintera de la couleur de la table : la base doit rester claire et unie, hors motifs indiqués). {desc}"))
table("table_brasserie", "Table resto 2 (brasserie)", "Plateau rond en bois verni visible sur le dessus, nappe courte avec un liseré vert sapin en bas, petite carafe d'eau et deux verres (verre crème pâle, jamais bleu) posés au centre, pied en fonte noire visible sous la nappe.")
table("table_gala", "Table resto 3 (grand restaurant)", "Nappe blanche damassée tombant jusqu'au sol, frange dorée en bas, un chandelier à trois bougies (flammes jaune moutarde) et deux couverts avec serviettes pliées en éventail sur le dessus.")
table("table_palace", "Table resto 4 (Palace)", "Nappe brodée tombant en plis jusqu'au sol, chemin de table à motifs dorés, bouquet de roses roses dans un vase doré, deux petits chandeliers dorés, couverts dorés.")

def chaise(slug, titre, desc):
    P.append((slug, titre, f"{STYLE} {FOND} {OBJ} UNE SEULE chaise vue de FACE, comme derrière un client assis : on voit uniquement le dossier et ses deux montants, "
              f"large (il doit dépasser de chaque côté d'un client assis), sans assise ni pieds visibles. {desc}"))
chaise("chaise_brasserie", "Chaise resto 2 (brasserie)", "Dossier en bois courbé brun foncé de bistrot, deux montants arrondis, petit empiècement canné au centre.")
chaise("chaise_gala", "Chaise resto 3 (grand restaurant)", "Haut dossier capitonné en tissu crème, montants en bois brun foncé avec petits embouts dorés.")
chaise("chaise_palace", "Chaise resto 4 (Palace)", "Dossier ovale en bois doré sculpté, capiton crème, couronne de petites volutes en haut.")

# --- Mobilier à acheter (un prompt par objet) ---
def objet(slug, titre, desc, coul=True, taille=""):
    P.append((slug, titre, f"{STYLE} {FOND} {OBJ} {(COULEUR + ' ') if coul else ''}{desc} {taille}".strip()))
objet("deco_cadre_fleurs", "Objet mural", "Un tableau de bouquet de fleurs (tulipes jaunes et roses dans un vase crème) dans un cadre en bois épais. COULEUR = le cadre. Format paysage environ 4:3, comparable à l'horloge actuelle.")
objet("deco_miroir", "Objet mural", "Grand miroir ovale posé à la verticale, cadre doré sculpté, verre crème pâle avec un reflet blanc en diagonale (jamais bleu). Pas de zone COULEUR (le cadre reste doré).", coul=False)
objet("deco_tete_cerf", "Objet mural", "Trophée de tête de cerf stylisé, bois du cerf à six pointes, fixé sur un petit écusson de bois. Pas de zone COULEUR : tout en bruns chauds.", coul=False)
objet("deco_applique", "Objet mural", "Applique murale à bras en laiton et abat-jour en tissu, ampoule allumée (lueur jaune pâle). COULEUR = l'abat-jour.")
objet("deco_lustre", "Objet mural (resto 3 et 4)", "Lustre à pampilles suspendu, structure dorée à six bras avec bougies-ampoules allumées, pendeloques en cristal crème et jaune pâle (jamais bleues), petite chaîne dorée en haut. Pas de zone COULEUR.", coul=False)
objet("deco_rideaux", "Objet mural", "Paire de rideaux ouverts retenus par des embrasses dorées, avec une tringle en bois et un petit lambrequin au sommet. COULEUR = le tissu des rideaux. Format portrait étroit, haut d'environ 1,6 fois sa largeur.")
objet("deco_plante_haute", "Objet au sol", "Grand ficus feuillu (feuilles vert sapin) dans un grand pot rond. COULEUR = le pot. Format portrait, haut d'environ 2 fois sa largeur.")
objet("deco_portemanteau", "Objet au sol", "Portemanteau à pied en bois tourné, avec trois crochets chargés d'un manteau et d'un chapeau melon. COULEUR = le manteau. Format portrait haut et étroit.")
objet("deco_vitrine", "Objet au sol", "Petit meuble vitrine à tartes : caisson en bois brun avec vitre en façade (verre crème pâle, jamais bleu) montrant deux étagères de tartes aux fruits. Pas de zone COULEUR.", coul=False)
objet("deco_comptoir_gateaux", "Objet au sol", "Présentoir à gâteaux sur pied haut, plateau rond surmonté d'une cloche en verre crème pâle (jamais bleue) abritant trois gâteaux colorés. COULEUR = le pied et le plateau.")
objet("deco_statue", "Objet au sol (resto 3 et 4)", "Buste de marbre crème d'une dame à chignon posé sur une colonne cannelée de marbre crème. Pas de zone COULEUR (tout en crème et gris chaud), format portrait.", coul=False)
objet("deco_piano", "Objet au sol (resto 4)", "Piano à queue noir laqué vu de face, couvercle relevé, petit tabouret, touches crème. Pas de zone COULEUR. Format paysage, environ 2 fois plus large que haut.", coul=False)
objet("deco_tapis_rond", "Tapis", "Tapis rond vu en légère plongée, donc ovale très aplati (environ 3 fois plus large que haut), bordure crème, motif de cercles concentriques. COULEUR = le fond du tapis.")
objet("deco_tapis_rayures", "Tapis", "Tapis rectangulaire à larges rayures, vu en légère plongée (trapèze très aplati, environ 3 fois plus large que haut), franges crème aux deux bouts. COULEUR = les rayures principales ; l'autre rayure est crème.")
objet("deco_tapis_persan", "Tapis (resto 3 et 4)", "Tapis d'orient rectangulaire à motifs géométriques sans lettres, vu en légère plongée (très aplati, environ 3 fois plus large que haut), franges crème. COULEUR = le fond du tapis ; motifs crème et brun.")

# --- Passe-plats ---
P.append(("passe_plats", "Guichet de la cuisine (remplace l'actuel)", f"{STYLE} {FOND} OBJET : un guichet passe-plats de cuisine, vu strictement de FACE (aucune perspective, aucune vue de dessus). "
  "C'est une ouverture rectangulaire CREUSÉE DANS UN MUR : cadre en bois brun foncé d'épaisseur régulière et assez fine, coins légèrement arrondis. "
  "À l'intérieur, la cuisine est sombre et chaude (brun chocolat, lueur orangée au fond, ombre plus foncée sur le haut et les côtés de l'ouverture pour montrer l'épaisseur du mur). Personne dans la cuisine. "
  "Le rebord du bas est une FINE tablette de bois clair qui dépasse à peine du cadre (hauteur visible environ 1/12 de la hauteur de l'ouverture), dessus plat d'un seul ton clair, rien posé dessus. "
  "Aucune boîte, aucun comptoir profond, aucun pied, aucun meuble sous le guichet, aucun carreau autour. "
  "Au-dessus de l'ouverture, une petite lampe chauffante rouge tomate à abat-jour, suspendue à un support fixé au cadre, qui éclaire d'une lueur jaune pâle le rebord. "
  "PROPORTIONS : ouverture environ 1,6 fois plus large que haute, objet entier cadré avec une marge bleue de 8 %, centré."))

INTRO = """# Prompts 7f — un prompt complet par image (copier-coller direct)

Chaque bloc ci-dessous est **autonome** : tu copies tout le contenu du cadre, sans rien assembler. Le **nom du fichier** est en titre de chaque section : donne-le à l'image que tu m'envoies (ou dis-moi simplement « c'est le prompt n° X »).
Ordre conseillé : `client_08_afro`, `client_09_tresses`, `table_brasserie`, `chaise_brasserie`, `passe_plats`, `client_10` à `12`, puis objets, puis lots C et D.

**Les clients sont des « patrons » recolorables** : le jeu change en code la peau, les cheveux et le vêtement principal (6 teintes de peau × ~8 cheveux × ~8 vêtements). C'est pour cela que ces trois zones sont demandées en aplats de couleurs de référence : si une IA ne les respecte pas (cheveux de la couleur de la peau, vêtement à deux tons), régénère l'image ou garde le client tel quel, sans recoloration. Les anciens clients restent, tirés moins souvent aux restos 2 à 4.
Les objets avec une « zone COULEUR » seront recolorés de la même façon (cadre, pot, abat-jour…).

Sortie : client = `<nom>_attente.png` et `<nom>_appel.png` (je découpe la planche) ; tables, chaises, objets, passe-plats = un fichier `<nom>.png`.

---
"""
out = INTRO
for i, (slug, titre, txt) in enumerate(P, 1):
    out += f"\n## {i}. `{slug}` — {titre}\n\n```\n{txt}\n```\n"
open(sys.argv[1], "w", encoding="utf-8").write(out)
print(len(P), "prompts")
