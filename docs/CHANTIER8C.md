# Chantier 8C — relecture visuelle, satisfaction (suite), équilibrage (25/10/2026)

Tests : `test_jeu` 172, `test_cuisine` 34, `test_8a` 11, `test_mobile` 42, `test_8b` 23, `test_8c` 19 (dépôt complet). Outils : `tools/capture_*_8c.py` (captures), `tools/equilibrage_8c.py` (robot qui joue chaque resto et chiffre le coût de l'équipement).
**Limite de ce chantier** : les 38 images d'objets des lots précédents (tableaux, miroirs, lustres, rideaux, plantes, tapis, vitrine, présentoir, portemanteau, trophée de cerf) n'étaient pas dans les envois. Le moteur a été vérifié avec des images provisoires (rectangles colorés, jamais livrées) : la géométrie est testée, mais **l'œil n'a pas jugé le rendu réel** de ces objets.

## Étape 1 — relecture visuelle
- **Meubles qui flottaient** : ils posaient leurs pieds à y = 520 alors que le sol est à 545 (brasserie), 618 (grand resto), 636 (Palace) ; `SALLES[i].sol`, mesuré sur les fonds. Une table devant un meuble peut maintenant en cacher le pied (45 % au plus, 70 % en dernier recours) ; le moteur choisit l'emplacement le moins caché. Village inchangé (482, meubles posés dans la salle).
- **Tableaux** : zone d'accrochage agrandie vers le bas (jusqu'aux lambris : `mur.y1` 415 / 490 / 490), essais du haut vers le bas, pas de 15 px entre deux emplacements, et 20 px de marge (`MARGE_MUR`) autour du rail, de la porte et du passe-plats.
- **Rideaux** : nouvelle zone `fenetre`. Un rideau est posé sur chaque vraie fenêtre de la salle (`SALLES[i].fenetres`), centré dessus, et ne gêne plus les autres objets.
- **Passe-plats** : celui du village est juste. Les deux versions « crème » et le Palace avaient les assiettes un peu au-dessus du rebord : `PASSES[..].plat.y` 566 → 584 (crème), 592 → 586 (palace).
- **Clients** : `CLIENT_W` 200 → 180 (−10 %). Correction d'un défaut vu sur les captures : le sablier et le smiley de deux tables voisines se chevauchaient quand leurs deux côtés se faisaient face ; `coteIndic` bascule l'un des deux de l'autre côté.
- **Atelier sur petit écran** : défaut réel, la liste (6 lignes visibles) ne défilait qu'au clavier. Ajouts : boutons ▲ ▼ (et compteur « 1–6 sur 15 » plus gros), glissement du doigt, molette ; sur écran tactile, **1er toucher = aperçu, 2e = achat** (avant, un toucher achetait directement). Vérifié à 667×375 et 844×390.

## Étape 2 — satisfaction (paramètres dans `BAL`)
- **Changement de couleur** : `decoClientsCouleur` = 4 clients charmés (objet ou table : `decoClients` = 12).
- **Lassitude** : `lassitude(objet, resto)` = max(`lassitudeMin`, 1 − `lassitudeAncien` × écart de resto) ; elle réduit le nombre de clients charmés à l'achat et le poids de l'objet dans `satisfactionDeco`. *Inactive aujourd'hui* : depuis le 8B chaque objet n'est vendu que dans son resto (écart toujours nul). Elle s'applique dès qu'on vendra des objets des restos précédents.
- **Clients snobs** (mode difficile seulement, jamais VIP) : `snobPart` [0, 8 %, 15 %, 25 %], patience × `snobPatience` 0,85 ; décor ≥ `snobSeuil` 60 % d'un bel équipement → patience × (1 + 0,6 × satisfaction) et « Voilà un cadre digne de moi. » + cœur ; décor plus modeste → patience × `snobDeception` 0,8 et « Hmm… bien modeste, tout ceci. ». Étiquette « Snob » au-dessus du client.

## Étape 3 — équilibrage
Mesures du robot (élève moyen 70 %, 5 s, une partie ≈ 6 min) : ≈ 400 / 620 / 850 / 1 230 pièces par service au village / brasserie / grand resto / Palace (+ ≈ 70 à 215 de bonus cuisine en difficile) ; 1 achat dès 0,2 service. Avant : équiper à fond le Palace demandait ≈ 77 services (91 560 pièces), la brasserie ≈ 19, le grand resto ≈ 42 (les prix de chaque catalogue montaient déjà, puis étaient encore multipliés par `PRIX_RESTO`).
- Objets et tables : **prix affichés = prix payés** (× 0,8 / 0,45 / 0,38 / 0,385 appliqués une fois pour toutes aux anciens prix). Prix des objets : 100–240 / 100–260 / 130–490 / 200–850.
- Papiers et nappes (les mêmes partout) : × `PRIX_RESTO` = [1, 1,6, 2,4, 3,6] (avant [1, 2, 3,5, 6]) : papier 100 / 160 / 240 / 360. Prix du village inchangés.
- `DECO_REF` (bel équipement) = [1000, 1500, 2000, 3200].
- Résultat : tout équiper (objets qui tiennent, plus belle table, un papier, une nappe) ≈ **4,5 / 5 / 5,5 / 6 services** d'un élève moyen. Le robot « en difficulté » (50 %, 8 s) perd en 1 minute : il ne mesure rien d'utile ; à vérifier avec de vrais élèves.
- À vérifier en classe : (1) pièces gagnées par service, (2) nombre d'objets qui tiennent réellement avec les vraies images, (3) si 5-6 services par resto est le bon rythme.

## Correctif : recoloration vers le clair (retour de Julie)

**Problème** : la recoloration marchait vers plus foncé (peau, cheveux) mais pas vers plus clair — le résultat virait au gris délavé.

**Cause** : l'ancien calque multipliait la couleur cible par le gris du sprite, qui ne peut qu'assombrir. Une cible claire ne pouvait donc jamais être atteinte.

**Nouvel algorithme** (`recolorer`, par calque peau / cheveux / vêtement), sans `getImageData` (le canvas est « sali » sur `file://`) :
1. dessiner le sprite, puis le désaturer (mode `saturation` avec un gris neutre) ;
2. ajouter le calque de gris en mode `lighter` pour **éclaircir** jusqu'à la valeur de référence du calque : `TEINTE_REF = { skin: 0.7, hair: 0.3, shirt: 0.4 }` ;
3. multiplier par la couleur cible (`multiply`) ;
4. découper avec le masque d'origine (`destination-in`) pour garder contours et transparence.

**Test** (`tools/test_8c.py`) : 4 cibles (clair `#f0e6d2`, doré `#e8b33f`, rose `#c76b8f`, sombre `#2f2f3a`) — on compte les pixels exactement à la couleur cible sur un aperçu du sprite.

**Limite connue** : sur des peaux très foncées, les contours paraissent un peu durs.

## Correctif 2 : teintes de cheveux trop claires

Avec un gris clair (`#cfc9bd`), la recoloration éclaircit aussi les contours et les yeux, qui sont dans le même calque : le rendu est faux. Le blond `#c9a24a` donnait le même défaut, en plus discret (yeux jaune-olive).
- gris clair `#cfc9bd` **retiré** de `TEINTES.hair` ;
- blond `#c9a24a` remplacé par `#b8893a` (le plus clair qui garde yeux et contours propres), dans `TEINTES.hair` et dans la liste `looks` ;
- à partir du gris moyen (`#8e8e8e`), tout va bien.
**Règle pour les futures teintes de cheveux** : rester à peu près au niveau de `#b8893a` ou plus foncé.

## Images reçues (lots 4 et 5)
Les 38 images d'objets manquantes sont intégrées (`assets/salle/`), détourées par `tools/detourer_8c_lot4.py` (tableaux, lustres, miroirs) et `tools/detourer_8c_lot5.py` (plantes, tapis, porte-manteau, rideaux, vitrine, présentoir, tête de cerf). Plus aucune image absente ; toutes les suites passent sans contrôle ignoré (172 / 33 / 11 / 42 / 23 / 23).
Associations à vérifier à l'œil : lustre « sphères » = 3 anneaux dorés, « globes » = étages à boules de verre ; « tableau_abstrait_orne » = cadre bois à coins rouges.

## Paiement et échelle de prix (demande de Julie)

**Paiement** (`BAL.paieBase`, `paieVitesse`, `paieErreur`, `refusMax`, `repuFacheErreur`) :
- du premier coup : 10 pièces + prime de rapidité jusqu'à 20 × patience restante (servi vite ≈ 28, servi in extremis ≈ 14) ;
- une erreur (un plat refusé) : la moitié ;
- deux erreurs : le client part fâché **sans payer** ; la bonne forme et la règle s'affichent quand même (jamais la forme fautive) ; réputation −6 (au lieu de −12 pour un client lassé d'attendre : la faute est à la forme, pas à la lenteur).
Valable en mode facile comme en difficile. Remplace `pourboireRefus`. L'ancienne correction « au 2e refus » dans le panneau de choix n'est plus atteinte (le client est parti).

**Prix des objets et tables** (`prixDeco`, `BAL.prixK`, `prixExp`, `prixServices`) : prix = K_resto × base^1,7 / 100^0,7, arrondi à 10. L'écart se creuse : les petites pièces restent à ≈ 1/5 d'un service (premier achat dès le premier service : 120 / 150 / 200 / 310 pièces), les grandes pièces demandent plusieurs services (jusqu'à 3 650 au Palace). Équiper à fond un resto (tout ce qui tient + plus belle table + papier + nappes) = **7 / 9 / 11 / 13 services** d'un élève moyen (gain mesuré par `tools/equilibrage_8c.py` : ≈ 500 / 750 / 950 / 1450 pièces par service). Papiers et nappes : inchangés (× PRIX_RESTO).
**Limite** : le robot « élève en difficulté » de la simulation s'arrête presque tout de suite (limite du robot, déjà vraie avant la règle) ; je n'ai donc pas pu chiffrer le rythme d'un élève à 50 % — à vérifier en classe. Si les élèves fragiles stagnent, baisser `prixK` ou `refusMax`/pénalités.
