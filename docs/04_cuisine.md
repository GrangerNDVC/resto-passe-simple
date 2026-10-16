> **FAIT le 16/10/2026** — voir `claude/CHANTIER4.md`. Concept finalement retenu : saisie de la forme **au clavier** (et non glisser-déposer), un poste par groupe, alternance salle / cuisine par la porte. Les « critères de validation » ci-dessous sont remplis (test Playwright : `tools/test_cuisine.py`, avec saisie au vrai clavier à la place du glisser-déposer).

# Chantier 4 — Cuisine : fabriquer les plats (phase 2)

## Objectif
Quand la salle est maîtrisée, la cuisine s'ouvre : au lieu de choisir parmi 4 formes, le joueur **fabrique lui-même** le plat sur des postes de travail : marmite, plan de travail, plaque. C'est le passage de la reconnaissance à la production.

## À joindre à la conversation
- L'archive du jeu (contient déjà `bg_cuisine.png`, briques, plats)
- Images à produire avant (facultatives, dessins provisoires en code sinon) : `postes.png`, `chef.png`, `cuisine_deco.png` (prompts dans `PROMPTS_ASSETS.md`)
- Les chantiers 1 et 3 doivent être faits.

## Livrables
- Écran Cuisine jouable, enchaîné avec la salle (porte battante dans le décor).
- `tools/extract_cuisine.py` (détourage et découpe de `postes`, `chef`, `cuisine_deco`).
- Archive mise à jour.

## Concept validé avec Julie
1. Le joueur **écrit la forme au clavier** (le pronom est affiché sur une brique fixe).
2. **Un poste par groupe** : marmite = 1er, plan de travail = 2e, plaque = 3e.
3. **Alternance par la porte** : la salle continue de tourner pendant que le joueur est en cuisine.

## Tâches (prévues à l'origine)
- Écran cuisine : `bg_cuisine` (mur du fond jusqu'à y ≈ 345, sol en dessous), porte battante à gauche (retour en salle), passe-plats à droite avec la cloche de service, 3 postes sur le sol (x ≈ 520, 960, 1400, base y ≈ 700), chef-conseiller à gauche, zone de saisie en bas (y de 830 à 1066).
- Postes : deux images (repos / action) alternées pendant la cuisson, avec vapeur et sons.
- Chef : 4 poses (neutre, explique, bravo, fâché) selon les erreurs ; bulle d'aide qui rappelle la règle de la terminaison.
- Flux : tickets de la salle → cuisine → passe-plats → service. Plusieurs commandes en attente et **temps de cuisson**.
- Erreur : plat raté (`plat_rate`), le chef réagit, la bonne forme s'affiche.
- Déblocage : la cuisine s'ouvre après N clients servis sans erreur grave ; message d'annonce.

## Critères de validation
- Une commande complète salle → cuisine → service sans erreur.
- Tests Playwright étendus.
