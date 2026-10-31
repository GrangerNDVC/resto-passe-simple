# CHANTIER 10 — Comptes élèves + espace enseignante (Firebase LEXICA)

Version livrée : « Version du 31/10, 8 h » (`?v=20261031-08`)

## 1. Décisions validées
- Chemin Firebase : `jeux/resto-passe-simple/<numéro à 4 chiffres>` ; même projet LEXICA que le jeu de foot.
- E-mail enseignante dans les règles : `julie.granger.rennes@gmail.com`.
- Réglages d'accessibilité : sur l'appareil seulement.
- Fusion par resto : meilleur des deux (réussi = OU, étoiles/record = max, ouvert = OU). Argent + déco : copie qui a gagné le plus de pièces cumulées. « Nouvelle campagne » pose un marqueur « recommencé ».
- Colonnes de suivi : numéro · dernière activité · restos réussis (x/4) · étoiles (x/15) · pièces gagnées · Toque chef · % formes justes · 5 verbes les plus ratés.
- Mode essai : réservé à l'enseignante. Mot de passe de secours (« Pas de connexion ? ») : n'ouvre QUE le mode essai ; stocké uniquement sous forme d'empreinte SHA-256 salée.

## 2. Architecture
- `js/compte.js` (nouveau, ~600 lignes, style ES5) : écran du numéro, synchronisation, fusion, espace enseignante, mode essai. Firebase (SDK compat 8.10.1) chargé seulement quand un élève tape un numéro.
- `js/game.js` : sauvegarde v3 (stats par verbe, `maj`, `rec`), `window.RESTO_JEU` (points d'accroche), `noterForme`, page debug 9C réutilisée comme mode essai (+ accès direct aux écrans de fin).
- `index.html` : ajoute compte.js, `?v=` sur les scripts.
- Synchro : localStorage = mémoire principale ; à chaque connexion lecture cloud → fusion → envoi ; **relecture du cloud avant CHAQUE envoi** ; envoi 5 s après le dernier changement, 20 s max en jeu ; connexion coupée entre les envois ; rien dans la console.
- Enseignante : ⚙ discret en bas à droite (opacité 12 %), connexion e-mail + mot de passe Firebase, liste (tri numéro/progression/activité, filtre préfixe, recherche par progression), suppression d'un compte ou des inactifs depuis N jours (confirmation), déconnexion à la fermeture.

## 3. Règles Firebase (à coller dans « jeux », à côté de « foot » — le reste inchangé)
```
"resto-passe-simple": {
  ".read": "auth != null && auth.token.email == 'julie.granger.rennes@gmail.com'",
  "$num": {
    ".read": "auth != null && $num.matches(/^[0-9]{4}$/)",
    ".write": "auth != null && $num.matches(/^[0-9]{4}$/) && (newData.exists() || auth.token.email == 'julie.granger.rennes@gmail.com')",
    ".validate": "newData.hasChildren(['v','maj','donnees'])",
    "v": { ".validate": "newData.isNumber()" },
    "maj": { ".validate": "newData.isNumber()" },
    "donnees": { ".validate": "newData.isString() && newData.val().length < 60000" },
    "$other": { ".validate": false }
  }
}
```
Sauvegarder les règles actuelles avant de coller.

## 4. Fichiers modifiés / créés
index.html, js/game.js, js/compte.js, tools/test_10.py, tools/test_9.py, tools/test_7e.py, docs/CHANTIER10.md.

## 5. Tests faits (Firebase simulé en mémoire, Chrome headless)
- test_10 : 102/102 (SHA-256, fusion, écran du numéro, reprendre/nouvelle/pris/inconnu, envoi différé, coupure, deux appareils, « recommencé », statistiques, changer d'élève, sans compte, hors ligne, espace enseignante, règles simulées, mot de passe de secours + blocage 30 s, mode essai, console propre, 4 tailles d'écran).
- Régression : jeu 169/169, 8a 11, 8b 23, 8c 24, 8d 44, 7e 27, 9 40, cuisine 33, mobile 42.

## 6. Non testé (à faire par Julie)
Vraies règles Firebase, vrai Firebase Auth, vrai iPad Mini 2, restriction en ligne de `?tout`.

## 7. Écarts à connaître
- Mode essai = page debug 9C réutilisée (réglages en mémoire).
- L'ancien point caché ouvre maintenant la fenêtre enseignante.
- En file:// pas d'écran du numéro sauf `?compte`.
- Le mot de passe de secours est un verrou côté navigateur : suffit contre la triche des élèves, ne protège pas les données (seules les règles Firebase le font).

## 8. Reste pour Julie
Coller les règles, autoriser le domaine Netlify (Authentication > Authorized domains), tester sur PC puis iPad Mini 2.
