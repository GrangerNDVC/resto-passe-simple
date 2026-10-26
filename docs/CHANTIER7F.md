# Chantier 7f — ÉTAT PARTIEL (24/10/2026) — à reprendre dans la conversation suivante

## Fait et testé (test_jeu.py : 172/172 attendu)
- Le client valide le plat servi par une phrase (bulle), qu'il soit bon ou mauvais côté « porter à la table » ; le message système « bonne assiette » est remplacé par « Porte-la à la table N ».
- Proportions clients : `CLIENT_ECH` retouché, `CLIENT_DY` (moustachu remonté). À valider à l'œil.
- 11 nouveaux clients recolorables détourés : `assets/clients/client_08..18_{attente,appel,calques}.png` (lots A–D). **Chargés mais pas encore utilisés dans le casting ni recolorés en jeu.**
- Chaises `chaise_brasserie/gala/palace`, `deco_applique`, `deco_desserte`, `deco_desserte_3q` détourées (chargées, pas encore dessinées par resto).
- Catalogue `OBJETS` (17 objets, resto, zone, prix) en brouillon ; seuls ceux dont l'image existe sont proposés (donc aujourd'hui : plante, lampe, horloge, ardoise, applique, desserte).
- `deco.charme` et paramètres `BAL.decoClients/decoPatience` ajoutés (sans effet encore).
- Outils : `tools/extract_clients_7f.py`, `tools/build_prompts_7f.py`, `docs/PROMPTS_7F.md` (33 prompts).

## À faire (ordre conseillé) — voir aussi claude/ROADMAP_CHANTIERS.md
1. Chantier 8A (urgent) : smartphone (canvas `100dvh`, contain), proportions passe-plats/porte, +60 s en cuisine, sablier de patience avec n° de table, cuisine + objets + couleurs réservés au mode difficile.
2. Détourer les images listées ci-dessous (tools/chroma.py `key_blue`, alpha dur, recadrage).
3. Brancher : casting des nouveaux clients + recoloration (peau/cheveux/vêtements via `_calques`), tables/chaises par resto (alternatives payantes), objets classés par resto avec tailles croissantes, orientations (tableaux/miroirs horizontal/vertical, meubles 3 sens), placement sans chevauchement des tables / passe-plats / porte / rail / fenêtres, Palace à une fenêtre (`MURS_SALON`), nouveaux passe-plats.
4. Satisfaction : bulle « c'est beau ici ! » + cœurs, bonus d'attente seulement pour les clients arrivés après un changement, coût et gain réduits pour un simple changement de couleur, lassitude des objets d'anciens restos, clients snob.
5. Refaire la mise en page de l'onglet Objets de l'atelier.
6. Plus tard : Firebase (concentrer la sauvegarde dans `sauver()/campLire()`, ajouter un numéro de version).

## Images à re-verser dans la prochaine conversation (les fichiers de celle-ci ne sont pas conservés)
Ne PAS re-verser les clients, chaises, applique et desserte déjà traités. Re-verser tout le reste, avec le nom de l'objet dans le message si possible :
- Tables : brasserie ×3 variantes (dont celle à liseré coloré = alternative payante), gala ×3 (unie, bougie, frange), Palace (roses, brodées, « croix »).
- Plantes : ficus, monstera, sansevieria, dracaena, palmier.
- Portemanteau, rideaux, tête de cerf, vitrine (2 variantes), présentoir à gâteaux, piano (face + 3/4).
- Tapis (8 ou plus : rond, tressé, rayures, zigzag, persan, ornemental…).
- Statues et bustes (8 ; le groupe monumental a une plaque au faux grec : à refaire ou à ne pas utiliser).
- Passe-plats : variantes crème, marbre/or luxe, laiton sombre, bois/rouge.
- Nouvelle salle du Palace à une fenêtre.
- Variantes de desserte (bois, sombre et or, or) si tu les veux.
