# Chantier 9A — Retouches après essai (clients et atelier en plein service)

- **Plus de gris sur les personnages** : le gris moyen des cheveux (#8e8e8e) devient un châtain (#7a3b2e) ; le vêtement gris-bleu foncé (#2f2f3a) devient un bordeaux (#8a2f4a) ; plus de gris non plus dans les silhouettes de secours.
- **Un personnage ne revient pas trop vite** : les derniers personnages venus (jusqu'à 5, moins si la réserve du resto est petite) sont écartés du tirage, même s'ils reviendraient avec d'autres couleurs (`S_.recents`, `tirerClient`). Écart mesuré : au moins 6 clients.
- **Atelier déco en plein service** (campagne, pas en entraînement libre) : bouton « Déco (D) » sous « Pause » avec le nombre de pièces ; le service est suspendu tant qu'on est à l'atelier ; au retour (Échap ou « Retour »), les tables posées / recolorées sont reprises, les clients déjà installés restent, le serveur repart de zéro (chemin effacé). Mode facile : seulement tables et nappes, comme avant.
- Test test_8b rendu fiable (un client snob tiré au hasard faisait parfois échouer un contrôle).
- Tests : test_jeu 170, 8a 11, 8b 23, 8c 24, 8d 44, 7e 27, cuisine 34, mobile 42, **test_9 11 (nouveau)**.

## À regarder en classe
Le serveur qui perd son trajet au retour de l'atelier ; une table déplacée sous un client déjà assis (il suit sa place).
