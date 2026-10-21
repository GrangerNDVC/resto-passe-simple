# Chantier 7c — l'atelier déco (fait le 21/10/2026)

Complète `chantiers/07_campagne_restos.md` (§4) et `claude/CHANTIER7B.md`. Aucune nouvelle image n'est nécessaire.

## Ce qui est codé (`js/game.js`)
- **Catalogue** (`PAPIERS`, `NAPPES`, `OBJETS`, `CATALOGUE`, juste après `RESTOS`) : tout se règle là, prix de base compris.
  - Papier peint (6) : rayures crème (d'origine, gratuit), rose poudré, vert sauge, jaune soleil, lilas, abricot — 100 pièces chacun. Teinte « multiply » sur les trois pans de mur (`MURS`) ; le lambris et le sol ne changent pas.
  - Nappes (4) : d'origine (gratuites), pastel 150, dorées 220, velours 300. Voile de couleur posé sur chaque sprite de table (`tableImg`, mis en cache dans un canvas hors écran, donc compatible tablette).
  - Objets (4) : plante 120, lampe 180, horloge 240, ardoise du jour 300. **Au départ la salle est nue** : plus rien n'est posé tant que rien n'est acheté (avant 7c, plante + lampe + horloge étaient toujours là). L'ardoise (`deco_ardoise.png`, jusqu'ici non posée) est accrochée au mur du fond entre le tableau de bord et le passe-plats (`ARDOISE`).
- **Prix croissants** : `PRIX_RESTO = [1, 2, 3.5, 6]` multiplie le prix de base (arrondi à 10). Les pièces rapportent × 1 / 1,5 / 2 / 3 : la déco coûte donc relativement plus cher à chaque resto, comme demandé.
- **Déco propre à chaque resto** : `G.camp.restos[i].deco = { papier, nappes, achats: ["papier:rose", "objet:plante", …] }`. Les pièces dépensées sont celles de `G.camp.argent` (le total « en poche » ; `restos[i].argent` reste le cumul gagné, il ne baisse jamais). Sauvegardée dans `localStorage` avec le reste ; `decoLire` relit prudemment (identifiants inconnus, doublons, papier ou nappes jamais achetés : écartés). Une ancienne sauvegarde 7b (sans déco) se relit avec une déco vide. « Nouvelle campagne » efface aussi la déco.
- **Atelier** (mode `atelier`, `dessinerAtelier`, `clicAtelier`) : trois onglets (Papier peint / Nappes / Objets), liste à gauche, **aperçu en direct de la salle du resto** à droite (tables vides, nombre de tables du resto) ; l'objet survolé est prévisualisé avant achat (« Aperçu — pas encore acheté »). Clic = acheter, ou reposer un papier / des nappes déjà achetés (gratuit). Pièces insuffisantes : message « Il te manque N pièces… », rien n'est débité. Boutons des 4 restos en bas (les verrouillés sont grisés).
- **Accès** : bouton « Atelier déco (D) » sur la carte et sur l'écran titre de chaque resto (pas en entraînement libre) ; bouton « ATELIER DÉCO » à la fin d'une partie de campagne (Retour ramène à l'écran de fin). Clavier : D ouvre ; dans l'atelier ↑ ↓ choisir, Entrée / Espace acheter ou poser, ← → changer de resto ouvert, 1 2 3 onglets, Échap retour.
- **Rendu en jeu** : `rendre()` pose `decoRendu` (déco du resto joué ; en entraînement libre, celle du resto choisi sur la carte), `papierPeint`, `dessinerObjets`, `tableImg`.
- Carte : la barre de boutons passe à 6 (ajout de l'atelier) ; fin de partie en campagne : 3 boutons (REJOUER / ATELIER DÉCO / CARTE).

## Équilibrage (à ajuster en classe)
Mesure avec un joueur parfait (robot), séance de 5 min, salle seule : ≈ 800 pièces au bistrot, 1 030 à la brasserie, 1 330 au grand resto, 2 200 au Palace. Un élève réel gagne moins (à mesurer).
Au bistrot, équiper toute la salle coûte 2 010 pièces (≈ 2,5 séances d'un joueur parfait) ; au Palace, 12 060 (≈ 5,5 séances). Un article isolé coûte 100 à 300 pièces au bistrot, 600 à 1 800 au Palace. Si c'est trop facile ou trop long : `PRIX_RESTO` et les prix de base.

## Choix à valider par Julie
1. **La salle commence nue** (aucun objet) : les objets deviennent des achats. Variante : offrir la plante au départ.
2. Les nappes sont des **variantes de couleur** des nappes actuelles (pas de nouveau motif) : la couleur de table, qui sert à repérer les tables, reste distincte.
3. Un seul papier / un seul jeu de nappes posé à la fois ; objets tous visibles dès qu'achetés (pas de bouton « ranger »).
4. Papier peint sur les murs seulement : pas de couleur de sol ni de lambris (à ajouter si besoin).
5. Les 5 points encore à valider du chantier 7b (voir `CHANTIER7B.md`) restent inchangés.

## Tests
`test_jeu.py` : 169 contrôles (26 nouveaux : achats, refus sans pièces, prix par resto, déco propre à chaque resto, clavier, rendu en salle, lecture prudente de la sauvegarde). `test_cuisine.py` : 33. Deux clics de l'ancien test ont changé de place (boutons « Nouvelle campagne » et « CARTE »).

## Suite
7d : images des restos 2-4 (façades, salles, carte) — le papier peint se pose par-dessus ces nouvelles salles. 7e : franchises, « Toque chef », diplôme, article final.
