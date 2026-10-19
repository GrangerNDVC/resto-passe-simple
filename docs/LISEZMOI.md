# Le Resto du Passé Simple — prototype « salle + cuisine » (1er, 2e et 3e groupes)

## Lancer le jeu
Ouvre `index.html` dans un navigateur (Chrome, Edge, Firefox). Aucun serveur n'est nécessaire.

## Comment on joue
**Au clavier :** ← → fait marcher le serveur, **Espace** (ou Entrée) agit. La souris marche toujours (clic sur un client, un ticket, le passe-plats ou une table).

1. **Prendre la commande.** Un client lève la main : va à sa table (Espace, ou clic). Un petit dialogue s'affiche, avance avec Espace :
   - le client choisit un **verbe à l'infinitif** sur la carte (ex. MANGER) ;
   - le serveur demande « C'est noté ! Et pour la cuisson ? » ;
   - le client répond par la **personne** (ex. « À la 3e personne du singulier »). Pendant le dialogue, sa patience est gelée.
   Un ticket (verbe + personne + numéro de table) s'accroche au rail du fond.
2. **Aller au passe-plats** (dans le mur, à gauche). Le serveur y va tout seul. Au clavier, une flèche reprend la main ; place-toi près du passe-plats et appuie sur Espace. Tu peux aussi cliquer sur le passe-plats ou sur un ticket.
3. **Choisir la bonne assiette** : quatre vraies assiettes glissent hors du passe-plats ; chacune porte une étiquette avec une forme du verbe au passé simple (touches 1 à 4, flèches + Entrée, ou clic). Échap ferme le choix, la commande reste à préparer. **Aucune correction à ce moment-là** : le plat part à la table, même si la forme est fausse.
4. **Servir la bonne table** : le numéro est sur le ticket (Espace devant la table, ou clic). Si le plat est bon, le client le mange : tu gagnes des pièces (10 + un pourboire qui dépend de sa patience). Sinon, **le client refuse** : « Ce n’est pas le plat que j’ai demandé ! » (forme d’un autre verbe) ou « Ce n’est pas la bonne cuisson ! » (mauvaise forme du bon verbe). L’assiette refusée est enlevée, le serveur retourne tout seul au passe-plats où il ne reste que les autres assiettes. Chaque refus fait perdre de la patience au client et casse ta série ; le pourboire est complet du premier coup, divisé par deux après un refus, nul après deux refus. Au **2e refus**, la bonne forme et la règle s’affichent pour t’aider.
5. Un client dont la patience (smiley) tombe à zéro part fâché : on perd un cœur. Trois cœurs perdus : fin de partie, avec la liste « à revoir » et de **1 à 3 étoiles** selon la part de clients servis du premier coup (60 % pour 2 étoiles, 85 % pour 3).

**Accueil** : le jeu s'ouvre sur la façade du bistrot : le serveur arrive, la pancarte « Au passé pas si simple » s'écrit, puis un panneau OUVERT tombe sur la porte : on clique dessus (ou Espace) pour entrer. Un clic passe l'animation ; avec le réglage « Animations : calmes » elle s'affiche directement terminée.

**Guide gourmand** : sur l'écran titre, « Mon resto (N) » permet de baptiser le restaurant (24 lettres max.). En jouant, un article du journal *Le Gourmet du matin* s'affiche (le jeu est figé, Espace / Entrée / clic pour continuer) : « table à retenir » après 5 clients servis, puis **1, 2 et 3 étoiles du guide** après 3, 6 et 10 niveaux franchis, à condition d'avoir servi au moins 70 % des clients du premier coup (sinon l'étoile attend). Les articles sont au passé simple et reprennent trois verbes servis pendant la partie. Le nom et les articles sont mémorisés dans le navigateur ; « Revue de presse » (écran titre) permet de les relire. Les textes sont modifiables dans `js/presse.js`.

**Pause** : bouton « Pause (P) » en haut à droite, ou touche P. Pour reprendre : clic n'importe où, Espace, Entrée, Échap ou P. Le jeu se met aussi en pause si tu quittes l'onglet.

Réglages utiles (écran titre → Réglages) : volume des sons (Coupé / Bas / Normal), musique d'ambiance (Non / Oui), « Aide : écrire aussi le pronom » (il / elle / on…) est activée par défaut ; désactive-la pour que l'élève identifie seul la personne.

## La cuisine (chantier 4)
Après **10 clients servis d'affilée sans qu'aucun ne parte fâché**, la cuisine s'ouvre (message d'annonce, porte battante « CUISINE » sur le mur du fond). Ensuite, **6 commandes sur 10** sont « à cuisiner » (les autres restent des QCM en salle) :
1. Prends la commande comme d'habitude : le ticket s'accroche au rail avec la mention « à cuisiner », pas de QCM.
2. Clique sur la porte (ou touche `C`) : tu passes en cuisine. Le client continue d'attendre : le tableau « Salle » (en haut à droite) montre l'humeur de chaque table.
3. Choisis le **poste du groupe du verbe** : marmite = 1er groupe, plan de travail = 2e, plaque = 3e (les auxiliaires avoir et être, violets, se font à la plaque). Touches `1` `2` `3`.
4. **Écris la forme** au clavier (accents compris ; boutons à, â, ç, é… pour les tablettes). `Entrée` = cuisiner, `Échap` = annuler. Si seul un accent est faux : « Presque ! » et une seconde chance sans pénalité.
5. Le plat cuit (3 à 5 secondes, un poste = un plat à la fois ; tu peux utiliser plusieurs postes en même temps). Clique sur le plat prêt : il part au passe-plats.
6. Retourne en salle (porte ou `C`) : le serveur va chercher le plat tout seul ; clique sur la bonne table.
Erreur de forme : plat raté, le poste est bloqué 3 secondes, le client perd de la patience, la bonne forme et la règle s'affichent, puis tu recommences. « Aide du chef » (ou clic sur le chef) rappelle la terminaison mais fait perdre le bonus de rapidité. Un plat fait maison rapporte 10 points de plus.
À l'écran titre, le bouton **Cuisine : oui / non** permet de jouer la salle seule (QCM uniquement).
Dessins provisoires : tant que `assets/cuisine/` est vide, les postes, le chef et la porte sont dessinés en code. Pour les remplacer : `python3 -I tools/extract_cuisine.py postes.png chef.png cuisine_deco.png .`

## Les groupes et les couleurs
La brique, le ticket et le plat servi suivent la couleur du groupe : **vert** = 1er groupe (salade), **orange** = 2e groupe (soupe), **rouge** = 3e groupe (ragoût), **violet** = auxiliaires avoir et être (plat sous cloche). Le groupe est aussi écrit sur chaque brique (« 2e gr. »).

| Niveaux | Contenu |
|---|---|
| 1 à 5 | 1er groupe (réguliers, -ger/-cer, -ier/-uer/-éer, -yer et e muet, mélange) |
| 6 | 2e groupe : finir, choisir, grandir… |
| 7 | 3e groupe, famille -is : partir, mettre, prendre… |
| 8 | 3e groupe, famille -us + avoir et être : lire, pouvoir, vivre… |
| 9 | 3e groupe, famille -ins : venir, tenir et leurs dérivés |
| 10 | irréguliers : aller, faire, voir, dire, écrire (+ mélange de tout) |

Avec « Tous les verbes », on part du niveau 1 et on monte (niveau +1 tous les 8 clients servis). Avec « 2e groupe » ou « 3e groupe », on part du premier niveau du groupe (6 ou 7) et seuls les verbes de ce groupe sortent.

## Images à ajouter (le jeu utilise des silhouettes tant qu'elles manquent)
Les images sont lues automatiquement, sans toucher au code, avec PNG transparent (fond bleu déjà retiré) :

| Dossier | Fichiers attendus |
|---|---|
| `assets/clients/` | `client_01_garcon_attente.png`, `client_01_garcon_appel.png`, idem pour `client_02_papy`, `client_03_bouclee`, `client_04_blonde`, `client_05_mamie`, `client_06_moustachu`, `client_07_critique` |
| `assets/serveur/` | `serveur_marche_1.png` … `serveur_marche_6.png`, `serveur_idle.png`, `serveur_depose.png`, `serveur_content.png`, `serveur_oups.png` |

Réglages à ajuster dans `js/game.js` (en haut du fichier) quand les vrais personnages arrivent :
`CLIENT_W` (largeur des clients), `SERVEUR_H` (hauteur du serveur), `TRAY` (position du plateau).

## Organisation
- `js/verbes.js` : conjugaison (1er, 2e et 3e groupes, 81 verbes), fabrication des commandes, distracteurs et pièges
- `tools/test_conjugaison.js` : test de toutes les formes contre la table de référence (`node tools/test_conjugaison.js`)
- `tools/test_jeu.py` : parcours automatique dans Chromium, salle seule (`python3 -I tools/test_jeu.py . captures`)
- `tools/test_cuisine.py` : parcours salle → cuisine → service, saisie au vrai clavier, erreurs, joueur parfait (`python3 -I tools/test_cuisine.py . captures`)
- `tools/extract_cuisine.py` : détourage et découpe de `postes.png`, `chef.png`, `cuisine_deco.png` vers `assets/cuisine/`
- `js/game.js` : moteur du jeu, dessin, interface
- `js/geometrie.js` : mesures des tables (plateau, nappe) pour poser les plats
- `assets/` : décors et sprites détourés
