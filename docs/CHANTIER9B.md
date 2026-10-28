# Chantier 9B — Retouches après essai (fin de resto, passe-plats, tailles)

- **Resto réussi → on quitte le resto** : à la 1re réussite d'un resto (barre de réputation pleine), après l'article de presse, le service s'arrête et un écran propose : « Aller au resto suivant » (ouvert), « Refaire ce resto en difficile » (seulement si on jouait en facile : cuisine, pièces, objets de déco), « Retour à la carte ». Au Palace : retour direct à la carte (l'émission Toque chef se lance). Si l'article était déjà gagné, le retour se fait seul après 2,6 s. Les réussites suivantes du même resto ne coupent pas le service. Le bilan (étoiles, record) est enregistré à ce moment. L'atelier s'ouvre ensuite sur le resto suivant.
- **Passe-plats du resto 1** : il reposait sur le sol ; il est remonté sur le mur (rebord à y = 292, hauteur 150 px). La zone cliquable suit le dessin (`HATCH_DESSIN`).
- **Tailles des clients** : anciens 180 → 190 (le −10 % du 8C était trop) ; nouveaux ×1,2 → ×1,0 (`NOUVEAUX_ECH`), soit 216 → 190 px. Réglables : `CLIENT_W`, `NOUVEAUX_ECH`, `CLIENT_ECH` dans game.js.
- Tests : test_jeu 170, 8a 11, 8b 23, 8c 24 (contrôle de taille mis à jour), 8d 44, 7e 27, cuisine 34, mobile 42, test_9 19.

## À regarder en classe
Si les nouveaux clients semblent encore grands/petits : `NOUVEAUX_ECH` (0,95 ou 1,05). Passe-plats du resto 1 : un peu plus petit qu'avant (150 px de haut au lieu de 190), car le mur du village est bas.
