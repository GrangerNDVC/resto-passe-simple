# Chantier 7b — la campagne (fait le 21/10/2026)

Complète `chantiers/07_campagne_restos.md` (§3, §3bis, §7). Remplace, pour la campagne, ce que dit `TRANSMISSION.md` sur le choix des verbes à l'écran titre.

## Ce qui est codé (`js/game.js`)
- `RESTOS` : 4 restos (titre, enseigne, groupes, niveaux debut/fin, tablesDepart/tablesMax, coef, teinte provisoire, noms d'images). `G.camp` = { argent, restos[4] : ouvert, reussi, etoiles, argent, meilleur } ; sauvegardé dans `localStorage` avec `G.resto` (`campLire` valide la sauvegarde).
- Une partie a un contexte `S_.ctx` (un resto, ou l'entraînement libre `G.libre`) qui remplace `G.groupe` : niveaux de verbes, groupes proposés (`VERBES.nouvelleCommande` accepte maintenant une liste de groupes), tables, coefficient, postes de cuisine ouverts.
- Pièces : `score` = pièces, multipliées par le coefficient du resto à chaque service ; en campagne elles sont aussi ajoutées à `G.camp`. Aucune pièce en entraînement libre.
- Succès de presse (`verifierGuide`) : barre à 100 → `restos[i].reussi`, resto suivant ouvert, prime `GUIDE.bonusSucces` (50) × coef, article (id = n° du resto + 1, plafonné à 3), barre remise à `repuApresSucces`. « Table à retenir » à 5 clients servis (une fois).
- `finir()` : bilan de fin enregistré (étoiles de fin de partie, meilleur score).
- Modes : `carte` (écran principal, `dessinerCarte`, `clicCarte`), `accueil` rejoué par resto (`G.accueilResto`, pancarte = `enseigne`, façade `bg_titre_N` ou celle du village teintée), `title` sans choix de verbes en campagne (avec en entraînement libre), retours de réglages/presse/nom vers l'écran d'où l'on vient (`G.retourDe`).
- Touches : carte ← → / Espace / L (libre) / R / N ; titre Échap = carte ; fin de partie Échap = carte, bouton CARTE.
- Images facultatives : `bg_carte.jpg`, `bg_titre_2..4.jpg`, `bg_salle_2..4.png` (sinon teinte multiplicative du village).

## Choix à valider par Julie
1. Articles : village ★1, brasserie ★2, grand resto ★3 ; le Palace n'a pas d'article propre avant 7e (« légende »).
2. Brasserie : niveau de verbes unique (6) ; le contenu varie par le rappel du 1er groupe (moitié des commandes en 2e groupe).
3. Palace : niveau 10 seul (moitié irréguliers).
4. Prime de succès de presse : 50 pièces × coef (pour inciter à rejouer).
5. Poste partagé en classe : un seul profil + « Nouvelle campagne » ; profils par élève à décider (chantier 6).

## Tests
`test_jeu.py` : 143 contrôles (les parcours salle utilisent `G.libre = true` ; nouveau bloc « campagne »). `test_cuisine.py` : 33. 

## Suite
7c : atelier déco (bouton sur la carte et dans le resto), papier peint, prix croissants. 7d : images. 7e : franchises, « Toque chef », diplôme, article final.
