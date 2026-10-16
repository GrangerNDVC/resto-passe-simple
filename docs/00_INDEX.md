# Jeu de commande — Index des chantiers

**Principe : un chantier = une conversation.** Chaque chantier a son propre document dans ce projet, avec tout ce qu'il faut pour démarrer sans relire l'historique. Fais-les dans l'ordre indiqué (certains peuvent se faire en parallèle).

## État au 16/10/2026
- Prototype jouable « salle » avec **1er, 2e et 3e groupes** (10 niveaux, 81 verbes) : **fait et testé** (voir `claude/CHANTIER3.md`).
- Chantier 2 (pédagogie, équilibrage, mode séance, accessibilité) : fait pour l'essentiel (voir `claude/CHANTIER2_ETAPE1.md`).
- **Chantier 4 (cuisine) : fait et testé** (voir `claude/CHANTIER4.md`) : porte battante, 3 postes (un par groupe), saisie de la forme au clavier, cuisson, passe-plats, chef. Dessins provisoires en code en attendant `postes.png`, `chef.png`, `cuisine_deco.png`.
- Décors, mobilier, plats, briques, interface, smileys, effets : **générés, détourés et intégrés**.
- Personnages (clients, serveur) : voir chantier 1.
- Habillage, sons, déploiement : à faire.

## Les chantiers

| N° | Chantier | Dépend de | Images à produire par Julie |
|---|---|---|---|
| 0 | Production des images restantes (par Julie) | — | clients, serveur, chef, postes, déco salle, déco cuisine, bg_titre |
| 1 | Intégration des personnages | images clients + serveur | `client_*.png`, `serveur_marche.png`, `serveur_poses.png` |
| 2 | Pédagogie, accessibilité et équilibrage de la salle | prototype | aucune |
| 3 | Groupes 2 et 3 et verbes irréguliers | chantier 2 | aucune |
| 4 | Cuisine : fabriquer les plats (phase 2) | chantiers 1 et 3 | `postes.png`, `chef.png`, `cuisine_deco.png` (facultatifs : dessins provisoires en code) |
| 5 | Habillage, sons et finitions | chantier 1 | `salle_deco.png`, `bg_titre.png` |
| 6 | Déploiement, sauvegarde et tests en classe | tout | aucune |

Ordre conseillé : **0 → 1 → 2 → 3 → 4 → 5 → 6**. Les chantiers 2 et 3 peuvent se faire pendant que tu génères les images du chantier 0 (ils n'en ont pas besoin).

## À joindre à chaque nouvelle conversation
1. L'archive du jeu (ou sa dernière version, mise à jour à la fin de chaque chantier). **Vérifier qu'elle contient bien le dernier code** (`js/game.js` doit contenir `cuisineApres` depuis le chantier 4 ; `js/verbes.js` doit contenir `GROUPES` et `NIVEAU_MAX = 10` depuis le chantier 3).
2. Les images concernées par le chantier (voir le tableau).
3. Le texte « Pour démarrer » du chantier.

Le code source est aussi enregistré dans ce projet (`code/…`) et le document `TRANSMISSION.md` résume l'architecture : une conversation peut donc relire le code même sans l'archive (mais pas les images).

## Fin de chantier (rituel)
Terminer chaque conversation par : mettre à jour l'archive, mettre à jour `TRANSMISSION.md` et le code dans le projet, cocher le chantier ci-dessus.

## Suivi
- [x] Prototype salle 1er groupe
- [ ] 0 Images restantes
- [ ] 1 Personnages
- [x] 2 Pédagogie et équilibrage (reste : « rejouer mes erreurs », « personne seule », aide contre pénalité, fiche enseignante)
- [x] 3 Groupes 2 et 3 (15/10/2026)
- [x] 4 Cuisine (16/10/2026) — reste : vrais dessins des postes/chef/déco, équilibrage `BAL.cuisine*` en classe
- [ ] 5 Habillage et sons
- [ ] 6 Déploiement et tests
