# Chantier 4 — Cuisine (fait le 16/10/2026)

## Décisions de concept (validées par Julie)
- **Ce que fait le joueur : il ÉCRIT la forme conjuguée au clavier** (pas de briques à glisser). Le pronom est affiché sur une brique fixe, le joueur tape le verbe conjugué, accents compris.
- **Un poste par groupe** : marmite = 1er groupe, plan de travail = 2e, plaque = 3e (les auxiliaires avoir/être, en violet, se cuisent à la plaque). Choisir le bon poste fait travailler le repérage du groupe.
- **Alternance salle / cuisine par la porte battante** : un seul écran à la fois, la salle continue de tourner (patience des clients) pendant que le joueur est en cuisine.

## Ce qui est codé
- Ouverture : après `BAL.cuisineApres` (10) clients servis d'affilée sans client parti fâché. Bouton « Cuisine : oui / non » à l'écran titre (mémorisé).
- Ensuite `BAL.cuisineProba` (60 %) des commandes sont « à cuisiner » : pas de QCM, ticket marqué « à cuisiner », client plus patient (`cuisinePatMul` = 1,5).
- Porte battante sur le mur du fond de la salle (x 600-704) + pastille rouge « ! » quand la cuisine appelle (ticket à cuisiner ou plat prêt). Touche `C` ou clic. Fondu enchaîné.
- Cuisine : 3 postes (x = 520, 960, 1400, base y = 700), chef à gauche (4 poses : neutre, explique, bravo, fâché ; bulle d'aide), passe-plats miroir à droite avec cloche, tableau « Salle » (humeur de chaque table) en haut à droite, rail de tickets (ticket choisi encadré).
- Saisie : champ HTML invisible (`<input id="saisie">`) qui reçoit le vrai clavier (touches mortes, accents, clavier tactile) ; boutons d'accents et « Effacer » dessinés sur le panneau ; Entrée = cuisiner, Échap = annuler.
- Accent seul faux : « Presque ! », une seconde chance sans pénalité. Forme fausse : plat raté (poste bloqué `rateDuree` = 3 s, patience −20 %), bonne forme + règle affichées (jamais la forme fautive), erreur ajoutée au bilan « à revoir ».
- « Aide du chef » : rappelle la terminaison de la personne, fait perdre le bonus de rapidité.
- Cuisson : 3,2 / 4,2 / 5,2 s (marmite / plan de travail / plaque), un poste = un plat à la fois (plusieurs postes en parallèle). Clic sur le plat prêt → passe-plats (file `S.hatchQ`, plusieurs plats possibles) ; le serveur libre va le chercher tout seul ; +10 points pour un plat fait maison.
- Un client qui part : ses tickets, plats en cuisson ou au passe-plats et la saisie en cours sont nettoyés.
- Les postes s'ouvrent avec les groupes (gris « bientôt… » tant que le groupe n'est pas au programme du niveau ; avec un groupe choisi à l'écran titre, seul son poste est ouvert).
- Dessins provisoires en code tant que `assets/cuisine/` est vide (postes, chef, porte, enseigne). `tools/extract_cuisine.py` détoure et découpe `postes.png`, `chef.png`, `cuisine_deco.png` (noms attendus dans `docs/assets_manifest.json`).

## Tests
- `tools/test_cuisine.py` (31 contrôles) : ouverture, ticket à cuisiner, porte, mauvais poste, saisie au vrai clavier (p / m / c ne déclenchent rien), « presque », plat raté, nettoyage, cuisson, passe-plats, service automatique, client qui part pendant la cuisson, joueur parfait salle + cuisine (35 plats cuisinés, 59 clients, 0 erreur), cuisine désactivée.
- `tools/test_jeu.py` (48 contrôles) passe toujours ; il désactive la cuisine (`G.cuisine = 0`) car son joueur automatique ne sait pas cuisiner.
- Le glisser-déposer prévu dans la fiche d'origine n'existe plus : remplacé par la saisie au clavier.

## À régler en classe / points ouverts
- Les réglages `BAL.cuisine*` et `BAL.cuisson` sont des valeurs de départ, pas encore équilibrées par simulation.
- Copier la forme affichée après une erreur est possible (message visible ~6 s) : à observer avec les élèves.
- La saisie pénalise les élèves dyslexiques : boutons d'accents + « Presque » aident ; on pourrait ajouter une tolérance (aide contre pénalité plus généreuse).
- Dessins définitifs : `postes.png`, `chef.png`, `cuisine_deco.png` (positions du décor de `cuisine_deco` à ajuster au chantier 5).
- Sons de cuisson (grésillement, mijotage) : chantier 5.
- Position du plat sur le passe-plats de la salle (`HATCH_PLATE`) et de la cuisine (`CUIS_PASSE`) à vérifier avec les vrais dessins.
