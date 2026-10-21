// Le Resto du Passé Simple — prototype « salle » : 1er, 2e et 3e groupes (10 niveaux de verbes).
// Canvas logique 1920×1080. Les images absentes (clients, serveur) sont remplacées par des silhouettes.
(function () {
  "use strict";
  const W = 1920, H = 1080;
  const cv = document.getElementById("c"), ctx = cv.getContext("2d");

  // ------------------------------------------------------------------ images
  const IMG = {};
  const LISTE = {
    bg_salle: "assets/bg_salle.png", bg_titre: "assets/bg_titre.jpg",
    // facultatifs (chantier 7d) : façades, salles et carte des restos 2 à 4 ; absents, le jeu teinte les images du village
    bg_carte: "assets/bg_carte.jpg", bg_titre_2: "assets/bg_titre_2.jpg", bg_titre_3: "assets/bg_titre_3.jpg", bg_titre_4: "assets/bg_titre_4.jpg",
    bg_salle_2: "assets/bg_salle_2.png", bg_salle_3: "assets/bg_salle_3.png", bg_salle_4: "assets/bg_salle_4.png",
    deco_plante: "assets/salle/deco_plante.png", deco_lampe: "assets/salle/deco_lampe.png", deco_horloge: "assets/salle/deco_horloge.png", deco_ardoise: "assets/salle/deco_ardoise.png",
    chaise: "assets/salle/chaise.png", passe_plats: "assets/salle/passe_plats.png", plaque_numero: "assets/salle/plaque_numero.png",
  };
  const COULEURS = ["rouge", "vert", "jaune", "violet", "orange", "rose"];
  COULEURS.forEach((c) => (LISTE["table_" + c] = "assets/salle/table_" + c + ".png"));
  ["assiette_vide", "plat_g1_salade", "plat_g2_soupe", "plat_g3_ragout", "plat_cloche", "plat_rate"].forEach((n) => (LISTE[n] = "assets/plats/" + n + ".png"));
  ["brique_g1_verte", "brique_g2_orange", "brique_g3_rouge", "brique_aux_violette", "brique_slot_vide"].forEach((n) => (LISTE[n] = "assets/briques/" + n + ".png"));
  ["bulle_commande", "ticket_commande", "rail_tickets", "panneau_bois", "cloche_service", "carnet_commande"].forEach((n) => (LISTE[n] = "assets/ui/" + n + ".png"));
  ["smiley_1_ravi", "smiley_2_content", "smiley_3_neutre", "smiley_4_presse", "smiley_5_mecontent", "smiley_6_furieux"].forEach((n) => (LISTE[n] = "assets/smileys/" + n + ".png"));
  ["fx_piece", "fx_etoile", "fx_coeur", "fx_coche", "fx_croix", "fx_sablier"].forEach((n) => (LISTE[n] = "assets/fx/" + n + ".png"));
  // facultatifs : remplacés par des silhouettes s'ils manquent
  const CLIENTS = ["client_01_garcon", "client_02_papy", "client_03_bouclee", "client_04_blonde", "client_05_mamie", "client_06_moustachu", "client_07_critique"];
  CLIENTS.forEach((c) => { LISTE[c + "_attente"] = "assets/clients/" + c + "_attente.png"; LISTE[c + "_appel"] = "assets/clients/" + c + "_appel.png"; });
  for (let i = 1; i <= 6; i++) LISTE["serveur_marche_" + i] = "assets/serveur/serveur_marche_" + i + ".png";
  ["serveur_idle", "serveur_depose", "serveur_content", "serveur_oups"].forEach((n) => (LISTE[n] = "assets/serveur/" + n + ".png"));
  // cuisine : décor existant + dessins facultatifs (remplacés par des dessins provisoires en code tant qu'ils manquent)
  LISTE.bg_cuisine = "assets/bg_cuisine.png";
  ["marmite", "plan_travail", "plaque"].forEach((n) => ["repos", "actif"].forEach((e) => (LISTE[n + "_" + e] = "assets/cuisine/" + n + "_" + e + ".png")));
  ["chef_neutre", "chef_explique", "chef_bravo", "chef_fache"].forEach((n) => (LISTE[n] = "assets/cuisine/" + n + ".png"));
  ["etagere_bocaux", "casseroles_suspendues", "hotte_inox", "porte_battante"].forEach((n) => (LISTE[n] = "assets/cuisine/" + n + ".png"));

  function charger() {
    return Promise.all(Object.keys(LISTE).map((k) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { IMG[k] = im; res(); };
      im.onerror = () => res();           // absent : on utilisera la silhouette
      im.src = LISTE[k];
    })));
  }
  const img = (k) => IMG[k] || null;

  // ------------------------------------------------------------------ constantes de mise en scène
  const S = 0.85;                          // échelle des tables
  const TABLE_X = [330, 630, 930, 1230, 1530, 1780];
  const TABLE_TOP = 552;                   // haut du sprite de table
  const ORDRE_OUVERTURE = [2, 3, 1, 4, 0, 5];
  const CLIENT_CUT_Y = TABLE_TOP + 120 * S - 16;   // bord bas du client, caché derrière la nappe
  const Y_COULOIR = 880;                   // pieds du serveur dans le couloir
  const HATCH = { x: 152, y: 172, s: 0.95 };                  // passe-plats : creusé dans le mur du fond (remonté et agrandi au chantier 5)
  const HATCH_RECT = { x: 152, y: 172, w: 440, h: 267 };      // zone cliquable
  const HATCH_STAND = { x: 612, y: 478 };  // serveur au passe-plats (à droite du comptoir pour ne pas cacher les assiettes)
  const HATCH_PLATE = { x: 372, y: 380 };  // plats posés sur le comptoir
  const STAND_DX = -140;                   // le serveur se place à gauche de la table (il ne cache pas le client)
  const HATCH_ZONE = { x: 372, portee: 220 };   // au clavier : se placer dans cette zone du couloir, puis Espace
  const SERVEUR_H = 370;                   // hauteur du serveur au premier plan (les tables sont plus loin : il doit être plus grand qu'elles)
  const TRAY = { x: 62 * SERVEUR_H / 300, y: -232 * SERVEUR_H / 300 };   // plateau du serveur (repère local, serveur tourné vers la droite)
  const CLIENT_W = 200;                    // largeur de la toile du client (chantier 5 : 230 → 200, les clients paraissaient trop grands face au serveur)
  const CLIENT_ECH = { client_01_garcon: 0.92, client_02_papy: 1.15, client_03_bouclee: 1.0, client_04_blonde: 0.95, client_05_mamie: 0.92, client_06_moustachu: 1.2, client_07_critique: 1.05 };   // même taille de tête pour tous
  const PERS_LONG = ["1re personne du singulier", "2e personne du singulier", "3e personne du singulier", "1re personne du pluriel", "2e personne du pluriel", "3e personne du pluriel"];
  const PERS_COURT = [["1re pers.", "du sing."], ["2e pers.", "du sing."], ["3e pers.", "du sing."], ["1re pers.", "du plur."], ["2e pers.", "du plur."], ["3e pers.", "du plur."]];
  const MAIN_GAUCHE = ["client_01_garcon", "client_03_bouclee", "client_06_moustachu"];   // clients dont la main levée est à gauche (les autres : à droite)
  const RAIL = { x: 690, y: 14, w: 445 };
  const TEMPS_PAT = { normal: 1, lent: 0.5, sans: 0 };
  // Porte battante de la salle (mur du fond, entre le passe-plats et le rail) et position du serveur devant la porte
  const DOOR = { x: 590, y: 176, w: 140, h: 126 };
  const DOOR_STAND = { x: 652, y: 345 };
  // Cuisine (canvas 1920×1080) : 3 postes sur le sol, chef à gauche, passe-plats à droite, porte de retour à gauche
  const POSTES = [
    { k: 0, nom: "Marmite", tag: "1er groupe", couleur: "g1", x: 520, base: 700, debut: 1 },
    { k: 1, nom: "Plan de travail", tag: "2e groupe", couleur: "g2", x: 960, base: 700, debut: 6 },
    { k: 2, nom: "Plaque", tag: "3e groupe", couleur: "g3", x: 1400, base: 700, debut: 7 },
  ];
  const POSTE_IMG = ["marmite", "plan_travail", "plaque"];
  const CUIS_PORTE = { x: 8, y: 250, w: 224, h: 250 };        // porte battante de la cuisine (retour en salle)
  const CUIS_CHEF = { x: 305, base: 770, h: 255 };
  const CUIS_PASSE = { x: 1800, y: 290, s: 0.5 };              // passe-plats vu de la cuisine (dessiné en miroir ; x = bord droit)
  const poste_de = (couleur) => (couleur === "g1" ? 0 : couleur === "g2" ? 1 : 2);   // les auxiliaires (violet) se cuisent à la plaque, avec le 3e groupe

  // ------------------------------------------------------------------ réglages d'équilibrage (tout est ici)
  const BAL = {
    // Réglés par simulation (tools/test_profils.py) : élève moyen ≈ 5 min en Normal, élève en difficulté ≈ 5 min en Lent.
    patBase: 64, patPas: 4, patMin: 34,        // patience (s) = max(patMin, patBase − patPas × niveau)
    spawnBase: 14, spawnPas: 1.0, spawnServis: 0.08, spawnMin: 5.5,   // délai entre deux clients (s)
    clientsParNiveau: 8,                       // niveau +1 tous les N clients servis
    clientsParTable: 4,                        // une table de plus tous les N clients servis
    pourboireRefus: [1, 0.5, 0],               // part du pourboire (bonus de rapidité) selon le nombre de plats refusés avant le bon
    etoiles: [0.6, 0.85],                      // part de clients servis du premier coup pour 2 et 3 étoiles
    penalitePat: 0.2,                          // part de patience perdue à chaque erreur de forme
    // Barre de réputation (remplace les cœurs) : 0 = partie perdue, 100 = succès de presse (étoile du guide + article)
    repuDepart: 40, repuApresSucces: 55,
    repuServi: [3, 1, 0],                      // gain selon le nombre de plats refusés avant le bon (+ jusqu'à 2 points selon la patience restante si 0 refus)
    repuRefus: -4,                             // à chaque plat refusé
    repuFache: -12,                            // client parti fâché
    tablesDepart: 2,                           // tables ouvertes au début de la partie (max 6)
    // Cuisine (chantier 4) — réglages de départ, à ajuster après les essais en classe
    cuisineApres: 10,                          // la cuisine s'ouvre après N clients servis d'affilée (aucun client parti fâché entre-temps)
    cuisineProba: 0.6,                         // part des commandes à cuisiner une fois la cuisine ouverte (les autres restent des QCM en salle)
    cuisinePatMul: 1.5,                        // ces clients patientent plus longtemps (aller-retour par la porte, saisie, cuisson)
    cuisson: [3.2, 4.2, 5.2],                  // temps de cuisson (s) : marmite, plan de travail, plaque
    rateDuree: 3,                              // temps pendant lequel un poste reste bloqué après un plat raté
    bonusCuisine: 10,                          // points en plus pour un plat fait maison
  };
  const DUREES = [0, 3, 5, 10];                // 0 = partie classique (cœurs), sinon séance en minutes

  // Couleur et plat de chaque groupe : vert = 1er groupe, orange = 2e, rouge = 3e, violet = auxiliaires.
  // Le plat servi suit la couleur de la commande (salade, soupe, ragoût ; cloche pour le violet).
  const STYLE = {
    g1:  { brique: "brique_g1_verte",     plat: "plat_g1_salade", fond: "#4c8c4a", contour: "#1f4a22", fondContraste: "#12351a", ticket: "#2f6a2f", ticketContraste: "#004d00", tag: "1er gr." },
    g2:  { brique: "brique_g2_orange",    plat: "plat_g2_soupe",  fond: "#e8833a", contour: "#6e3708", fondContraste: "#4d2400", ticket: "#9a4f10", ticketContraste: "#6a3000", tag: "2e gr." },
    g3:  { brique: "brique_g3_rouge",     plat: "plat_g3_ragout", fond: "#d9473b", contour: "#5e1712", fondContraste: "#4d0c0c", ticket: "#a82e24", ticketContraste: "#7a0000", tag: "3e gr." },
    aux: { brique: "brique_aux_violette", plat: "plat_cloche",    fond: "#7b4b94", contour: "#37204d", fondContraste: "#2a1240", ticket: "#6a3f8f", ticketContraste: "#3f0f6a", tag: "aux." },
  };
  const style = (couleur) => STYLE[couleur] || STYLE.g1;
  const PLATS = Object.keys(STYLE).map((k) => STYLE[k].plat);                // 0 = partie classique (cœurs), sinon séance en minutes

  // ------------------------------------------------------------------ la campagne (chantier 7b) : 4 restaurants
  // groupes : verbes proposés (null = tous) ; debut/fin : niveaux de verbes ; coef : multiplicateur de pièces ; tint : teinte provisoire des images du village
  const RESTOS = [
    { id: 0, titre: "Bistrot de village", lieu: "Petit village de campagne", enseigne: ["Au passé", "pas si simple"], groupes: [1], debut: 1, fin: 5, tablesDepart: 2, tablesMax: 4, coef: 1, contenu: "1er groupe", tint: null, facade: "bg_titre", salle: "bg_salle" },
    { id: 1, titre: "Brasserie de la ville", lieu: "La ville", enseigne: ["La Brasserie", "du Passé"], groupes: [1, 2], debut: 6, fin: 6, tablesDepart: 3, tablesMax: 5, coef: 1.5, contenu: "2e groupe + rappel du 1er", tint: "#a9cbb8", facade: "bg_titre_2", salle: "bg_salle_2" },
    { id: 2, titre: "Grand restaurant", lieu: "La grande ville", enseigne: ["Le Grand", "Passé Simple"], groupes: [1, 2, 3], debut: 7, fin: 9, tablesDepart: 4, tablesMax: 6, coef: 2, contenu: "3e groupe + rappel", tint: "#c3b0dc", facade: "bg_titre_3", salle: "bg_salle_3" },
    { id: 3, titre: "Le Palace", lieu: "La capitale", enseigne: ["LE PALACE", "du Passé Simple"], groupes: [1, 2, 3], debut: 10, fin: 10, tablesDepart: 5, tablesMax: 6, coef: 3, contenu: "Tous les groupes, irréguliers", tint: "#f0d27a", facade: "bg_titre_4", salle: "bg_salle_4" },
  ];
  // ------------------------------------------------------------------ l'atelier déco (chantier 7c)
  // Chaque resto a sa propre déco, payée avec les pièces de la campagne (G.camp.argent). Les prix de base ci-dessous sont ceux du bistrot ;
  // ils sont multipliés par PRIX_RESTO : plus on monte, plus la déco coûte cher (plus vite que les pièces gagnées : coef 1 / 1,5 / 2 / 3).
  const PRIX_RESTO = [1, 2, 3.5, 6];
  const PAPIERS = [
    { id: "creme", nom: "Rayures crème", prix: 0, tint: null, pastille: "#f3e3b0" },
    { id: "rose", nom: "Rose poudré", prix: 100, tint: "#f2b8b8", pastille: "#f2b8b8" },
    { id: "sauge", nom: "Vert sauge", prix: 100, tint: "#b9d6b0", pastille: "#b9d6b0" },
    { id: "soleil", nom: "Jaune soleil", prix: 100, tint: "#ffd84a", pastille: "#ffd84a" },
    { id: "lilas", nom: "Lilas", prix: 100, tint: "#d4c1ec", pastille: "#d4c1ec" },
    { id: "abricot", nom: "Abricot", prix: 100, tint: "#ffb98a", pastille: "#ffb98a" },
  ];
  const NAPPES = [
    { id: "origine", nom: "Nappes d’origine", prix: 0, voile: null, pastille: "#d9473b" },
    { id: "pastel", nom: "Nappes pastel", prix: 150, voile: "rgba(255,255,255,0.40)", pastille: "#f2c9c0" },
    { id: "or", nom: "Nappes dorées", prix: 220, voile: "rgba(232,179,63,0.48)", pastille: "#e8b33f" },
    { id: "velours", nom: "Nappes velours", prix: 300, voile: "rgba(96,30,64,0.38)", pastille: "#8a3a66" },
  ];
  const OBJETS = [
    { id: "plante", nom: "Plante verte", prix: 120, img: "deco_plante" },
    { id: "lampe", nom: "Lampe de bistrot", prix: 180, img: "deco_lampe" },
    { id: "horloge", nom: "Horloge", prix: 240, img: "deco_horloge" },
    { id: "ardoise", nom: "Ardoise du jour", prix: 300, img: "deco_ardoise" },
  ];
  const CATALOGUE = [
    { cle: "papier", titre: "Papier peint", liste: PAPIERS },
    { cle: "nappes", titre: "Nappes", liste: NAPPES },
    { cle: "objet", titre: "Objets", liste: OBJETS },
  ];
  const prixDeco = (base, i) => Math.round(base * PRIX_RESTO[i] / 10) * 10;
  const decoVide = () => ({ papier: "creme", nappes: "origine", achats: [] });
  const parDefaut = (cle, id) => (cle === "papier" && id === "creme") || (cle === "nappes" && id === "origine");
  const possede = (d, cle, id) => parDefaut(cle, id) || d.achats.includes(cle + ":" + id);
  const choisi = (d, cle, id) => (cle === "objet" ? d.achats.includes("objet:" + id) : d[cle] === id);
  function decoLire(o) {                                         // lecture prudente de la déco sauvegardée
    const d = decoVide();
    if (!o || typeof o !== "object") return d;
    if (Array.isArray(o.achats)) d.achats = o.achats.filter((a, k) => typeof a === "string" && o.achats.indexOf(a) === k && CATALOGUE.some((C) => C.cle !== "objet" ? C.liste.some((it) => C.cle + ":" + it.id === a && it.prix > 0) : C.liste.some((it) => C.cle + ":" + it.id === a)));
    if (typeof o.papier === "string" && PAPIERS.some((p) => p.id === o.papier) && possede(d, "papier", o.papier)) d.papier = o.papier;
    if (typeof o.nappes === "string" && NAPPES.some((p) => p.id === o.nappes) && possede(d, "nappes", o.nappes)) d.nappes = o.nappes;
    return d;
  }
  const campVide = () => ({ argent: 0, restos: RESTOS.map((R, i) => ({ ouvert: i === 0, reussi: false, etoiles: 0, argent: 0, meilleur: 0, deco: decoVide() })) });
  function campLire(o) {                                         // lecture prudente de la sauvegarde
    const c = campVide(), n = (v, max) => (Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);
    if (!o || !Array.isArray(o.restos)) return c;
    c.argent = n(o.argent, 1e9);
    RESTOS.forEach((R, i) => { const r = o.restos[i]; if (r && typeof r === "object") c.restos[i] = { ouvert: i === 0 || !!r.ouvert, reussi: !!r.reussi, etoiles: n(r.etoiles, 3), argent: n(r.argent, 1e9), meilleur: n(r.meilleur, 1e9), deco: decoLire(r.deco) }; });
    return c;
  }

  // ------------------------------------------------------------------ état
  let rndSeed = (Date.now() % 2147483646) + 1;
  const rnd = () => (rndSeed = (rndSeed * 16807) % 2147483647) / 2147483647;
  const G = { keys: { gauche: false, droite: false }, mode: "accueil", tA: 0, sortie: 0, t: 0, chrono: "normal", duree: 0, groupe: 0, cuisine: 1, vue: "salle", trans: null, paused: false, muted: false, nom: "Chez Passé Simple", guide: [], camp: campVide(), resto: 0, accueilResto: 0, accueilSuite: "carte", libre: false, carteSel: 0, carteMsg: null, resetT: 0, retourDe: "title", lecture: null, saisieNom: "", mouse: { x: 0, y: 0 } };   // groupe : 0 = tous, 1, 2 ou 3
  let S_ = null;     // état de partie

  // ------------------------------------------------------------------ accessibilité : réglages mémorisés dans le navigateur
  const CLE = "resto_passe_simple_reglages_v1";
  const NOM_DEFAUT = "Chez Passé Simple";
  const TAILLES = [1, 1.15, 1.3];
  const A = { taille: 0, police: 0, contraste: 0, termin: 0, voix: 0, calme: 0, pronom: 1, son: 2, musique: 0 };
  try { if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) A.calme = 1; } catch (e) { /* tant pis */ }
  try {
    const sv = JSON.parse(localStorage.getItem(CLE) || "null");
    if (sv && sv.A) for (const k in A) if (typeof sv.A[k] === "number") A[k] = sv.A[k];
    if (sv && ["normal", "lent", "sans"].includes(sv.chrono)) G.chrono = sv.chrono;
    if (sv && [0, 3, 5, 10].includes(sv.duree)) G.duree = sv.duree;
    if (sv && [0, 1, 2, 3].includes(sv.groupe)) G.groupe = sv.groupe;
    if (sv && [0, 1].includes(sv.cuisine)) G.cuisine = sv.cuisine;
    if (sv && typeof sv.nom === "string" && sv.nom.trim()) G.nom = sv.nom.slice(0, 24);
    if (sv && sv.camp) G.camp = campLire(sv.camp);
    if (sv && Number.isInteger(sv.resto) && sv.resto >= 0 && sv.resto < RESTOS.length && G.camp.restos[sv.resto].ouvert) G.resto = sv.resto;
    G.carteSel = G.resto;
    if (sv && Array.isArray(sv.guide)) G.guide = sv.guide.filter((a) => a && Number.isInteger(a.id) && Array.isArray(a.v)).slice(0, 4);
  } catch (e) { /* pas de stockage : les réglages ne seront pas mémorisés */ }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify({ A, chrono: G.chrono, duree: G.duree, groupe: G.groupe, cuisine: G.cuisine, nom: G.nom, guide: G.guide, camp: G.camp, resto: G.resto })); } catch (e) { /* ignoré */ } }
  const ts = (n) => Math.round(n * TAILLES[A.taille]);                 // taille de texte réglable
  const FOND = () => (A.contraste ? "#ffffff" : "#f6e9cf");
  const ENCRE = () => (A.contraste ? "#000000" : "#4a2f22");

  // lecture à voix haute (synthèse vocale du navigateur)
  const voixOk = () => typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  function dire(t) {
    if (!voixOk() || G.muted) return;
    try { window.speechSynthesis.cancel(); const u = new window.SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = 0.85; window.speechSynthesis.speak(u); } catch (e) { /* ignoré */ }
  }
  function direCommande(cmd, avecChoix) {
    let t = cmd.verbe + ", " + PERS_LONG[cmd.p] + ", au passé simple.";
    if (avecChoix) cmd.choix.forEach((f, i) => { t += " " + (i + 1) + ", " + f + "."; });
    dire(t);
  }

  function ctxResto() {                                         // contenu de la partie : un resto de la campagne, ou l'entraînement libre
    if (!G.libre) return RESTOS[G.resto];
    const gr = VERBES.GROUPES[G.groupe];
    return { id: -1, libre: true, titre: "Entraînement libre", groupes: G.groupe ? [G.groupe] : null, debut: gr.debut, fin: gr.fin, tablesDepart: BAL.tablesDepart, tablesMax: 6, coef: 1, contenu: gr.titre };
  }
  function nouvellePartie() {
    const cx = ctxResto();
    S_ = {
      ctx: cx, succes: 0,
      score: 0, repu: BAL.repuDepart, repuAff: BAL.repuDepart, servis: 0, niveau: cx.debut, spawnT: 0.4, ticketId: 1, fin: 0,
      seance: G.duree > 0, reste: G.duree * 60, rep: 0, justes: 0, partis: 0, parfaits: 0, refus: 0, vus: [], article: null,
      tables: TABLE_X.map((x, i) => ({ i, x, client: null, plat: null, platT: 0 })),
      serveur: { x: 330, y: Y_COULOIR, dir: 1, path: [], task: null, pose: "idle", poseT: 0, carry: null, anim: 0, manuelT: 9 },
      tickets: [], panel: null, hatchQ: [], msgs: [], fx: [], erreurs: [], combo: 0, serie: 0, cuisines: 0,
      cuis: {
        ouverte: false, sel: null, saisie: null, cloche: 0,
        postes: POSTES.map((P) => ({ k: P.k, etat: "repos", t: 0, dur: 0, ticketId: null, table: -1, dish: null, cmd: null, sansBonus: false })),
        chef: { pose: "neutre", lignes: [], t: 0, dur: 0 },
      },
    };
    G.mode = "play"; G.vue = "salle"; G.trans = null; if (champ()) champ().blur();
    msg("Marche avec ← →, puis Espace pour agir", "1. Prends la commande   2. Va au passe-plats choisir la bonne assiette   3. Sers la bonne table. La souris marche aussi.", "info", 8);
  }
  const nbTables = () => Math.min(S_.ctx.tablesMax, S_.ctx.tablesDepart + Math.floor(S_.servis / BAL.clientsParTable));
  const tableActive = (i) => ORDRE_OUVERTURE.indexOf(i) < nbTables();
  // niveau de verbes : borné par le dernier niveau du groupe choisi (le niveau de jeu, lui, continue de monter : clients plus pressés)
  const niveauVerbes = () => Math.min(S_.ctx.fin, S_.niveau);
  const infoNiveau = () => VERBES.NIVEAUX[niveauVerbes()];
  const rythme = () => S_.niveau - S_.ctx.debut + 1;      // 1 au départ, quel que soit le groupe choisi

  // ------------------------------------------------------------------ sons (synthétisés : aucun fichier, aucune licence)
  // Rien ne démarre avant une action du joueur (règle des navigateurs) : le contexte audio n'est créé qu'au premier son demandé.
  let actx = null, bruitBuf = null;
  const VOL = [0, 0.45, 1];                       // Coupé / Bas / Normal (réglage « son »)
  function audio() {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  const muet = () => G.muted || !A.son;
  function bip(freq, dur, type, vol, delay) {
    if (muet()) return;
    try {
      const ac = audio(), o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + (delay || 0);
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime((vol || 0.08) * VOL[A.son], t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) { /* pas de son */ }
  }
  function bruit(dur, vol, delay, fc, type) {      // souffle filtré : plat posé, grésillement
    if (muet()) return;
    try {
      const ac = audio(), t0 = ac.currentTime + (delay || 0);
      if (!bruitBuf) { bruitBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = bruitBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = bruitBuf; src.loop = true; f.type = type || "lowpass"; f.frequency.value = fc || 2000;
      g.gain.setValueAtTime((vol || 0.05) * VOL[A.son], t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t0); src.stop(t0 + dur + 0.02);
    } catch (e) { /* pas de son */ }
  }
  const sonOk = () => { bip(660, 0.12, "triangle"); bip(990, 0.2, "triangle", 0.08, 0.1); };
  const sonKo = () => { bip(180, 0.3, "sawtooth", 0.07); bip(140, 0.25, "square", 0.04, 0.08); };
  const sonCloche = () => { bip(1568, 0.9, "sine", 0.06); bip(2349, 0.6, "sine", 0.035, 0.01); bip(3136, 0.4, "sine", 0.02, 0.02); };            // « ding » du passe-plats
  const sonClochette = () => { bip(1976, 0.35, "sine", 0.05); bip(2637, 0.5, "sine", 0.05, 0.16); };                                              // un client entre / appelle
  const sonPlat = () => { bip(130, 0.14, "sine", 0.12); bruit(0.07, 0.05, 0, 2600); };                                                              // assiette posée
  const sonCuisson = () => { bruit(0.9, 0.035, 0, 3500, "highpass"); };                                                                            // grésillement
  const sonClic = () => bip(520, 0.05, "square", 0.03);
  // musique d'ambiance : petite valse de bistrot (basse + accords), à 150 pulsations par minute, très douce
  const ACC = [[523.25, 659.25, 783.99], [440, 523.25, 659.25], [349.23, 440, 523.25], [392, 493.88, 587.33]];
  const BASSE = [130.81, 110, 87.31, 98];
  const mus = { next: 0, beat: 0 };
  function musiqueTick() {
    if (!A.musique || muet() || G.mode !== "play" || G.paused) return;
    try {
      const ac = audio();
      if (mus.next < ac.currentTime) mus.next = ac.currentTime + 0.05;
      while (mus.next < ac.currentTime + 0.7) {
        const t = mus.next - ac.currentTime, bar = Math.floor(mus.beat / 3) % 4, b = mus.beat % 3;
        if (b === 0) bip(BASSE[bar], 0.34, "triangle", 0.05, t); else ACC[bar].forEach((f) => bip(f, 0.2, "triangle", 0.014, t));
        mus.next += 0.4; mus.beat++;
      }
    } catch (e) { /* pas de son */ }
  }
  setInterval(musiqueTick, 250);

  // ------------------------------------------------------------------ guide gourmand : paliers, articles de presse
  // Paliers : mention (5 clients servis), puis 1, 2 et 3 étoiles après 3, 6 et 10 niveaux franchis, À CONDITION d'avoir servi
  // au moins 70 % des clients du premier coup (sinon le palier attend : la précision se rattrape).
  const GUIDE = { mentionApres: 5, bonusSucces: 50 };
  const aGagne = (id) => G.guide.some((a) => a.id === id);
  function changerRepu(d, x, y) {                          // réputation du resto, entre 0 et 100
    const avant = S_.repu; S_.repu = Math.max(0, Math.min(100, S_.repu + d));
    if (d && x !== undefined) fx({ img: d > 0 ? "fx_etoile" : "fx_croix", x, y, vy: -50, dur: 1.2, scale: 0.12, texte: (d > 0 ? "+" : "") + Math.round(S_.repu - avant) });
    if (S_.repu <= 0 && !S_.seance && !S_.fin) S_.fin = 1.4;
  }
  const sonFanfare = () => [523, 659, 784, 1047].forEach((f, k) => bip(f, 0.4, "triangle", 0.06, k * 0.13));
  function verbesDeLaPartie() {                         // trois formes servies (et justes) pendant la partie, pour personnaliser l'article
    const vus = [], vu = new Set();
    for (let i = S_.vus.length - 1; i >= 0 && vus.length < 3; i--) { const v = S_.vus[i]; if (!vu.has(v.verbe)) { vu.add(v.verbe); vus.push(v.texte); } }
    while (vus.length < 3) vus.push(PRESSE.PAR_DEFAUT[vus.length]);
    return vus.reverse();
  }
  function publier(id) {
    const v = verbesDeLaPartie();
    G.guide.push({ id, v, nom: G.nom }); sauver();
    S_.article = { id, v, nom: G.nom, t: 0 }; sonFanfare();
  }
  function verifierGuide() {
    if (!S_ || S_.article || !S_.servis) return;
    const cx = S_.ctx;
    if (!aGagne(0) && S_.servis >= GUIDE.mentionApres) { publier(0); return; }          // « table à retenir »
    if (S_.repu < 100) return;                                                            // succès de presse = barre de réputation pleine
    S_.repu = BAL.repuApresSucces; S_.succes++;
    if (cx.libre) { const suivant = PRESSE.ARTICLES.find((a) => !aGagne(a.id)); if (suivant) publier(suivant.id); else { msg("Succès de presse !", "", "ok", 3); sonFanfare(); } return; }
    const r = G.camp.restos[cx.id], premier = !r.reussi; r.reussi = true;
    const prime = Math.round(GUIDE.bonusSucces * cx.coef); S_.score += prime; r.argent += prime; G.camp.argent += prime;
    let ouvre = "";
    if (cx.id < RESTOS.length - 1 && !G.camp.restos[cx.id + 1].ouvert) { G.camp.restos[cx.id + 1].ouvert = true; ouvre = RESTOS[cx.id + 1].titre; }
    const art = Math.min(3, cx.id + 1);                                                   // un article par resto (le Palace garde l'article des 3 étoiles)
    if (!aGagne(art)) publier(art); else sonFanfare();
    sauver();
    msg("Succès de presse ! +" + prime + " pièces", ouvre ? "Nouveau restaurant ouvert : " + ouvre + " (retour à la carte à la fin du service)" : (premier ? "Resto réussi !" : "Continue : la barre repart de la moitié."), "ok", 5);
  }
  function etoilesFin() { const part = S_.servis ? S_.parfaits / S_.servis : 0; return !S_.servis ? 0 : part >= BAL.etoiles[1] ? 3 : part >= BAL.etoiles[0] ? 2 : 1; }
  function finir() {                                              // fin de partie : bilan enregistré dans la campagne
    G.mode = "over";
    if (S_.ctx.libre) return;
    const r = G.camp.restos[S_.ctx.id];
    r.etoiles = Math.max(r.etoiles, etoilesFin()); r.meilleur = Math.max(r.meilleur, S_.score); sauver();
  }
  const nbEtoilesGuide = () => G.guide.filter((a) => a.id >= 1).length;

  // ------------------------------------------------------------------ messages et effets
  const pv = (pronom, mot) => pronom + (pronom.endsWith("’") ? "" : " ") + mot;   // « J’aimai », « Tu chantas »
  function msg(texte, sous, kind, dur, note) { S_.msgs.push({ texte, sous: sous || "", note: note || "", kind: kind || "info", t: 0, dur: dur || 2.4 }); if (S_.msgs.length > 2) S_.msgs.shift(); }
  function fx(o) { o.t = 0; S_.fx.push(o); }

  // ------------------------------------------------------------------ clients
  function nouveauClient(table) {
    let vip = rnd() < 0.07;
    const pris = S_.tables.map((t) => t.client && t.client.slug).filter(Boolean);       // deux tables ne montrent jamais le même personnage
    const libres = CLIENTS.slice(0, 6).filter((c) => !pris.includes(c));
    const slug = vip && !pris.includes(CLIENTS[6]) ? CLIENTS[6] : libres[Math.floor(rnd() * libres.length)] || CLIENTS[Math.floor(rnd() * 6)];
    vip = slug === CLIENTS[6];
    const looks = { skin: ["#f1c9a5", "#d9a47a", "#a9714c", "#f6d5b5"], shirt: ["#e8b33f", "#4c8c4a", "#d9473b", "#e8833a", "#7b4b94", "#c76b8f"], hair: ["#5a3a29", "#2e2420", "#c9a24a", "#9a9a9a", "#a24a2b"] };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const patSec = Math.max(BAL.patMin, BAL.patBase - BAL.patPas * rythme()) * (vip ? 0.8 : 1);
    table.client = { slug, vip, state: "enter", t: 0, patience: 1, patSec, cmd: null, ticket: null, tries: 0, refus: [], corrige: false,
      look: { skin: pick(looks.skin), shirt: vip ? "#333" : pick(looks.shirt), hair: vip ? "#222" : pick(looks.hair) }, bob: rnd() * 6 };
  }
  const clientAttend = (c) => c.state === "call" || c.state === "order" || c.state === "wait";
  function smileyIdx(p) { return p > 0.85 ? 0 : p > 0.65 ? 1 : p > 0.45 ? 2 : p > 0.28 ? 3 : p > 0.12 ? 4 : 5; }

  function libererTable(table) { table.client = null; table.plat = null; table.platT = 0; table.refusT = 0; table.bulle = null; }

  function clientPart(table, colere) {
    const c = table.client; if (!c) return;
    if (c.ticket) S_.tickets = S_.tickets.filter((t) => t.id !== c.ticket);
    if (S_.panel && S_.panel.table === table.i) S_.panel = null;
    if (S_.dial && S_.dial.table === table.i) S_.dial = null;
    if (S_.serveur.carry && S_.serveur.carry.table === table.i) S_.serveur.carry = null;
    nettoyerCuisine(table.i, c.ticket);
    if (S_.serveur.task && S_.serveur.task.table === table.i && (S_.serveur.task.type === "goOrder" || S_.serveur.task.type === "goChoix")) { S_.serveur.task = null; S_.serveur.path = []; }
    if (colere) {
      S_.combo = 0; S_.partis++; S_.serie = 0;
      c.state = "leave"; c.t = 0; c.angry = true; sonKo();
      changerRepu(BAL.repuFache, table.x, 470);
      msg(S_.seance ? "Un client est parti sans être servi." : "Un client est parti fâché !", "La réputation du resto baisse.", "bad", 2.4);
    } else { c.state = "leave"; c.t = 0; }
  }

  // ------------------------------------------------------------------ serveur
  function allerVers(sv, tx, ty) {
    const path = [];
    if (sv.y < Y_COULOIR - 2 && Math.abs(sv.x - tx) > 2) path.push({ x: sv.x, y: Y_COULOIR });   // redescendre dans le couloir
    path.push({ x: tx, y: Y_COULOIR });
    if (ty !== Y_COULOIR) path.push({ x: tx, y: ty });
    sv.path = path;
  }
  const serveurOccupe = () => !!S_.serveur.task || S_.serveur.path.length > 0 || S_.serveur.poseT > 0;

  function demanderPrise(i) {
    const sv = S_.serveur, tb = S_.tables[i], c = tb.client;
    if (!c || c.state !== "call") return;
    if (sv.carry) { msg("Dépose d’abord ton plat !", "", "info", 1.6); return; }
    if (serveurOccupe()) return;
    sv.task = { type: "goOrder", table: i };
    allerVers(sv, tb.x + STAND_DX, Y_COULOIR);
    sonClic();
  }

  // Prise de commande = petit dialogue : le client choisit un verbe sur la carte, le serveur demande « pour la cuisson ? »,
  // le client donne la personne. Le serveur va ensuite au passe-plats choisir l'assiette (la bonne forme conjuguée).
  const DIAL_N = 3;
  function ligneDialogue(d) {
    const c = S_.tables[d.table].client, cmd = c.cmd;
    if (d.step === 0) return { qui: "client", haut: "Je voudrais :", gros: cmd.verbe.toUpperCase(), couleur: style(cmd.couleur).contour, voix: "Je voudrais " + cmd.verbe + "." };
    if (d.step === 1) return { qui: "serveur", haut: "C’est noté ! Et pour la cuisson ?", voix: "C’est noté. Et pour la cuisson ?" };
    return { qui: "client", haut: "À la " + PERS_LONG[cmd.p] + ".", bas: A.pronom ? "(" + LIBELLE_PERSONNE(cmd.p) + ")" : "", voix: "À la " + PERS_LONG[cmd.p] + "." };
  }
  function direDialogue() { if (A.voix && S_.dial) dire(ligneDialogue(S_.dial).voix); }
  function arriveePrise(i) {
    const tb = S_.tables[i], c = tb.client, sv = S_.serveur;
    sv.task = null;
    if (!c || c.state !== "call") return;
    if (!c.cmd) {
      c.cmd = VERBES.nouvelleCommande(niveauVerbes(), rnd, S_.ctx.groupes);
      c.ticket = S_.ticketId++;
      c.cuisine = S_.cuis.ouverte && rnd() < BAL.cuisineProba;
      S_.tickets.push({ id: c.ticket, table: i, cmd: c.cmd, cuisine: c.cuisine, etat: "attente" });
    }
    c.state = "order"; c.etape = "dial"; sv.pose = "idle"; sv.dir = 1;
    S_.dial = { table: i, step: 0 };
    direDialogue();
  }
  function avancerDialogue() {
    const d = S_.dial; if (!d) return;
    d.step++; sonClic();
    if (d.step >= DIAL_N) { finDialogue(d.table); return; }
    direDialogue();
  }
  function finDialogue(i) {
    const c = S_.tables[i].client, sv = S_.serveur;
    S_.dial = null;
    if (!c) return;
    c.state = "wait";
    if (c.cuisine) {                         // plat à fabriquer en cuisine : pas d'assiette à choisir, le client attend
      c.etape = "cuisine"; c.patSec *= BAL.cuisinePatMul;
      msg("Commande à cuisiner !", "Passe la porte battante (touche C) : " + cmdTexte(c.cmd) + ", au passé simple.", "info", 3.6);
      if (A.voix) direCommande(c.cmd, false);
      return;
    }
    c.etape = "choix";
    msg("Va au passe-plats !", "Choisis l’assiette avec le bon verbe, bien conjugué.", "info", 3.2);
    sv.task = { type: "goChoix", table: i };
    allerVers(sv, HATCH_STAND.x, HATCH_STAND.y);
  }
  const cmdTexte = (cmd) => cmd.verbe.toUpperCase() + ", " + PERS_LONG[cmd.p];
  const commandesEnAttente = () => S_.tickets.filter((t) => { const c = S_.tables[t.table].client; return c && c.ticket === t.id && c.etape === "choix"; });
  function demanderChoix(i) {                // aller au passe-plats choisir l'assiette de la table i
    const sv = S_.serveur;
    if (serveurOccupe() || S_.panel || S_.dial) return;
    if (sv.carry) { msg("Sers d’abord ton plat !", "", "info", 1.6); return; }
    sv.task = { type: "goChoix", table: i };
    allerVers(sv, HATCH_STAND.x, HATCH_STAND.y);
    sonClic();
  }
  function agirAuPasse() {
    const sv = S_.serveur;
    if (serveurOccupe() || S_.panel || S_.dial) return;
    const att = commandesEnAttente();
    if (sv.carry) { msg("Sers d’abord ton plat !", "", "info", 1.6); return; }
    if (att.length) { demanderChoix(att[0].table); return; }
    if (S_.hatchQ.length) { sv.task = { type: "goHatch", table: S_.hatchQ[0].table }; allerVers(sv, HATCH_STAND.x, HATCH_STAND.y); sonClic(); return; }
    msg("Rien à faire au passe-plats pour l’instant.", "", "info", 1.8);
  }
  function arriveeChoix() {
    const t = S_.serveur.task; S_.serveur.task = null;
    if (t) ouvrirChoix(t.table);
  }
  function ouvrirChoix(i) {
    const sv = S_.serveur, c = S_.tables[i].client;
    if (!c || c.etape !== "choix" || S_.panel) return;
    if (sv.carry) { msg("Dépose d’abord ton plat !", "", "info", 1.6); return; }
    const cmd = Object.assign({}, c.cmd, { choix: c.cmd.choix.filter((f) => !c.refus.includes(f)) });          // les assiettes déjà refusées ont été enlevées
    S_.panel = { table: i, cmd, focus: 0, clavier: false, feedback: null, t0: G.t };
    if (c.refus.length === 2 && !c.corrige) { c.corrige = true; S_.panel.feedback = { corr: true }; }          // au 2e refus : la bonne forme et la règle
    sv.pose = "idle";
    if (A.voix) direCommande(c.cmd, true);
  }

  // Message d'erreur : la bonne forme et la règle, jamais la forme fautive (elle ne doit pas s'imprimer dans la mémoire visuelle).
  function messageErreur(cmd) {
    const r = cmd.regle, notes = [];
    if (r.circonflexe) notes.push("Accent circonflexe sur le " + r.lettre + " : nous / vous.");
    if (r.note) notes.push(r.note);
    msg("Oh non, un plat raté !", "Il fallait : " + pv(cmd.pronom, cmd.bonne) + "      " + r.texte, "bad", notes.length ? 6.2 : 4.6, notes.join(" "));
  }

  function choisir(idx) {
    const p = S_.panel; if (!p || p.feedback) return;
    const tb = S_.tables[p.table], c = tb.client, sv = S_.serveur;
    if (!c) { S_.panel = null; return; }
    const choix = p.cmd.choix[idx];
    S_.rep++;
    if (choix === p.cmd.bonne) {
      S_.justes++; S_.panel = null; sonOk();
      c.etape = "plat";
      sv.carry = { table: p.table, dish: style(p.cmd.couleur).plat, cuisine: false, sansBonus: false };
      sv.pose = "content"; sv.poseT = 0.6;
      msg("Bravo, la bonne assiette !", "Porte-la à la table " + (p.table + 1) + " (regarde ton ticket).", "ok", 2.8);
    } else {                                  // mauvaise assiette : on ne le dit pas, c'est le client qui réagira à la table
      S_.erreurs.push({ pronom: p.cmd.pronom, verbe: p.cmd.verbe, bonne: p.cmd.bonne, choisie: choix, regle: p.cmd.regle, niveau: p.cmd.niveau });
      S_.panel = null; sonClic();
      c.etape = "plat";
      sv.carry = { table: p.table, dish: style(p.cmd.couleur).plat, cuisine: false, sansBonus: false, mauvais: true, forme: choix };
      sv.pose = "content"; sv.poseT = 0.6;
      msg("Porte-la à la table " + (p.table + 1) + " (regarde ton ticket).", "", "info", 2.4);
    }
  }
  function reessayer() {                      // après la correction : retour aux assiettes restantes
    const p = S_.panel; if (!p || !p.feedback) return;
    p.feedback = null; p.focus = 0; p.clavier = false; p.t0 = G.t; sonClic();
    if (A.voix) direCommande(p.cmd, true);
  }

  function demanderService(i) {
    const sv = S_.serveur;
    if (!sv.carry) return;
    if (serveurOccupe()) return;
    sv.task = { type: "goTable", table: i };
    allerVers(sv, S_.tables[i].x + STAND_DX, Y_COULOIR);
    sonClic();
  }

  function arriveeService(i) {
    const sv = S_.serveur, tb = S_.tables[i], carry = sv.carry;
    sv.task = null;
    if (!carry) return;
    sv.dir = 1;
    if (carry.table !== i || !tb.client) {
      sv.pose = "oups"; sv.poseT = 0.9; sonKo();
      msg("Ce n’est pas la bonne table !", "Regarde le numéro sur le ticket : table " + (carry.table + 1) + ".", "bad", 2.6);
      return;
    }
    const c = tb.client;
    if (carry.mauvais) {                      // le client refuse : ce n'est pas ce qu'il a commandé
      const autre = VERBES.autreVerbe(c.cmd, carry.forme);
      sv.carry = null; c.refus.push(carry.forme); c.tries++; S_.refus++; S_.combo = 0;
      c.patience = Math.max(0.06, c.patience - BAL.penalitePat);
      tb.plat = carry.dish; tb.refusT = 1.5; sonPlat(); sonKo();
      const pc = PERS_COURT[c.cmd.p];                                   // le client refuse, puis répète sa demande
      tb.bulle = { lignes: (autre ? ["Ce n’est pas le plat", "que j’ai demandé !"] : ["Ce n’est pas", "la bonne cuisson !"]).concat(["Je voulais « " + c.cmd.verbe + " »,", pc[0] + " " + pc[1]]), t: 0, dur: 4.6 };
      sv.pose = "oups"; sv.poseT = 0.9;
      changerRepu(BAL.repuRefus, tb.x, 470);
      if (A.voix) dire(tb.bulle.lignes.join(" "));
      if (carry.cuisine) {                                              // plat écrit à la main : il faut le refaire en cuisine
        c.etape = "cuisine"; const tk = ticketPar(c.ticket); if (tk) tk.etat = "attente";
        if (c.refus.length === 2 && !c.corrige) { c.corrige = true; messageErreur(c.cmd); }
        else msg("Plat refusé !", "Retourne en cuisine (touche C) : le ticket est de nouveau à cuisiner.", "bad", 3.4);
      } else { c.etape = "choix"; msg("Plat refusé !", "Retourne au passe-plats : il reste d’autres assiettes.", "bad", 3); }
      return;
    }
    const nr = c.refus.length, coef = BAL.pourboireRefus[Math.min(nr, BAL.pourboireRefus.length - 1)];
    const bonus = carry.sansBonus ? 0 : Math.round(10 * c.patience * coef);
    if (!nr) S_.parfaits++;
    if (c.cmd) S_.vus.push({ verbe: c.cmd.verbe, texte: pv(c.cmd.pronom.charAt(0).toLowerCase() + c.cmd.pronom.slice(1), c.cmd.bonne) });
    const gain = Math.round(((10 + bonus) * (c.vip ? 2 : 1) + (S_.combo >= 2 ? 5 : 0) + (carry.cuisine ? BAL.bonusCuisine : 0)) * S_.ctx.coef);   // pièces × coefficient du resto
    if (!S_.ctx.libre) { const r = G.camp.restos[S_.ctx.id]; r.argent += gain; G.camp.argent += gain; r.meilleur = Math.max(r.meilleur, S_.score + gain); }
    S_.score += gain; S_.combo++; S_.servis++; S_.serie++;
    sv.carry = null;
    tb.plat = carry.dish; tb.platT = 0; sonPlat();
    if (c.ticket) S_.tickets = S_.tickets.filter((t) => t.id !== c.ticket);
    c.state = "eat"; c.t = 0;
    sv.pose = "content"; sv.poseT = 0.9;
    sonCloche();
    fx({ img: "fx_piece", x: tb.x + 60, y: 500, vy: -80, dur: 1.4, scale: 0.28, texte: "+" + gain });
    if (!A.calme) for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2 + 0.4; fx({ img: "fx_etoile", x: tb.x + Math.cos(an) * 20, y: 560 + Math.sin(an) * 10, vx: Math.cos(an) * 170, vy: Math.sin(an) * 140 - 60, dur: 0.8, scale: 0.13 }); }       // étincelles
    changerRepu(BAL.repuServi[Math.min(nr, BAL.repuServi.length - 1)] + (nr ? 0 : Math.round(2 * c.patience)), tb.x - 60, 500);
    verifierGuide();
    if (S_.servis % BAL.clientsParNiveau === 0) {
      S_.niveau++;
      const n = S_.niveau <= S_.ctx.fin ? VERBES.NIVEAUX[S_.niveau] : null;
      msg("Niveau " + S_.niveau + " !", n ? "Nouveaux verbes : " + n.titre + " (" + n.detail + ")" : "Les clients sont plus pressés !", "ok", 3.4);
    }
    else if (S_.servis % BAL.clientsParTable === 0 && S_.ctx.tablesDepart + S_.servis / BAL.clientsParTable <= S_.ctx.tablesMax) msg("Une nouvelle table est ouverte !", "", "ok", 2.2);
    if (G.cuisine && !S_.cuis.ouverte && S_.serie >= BAL.cuisineApres) {
      S_.cuis.ouverte = true;
      msg("La cuisine est ouverte !", "Certaines commandes sont à cuisiner toi-même : passe la porte battante (touche C).", "ok", 5.5);
      sonCloche();
    }
  }

  function arriveeComptoir() {
    const sv = S_.serveur, t = sv.task;
    sv.task = null;
    if (!t || sv.carry) return;
    const e = S_.hatchQ.find((h) => h.table === t.table) || S_.hatchQ[0];
    if (!e) return;
    S_.hatchQ = S_.hatchQ.filter((h) => h !== e);
    sv.carry = { table: e.table, dish: e.dish, cuisine: !!e.cuisine, sansBonus: !!e.sansBonus, mauvais: !!e.mauvais, forme: e.forme };
    sonCloche();
  }

  // ------------------------------------------------------------------ mise à jour
  function update(dt) {
    G.t += dt;
    if (G.mode === "accueil") { G.tA += dt; if (G.sortie > 0) { G.sortie -= dt; if (G.sortie <= 0) { G.sortie = 0; G.mode = G.accueilSuite || "title"; } } return; }
    if (S_ && S_.article && G.mode === "play") { S_.article.t += dt; return; }        // l'article de presse fige le jeu
    if (G.mode !== "play") return;
    if (S_) S_.repuAff += (S_.repu - S_.repuAff) * Math.min(1, dt * 4);
    const s = S_, sv = s.serveur, rate = TEMPS_PAT[G.chrono];

    if (s.fin > 0) { s.fin -= dt; if (s.fin <= 0) finir(); }
    if (s.seance && G.mode === "play") { s.reste -= dt; if (s.reste <= 0) { s.reste = 0; s.panel = null; finir(); return; } }

    // apparition des clients
    if (s.fin <= 0) {
      s.spawnT -= dt;
      if (s.spawnT <= 0) {
        const libres = s.tables.filter((t) => tableActive(t.i) && !t.client);
        const actifs = s.tables.filter((t) => t.client).length;
        if (libres.length && actifs < 1 + Math.ceil(nbTables() * 0.75)) nouveauClient(libres[Math.floor(rnd() * libres.length)]);
        s.spawnT = Math.max(BAL.spawnMin, BAL.spawnBase - rythme() * BAL.spawnPas - s.servis * BAL.spawnServis) * (0.8 + rnd() * 0.5);
      }
    }

    // clients
    for (const tb of s.tables) {
      const c = tb.client; if (!c) continue;
      c.t += dt;
      if (tb.bulle) { tb.bulle.t += dt; if (tb.bulle.t > tb.bulle.dur) tb.bulle = null; }
      if (tb.refusT > 0) { tb.refusT -= dt; if (tb.refusT <= 0) { tb.plat = null; if (c.etape === "choix" && !S_.panel && !S_.dial) demanderChoix(tb.i); } }     // l'assiette refusée est enlevée, le serveur repart au passe-plats
      if (tb.platT > 0) { tb.platT -= dt; if (tb.platT <= 0 && tb.plat === "plat_rate") tb.plat = null; }
      if (c.state === "enter" && c.t > 0.7) { c.state = "call"; c.t = 0; sonClochette(); }
      else if (clientAttend(c)) {
        if (!(S_.dial && S_.dial.table === tb.i)) c.patience -= (dt / c.patSec) * rate;       // pendant le dialogue, le client patiente
        if (c.patience <= 0) { c.patience = 0; clientPart(tb, true); }
      } else if (c.state === "eat") {
        if (c.t > 1.4 && PLATS.includes(tb.plat)) tb.plat = "assiette_vide";
        if (c.t > 3.2) { tb.plat = null; clientPart(tb, false); }
      } else if (c.state === "leave" && c.t > 0.8) libererTable(tb);
    }

    // serveur : déplacement le long du chemin
    const presse = rate > 0 && !A.calme && s.tables.some((tb) => tb.client && clientAttend(tb.client) && tb.client.patience < 0.3);       // un client s'impatiente : le serveur accélère le pas
    sv.anim += dt * (presse ? 1.3 : 1); if (sv.marcheT > 0) sv.marcheT -= dt;
    if (sv.poseT > 0) { sv.poseT -= dt; if (sv.poseT <= 0) sv.pose = "idle"; }
    if (sv.path.length) {
      const w = sv.path[0], dx = w.x - sv.x, dy = w.y - sv.y, d = Math.hypot(dx, dy), v = 640 * dt * (presse ? 1.25 : 1);
      if (d <= v) { sv.x = w.x; sv.y = w.y; sv.path.shift(); if (!sv.path.length) arrivee(); }
      else { sv.x += (dx / d) * v; sv.y += (dy / d) * v; if (Math.abs(dx) > 1) sv.dir = dx > 0 ? 1 : -1; }
    }

    majCuisine(dt);
    if (G.trans) {
      G.trans.t += dt;
      if (!G.trans.fait && G.trans.t >= 0.22) { G.trans.fait = true; G.vue = G.trans.vers; entrerVue(); }
      if (G.trans.t >= 0.44) G.trans = null;
    }
    marcheManuelle(dt);
    // un plat attend au passe-plats : le serveur libre va le chercher (sauf si le joueur marche au clavier)
    if (G.vue === "salle" && !G.trans && !s.panel && !s.dial && s.hatchQ.length && !sv.carry && !serveurOccupe() && s.fin <= 0 && sv.manuelT > 1.2) {
      sv.task = { type: "goHatch", table: s.hatchQ[0].table };
      allerVers(sv, HATCH_STAND.x, HATCH_STAND.y);
    }

    // effets et messages
    for (const f of s.fx) { f.t += dt; f.y += (f.vy || 0) * dt; f.x += (f.vx || 0) * dt; }
    s.fx = s.fx.filter((f) => f.t < f.dur);
    for (const m of s.msgs) m.t += dt;
    s.msgs = s.msgs.filter((m) => m.t < m.dur);
  }

  // Marche au clavier : flèches gauche / droite dans le couloir, Espace (ou Entrée) pour agir à l'endroit où l'on se trouve.
  const XMIN = 110, XMAX = 1830, PORTEE = 175;
  function marcheManuelle(dt) {
    const sv = S_.serveur, dir = (G.keys.droite ? 1 : 0) - (G.keys.gauche ? 1 : 0);
    sv.manuelT += dt;
    if (!dir || G.vue !== "salle" || G.trans || S_.panel || S_.dial || G.paused || S_.fin > 0) return;
    sv.manuelT = 0; sv.task = null; sv.path = [];                                  // le clavier reprend la main sur un déplacement lancé à la souris
    sv.dir = dir; sv.x = Math.max(XMIN, Math.min(XMAX, sv.x + dir * 640 * dt));
    if (sv.y < Y_COULOIR) sv.y = Math.min(Y_COULOIR, sv.y + 640 * dt);
    sv.anim += dt; sv.marcheT = 0.12;
  }
  function tableProche() {                         // table devant laquelle se trouve le serveur (dans le couloir)
    const sv = S_.serveur; if (sv.y < Y_COULOIR - 6) return -1;
    let best = -1, bd = PORTEE;
    for (const tb of S_.tables) if (tableActive(tb.i) && Math.abs(sv.x - tb.x) < bd) { bd = Math.abs(sv.x - tb.x); best = tb.i; }
    return best;
  }
  const auPasse = () => { const sv = S_.serveur; return Math.abs(sv.x - HATCH_ZONE.x) < HATCH_ZONE.portee && (sv.y >= Y_COULOIR - 6 || sv.y <= HATCH_STAND.y + 10); };
  function agirSurPlace() {
    const sv = S_.serveur; if (G.vue !== "salle" || G.trans || S_.fin > 0) return;
    if (S_.dial) { avancerDialogue(); return; }
    if (S_.panel) return;
    if (sv.task || sv.path.length || sv.poseT > 0) return;
    const i = tableProche();
    if (i >= 0) {
      if (sv.carry) { arriveeService(i); return; }
      const c = S_.tables[i].client;
      if (c && c.state === "call") { arriveePrise(i); return; }
    }
    if (auPasse() && (commandesEnAttente().length || S_.hatchQ.length || sv.carry)) { agirAuPasse(); return; }
    if (i < 0) msg(sv.carry ? "Place-toi devant une table (← →), puis Espace." : "Place-toi devant un client qui lève la main (← →), puis Espace.", "", "info", 2.2);
    else msg("Ce client n’a pas besoin de toi pour l’instant.", "", "info", 1.8);
  }

  function arrivee() {
    const t = S_.serveur.task; if (!t) return;
    if (t.type === "goOrder") arriveePrise(t.table);
    else if (t.type === "goChoix") arriveeChoix();
    else if (t.type === "goHatch") arriveeComptoir();
    else if (t.type === "goTable") arriveeService(t.table);
    else if (t.type === "goDoor") { S_.serveur.task = null; changerVue("cuisine"); }
  }

  // ------------------------------------------------------------------ dessin : utilitaires
  function dessiner(k, x, y, sx, sy, ancre) {
    const im = img(k); if (!im) return false;
    sy = sy === undefined ? sx : sy;
    const w = im.width * sx, h = im.height * sy;
    const ax = ancre === "bas" ? x - w / 2 : ancre === "centre" ? x - w / 2 : x;
    const ay = ancre === "bas" ? y - h : ancre === "centre" ? y - h / 2 : y;
    ctx.drawImage(im, ax, ay, w, h); return true;
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function texte(t, x, y, taille, couleur, align, contour, poids) {
    ctx.font = (poids || "bold") + " " + taille + "px " + (A.police ? "Verdana, Tahoma, 'Trebuchet MS', sans-serif" : "'Trebuchet MS', Verdana, sans-serif");
    if ("letterSpacing" in ctx) ctx.letterSpacing = A.police ? Math.max(1, Math.round(taille * 0.07)) + "px" : "0px";
    ctx.textAlign = align || "center"; ctx.textBaseline = "middle";
    if (contour) { ctx.lineWidth = Math.max(3, taille / 7); ctx.strokeStyle = contour; ctx.lineJoin = "round"; ctx.strokeText(t, x, y); }
    ctx.fillStyle = couleur || "#fff"; ctx.fillText(t, x, y);
  }
  function neuf(k, x, y, w, h, b) {   // cadre extensible à 9 morceaux
    const im = img(k);
    if (!im) { ctx.fillStyle = "#8b5a3c"; rr(x, y, w, h, 18); ctx.fill(); ctx.fillStyle = "#f6e9cf"; rr(x + 12, y + 12, w - 24, h - 24, 10); ctx.fill(); return; }
    const sw = im.width, sh = im.height, d = b;
    const xs = [0, d, sw - d, sw], ys = [0, d, sh - d, sh], X = [x, x + d, x + w - d, x + w], Y = [y, y + d, y + h - d, y + h];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
      ctx.drawImage(im, xs[c], ys[r], xs[c + 1] - xs[c], ys[r + 1] - ys[r], X[c], Y[r], X[c + 1] - X[c], Y[r + 1] - Y[r]);
  }

  // ------------------------------------------------------------------ dessin : décor et personnages
  // déco du resto en cours de dessin (papier peint, nappes, objets) : posée par rendre() ou par l'aperçu de l'atelier
  let decoRendu = null;
  const nappeCache = {};
  function tableImg(col) {                                       // table avec la nappe choisie (voile de couleur, mis en cache)
    const base = img("table_" + col), id = decoRendu ? decoRendu.nappes : "origine", N = NAPPES.find((x) => x.id === id);
    if (!base || !N || !N.voile) return base;
    const k = col + "|" + id;
    if (!nappeCache[k]) {
      const c = document.createElement("canvas"); c.width = base.width; c.height = base.height;
      const x = c.getContext("2d"); x.drawImage(base, 0, 0); x.globalCompositeOperation = "source-atop"; x.fillStyle = N.voile; x.fillRect(0, 0, c.width, c.height);
      nappeCache[k] = c;
    }
    return nappeCache[k];
  }
  // murs tapissés de la salle : fond (avec la fenêtre-vitrine), mur gauche, mur droit — le lambris n'est pas touché
  const MURS = [
    [[155, 42], [1768, 42], [1768, 212], [1752, 212], [1738, 262], [1245, 262], [1232, 212], [155, 212]],
    [[0, 8], [152, 42], [152, 215], [0, 322]],
    [[1768, 42], [1920, 8], [1920, 322], [1768, 215]],
  ];
  function papierPeint(d) {
    const P = d && PAPIERS.find((p) => p.id === d.papier);
    if (!P || !P.tint) return;
    ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = P.tint;
    MURS.forEach((m) => { ctx.beginPath(); m.forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill(); });
    ctx.restore();
  }
  function dessinerObjets(d) {                                   // les objets achetés (chacun à sa place sur le mur ou dans le coin)
    if (!d) return;
    const a = (id) => d.achats.includes("objet:" + id);
    if (a("plante") && img("deco_plante")) dessiner("deco_plante", 100, 640, 0.34, 0.34, "bas");
    if (a("lampe") && img("deco_lampe")) dessiner("deco_lampe", 1195 - img("deco_lampe").width * 0.4 / 2, 34, 0.4, 0.4, "haut");
    if (a("horloge") && img("deco_horloge")) dessiner("deco_horloge", 1810 - img("deco_horloge").width * 0.4 / 2, 92, 0.4, 0.4, "haut");
    if (a("ardoise") && img("deco_ardoise")) dessiner("deco_ardoise", ARDOISE.x - img("deco_ardoise").width * ARDOISE.s / 2, ARDOISE.y, ARDOISE.s, ARDOISE.s, "haut");
  }
  const ARDOISE = { x: 520, y: 50, s: 0.40 };      // mur du fond, à droite du tableau de bord (HUD) et au-dessus du passe-plats
  function dessinerTable(tb) {
    const col = COULEURS[tb.i], g = GEOM[col], tab = tableImg(col);
    if (!tab) return;
    const tx = tb.x - tab.width * S / 2, ty = TABLE_TOP;
    // chaise + client derrière la table
    if (tb.client) {
      dessiner("chaise", tb.x, ty + 60 * S + 120, 0.70, 0.70, "bas");
      dessinerClient(tb);
    }
    ctx.drawImage(tab, tx, ty, tab.width * S, tab.height * S);
    // plaque de numéro
    dessiner("plaque_numero", tb.x, ty + 148 * S, 0.17, 0.17, "centre");
    texte(String(tb.i + 1), tb.x, ty + 148 * S + 1, 24, "#5a3a29");
    // plat posé sur le plateau
    if (tb.plat) {
      const sx = g.plateau.w * 0.92 * S / 388;
      dessiner(tb.plat, tx + g.plateau.cx * S, ty + (g.plateau.y1 + 2) * S, sx, sx * 0.72, "bas");
    }
    // smiley d'humeur
    if (tb.client && (clientAttend(tb.client))) {
      const c = tb.client, k = ["smiley_1_ravi", "smiley_2_content", "smiley_3_neutre", "smiley_4_presse", "smiley_5_mecontent", "smiley_6_furieux"][smileyIdx(c.patience)];
      const rebond = A.calme ? 0 : Math.sin(G.t * (c.patience < 0.3 ? 9 : 3) + tb.i) * (c.patience < 0.3 ? 5 : 2);
      const mainG = !img(c.slug + "_appel") || MAIN_GAUCHE.includes(c.slug);      // le smiley se met du côté opposé à la main levée
      dessiner(k, tb.x + (mainG ? 98 : -98), 470 + rebond, 0.24, 0.24, "centre");
    }
    if (tb.bulle) {                           // le client parle
      const b = tb.bulle, a = Math.min(1, b.t / 0.15, (b.dur - b.t) / 0.3), bx = Math.max(165, Math.min(W - 165, tb.x)), by = 372;
      ctx.save(); ctx.globalAlpha = Math.max(0, a);
      const nl = b.lignes.length, hb = 20 + nl * 32, hy = by + 44 - hb;
      ctx.fillStyle = "#fff8e8"; rr(bx - 165, hy, 330, hb, 18); ctx.fill(); ctx.strokeStyle = "#d9473b"; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = "#fff8e8"; ctx.beginPath(); ctx.moveTo(bx - 14, by + 43); ctx.lineTo(bx + 14, by + 43); ctx.lineTo(bx, by + 66); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(bx - 12, by + 38, 24, 8);
      b.lignes.forEach((l, k) => texte(l, bx, hy + 26 + k * 32, 25, k < 2 ? "#b3261e" : "#4a2f22"));
      ctx.restore();
    }
    if (tb.client && tb.client.vip && tb.client.state !== "leave") texte("VIP", tb.x, 390, 26, "#e8b33f", "center", "#5a3a29");
  }

  function dessinerClient(tb) {
    const c = tb.client, x = tb.x, y = CLIENT_CUT_Y;
    let a = 1;
    if (c.state === "enter") a = Math.min(1, c.t / 0.6);
    if (c.state === "leave") a = Math.max(0, 1 - c.t / 0.8);
    ctx.save(); ctx.globalAlpha = a;
    const appel = c.state === "call" && (A.calme || Math.sin(G.t * 6 + tb.i) > 0);   // calme : la main reste levée, sans clignoter
    const sprite = img(c.slug + (appel ? "_appel" : "_attente")) || img(c.slug + "_attente");
    const montee = c.state === "enter" && !A.calme ? Math.pow(1 - Math.min(1, c.t / 0.6), 3) * 60 : 0;      // il glisse jusqu'à sa chaise
    const resp = (A.calme ? 0 : Math.sin(G.t * 2 + c.bob) * 2) + montee;
    if (sprite) {
      const sc = CLIENT_W * (CLIENT_ECH[c.slug] || 1) / (img(c.slug + "_attente") || sprite).width;
      ctx.drawImage(sprite, x - sprite.width * sc / 2, y - sprite.height * sc + resp, sprite.width * sc, sprite.height * sc);
    } else silhouetteClient(x, y + resp, c, appel);
    ctx.restore();
  }

  function silhouetteClient(x, y, c, appel) {
    const L = c.look;
    ctx.lineWidth = 4; ctx.strokeStyle = "#5a3a29"; ctx.lineJoin = "round";
    if (appel) { ctx.fillStyle = L.shirt; rr(x - 82, y - 250, 26, 160, 13); ctx.fill(); ctx.stroke(); ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(x - 69, y - 256, 17, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = L.shirt; rr(x - 72, y - 150, 144, 160, 34); ctx.fill(); ctx.stroke();
    ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(x, y - 196, 44, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = L.hair; ctx.beginPath(); ctx.arc(x, y - 206, 44, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3a2a22"; ctx.beginPath(); ctx.arc(x - 15, y - 192, 4.5, 0, 7); ctx.arc(x + 15, y - 192, 4.5, 0, 7); ctx.fill();
    ctx.strokeStyle = "#5a3a29"; ctx.beginPath(); ctx.arc(x, y - 178, 10, 0.2, Math.PI - 0.2); ctx.stroke();
    if (c.slug === "client_07_critique") { ctx.fillStyle = "#222"; rr(x - 36, y - 262, 72, 26, 6); ctx.fill(); ctx.stroke(); }
  }

  function dessinerServeur() {
    const sv = S_.serveur;
    const sc = 0.6 + 0.4 * Math.max(0, Math.min(1, (sv.y - 330) / (Y_COULOIR - 330)));
    const marche = sv.path.length > 0 || (sv.marcheT || 0) > 0;
    const frame = 1 + (Math.floor(sv.anim * 10) % 6);
    let k = marche ? "serveur_marche_" + frame : sv.pose === "oups" ? "serveur_oups" : sv.pose === "content" ? "serveur_content" : "serveur_idle";
    const sprite = img(k) || img("serveur_idle");
    ctx.save();
    // ombre
    ctx.fillStyle = "rgba(60,30,20,0.22)"; ctx.beginPath(); ctx.ellipse(sv.x, sv.y, 52 * sc, 12 * sc, 0, 0, 7); ctx.fill();
    ctx.translate(sv.x, sv.y); ctx.scale(sc * sv.dir, sc);
    const bob = A.calme ? 0 : marche ? Math.abs(Math.sin(sv.anim * 10)) * -6 : Math.sin(sv.anim * 2) * -2;
    if (sprite) {
      const h = SERVEUR_H, w = sprite.width * h / sprite.height;
      ctx.drawImage(sprite, -w / 2, -h + bob, w, h);
    } else silhouetteServeur(marche, bob, sv);
    // plat porté sur le plateau
    if (sv.carry) {
      const im = img(sv.carry.dish);
      if (im) { const s2 = 0.2 * SERVEUR_H / 300; ctx.drawImage(im, TRAY.x - im.width * s2 / 2, TRAY.y + bob - im.height * s2 * 0.8 + 6, im.width * s2, im.height * s2 * 0.8); }
    }
    ctx.restore();
  }

  function silhouetteServeur(marche, bob, sv) {
    const sw = marche ? Math.sin(sv.anim * 10) * 18 : 0;
    ctx.lineWidth = 4; ctx.strokeStyle = "#3a2a22"; ctx.lineJoin = "round";
    ctx.fillStyle = "#2d2d33";                                           // jambes
    rr(-26 + sw, -92 + bob, 22, 90, 8); ctx.fill(); ctx.stroke();
    rr(4 - sw, -92 + bob, 22, 90, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f6f1e6"; rr(-40, -190 + bob, 80, 110, 20); ctx.fill(); ctx.stroke();   // chemise
    ctx.fillStyle = "#2d2d33"; rr(-34, -186 + bob, 68, 52, 14); ctx.fill();                  // gilet
    ctx.fillStyle = "#fff"; rr(-42, -134 + bob, 84, 128, 12); ctx.fill(); ctx.stroke();      // tablier
    ctx.fillStyle = "#f1c9a5"; ctx.beginPath(); ctx.arc(0, -226 + bob, 34, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#4a2f22"; ctx.beginPath(); ctx.arc(0, -236 + bob, 34, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d9473b"; ctx.beginPath(); ctx.moveTo(0, -190 + bob); ctx.lineTo(-16, -200 + bob); ctx.lineTo(-16, -180 + bob); ctx.closePath(); ctx.moveTo(0, -190 + bob); ctx.lineTo(16, -200 + bob); ctx.lineTo(16, -180 + bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#3a2a22"; ctx.beginPath(); ctx.arc(12, -228 + bob, 4, 0, 7); ctx.fill();
    ctx.fillStyle = "#f6f1e6"; rr(36, -214 + bob, 20, 60, 10); ctx.fill(); ctx.stroke();       // bras levé
    ctx.fillStyle = "#cfcfd2"; ctx.beginPath(); ctx.ellipse(TRAY.x, TRAY.y + bob + 14, 46, 9, 0, 0, 7); ctx.fill(); ctx.stroke();   // plateau
  }

  function dessinerRail() {
    dessiner("rail_tickets", RAIL.x, RAIL.y, RAIL.w / 494, RAIL.w / 494, "haut");
    S_.tickets.forEach((t, k) => {
      const x = RAIL.x + 22 + k * 108, y = RAIL.y + 62, sc = 0.46;
      const sw = A.calme ? 0 : Math.sin(G.t * 1.5 + k) * 0.015;
      ctx.save(); ctx.translate(x + 50, y); ctx.rotate(sw);
      if (!dessiner("ticket_commande", -50, 0, sc, sc, "haut")) { ctx.fillStyle = "#f6e9cf"; rr(-50, 0, 100, 147, 6); ctx.fill(); }
      ctx.fillStyle = "#f6e9cf"; ctx.fillRect(-40, 34, 80, 88);
      const pc = PERS_COURT[t.cmd.p], cr = A.contraste ? "#000" : "#5a3a29";
      texte(pc[0], 0, 46, 16, cr); texte(pc[1], 0, 62, 16, cr);
      const mot = t.cmd.verbe.toUpperCase();
      texte(mot, 0, 92, Math.max(13, Math.min(21, Math.floor(92 / (mot.length * 0.72)))), A.contraste ? style(t.cmd.couleur).ticketContraste : style(t.cmd.couleur).ticket);   // le verbe doit tenir sur le ticket
      texte("table " + (t.table + 1), 0, 128, 18, A.contraste ? "#000" : "#7a5a44", "center", null, "normal");
      if (t.cuisine) {                                       // commande à cuisiner : état affiché sous le ticket, ticket choisi encadré
        const st = style(t.cmd.couleur);
        if (G.vue === "cuisine" && ticketSelId() === t.id) { ctx.strokeStyle = "#ffd84a"; ctx.lineWidth = 6; rr(-54, -4, 108, 155, 8); ctx.stroke(); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; rr(-58, -8, 116, 163, 10); ctx.stroke(); }
        texte(t.etat === "attente" ? "à cuisiner" : t.etat === "cuisson" ? "en cuisson…" : "prêt !", 0, 168, 18, "#fff", "center", st.contour);
      }
      ctx.restore();
    });
  }

  // ------------------------------------------------------------------ panneau de choix
  const PANEL = { x: 150, y: 830, w: 1620, h: 236 };       // panneau de saisie (cuisine)
  const PCH = { x: 150, y: 770, w: 1620, h: 296 };       // panneau « Passe-plats » (assiettes), plus haut que le panneau de saisie de la cuisine
  function briqueRect(i, n) {
    const bw = 300, bh = 190, gap = 40, total = n * bw + (n - 1) * gap, x0 = PCH.x + (PCH.w - total) / 2;
    return { x: x0 + i * (bw + gap), y: PCH.y + 84, w: bw, h: bh };
  }
  // terminaison d'une proposition (aide visuelle) : le radical reste blanc, la terminaison passe en jaune
  const TERMS = ["inrent", "irent", "urent", "èrent", "érent", "aient", "înmes", "întes", "âmes", "âtes", "îmes", "îtes", "ûmes", "ûtes", "imes", "ites", "umes", "utes", "ames", "ates", "ions", "iez", "ons", "ent", "ait", "ais", "ins", "int", "ez", "ai", "as", "es", "is", "it", "us", "ut", "a", "e"];
  function coupe(f) {
    for (const t of TERMS) if (f.length > t.length && f.endsWith(t)) return [f.slice(0, -t.length), t];
    return [f, ""];
  }
  const FEED_BTN = { x: PCH.x + PCH.w / 2 - 190, y: PCH.y + 214, w: 380, h: 56 };
  const ECOUTER = { x: PCH.x + PCH.w - 230, y: PCH.y + 32, w: 170, h: 42 };
  function dessinerPanneau() {
    const p = S_.panel; if (!p) return;
    const d = G.t - (p.secT === undefined ? -9 : p.secT);
    ctx.save(); if (d >= 0 && d < 0.45 && !A.calme) ctx.translate(Math.sin(d * 60) * 14 * (1 - d / 0.45), 0);
    dessinerPanneau0(p);
    ctx.restore();
  }
  function dessinerPanneau0(p) {
    ctx.fillStyle = A.contraste ? "rgba(0,0,0,0.65)" : "rgba(30,15,8,0.35)"; ctx.fillRect(0, 0, W, H);
    neuf("panneau_bois", PCH.x, PCH.y - 6, PCH.w, PCH.h + 12, 36);
    if (A.contraste) { ctx.fillStyle = "#fff"; rr(PCH.x + 14, PCH.y + 4, PCH.w - 28, 70, 14); ctx.fill(); }
    const fb = p.feedback;
    if (!fb) {
      const titre = "Passe-plats · table " + (p.table + 1) + " : " + p.cmd.verbe.toUpperCase() + ", " + PERS_LONG[p.cmd.p] + (A.pronom ? " (" + LIBELLE_PERSONNE(p.cmd.p) + ")" : "") + " — quelle assiette ?";
      let tt = Math.min(ts(30), 34); texte("", 0, 0, tt);
      while (tt > 20 && ctx.measureText(titre).width > PCH.w - (voixOk() ? 300 : 120)) { tt -= 2; texte("", 0, 0, tt); }
      texte(titre, PCH.x + PCH.w / 2 - (voixOk() ? 100 : 0), PCH.y + 54, tt, ENCRE());
    } else texte("Voici la bonne forme, pour t’aider :", PCH.x + PCH.w / 2 - (voixOk() ? 100 : 0), PCH.y + 54, Math.min(ts(32), 36), A.contraste ? "#b00000" : "#d9473b");
    if (voixOk()) {
      const sur = G.mouse.x > ECOUTER.x && G.mouse.x < ECOUTER.x + ECOUTER.w && G.mouse.y > ECOUTER.y && G.mouse.y < ECOUTER.y + ECOUTER.h;
      ctx.fillStyle = sur ? "#e8b33f" : FOND(); rr(ECOUTER.x, ECOUTER.y, ECOUTER.w, ECOUTER.h, 14); ctx.fill();
      ctx.strokeStyle = ENCRE(); ctx.lineWidth = 4; ctx.stroke();
      texte("Écouter (L)", ECOUTER.x + ECOUTER.w / 2, ECOUTER.y + ECOUTER.h / 2 + 1, 22, ENCRE());
    }
    if (fb) {                                           // la bonne forme et la règle, jamais la forme fautive
      const cx = PCH.x + PCH.w / 2, cmd = p.cmd, r = cmd.regle, notes = [];
      if (r.circonflexe) notes.push("Accent circonflexe sur le " + r.lettre + " : nous / vous.");
      if (r.note) notes.push(r.note);
      const pr = cmd.pronom.charAt(0).toLowerCase() + cmd.pronom.slice(1);
      texte("Il fallait : " + pv(pr, cmd.bonne), cx, PCH.y + 120, Math.min(ts(46), 54), A.contraste ? "#006400" : "#4c8c4a");
      const ligne = r.texte + (notes.length ? "     " + notes.join(" ") : "");
      let tr = Math.min(ts(24), 28); texte("", 0, 0, tr);
      while (tr > 16 && ctx.measureText(ligne).width > PCH.w - 140) { tr -= 1; texte("", 0, 0, tr); }
      texte(ligne, cx, PCH.y + 172, tr, ENCRE(), "center", null, "normal");
      const b = FEED_BTN, sur = dans(b, G.mouse);
      ctx.fillStyle = sur ? "#e8b33f" : "#4c8c4a"; rr(b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = A.contraste ? "#000" : "#5a3a29"; ctx.lineWidth = 5; ctx.stroke();
      texte("Continuer (Espace)", b.x + b.w / 2, b.y + b.h / 2 + 2, 28, sur ? "#4a2f22" : "#fff");
      return;
    }
    // les 4 propositions sont de vraies assiettes (celles du groupe) glissant hors du passe-plats ; le mot est écrit sur une étiquette crème bien lisible
    const st = style(p.cmd.couleur), imP = img(st.plat), n = p.cmd.choix.length;
    const RW = 284, RH = 74;                              // étiquette
    let taille = ts(48);
    for (const f of p.cmd.choix) { texte("", 0, 0, taille); while (taille > 26 && ctx.measureText(f).width > RW - 36) { taille -= 2; texte("", 0, 0, taille); } }
    const contour = A.contraste ? "#000" : st.contour;
    p.cmd.choix.forEach((f, i) => {
      const r = briqueRect(i, n);
      const k = A.calme ? 1 : Math.max(0, Math.min(1, (G.t - (p.t0 || 0) - i * 0.07) / 0.34)), e3 = 1 - Math.pow(1 - k, 3);
      const sur = G.mouse.x > r.x && G.mouse.x < r.x + r.w && G.mouse.y > r.y && G.mouse.y < r.y + r.h;
      const zoom = (sur && !A.calme ? 1.06 : 1) * (0.35 + 0.65 * e3);
      const bx = r.x + r.w / 2, by = r.y + r.h;           // milieu du bas de l'assiette
      const cx = HATCH_PLATE.x + (bx - HATCH_PLATE.x) * e3, cy = (HATCH_PLATE.y + 20) + (by - (HATCH_PLATE.y + 20)) * e3;
      ctx.save(); ctx.globalAlpha = Math.min(1, 0.25 + k);
      ctx.fillStyle = "rgba(50,25,12,0.28)"; ctx.beginPath(); ctx.ellipse(cx, cy - 6, 140 * zoom, 18 * zoom, 0, 0, 7); ctx.fill();       // ombre sur le comptoir
      if (sur && !A.calme) { ctx.fillStyle = "rgba(255,216,74,0.35)"; ctx.beginPath(); ctx.ellipse(cx, cy - 70 * zoom, 160 * zoom, 84 * zoom, 0, 0, 7); ctx.fill(); }
      ctx.translate(cx, cy); ctx.scale(zoom, zoom);
      if (imP) { const sc = Math.min(r.w / imP.width, r.h / imP.height); ctx.drawImage(imP, -imP.width * sc / 2, -imP.height * sc, imP.width * sc, imP.height * sc); }
      else { ctx.fillStyle = st.fond; ctx.beginPath(); ctx.ellipse(0, -r.h / 2, r.w / 2, r.h / 2.4, 0, 0, 7); ctx.fill(); }
      // étiquette
      const ey = -RH - 10;                      // l'étiquette ne couvre que le bord avant de l'assiette : on voit le plat au-dessus
      ctx.fillStyle = A.contraste ? "#fff" : "rgba(250,243,226,0.97)"; rr(-RW / 2, ey, RW, RH, 18); ctx.fill();
      ctx.strokeStyle = contour; ctx.lineWidth = A.contraste ? 6 : 5; ctx.stroke();
      texte("", 0, 0, taille);
      const [rad, fin] = A.termin ? coupe(f) : [f, ""], ty = ey + RH / 2 - 7, ink = A.contraste ? "#000" : ENCRE(), col = A.contraste ? "#000" : st.ticket;
      if (fin) {
        const w1 = ctx.measureText(rad).width, w2 = ctx.measureText(fin).width, x0 = -(w1 + w2) / 2;
        texte(rad, x0, ty, taille, ink, "left");
        texte(fin, x0 + w1, ty, taille, col, "left");
        ctx.fillStyle = A.contraste ? "#000" : st.fond; rr(x0 + w1, ty + taille * 0.5, w2, 5, 2); ctx.fill();        // la terminaison est aussi soulignée : la couleur ne suffit pas
      } else texte(f, 0, ty, taille, ink, "center");
      texte(st.tag, RW / 2 - 12, ey + RH - 13, 15, ink, "right", null, "normal");      // le groupe est aussi écrit
      ctx.restore();
      if (p.clavier && p.focus === i) { ctx.strokeStyle = "#ffd84a"; ctx.lineWidth = 8; rr(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 26); ctx.stroke(); ctx.strokeStyle = "#000"; ctx.lineWidth = 3; rr(r.x - 12, r.y - 12, r.w + 24, r.h + 24, 30); ctx.stroke(); }
      ctx.fillStyle = FOND(); ctx.beginPath(); ctx.arc(r.x + 24, r.y + 24, 19, 0, 7); ctx.fill(); ctx.strokeStyle = ENCRE(); ctx.lineWidth = 3; ctx.stroke();
      texte(String(i + 1), r.x + 24, r.y + 25, 24, ENCRE());
    });
  }

  // ------------------------------------------------------------------ cuisine (chantier 4)
  // Le joueur passe la porte battante, choisit le poste du groupe du verbe (marmite = 1er, plan de travail = 2e, plaque = 3e),
  // ÉCRIT la forme au clavier, attend la cuisson, envoie le plat au passe-plats ; le serveur le porte ensuite à la bonne table.
  const ECOUTER_C = { x: PANEL.x + PANEL.w - 220, y: PANEL.y + 30, w: 180, h: 44 };
  const ACCENTS = ["à", "â", "ç", "é", "è", "ê", "î", "ô", "û", "ù"];
  const champ = () => document.getElementById("saisie");
  function posteActif(k) {
    const g = S_.ctx.groupes;
    if (g && !g.includes(k + 1)) return false;                   // seuls les postes des groupes du resto sont ouverts
    return niveauVerbes() >= POSTES[k].debut;                    // les postes s'ouvrent avec les niveaux
  }
  const ticketPar = (id) => S_.tickets.find((t) => t.id === id);
  function ticketSelId() {
    const cu = S_.cuis, ok = (id) => S_.tickets.some((t) => t.id === id && t.cuisine && t.etat === "attente");
    if (ok(cu.sel)) return cu.sel;
    const t = S_.tickets.find((t) => t.cuisine && t.etat === "attente");
    return t ? t.id : null;
  }
  const ticketRect = (k) => ({ x: RAIL.x + 22 + k * 108, y: RAIL.y + 62, w: 100, h: 147 });

  function chefDit(pose, texteChef, dur) { const ch = S_.cuis.chef; ch.pose = pose; ch.texte = texteChef; ch.t = 0; ch.dur = dur || 4.5; }

  function nettoyerCuisine(i, ticketId) {          // un client s'en va : on jette ce qui le concernait
    const cu = S_.cuis;
    S_.hatchQ = S_.hatchQ.filter((h) => h.table !== i);
    for (const po of cu.postes) if (po.table === i && po.etat !== "repos") Object.assign(po, { etat: "repos", t: 0, ticketId: null, table: -1, dish: null, cmd: null });
    if (cu.saisie && cu.saisie.ticketId === ticketId) { fermerSaisie(); chefDit("neutre", "Le client est parti… on jette la commande.", 4); }
  }

  function majCuisine(dt) {
    const cu = S_.cuis;
    for (const po of cu.postes) {
      if (po.etat === "cuit") {
        po.t += dt;
        if (po.t >= po.dur) {
          po.etat = "pret"; po.t = 0;
          const tk = ticketPar(po.ticketId); if (tk) tk.etat = "pret";
          sonCloche();
          if (G.vue === "salle") msg("Un plat est prêt en cuisine !", "Passe la porte (touche C) pour l’envoyer au passe-plats.", "info", 3.2);
          else chefDit("bravo", "C’est prêt ! Clique sur le plat pour l’envoyer au passe-plats.", 4);
        }
      } else if (po.etat === "rate") {
        po.t += dt;
        if (po.t >= po.dur) Object.assign(po, { etat: "repos", t: 0, ticketId: null, table: -1, dish: null, cmd: null });
      }
    }
    cu.chef.t += dt; if (cu.chef.dur > 0 && cu.chef.t > cu.chef.dur) cu.chef.dur = 0;
    if (cu.cloche > 0) cu.cloche -= dt;
  }

  function changerVue(v) {
    if (G.trans || G.vue === v) return;
    if (v === "salle" && S_.cuis.saisie) fermerSaisie();
    G.trans = { t: 0, vers: v, fait: false };
  }
  function entrerVue() {
    const sv = S_.serveur, cu = S_.cuis;
    if (G.vue === "salle") { sv.x = DOOR_STAND.x; sv.y = DOOR_STAND.y; sv.path = []; sv.task = null; sv.dir = -1; return; }
    cu.sel = ticketSelId();
    const tk = ticketPar(cu.sel);
    if (tk) chefDit("explique", "Une commande : " + pv(tk.cmd.pronom, tk.cmd.verbe) + ", au passé simple. À quel groupe appartient ce verbe ? Choisis le bon poste !", 7);
    else chefDit("neutre", "Rien à cuisiner pour le moment. Retourne en salle prendre des commandes !", 5);
  }
  function demanderCuisine() {
    const sv = S_.serveur;
    if (!S_.cuis.ouverte || G.vue !== "salle" || G.trans) return;
    if (sv.carry) { msg("Dépose d’abord ton plat !", "", "info", 1.6); return; }
    if (serveurOccupe()) return;
    sv.task = { type: "goDoor" };
    allerVers(sv, DOOR_STAND.x, DOOR_STAND.y);
    sonClic();
  }

  // ----- saisie au clavier (un vrai champ HTML invisible reçoit les touches : accents, touches mortes et claviers tactiles fonctionnent)
  function rectsSaisie() {
    const y1 = PANEL.y + 78, h1 = 84, y2 = PANEL.y + 170;
    const R = { pronom: { x: 210, y: y1, w: 250, h: h1 }, champ: { x: 480, y: y1, w: 620, h: h1 }, valider: { x: 1120, y: y1, w: 200, h: h1 },
      aide: { x: 1340, y: y1, w: 200, h: h1 }, annuler: { x: 1560, y: y1, w: 180, h: h1 }, effacer: { x: 1300, y: y2, w: 170, h: 50 }, accents: [] };
    ACCENTS.forEach((ch, i) => R.accents.push({ ch, x: 480 + i * 78, y: y2, w: 68, h: 50 }));
    return R;
  }
  function majTexte(t) { const sa = S_.cuis.saisie; if (!sa) return; sa.texte = t.slice(0, 20); const c = champ(); if (c) c.value = sa.texte; }
  function ouvrirSaisie(k, tk) {
    S_.cuis.saisie = { poste: k, ticketId: tk.id, texte: "", presque: 0, indice: "" };
    const c = champ(); if (c) { c.value = ""; c.focus(); }
    chefDit("explique", "Écris la forme du passé simple, accents compris !", 4);
    if (A.voix) direCommande(tk.cmd, false);
  }
  function fermerSaisie() { S_.cuis.saisie = null; const c = champ(); if (c) { c.value = ""; c.blur(); } }
  function aideChef() {
    const sa = S_.cuis.saisie, tk = ticketPar(sa ? sa.ticketId : ticketSelId());
    if (!tk) return;
    tk.aide = true;                                              // l'aide fait perdre le bonus de rapidité
    const r = tk.cmd.regle;
    chefDit("explique", "Pour « " + LIBELLE_PERSONNE(tk.cmd.p) + " » la terminaison est " + r.terminaison + (r.circonflexe ? " (accent circonflexe !)" : "") + ".", 6);
    sonClic();
  }
  const LIBELLE_PERSONNE = (p) => ["je", "tu", "il / elle / on", "nous", "vous", "ils / elles"][p];
  const norm = (t) => t.trim().toLowerCase();
  const sansAccents = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

  function validerSaisie() {
    const cu = S_.cuis, sa = cu.saisie; if (!sa) return;
    const tk = ticketPar(sa.ticketId), po = cu.postes[sa.poste];
    if (!tk || !tk.cuisine) { fermerSaisie(); return; }
    const rep = norm(sa.texte), cmd = tk.cmd, bonne = cmd.bonne.toLowerCase();
    if (!rep) return;
    if (rep === bonne) {
      S_.rep++; S_.justes++; sonOk();
      Object.assign(po, { etat: "cuit", t: 0, dur: BAL.cuisson[sa.poste], ticketId: tk.id, table: tk.table, dish: style(cmd.couleur).plat, cmd, sansBonus: !!tk.aide, mauvais: false, forme: null });
      tk.etat = "cuisson"; sonCuisson();
      fermerSaisie();
      chefDit("bravo", "Bravo, c’est la bonne forme ! Ça cuit…", 3.5);
      return;
    }
    if (!sa.presque && sansAccents(rep) === sansAccents(bonne)) {          // seulement un accent : une seconde chance, sans pénalité
      sa.presque = 1; sa.indice = "Presque ! Regarde bien les accents.";
      bip(440, 0.12, "triangle"); chefDit("explique", "Presque ! Il manque ou il y a un accent de trop. Regarde bien la terminaison.", 5);
      return;
    }
    S_.rep++;                                // mauvaise forme : le plat cuit quand même, c'est le client qui le refusera à table
    S_.erreurs.push({ pronom: cmd.pronom, verbe: cmd.verbe, bonne: cmd.bonne, choisie: rep, regle: cmd.regle, niveau: cmd.niveau });
    Object.assign(po, { etat: "cuit", t: 0, dur: BAL.cuisson[sa.poste], ticketId: tk.id, table: tk.table, dish: style(cmd.couleur).plat, cmd, sansBonus: !!tk.aide, mauvais: true, forme: rep });
    tk.etat = "cuisson"; sonCuisson();
    fermerSaisie();
    chefDit("neutre", "Ça cuit… on verra ce qu’en dira le client !", 3.5);
  }

  function servirDuPoste(po) {
    S_.hatchQ.push({ dish: po.dish, table: po.table, cuisine: true, sansBonus: po.sansBonus, mauvais: !!po.mauvais, forme: po.forme });
    po.mauvais = false; po.forme = null;
    S_.cuisines++; S_.cuis.cloche = 0.9; sonCloche();
    Object.assign(po, { etat: "repos", t: 0, ticketId: null, table: -1, dish: null, cmd: null });
    chefDit("bravo", "Le plat part au passe-plats. Retourne en salle : le serveur le porte à la table !", 5);
  }

  function clicPoste(k) {
    const cu = S_.cuis, po = cu.postes[k], P = POSTES[k];
    if (!posteActif(k)) { chefDit("explique", "Ce poste ouvrira avec les verbes du " + P.tag + ".", 4); return; }
    if (po.etat === "pret") { servirDuPoste(po); return; }
    if (po.etat === "cuit") { chefDit("neutre", "Patience, ça cuit !", 2.5); return; }
    if (po.etat === "rate") { chefDit("fache", "Ce poste est en nettoyage…", 2.5); return; }
    const tk = ticketPar(ticketSelId());
    if (!tk) { chefDit("neutre", "Aucune commande à cuisiner pour l’instant. Retourne en salle !", 4); return; }
    cu.sel = tk.id;
    if (poste_de(tk.cmd.couleur) !== k) {
      sonKo(); const bon = POSTES[poste_de(tk.cmd.couleur)];
      chefDit("fache", "« " + tk.cmd.verbe + " » est un verbe du " + bon.tag + " : ça se prépare à la " + (bon.k === 1 ? "plan de travail" : bon.nom.toLowerCase()) + " !", 5.5);
      return;
    }
    ouvrirSaisie(k, tk);
  }

  function clicCuisine(p) {
    const cu = S_.cuis, sa = cu.saisie;
    if (sa) {
      const R = rectsSaisie(), tk = ticketPar(sa.ticketId);
      if (voixOk() && dans(ECOUTER_C, p) && tk) { direCommande(tk.cmd, false); return; }
      if (dans(R.valider, p)) { validerSaisie(); return; }
      if (dans(R.annuler, p)) { fermerSaisie(); return; }
      if (dans(R.aide, p)) { aideChef(); return; }
      if (dans(R.effacer, p)) { majTexte(sa.texte.slice(0, -1)); champ().focus(); return; }
      const ac = R.accents.find((a) => dans(a, p)); if (ac) { majTexte(sa.texte + ac.ch); champ().focus(); return; }
      if (dans(CUIS_PORTE, p)) { fermerSaisie(); changerVue("salle"); sonClic(); return; }
      const c = champ(); if (c) c.focus();
      return;
    }
    if (dans(CUIS_PORTE, p)) { changerVue("salle"); sonClic(); return; }
    for (let k = 0; k < S_.tickets.length; k++) {
      if (dans(ticketRect(k), p)) { const t = S_.tickets[k]; if (t.cuisine && t.etat === "attente") { cu.sel = t.id; sonClic(); } return; }
    }
    for (const P of POSTES) if (Math.abs(p.x - P.x) < 150 && p.y > P.base - 400 && p.y < P.base + 90) { clicPoste(P.k); return; }
    if (Math.abs(p.x - CUIS_CHEF.x) < 100 && p.y > CUIS_CHEF.base - CUIS_CHEF.h && p.y < CUIS_CHEF.base) { if (ticketSelId()) aideChef(); }
  }

  // ----- dessin de la cuisine
  function posteCode(k, x, b, phase, cuit, st) {          // dessin provisoire (remplacé par postes.png dès qu'il est fourni)
    ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#5a3a29";
    ctx.fillStyle = "#9b6a46"; rr(x - 125, b - 190, 250, 190, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#b98558"; rr(x - 108, b - 150, 216, 130, 10); ctx.fill();
    ctx.fillStyle = st.fond; rr(x - 125, b - 190, 250, 28, 12); ctx.fill(); ctx.stroke();
    if (k === 0) {                                          // marmite
      const lift = phase ? -16 : 0;
      ctx.fillStyle = "#3a2a22"; rr(x - 112, b - 214, 224, 26, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#c5c9d1"; rr(x - 86, b - 330, 172, 120, 28); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#9fa4ad"; rr(x - 112, b - 300, 30, 18, 9); ctx.fill(); ctx.stroke(); rr(x + 82, b - 300, 30, 18, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#d7dbe2"; ctx.beginPath(); ctx.ellipse(x, b - 332 + lift, 96, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#5a3a29"; ctx.beginPath(); ctx.arc(x, b - 354 + lift, 9, 0, 7); ctx.fill();
    } else if (k === 1) {                                   // plan de travail
      ctx.fillStyle = "#d9b27c"; rr(x - 136, b - 216, 272, 30, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f0d9a8"; rr(x - 100, b - 252, 200, 36, 8); ctx.fill(); ctx.stroke();
      [[-52, "#e8833a", 17], [-2, "#d9473b", 16], [48, "#4c8c4a", 17]].forEach(([dx, c, r]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx, b - 270, r, 0, 7); ctx.fill(); ctx.stroke(); });
      ctx.save(); ctx.translate(x + 96, b - 262); ctx.rotate(phase ? -0.55 : -0.12);
      ctx.fillStyle = "#cfd3da"; rr(-6, -86, 14, 78, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#5a3a29"; rr(-8, -8, 18, 40, 6); ctx.fill(); ctx.stroke(); ctx.restore();
    } else {                                                // plaque de cuisson
      ctx.fillStyle = "#2d2d33"; rr(x - 136, b - 216, 272, 30, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4a4a52"; ctx.beginPath(); ctx.ellipse(x - 10, b - 232, 84, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#2d2d33"; rr(x + 62, b - 240, 96, 14, 7); ctx.fill(); ctx.stroke();
      if (cuit) for (let i = 0; i < 5; i++) { const h = 20 + ((phase ? i : 4 - i) % 3) * 9; ctx.fillStyle = i % 2 ? "#e8b33f" : "#e8833a"; ctx.beginPath(); ctx.moveTo(x - 96 + i * 34, b - 206); ctx.lineTo(x - 80 + i * 34, b - 206); ctx.lineTo(x - 88 + i * 34, b - 206 - h); ctx.closePath(); ctx.fill(); }
    }
  }
  function dessinerPoste(k) {
    const P = POSTES[k], po = S_.cuis.postes[k], x = P.x, b = P.base, actif = posteActif(k), st = style(P.couleur);
    const cuit = po.etat === "cuit", phase = cuit && !A.calme && Math.floor(G.t * 4) % 2 === 1;     // deux dessins alternés pendant la cuisson
    ctx.save(); if (!actif) { try { ctx.filter = "grayscale(1) brightness(0.8)"; } catch (e) { /* tant pis */ } }
    const sp = img(POSTE_IMG[k] + (phase ? "_actif" : "_repos")) || img(POSTE_IMG[k] + "_repos");
    if (sp) { const k = 0.9, w = sp.width * k, h = sp.height * k; ctx.drawImage(sp, x - w / 2, b - h, w, h); } else posteCode(k, x, b, phase, cuit, st);
    ctx.restore();
    ctx.fillStyle = actif ? st.fond : "#8b7a70"; rr(x - 125, b + 14, 250, 72, 16); ctx.fill(); ctx.strokeStyle = actif ? st.contour : "#4a3a30"; ctx.lineWidth = 5; ctx.stroke();
    texte(P.nom, x, b + 40, 28, "#fff", "center", actif ? st.contour : "#4a3a30");
    texte(actif ? P.tag : "bientôt…", x, b + 69, 20, "#fff", "center", actif ? st.contour : "#4a3a30", "normal");
    if (cuit) {                                             // vapeur, étincelles et barre de cuisson
      if (!A.calme) for (let i = 0; i < 4; i++) { const u = ((G.t * 0.7 + i * 0.25) % 1); ctx.save(); ctx.globalAlpha = 0.55 * (1 - u); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - 40 + i * 27 + Math.sin(G.t * 3 + i) * 8, b - 290 - u * 80, 12 + u * 14, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = "rgba(60,30,20,0.55)"; rr(x - 95, b - 338, 190, 20, 10); ctx.fill();
      ctx.fillStyle = st.fond; rr(x - 91, b - 334, Math.max(12, 182 * po.t / po.dur), 12, 6); ctx.fill();
      texte(pv(po.cmd.pronom, po.cmd.verbe), x, b - 358, 22, "#fff", "center", "#5a3a29");
    } else if (po.etat === "pret") {
      const bob = A.calme ? 0 : Math.sin(G.t * 4) * 6;
      dessiner(po.dish, x, b - 250 + bob, 0.3, 0.3, "bas");
      texte("Prêt ! Clique", x, b - 338, 28, "#fff", "center", st.contour);
    } else if (po.etat === "rate") {
      const bob = A.calme ? 0 : Math.sin(G.t * 12) * 3;
      dessiner("plat_rate", x + bob, b - 240, 0.3, 0.3, "bas");
      texte("Raté !", x, b - 338, 30, "#d9473b", "center", "#fff7e0");
    }
  }

  function silhouetteChef(x, b, pose) {
    ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "#3a2a22";
    const bras = (dx, haut) => { ctx.fillStyle = "#fff"; ctx.save(); ctx.translate(x + dx, b - 160); ctx.rotate(haut ? (dx > 0 ? -2.3 : 2.3) : (dx > 0 ? -0.3 : 0.3)); rr(-13, 0, 26, 100, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f1c9a5"; ctx.beginPath(); ctx.arc(0, 104, 14, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); };
    ctx.fillStyle = "#2d2d33"; rr(x - 38, b - 70, 28, 70, 8); ctx.fill(); ctx.stroke(); rr(x + 10, b - 70, 28, 70, 8); ctx.fill(); ctx.stroke();
    bras(-72, pose === "bravo"); bras(72, pose === "bravo" || pose === "explique");
    ctx.fillStyle = "#fff"; rr(x - 62, b - 190, 124, 130, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d9473b"; ctx.beginPath(); ctx.arc(x - 20, b - 150, 5, 0, 7); ctx.arc(x - 20, b - 125, 5, 0, 7); ctx.arc(x - 20, b - 100, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#f1c9a5"; ctx.beginPath(); ctx.arc(x, b - 222, 42, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; rr(x - 44, b - 322, 88, 60, 20); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, b - 322, 52, 22, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#5a3a29"; ctx.beginPath(); ctx.ellipse(x, b - 196, 22, 10, 0, 0, Math.PI); ctx.fill();         // moustache
    ctx.fillStyle = "#3a2a22"; ctx.beginPath(); ctx.arc(x - 16, b - 232, 4.5, 0, 7); ctx.arc(x + 16, b - 232, 4.5, 0, 7); ctx.fill();
    ctx.strokeStyle = "#3a2a22"; ctx.lineWidth = 4; ctx.beginPath();
    if (pose === "fache") { ctx.moveTo(x - 26, b - 248); ctx.lineTo(x - 8, b - 240); ctx.moveTo(x + 26, b - 248); ctx.lineTo(x + 8, b - 240); ctx.moveTo(x - 10, b - 184); ctx.quadraticCurveTo(x, b - 192, x + 10, b - 184); }
    else if (pose === "bravo") ctx.arc(x, b - 196, 14, 0.15, Math.PI - 0.15);
    else if (pose === "explique") ctx.arc(x, b - 188, 7, 0, 7);
    else { ctx.moveTo(x - 10, b - 186); ctx.lineTo(x + 10, b - 186); }
    ctx.stroke();
  }
  function lignesBulle(t, maxW, taille) {
    texte("", 0, 0, taille);
    const mots = t.split(" "), out = []; let l = "";
    for (const m of mots) { const essai = l ? l + " " + m : m; if (ctx.measureText(essai).width > maxW && l) { out.push(l); l = m; } else l = essai; }
    if (l) out.push(l); return out;
  }
  function dessinerChef() {
    const ch = S_.cuis.chef, pose = ch.dur > 0 ? ch.pose : "neutre", x = CUIS_CHEF.x, b = CUIS_CHEF.base;
    const sp = img("chef_" + pose) || img("chef_neutre");
    if (!sp) { ctx.fillStyle = "rgba(60,30,20,0.22)"; ctx.beginPath(); ctx.ellipse(x, b, 80, 14, 0, 0, 7); ctx.fill(); }
    if (sp) { const h = CUIS_CHEF.h, w = sp.width * h / sp.height; ctx.drawImage(sp, x - w / 2, b - h, w, h); } else silhouetteChef(x, b, pose);
    if (ch.dur > 0 && ch.texte) {
      const t = ts(26), L = lignesBulle(ch.texte, 400, t), h = L.length * (t + 8) + 24, bx = 245, by = 236;
      ctx.fillStyle = FOND(); rr(bx, by, 440, h, 20); ctx.fill(); ctx.strokeStyle = pose === "fache" ? "#d9473b" : "#5a3a29"; ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 30, by + h - 2); ctx.lineTo(x + 8, by + h - 2); ctx.lineTo(x - 6, by + h + 44); ctx.closePath(); ctx.fillStyle = FOND(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = FOND(); ctx.fillRect(x - 28, by + h - 6, 34, 8);
      L.forEach((l, i) => texte(l, bx + 220, by + 24 + t / 2 + i * (t + 8), t, ENCRE(), "center", null, "normal"));
    }
  }

  function dessinerPorteCuisine() {
    const R = CUIS_PORTE, sp = img("porte_battante");
    if (sp) { const k = Math.min(R.w / sp.width, R.h / sp.height), w = sp.width * k, h = sp.height * k; ctx.drawImage(sp, R.x + R.w / 2 - w / 2, R.y + R.h - h, w, h); }
    else {
      ctx.lineJoin = "round"; ctx.lineWidth = 6; ctx.strokeStyle = "#5a3a29";
      ctx.fillStyle = "#5a3a29"; rr(R.x - 8, R.y - 8, R.w + 16, R.h + 16, 14); ctx.fill();
      for (let i = 0; i < 2; i++) {
        const lx = R.x + i * (R.w / 2 + 2), lw = R.w / 2 - 2;
        ctx.fillStyle = "#b98558"; rr(lx, R.y, lw, R.h, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f6e9cf"; ctx.beginPath(); ctx.arc(lx + lw / 2, R.y + 110, 32, 0, 7); ctx.fill(); ctx.stroke();
      }
    }
    const sur = dans(CUIS_PORTE, G.mouse);
    ctx.fillStyle = sur ? "#e8b33f" : FOND(); rr(R.x - 4, R.y + R.h + 12, R.w + 8, 56, 14); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; ctx.stroke();
    texte("SALLE (C)", R.x + R.w / 2, R.y + R.h + 41, 26, "#4a2f22");
  }
  function dessinerPorteSalle() {
    if (!S_.cuis.ouverte) return;
    const R = DOOR, sp = img("porte_battante");
    if (sp) { const k = Math.min(R.w / sp.width, R.h / sp.height), w = sp.width * k, h = sp.height * k; ctx.drawImage(sp, R.x + R.w / 2 - w / 2, R.y + R.h - h, w, h); }
    else {
      ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#3a2210";
      ctx.fillStyle = "#4a2f22"; rr(R.x - 5, R.y - 5, R.w + 10, R.h + 5, 8); ctx.fill();
      for (let i = 0; i < 2; i++) {
        const lx = R.x + i * (R.w / 2 + 1), lw = R.w / 2 - 1;
        ctx.fillStyle = "#b98558"; rr(lx, R.y + 4, lw, R.h - 4, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f6e9cf"; ctx.beginPath(); ctx.arc(lx + lw / 2, R.y + 70, 16, 0, 7); ctx.fill(); ctx.stroke();
      }
    }
    ctx.fillStyle = "#e8b33f"; rr(R.x + 2, R.y - 22, R.w - 4, 22, 6); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 3; ctx.stroke();
    texte("CUISINE", R.x + R.w / 2, R.y - 10, 16, "#4a2f22");
    const attend = S_.tickets.some((t) => t.cuisine && t.etat === "attente") || S_.cuis.postes.some((po) => po.etat === "pret");
    if (attend) {                                           // la cuisine appelle
      const e = A.calme ? 1 : 1 + Math.sin(G.t * 7) * 0.12;
      ctx.save(); ctx.translate(R.x + R.w - 4, R.y - 26); ctx.scale(e, e);
      ctx.fillStyle = "#d9473b"; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke();
      texte("!", 0, 1, 24, "#fff"); ctx.restore();
    }
  }

  function dessinerMoniteurSalle() {                         // la salle vue depuis la cuisine : qui attend, avec quelle humeur
    ctx.fillStyle = A.contraste ? "#fff" : "rgba(246,233,207,0.94)"; rr(1190, 20, 500, 124, 20); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; ctx.stroke();
    texte("Salle", 1232, 38, 22, ENCRE(), "center", null, "normal");
    S_.tables.forEach((tb) => {
      if (!tableActive(tb.i)) return;
      const x = 1250 + tb.i * 78, c = tb.client;
      texte(String(tb.i + 1), x, 124, 22, ENCRE());
      if (!c || !clientAttend(c)) return;
      dessiner(["smiley_1_ravi", "smiley_2_content", "smiley_3_neutre", "smiley_4_presse", "smiley_5_mecontent", "smiley_6_furieux"][smileyIdx(c.patience)], x, 78, 0.24, 0.24, "centre");
      if (c.state === "call") { ctx.fillStyle = "#d9473b"; ctx.beginPath(); ctx.arc(x + 26, 50, 11, 0, 7); ctx.fill(); texte("!", x + 26, 51, 16, "#fff"); }
    });
  }

  function dessinerSaisie() {
    const sa = S_.cuis.saisie; if (!sa) return;
    const tk = ticketPar(sa.ticketId); if (!tk) return;
    const R = rectsSaisie(), st = style(tk.cmd.couleur), cmd = tk.cmd;
    neuf("panneau_bois", PANEL.x, PANEL.y - 6, PANEL.w, PANEL.h + 12, 36);
    if (A.contraste) { ctx.fillStyle = "#fff"; rr(PANEL.x + 14, PANEL.y + 4, PANEL.w - 28, 54, 14); ctx.fill(); }
    texte(sa.indice || ("Table " + (tk.table + 1) + " :  écris la forme de « " + cmd.verbe + " », " + PERS_LONG[cmd.p] + ", au passé simple"), PANEL.x + PANEL.w / 2 - (voixOk() ? 100 : 0), PANEL.y + 50, Math.min(ts(28), 30), sa.indice ? (A.contraste ? "#b00000" : "#d9473b") : ENCRE());
    if (voixOk()) {
      const sur = dans(ECOUTER_C, G.mouse);
      ctx.fillStyle = sur ? "#e8b33f" : FOND(); rr(ECOUTER_C.x, ECOUTER_C.y, ECOUTER_C.w, ECOUTER_C.h, 14); ctx.fill(); ctx.strokeStyle = ENCRE(); ctx.lineWidth = 4; ctx.stroke();
      texte("Écouter", ECOUTER_C.x + ECOUTER_C.w / 2, ECOUTER_C.y + ECOUTER_C.h / 2 + 1, 24, ENCRE());
    }
    // brique-pronom (fixe) + champ de saisie
    const b = R.pronom;
    if (A.contraste) { ctx.fillStyle = st.fondContraste; rr(b.x, b.y, b.w, b.h, 20); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.stroke(); }
    else if (!dessiner(st.brique, b.x, b.y, b.w / 384, b.h / 154, "haut")) { ctx.fillStyle = st.fond; rr(b.x, b.y, b.w, b.h, 20); ctx.fill(); }
    if (A.pronom) texte(cmd.pronom, b.x + b.w / 2, b.y + b.h / 2 + 2, ts(46), "#fff", "center", A.contraste ? "#000" : st.contour);
    else { texte(PERS_COURT[cmd.p][0], b.x + b.w / 2, b.y + b.h / 2 - 16, 26, "#fff", "center", A.contraste ? "#000" : st.contour); texte(PERS_COURT[cmd.p][1], b.x + b.w / 2, b.y + b.h / 2 + 18, 26, "#fff", "center", A.contraste ? "#000" : st.contour); }
    const f = R.champ;
    ctx.fillStyle = A.contraste ? "#fff" : "#fffaf0"; rr(f.x, f.y, f.w, f.h, 20); ctx.fill(); ctx.strokeStyle = A.contraste ? "#000" : "#5a3a29"; ctx.lineWidth = 6; ctx.stroke();
    let tz = 58; texte("", 0, 0, tz); while (tz > 28 && ctx.measureText(sa.texte).width > f.w - 70) { tz -= 2; texte("", 0, 0, tz); }
    const w = ctx.measureText(sa.texte).width, cx = f.x + f.w / 2 - w / 2;
    texte(sa.texte, cx, f.y + f.h / 2 + 3, tz, ENCRE(), "left");
    if (Math.floor(G.t * 2) % 2 === 0) { ctx.fillStyle = ENCRE(); ctx.fillRect(cx + w + 3, f.y + 20, 4, f.h - 40); }
    if (!sa.texte) texte("écris ici…", f.x + f.w / 2, f.y + f.h / 2 + 3, 34, "#a08c78", "center", null, "normal");
    const btn = (r, label, col, taille) => { const sur = dans(r, G.mouse); ctx.fillStyle = sur ? "#e8b33f" : col; rr(r.x, r.y, r.w, r.h, 16); ctx.fill(); ctx.strokeStyle = A.contraste ? "#000" : "#5a3a29"; ctx.lineWidth = 5; ctx.stroke(); texte(label, r.x + r.w / 2, r.y + r.h / 2 + 2, taille, col === "#4c8c4a" && !sur ? "#fff" : "#4a2f22"); };
    btn(R.valider, "Cuisiner ⏎", "#4c8c4a", 28); btn(R.aide, "Aide du chef", FOND(), 25); btn(R.annuler, "Annuler", FOND(), 27);
    R.accents.forEach((a) => btn(a, a.ch, FOND(), 32)); btn(R.effacer, "Effacer", FOND(), 24);
  }

  function dessinerCuisine() {
    const cu = S_.cuis;
    if (!dessiner("bg_cuisine", 0, 0, W / (img("bg_cuisine") ? img("bg_cuisine").width : W), H / (img("bg_cuisine") ? img("bg_cuisine").height : H), "haut")) { ctx.fillStyle = "#c9b48f"; ctx.fillRect(0, 0, W, H); }
    // décor (facultatif) : le mur du fond est vide tant que cuisine_deco n'est pas fourni
    [["etagere_bocaux", 565, 50, 150], ["casseroles_suspendues", 1000, 262, 105], ["hotte_inox", 1400, 150, 205]].forEach(([n, x, y, h]) => { const s = img(n); if (s) ctx.drawImage(s, x - s.width * h / s.height / 2, y, s.width * h / s.height, h); });
    if (!img("casseroles_suspendues") && !img("hotte_inox")) { ctx.fillStyle = "#8b5a3c"; rr(1320, 175, 300, 56, 14); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 5; ctx.stroke(); texte("CUISINE", 1470, 204, 40, "#f6e9cf", "center", "#5a3a29"); }
    dessinerPorteCuisine();
    // passe-plats (miroir de celui de la salle) et cloche de service
    const im = img("passe_plats");
    if (im) { ctx.save(); ctx.translate(CUIS_PASSE.x, CUIS_PASSE.y); ctx.scale(-CUIS_PASSE.s, CUIS_PASSE.s); ctx.drawImage(im, 0, 0); ctx.restore(); }
    S_.hatchQ.slice(0, 3).forEach((h, i, a) => { const x = CUIS_PASSE.x - 116 + (i - (a.length - 1) / 2) * 62; dessiner(h.dish, x, CUIS_PASSE.y + 96, 0.14, 0.11, "bas"); texte(String(h.table + 1), x, CUIS_PASSE.y + 32, 24, "#fff", "center", "#5a3a29"); });
    ctx.save(); ctx.translate(CUIS_PASSE.x - 116, 575); if (cu.cloche > 0) ctx.rotate(Math.sin(cu.cloche * 30) * 0.18); dessiner("cloche_service", 0, 0, 0.34, 0.34, "bas"); ctx.restore();
    texte("Passe-plats", CUIS_PASSE.x - 116, 598, 22, "#fff", "center", "#5a3a29", "normal");
    POSTES.forEach((P) => dessinerPoste(P.k));
    dessinerChef();
    dessinerRail();
    dessinerMoniteurSalle();
    if (!cu.saisie) {
      texte("1  Choisis un ticket     2  Clique sur le bon poste     3  Écris la forme     4  Envoie le plat au passe-plats", W / 2, 985, 30, "#fff", "center", "#5a3a29", "normal");
      texte("Clavier : 1 2 3 = postes · ← → = ticket · C = retour en salle", W / 2, 1030, 26, "#fff", "center", "#5a3a29", "normal");
    }
  }

  // ------------------------------------------------------------------ interface
  const BTN_PAUSE = { x: W - 214, y: 20, w: 184, h: 56 };
  const BTN_REPRENDRE = { x: W / 2 - 330, y: H / 2 + 10, w: 660, h: 100 };
  function barreRepu(x, y, w, h) {                  // jauge de réputation : rouge → vert, avec l'étoile du succès de presse au bout
    const v = Math.max(0, Math.min(100, S_.repuAff)) / 100, col = v < 0.2 ? "#d9473b" : v < 0.45 ? "#e8833a" : v < 0.75 ? "#e8b33f" : "#6cb04a";
    ctx.fillStyle = "rgba(90,58,41,0.25)"; rr(x, y, w, h, h / 2); ctx.fill();
    if (v > 0.01) { ctx.save(); rr(x, y, w, h, h / 2); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(h, w * v), h); ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillRect(x, y + 4, Math.max(h, w * v), h / 3); ctx.restore(); }
    ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; rr(x, y, w, h, h / 2); ctx.stroke();
    if (v >= 0.95 && !A.calme) { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 8); dessiner("fx_etoile", x + w - 6, y + h / 2, 0.11, 0.11, "centre"); ctx.restore(); } else dessiner("fx_etoile", x + w - 6, y + h / 2, 0.11, 0.11, "centre");
    texte("Réputation", x, y + h + 18, 18, A.contraste ? "#000" : "#6a4a36", "left", null, "normal");
  }
  function dessinerHUD() {
    const dur = S_ && S_.seance, hh = dur ? 150 : 130;
    ctx.fillStyle = A.contraste ? "#ffffff" : "rgba(246,233,207,0.94)"; rr(24, 20, 410, hh, 22); ctx.fill();
    ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; ctx.stroke();
    dessiner("fx_piece", 40, 32, 0.2, 0.2, "haut"); texte(String(S_.score), 112, 62, 46, A.contraste ? "#000" : "#5a3a29", "left");
    if (S_.seance) {                      // séance : le temps restant remplace les cœurs
      const r = Math.ceil(S_.reste), mm = Math.floor(r / 60), ss = r % 60;
      texte("Temps : " + mm + ":" + (ss < 10 ? "0" : "") + ss, 40, 112, 44, r <= 30 ? (A.contraste ? "#b00000" : "#d9473b") : (A.contraste ? "#000" : "#5a3a29"), "left");
    }
    barreRepu(212, 34, 206, 34);
    { const n = nbEtoilesGuide(); for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = i < n ? 1 : 0.22; dessiner("fx_etoile", 342 + i * 38, 100, 0.1, 0.1, "centre"); ctx.restore(); } }
    texte("Niveau " + S_.niveau + " · " + infoNiveau().titre, 40, hh + 20 - 22, 23, A.contraste ? "#000" : "#6a4a36", "left", null, "normal");
    if (G.mode === "play") {                                         // bouton pause toujours visible
      const b = BTN_PAUSE, sur = dans(b, G.mouse);
      ctx.fillStyle = sur ? "#e8b33f" : "rgba(246,233,207,0.94)"; rr(b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = "#5a3a29"; ctx.fillRect(b.x + 22, b.y + 16, 8, 24); ctx.fillRect(b.x + 36, b.y + 16, 8, 24);
      texte("Pause (P)", b.x + 62, b.y + b.h / 2 + 1, 24, "#4a2f22", "left");
    }
    texte((G.vue === "salle" ? "← → : marcher   Espace : agir   " : "") + "P : pause   M : son" + (S_.cuis.ouverte ? (G.vue === "cuisine" ? "   C : salle" : "   C : cuisine") : ""), W - 30, H - 22, 22, "rgba(255,255,255,0.8)", "right", "rgba(60,30,20,0.7)", "normal");
  }
  function dessinerPause() {
    ctx.fillStyle = "rgba(30,15,8,0.62)"; ctx.fillRect(0, 0, W, H);
    texte("PAUSE", W / 2, H / 2 - 110, 120, "#f6e9cf", "center", "#5a3a29");
    const b = BTN_REPRENDRE, sur = dans(b, G.mouse);
    ctx.fillStyle = sur ? "#e8b33f" : "#4c8c4a"; rr(b.x, b.y, b.w, b.h, 24); ctx.fill(); ctx.strokeStyle = "#f6e9cf"; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = sur ? "#4a2f22" : "#fff"; ctx.beginPath(); ctx.moveTo(b.x + 56, b.y + 28); ctx.lineTo(b.x + 56, b.y + 72); ctx.lineTo(b.x + 92, b.y + 50); ctx.closePath(); ctx.fill();
    texte("Reprendre la partie", b.x + 118, b.y + b.h / 2 + 2, 38, sur ? "#4a2f22" : "#fff", "left");
    texte("Clique n’importe où, ou appuie sur Espace, Entrée ou P", W / 2, b.y + b.h + 56, 30, "#f6e9cf", "center", "#5a3a29", "normal");
  }

  // Les messages s'empilent depuis le bas : le plus récent en bas, les autres au-dessus sans se chevaucher.
  const hauteurMsg = (m) => Math.round((m.note ? 134 : m.sous ? 100 : 66) * TAILLES[A.taille]);
  function dessinerMessages() {
    const k1 = TAILLES[A.taille];
    let y = 905 - Math.round((k1 - 1) * 100);
    for (let k = S_.msgs.length - 1; k >= 0; k--) {
      const m = S_.msgs[k], h = hauteurMsg(m);
      if (k < S_.msgs.length - 1) y -= h + 14;
      const a = Math.min(1, m.t / 0.2, (m.dur - m.t) / 0.4); if (a <= 0) continue;
      ctx.save(); ctx.globalAlpha = a;
      const col = A.contraste ? (m.kind === "ok" ? "#006400" : m.kind === "bad" ? "#b00000" : "#000") : (m.kind === "ok" ? "#4c8c4a" : m.kind === "bad" ? "#d9473b" : "#8b5a3c");
      const w = Math.min(1840, Math.max(560, ts(30) * (m.texte.length + 2), ts(22) * (m.sous.length + 4), ts(14) * (m.note.length + 4)));
      ctx.fillStyle = FOND(); rr(W / 2 - w / 2, y, w, h, 20); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = A.contraste ? 9 : 6; ctx.stroke();
      texte(m.texte, W / 2, y + (m.sous ? 32 : 33) * k1, ts(32), col);
      if (m.sous) texte(m.sous, W / 2, y + 72 * k1, ts(25), ENCRE(), "center", null, "normal");
      if (m.note) texte(m.note, W / 2, y + 112 * k1, ts(22), A.contraste ? "#000" : "#7a4a2a", "center", null, "normal");
      ctx.restore();
    }
  }

  function pilule(x, y, hw, label, taille) {
    ctx.fillStyle = "#ffd84a"; rr(x - hw, y - 22, 2 * hw, 44, 14); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 10, y + 22); ctx.lineTo(x + 10, y + 22); ctx.lineTo(x, y + 34); ctx.closePath(); ctx.fill(); ctx.stroke();
    texte(label, x, y + 1, taille, "#4a2f22");
  }
  function dessinerAction() {                      // « Espace » au-dessus de la table (ou du passe-plats) où le serveur peut agir
    if (G.vue !== "salle" || G.trans || S_.panel || S_.dial || G.mode !== "play") return;
    const sv = S_.serveur; if (sv.task || sv.path.length || sv.poseT > 0) return;
    const bob = A.calme ? 0 : Math.sin(G.t * 6) * 4, i = tableProche();
    if (i >= 0) {
      const tb = S_.tables[i], c = tb.client;
      if (sv.carry || (c && c.state === "call")) { pilule(tb.x, 378 + bob, sv.carry ? 100 : 62, sv.carry ? "Espace : servir" : "Espace", sv.carry ? 20 : 26); return; }
    }
    if (auPasse() && !sv.carry && (commandesEnAttente().length || S_.hatchQ.length)) pilule(HATCH.x + HATCH_RECT.w / 2, 478 + bob, 128, "Espace : passe-plats", 22);
  }

  // bulle de dialogue au-dessus de la table : le client parle (bulle crème, avec une pointe vers lui), le serveur répond (bulle verte)
  function dessinerDialogue() {
    const d = S_.dial; if (!d || G.vue !== "salle") return;
    const tb = S_.tables[d.table], L = ligneDialogue(d), serv = L.qui === "serveur";
    const t1 = ts(30), tg = ts(54), tb2 = ts(24);
    const lignes = lignesBulle(L.haut, 520, t1);
    let w = 0; texte("", 0, 0, t1); for (const l of lignes) w = Math.max(w, ctx.measureText(l).width);
    if (L.gros) { texte("", 0, 0, tg); w = Math.max(w, ctx.measureText(L.gros).width); }
    if (L.bas) { texte("", 0, 0, tb2); w = Math.max(w, ctx.measureText(L.bas).width); }
    w = Math.min(640, Math.max(330, w + 70));
    const h = lignes.length * (t1 + 8) + (L.gros ? tg + 14 : 0) + (L.bas ? tb2 + 10 : 0) + 56;
    const cx = Math.max(w / 2 + 20, Math.min(W - w / 2 - 20, tb.x)), bas = 410, by = bas - h, bx = cx - w / 2;
    const fond = serv ? "#e4f1dc" : FOND(), cont = serv ? "#4c8c4a" : "#5a3a29";
    ctx.save();
    ctx.fillStyle = fond; rr(bx, by, w, h, 22); ctx.fill(); ctx.strokeStyle = cont; ctx.lineWidth = 6; ctx.stroke();
    if (!serv) {                                                    // pointe vers le client
      ctx.beginPath(); ctx.moveTo(tb.x - 22, bas - 3); ctx.lineTo(tb.x + 22, bas - 3); ctx.lineTo(tb.x, bas + 30); ctx.closePath(); ctx.fillStyle = fond; ctx.fill(); ctx.stroke();
      ctx.fillStyle = fond; ctx.fillRect(tb.x - 19, bas - 8, 38, 9);
    }
    ctx.fillStyle = cont; rr(bx + 18, by - 16, serv ? 112 : 92, 30, 12); ctx.fill();
    texte(serv ? "SERVEUR" : "CLIENT", bx + 18 + (serv ? 56 : 46), by - 1, 19, "#fff");
    let y = by + 24;
    for (const l of lignes) { texte(l, cx, y + t1 / 2, t1, ENCRE(), "center", null, "normal"); y += t1 + 8; }
    if (L.gros) { texte(L.gros, cx, y + tg / 2 + 4, tg, A.contraste ? "#000" : L.couleur, "center", "#fff"); y += tg + 14; }
    if (L.bas) { texte(L.bas, cx, y + tb2 / 2, tb2, A.contraste ? "#000" : "#7a5a44", "center", null, "normal"); y += tb2 + 10; }
    texte(d.step < DIAL_N - 1 ? "Espace : suite" : "Espace : j’y vais !", bx + w - 18, by + h - 18, 19, A.contraste ? "#000" : "#7a5a44", "right", null, "normal");
    ctx.restore();
  }

  function dessinerFx() {
    for (const f of S_.fx) {
      const a = Math.max(0, 1 - f.t / f.dur);
      ctx.save(); ctx.globalAlpha = a;
      if (f.img) dessiner(f.img, f.x, f.y, f.scale || 0.3, f.scale || 0.3, "centre");
      if (f.texte) texte(f.texte, f.x + 52, f.y, 34, "#e8b33f", "left", "#5a3a29");
      ctx.restore();
    }
  }

  function bouton(x, y, w, h, label, actif, taille) {
    const sur = G.mouse.x > x && G.mouse.x < x + w && G.mouse.y > y && G.mouse.y < y + h;
    ctx.fillStyle = actif ? "#4c8c4a" : sur ? "#e8b33f" : "#f6e9cf"; rr(x, y, w, h, 20); ctx.fill();
    ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 5; ctx.stroke();
    texte(label, x + w / 2, y + h / 2 + 2, taille || 34, actif ? "#fff" : "#4a2f22");
    return { x, y, w, h };
  }
  const BTN = {};
  function dessinerTitre() {
    ctx.fillStyle = "rgba(40,20,10,0.55)"; ctx.fillRect(0, 0, W, H);
    texte("Le Resto du Passé Simple", W / 2, 190, 112, "#f6e9cf", "center", "#5a3a29");
    texte("Sers tes clients : trouve au passe-plats l’assiette avec la bonne forme du passé simple !", W / 2, 285, 40, "#fff", "center", "#5a3a29", "normal");
    texte("Vitesse des clients :", W / 2, 360, 34, "#fff", "center", "#5a3a29");
    BTN.normal = bouton(W / 2 - 470, 390, 290, 70, "Normal", G.chrono === "normal", 32);
    BTN.lent = bouton(W / 2 - 145, 390, 290, 70, "Lent", G.chrono === "lent", 32);
    BTN.sans = bouton(W / 2 + 180, 390, 290, 70, "Sans chrono", G.chrono === "sans", 32);
    if (G.libre) {
      texte("Entraînement libre — verbes :", W / 2, 500, 34, "#fff", "center", "#5a3a29");
      BTN.groupe = [0, 1, 2, 3].map((g, k) => bouton(W / 2 - 520 + k * 270, 530, 250, 70, g ? VERBES.GROUPES[g].titre : "Tous les verbes", G.groupe === g, 27));
    } else {
      BTN.groupe = null; const R = RESTOS[G.resto];
      texte(R.titre + " — " + R.lieu, W / 2, 510, 42, "#f6e9cf", "center", "#5a3a29");
      texte("Verbes : " + R.contenu + "   ·   jusqu’à " + R.tablesMax + " tables   ·   pièces × " + String(R.coef).replace(".", ","), W / 2, 575, 32, "#fff", "center", "#5a3a29", "normal");
    }
    texte("Type de partie :", W / 2, 632, 34, "#fff", "center", "#5a3a29");
    BTN.duree = DUREES.map((d, k) => bouton(W / 2 - 520 + k * 270, 660, 250, 84, d ? "Séance " + d + " min" : "Réputation", G.duree === d, 29));
    texte(G.duree ? "Séance : seul le temps compte, tu sers un maximum de clients avant la fin." : "Partie classique : garde une bonne réputation ! À zéro, c’est perdu ; au maximum, c’est un succès de presse.", W / 2, 775, 28, "#fff", "center", "#5a3a29", "normal");
    BTN.jouer = bouton(W / 2 - 230, 830, 460, 120, "JOUER", false);
    BTN.nom = bouton(400, 850, 300, 80, "Mon resto (N)", false, 28);
    texte(G.nom.length > 24 ? G.nom.slice(0, 23) + "…" : G.nom, 550, 955, 26, "#f6e9cf", "center", "#5a3a29");
    BTN.presse = bouton(1230, 850, 340, 80, "Revue de presse", false, 28);
    texte(nbEtoilesGuide() + " étoile" + (nbEtoilesGuide() > 1 ? "s" : "") + " sur 3", 1400, 955, 26, "#f6e9cf", "center", "#5a3a29");
    BTN.reglages = bouton(W - 340, 28, 310, 70, "Réglages (R)", false, 30);
    BTN.carte = bouton(30, 112, 400, 62, "← Carte (Échap)", false, 26);
    BTN.atelier = G.libre ? null : bouton(30, 190, 400, 62, "Atelier déco (D)", false, 26);
    BTN.cuisine = bouton(30, 28, 400, 70, G.cuisine ? "Cuisine : oui" : "Cuisine : non", !!G.cuisine, 30);
    texte("Prends la commande du client, va au passe-plats choisir l’assiette (la bonne forme), puis sers la bonne table.", W / 2, 1008, 30, "#fff", "center", "#5a3a29", "normal");
    if (G.cuisine) texte("Après quelques clients servis sans erreur, la cuisine s’ouvre : tu écris toi-même les plats !", W / 2, 1050, 26, "#fff", "center", "#5a3a29", "normal");
    const bob = A.calme ? 0 : Math.sin(G.t * 2) * 5;                       // le chef et le serveur accueillent le joueur
    const chef = img("chef_bravo"), sv = img("serveur_content");
    if (chef) { const h = 330, w = chef.width * h / chef.height; ctx.drawImage(chef, 250 - w / 2, 960 - h + bob, w, h); }
    if (sv) { const h = 470, w = sv.width * h / sv.height; ctx.drawImage(sv, 1700 - w / 2, 975 - h - bob, w, h); }
  }
  const REGLAGES = [
    { cle: "taille", titre: "Taille du texte", opts: ["Normal", "Grand", "Très grand"] },
    { cle: "police", titre: "Police", opts: ["Standard", "Lisible (dyslexie)"] },
    { cle: "contraste", titre: "Contraste", opts: ["Normal", "Élevé"] },
    { cle: "termin", titre: "Terminaison des formes en jaune", opts: ["Non", "Oui"] },
    { cle: "pronom", titre: "Aide : écrire aussi le pronom (il / elle / on…)", opts: ["Non", "Oui"] },
    { cle: "voix", titre: "Lecture à voix haute automatique", opts: ["Non", "Oui"] },
    { cle: "calme", titre: "Animations", opts: ["Normales", "Calmes"] },
    { cle: "son", titre: "Volume des sons", opts: ["Coupé", "Bas", "Normal"] },
    { cle: "musique", titre: "Musique d’ambiance (bistrot)", opts: ["Non", "Oui"] },
  ];
  function dessinerReglages() {
    ctx.fillStyle = A.contraste ? "rgba(0,0,0,0.88)" : "rgba(40,20,10,0.78)"; ctx.fillRect(0, 0, W, H);
    texte("Réglages", W / 2, 80, 80, "#f6e9cf", "center", "#5a3a29");
    BTN.reg = [];
    REGLAGES.forEach((r, i) => {
      const y = 140 + i * 84, n = r.opts.length, w = 300, gap = 30, x0 = W / 2 - (n * w + (n - 1) * gap) / 2;
      texte(r.titre, W / 2, y, 28, "#fff", "center", "#5a3a29");
      r.opts.forEach((o, k) => { const b = bouton(x0 + k * (w + gap), y + 18, w, 50, o, A[r.cle] === k, 26); BTN.reg.push(Object.assign(b, { cle: r.cle, val: k })); });
    });
    ctx.fillStyle = FOND(); rr(W / 2 - 560, 892, 1120, 58, 18); ctx.fill();
    let te = ts(34); texte("", 0, 0, te);
    while (te > 20 && ctx.measureText("Exemple : ils chantèrent / nous mangeâmes").width > 1060) { te -= 2; texte("", 0, 0, te); }
    texte("Exemple : ils chantèrent / nous mangeâmes", W / 2, 922, te, ENCRE());
    BTN.retour = bouton(W / 2 - 190, 964, 380, 76, "Retour", false);
    texte("Crédits : sons et musique créés dans le jeu (aucun fichier externe, aucune licence à citer).", W / 2, 1064, 20, "rgba(255,255,255,0.7)", "center", null, "normal");
  }
  function dessinerFin() {
    ctx.fillStyle = "rgba(40,20,10,0.72)"; ctx.fillRect(0, 0, W, H);
    const nbEt = etoilesFin();      // étoiles : clients servis du premier coup
    texte(S_.seance ? "Séance terminée !" : "Service terminé !", W / 2, 100, 92, "#f6e9cf", "center", "#5a3a29");
    for (let k = 0; k < 3; k++) { ctx.save(); ctx.globalAlpha = k < nbEt ? 1 : 0.18; if (k >= nbEt) ctx.filter = "grayscale(1)"; dessiner("fx_etoile", W / 2 + (k - 1) * 120, 205, 0.34, 0.34, "centre"); ctx.restore(); }
    texte((S_.ctx.libre ? "Score : " : "Pièces gagnées : ") + S_.score + "      Clients servis : " + S_.servis, W / 2, 300, 50, "#fff", "center", "#5a3a29");
    if (S_.servis) texte("Servis du premier coup : " + S_.parfaits + " sur " + S_.servis + "      Plats refusés : " + S_.refus, W / 2, 352, 32, "#e8b33f", "center", "#5a3a29", "normal");
    if (S_.rep) texte("Formes justes : " + S_.justes + " sur " + S_.rep + "  (" + Math.round(100 * S_.justes / S_.rep) + " %)" + (S_.cuisines ? "      Plats cuisinés : " + S_.cuisines : ""), W / 2, 402, 40, "#fff", "center", "#5a3a29", "normal");
    const uniq = []; for (const e of S_.erreurs) if (!uniq.some((u) => u.bonne === e.bonne)) uniq.push(e);
    if (uniq.length) {
      texte("À revoir :", W / 2, 466, 42, "#e8b33f", "center", "#5a3a29");
      uniq.slice(0, 5).forEach((e, k) => texte(pv(e.pronom, e.verbe) + "   →   " + pv(e.pronom, e.bonne) + "   (" + e.regle.terminaison + ")", W / 2, 526 + k * 56, 40, "#fff", "center", "#5a3a29"));
    } else if (S_.rep) texte("Aucune erreur de forme, bravo !", W / 2, 520, 48, "#9be08f", "center", "#5a3a29");
    else texte("Aucune commande prise cette fois.", W / 2, 520, 44, "#f6e9cf", "center", "#5a3a29", "normal");
    if (S_.ctx.libre) {
      BTN.rejouer = bouton(W / 2 - 500, 840, 460, 120, "REJOUER", false); BTN.atelierFin = null;
      BTN.carteFin = bouton(W / 2 + 40, 840, 460, 120, "CARTE", false);
    } else {
      BTN.rejouer = bouton(W / 2 - 750, 840, 480, 120, "REJOUER", false);
      BTN.atelierFin = bouton(W / 2 - 240, 840, 480, 120, "ATELIER DÉCO", false, 40);
      BTN.carteFin = bouton(W / 2 + 270, 840, 480, 120, "CARTE", false);
    }
    if (!S_.ctx.libre) texte(S_.ctx.titre + (S_.succes ? "   ·   succès de presse : " + S_.succes : "") + "   ·   total en poche : " + G.camp.argent + " pièces", W / 2, 1010, 30, "#f6e9cf", "center", "#5a3a29", "normal");
  }

  // ------------------------------------------------------------------ journal : article de presse
  const PAPIER = { x: 210, y: 50, w: 1500, h: 980 };
  const BTN_ART = { x: W / 2 - 230, y: 940, w: 460, h: 70 };
  function mots(par, nom, v) {                     // découpe un paragraphe en mots ; les formes conjuguées sont repérées (hl) et ne se coupent pas
    const t = par.replace(/\{R\}/g, nom).replace(/\{V(\d)\}/g, (m, d) => "\u0001" + (v[d - 1] || "").replace(/ /g, "\u00a0") + "\u0002");
    return t.split(" ").map((w) => {
      const parts = []; let hl = false, cur = "";
      for (const ch of w) { if (ch === "\u0001" || ch === "\u0002") { if (cur) parts.push({ t: cur, hl }); cur = ""; hl = ch === "\u0001"; } else cur += ch; }
      if (cur) parts.push({ t: cur, hl });
      return parts;
    });
  }
  const SERIF = "Georgia, 'Times New Roman', serif";
  function dessinerArticle(a, bouton_txt) {
    const art = PRESSE.ARTICLES.find((x) => x.id === a.id); if (!art) return;
    const nom = a.nom || NOM_DEFAUT, sous = (t) => t.replace(/\{R\}/g, nom);
    ctx.fillStyle = "rgba(30,15,8,0.8)"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    const k = a.t === undefined ? 1 : Math.min(1, a.t / 0.5), e = A.calme ? 1 : 0.92 + 0.08 * k;      // le journal arrive en grossissant
    ctx.translate(W / 2, H / 2); ctx.scale(e, e); ctx.rotate(A.calme || a.t === undefined ? 0 : (1 - k) * 0.05); ctx.translate(-W / 2, -H / 2);
    ctx.fillStyle = A.contraste ? "#fff" : "#f4ebd3"; ctx.fillRect(PAPIER.x, PAPIER.y, PAPIER.w, PAPIER.h);
    ctx.strokeStyle = "#3b2a1e"; ctx.lineWidth = 6; ctx.strokeRect(PAPIER.x + 14, PAPIER.y + 14, PAPIER.w - 28, PAPIER.h - 28);
    const cx = W / 2, enc = A.contraste ? "#000" : "#2b1d14";
    const ser = (t, x, y, taille, coul, align, poids) => { ctx.font = (poids || "bold") + " " + taille + "px " + SERIF; ctx.textAlign = align || "center"; ctx.textBaseline = "middle"; ctx.fillStyle = coul || enc; ctx.fillText(t, x, y); };
    ser(PRESSE.JOURNAL, cx, PAPIER.y + 82, 78, enc);
    ctx.fillStyle = enc; ctx.fillRect(PAPIER.x + 50, PAPIER.y + 136, PAPIER.w - 100, 4); ctx.fillRect(PAPIER.x + 50, PAPIER.y + 146, PAPIER.w - 100, 2);
    ser(art.rubrique.toUpperCase() + "   ·   " + (art.etoiles ? "★".repeat(art.etoiles) : "COUP DE CŒUR"), cx, PAPIER.y + 180, 26, "#8a3b1f", "center", "normal");
    // titre (réduit s'il est trop long)
    const titre = sous(art.titre); let ft = 64; ctx.font = "bold " + ft + "px " + SERIF; while (ft > 36 && ctx.measureText(titre).width > PAPIER.w - 140) { ft -= 2; ctx.font = "bold " + ft + "px " + SERIF; }
    ser(titre, cx, PAPIER.y + 252, ft, enc);
    ser(sous(art.chapeau), cx, PAPIER.y + 316, 28, "#5a3a29", "center", "italic");
    // corps : mots, passage à la ligne, formes conjuguées mises en valeur
    const taille = ts(32), inter = Math.round(taille * 1.5), x0 = PAPIER.x + 90, larg = PAPIER.w - 180;
    let y = PAPIER.y + 396;
    for (const par of art.paragraphes) {
      let x = x0; const lignes = [[]]; let cw = 0;
      const ws = mots(par, nom, a.v);
      ctx.font = "normal " + taille + "px " + SERIF; const esp = ctx.measureText(" ").width;
      for (const w of ws) {
        const lw = w.reduce((s2, p2) => { ctx.font = (p2.hl ? "bold " : "normal ") + taille + "px " + SERIF; return s2 + ctx.measureText(p2.t).width; }, 0);
        if (cw && cw + esp + lw > larg) { lignes.push([]); cw = 0; }
        lignes[lignes.length - 1].push({ w, lw, dx: cw ? cw + esp : 0 }); cw = (cw ? cw + esp : 0) + lw;
      }
      for (const ln of lignes) {
        for (const m of ln) {
          let px = x0 + m.dx;
          for (const p2 of m.w) {
            ctx.font = (p2.hl ? "bold " : "normal ") + taille + "px " + SERIF; ctx.textAlign = "left"; ctx.textBaseline = "middle";
            const wd = ctx.measureText(p2.t).width;
            if (p2.hl) { ctx.fillStyle = A.contraste ? "#ffe066" : "#f6d56a"; ctx.fillRect(px - 4, y - taille * 0.6, wd + 8, taille * 1.2); }
            ctx.fillStyle = p2.hl ? (A.contraste ? "#8a0000" : "#a3261c") : enc; ctx.fillText(p2.t, px, y); px += wd;
          }
        }
        y += inter;
      }
      y += Math.round(inter * 0.3);
    }
    ser("— " + PRESSE.CRITIQUE, PAPIER.x + PAPIER.w - 90, Math.min(y + 6, PAPIER.y + 880), 26, "#5a3a29", "right", "italic");
    ctx.restore();
    const pret = a.t === undefined || a.t > 0.8;
    if (pret) { bouton(BTN_ART.x, BTN_ART.y, BTN_ART.w, BTN_ART.h, bouton_txt, false, 32); }
  }
  function dessinerNom() {
    ctx.fillStyle = "rgba(40,20,10,0.8)"; ctx.fillRect(0, 0, W, H);
    texte("Comment s’appelle ton restaurant ?", W / 2, 230, 70, "#f6e9cf", "center", "#5a3a29");
    texte("Ce nom sera écrit dans les articles du journal.", W / 2, 320, 36, "#fff", "center", "#5a3a29", "normal");
    ctx.fillStyle = "#fffaf0"; rr(W / 2 - 520, 400, 1040, 120, 24); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 6; ctx.stroke();
    const cur = (!A.calme && Math.floor(G.t * 2) % 2 === 0) ? "|" : " ";
    texte((G.saisieNom || "") + cur, W / 2, 462, 58, "#4a2f22", "center", null, "bold");
    texte("Exemples : Chez Marcel · La Toque d’Or · Le Verbe Gourmand", W / 2, 590, 30, "#f6e9cf", "center", "#5a3a29", "normal");
    BTN.nomOk = bouton(W / 2 - 330, 680, 300, 90, "Valider", false, 36);
    BTN.nomDef = bouton(W / 2 + 30, 680, 300, 90, "Nom par défaut", false, 28);
    texte("Entrée : valider      Échap : annuler", W / 2, 830, 28, "#fff", "center", "#5a3a29", "normal");
  }
  function dessinerPresse() {
    ctx.fillStyle = "rgba(40,20,10,0.82)"; ctx.fillRect(0, 0, W, H);
    texte("Revue de presse", W / 2, 110, 90, "#f6e9cf", "center", "#5a3a29");
    texte("Les articles que le journal a écrits sur « " + G.nom + " »", W / 2, 195, 36, "#fff", "center", "#5a3a29", "normal");
    BTN.art = PRESSE.ARTICLES.map((art, i) => {
      const x = W / 2 - 560, y = 270 + i * 130, w = 1120, h = 108, got = G.guide.find((g) => g.id === art.id), sur = got && dans({ x, y, w, h }, G.mouse);
      ctx.fillStyle = got ? (sur ? "#e8b33f" : "#f6e9cf") : "rgba(246,233,207,0.25)"; rr(x, y, w, h, 20); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 5; ctx.stroke();
      if (got) {
        texte(art.etoiles ? "★".repeat(art.etoiles) : "✎", x + 100, y + h / 2 + 2, 44, "#c98a12", "center", null, "bold");
        texte(art.titre.replace(/\{R\}/g, got.nom || NOM_DEFAUT), x + 200, y + h / 2 + 2, 34, "#4a2f22", "left");
      } else {
        texte(art.etoiles ? "☆".repeat(art.etoiles) : "✎", x + 100, y + h / 2 + 2, 44, "rgba(255,255,255,0.5)", "center");
        texte(art.etoiles ? "À gagner : remplis la barre de réputation" : "À gagner : sers " + GUIDE.mentionApres + " clients", x + 200, y + h / 2 + 2, 28, "rgba(255,255,255,0.8)", "left", null, "normal");
      }
      return got ? { x, y, w, h, id: art.id } : null;
    });
    BTN.presseRetour = bouton(W / 2 - 190, 930, 380, 80, "Retour", false);
  }

  // ------------------------------------------------------------------ écran d'accueil : le serveur arrive devant le resto
  const ACCU = {
    MARCHE: 3.2, ENSEIGNE: 3.9, PANNEAU: 6.4, FIN: 7.2,           // instants (s) : arrivée, pancarte, panneau OUVERT, animation finie
    SOL: 1010, X0: -150, X1: 690, H: 390,
    ENS: { x: 959, y: 332, w: 330 },                                // pancarte vierge de l'image (centre, largeur utile)
    PORTE: { x: 830, y: 610, w: 270, h: 360 },
    ATTACHE: { x: 960, y: 626 },                                    // clou où le panneau OUVERT est accroché
    LIGNES: ["Au passé", "pas si simple"],
  };
  const panneauRect = () => ({ x: ACCU.ATTACHE.x - 160, y: ACCU.ATTACHE.y + 20, w: 320, h: 130 });
  const entrerResto = () => { if (G.sortie > 0) return; G.sortie = 0.45; sonClochette(); };
  function actionAccueil(p) {                                       // clic / Espace : passe l'animation, puis entre
    if (G.sortie > 0) return;
    if (G.tA < ACCU.FIN) { G.tA = ACCU.FIN; return; }
    if (!p || dans(panneauRect(), p) || dans(ACCU.PORTE, p)) entrerResto();
  }
  function dessinerAccueil() {
    const t = G.tA, ease = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3), sf = "bold %px Georgia, 'Times New Roman', serif";
    const R = RESTOS[G.accueilResto], fac = img(R.facade), bg = fac || img("bg_titre");
    if (bg) ctx.drawImage(bg, 0, 0, W, H); else { ctx.fillStyle = "#f2b774"; ctx.fillRect(0, 0, W, H); }
    if (!fac && R.tint) teinter(R.tint);                              // façade provisoire : celle du village, teintée
    // pancarte : le texte s'écrit lettre par lettre
    const lignes = R.enseigne, nTot = lignes.join("").length, n = t < ACCU.ENSEIGNE ? 0 : Math.min(nTot, Math.floor((t - ACCU.ENSEIGNE) / 0.07));
    let reste = n; const tailleE = 50;
    lignes.forEach((l, i) => {
      const part = l.slice(0, Math.max(0, Math.min(l.length, reste))); reste -= l.length;
      if (!part) return;
      ctx.font = sf.replace("%", tailleE); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      let full = ctx.measureText(l).width;
      if (full > ACCU.ENS.w + 50) { ctx.font = sf.replace("%", Math.floor(tailleE * (ACCU.ENS.w + 50) / full)); full = ctx.measureText(l).width; }
      const x0 = ACCU.ENS.x - full / 2; ctx.textAlign = "left";
      ctx.lineWidth = 7; ctx.strokeStyle = "#3b2415"; ctx.lineJoin = "round"; ctx.strokeText(part, x0, ACCU.ENS.y - 26 + i * 56);
      ctx.fillStyle = "#f6d56a"; ctx.fillText(part, x0, ACCU.ENS.y - 26 + i * 56);
    });
    const finE = ACCU.ENSEIGNE + nTot * 0.07;
    if (!A.calme && t > finE && t < finE + 0.9) {                       // petits éclats quand la pancarte est écrite
      for (let i = 0; i < 4; i++) { const a = (t - finE) / 0.9; ctx.save(); ctx.globalAlpha = 1 - a; dessiner("fx_etoile", ACCU.ENS.x - 170 + i * 113, ACCU.ENS.y - 60 - a * 30 + (i % 2) * 90, 0.09, 0.09, "centre"); ctx.restore(); }
    }
    // le serveur arrive, s'arrête, puis se réjouit
    const marche = t < ACCU.MARCHE;
    const sx = marche ? ACCU.X0 + (ACCU.X1 - ACCU.X0) * (t / ACCU.MARCHE) : ACCU.X1;
    const k = marche ? "serveur_marche_" + (1 + (Math.floor(t * 10) % 6)) : t < ACCU.ENSEIGNE ? "serveur_idle" : "serveur_content";
    const sp = img(k) || img("serveur_idle");
    if (sp) {
      const h = ACCU.H, w = sp.width * h / sp.height, bob = A.calme ? 0 : marche ? Math.abs(Math.sin(t * 10)) * -7 : Math.sin(t * 2) * -2;
      ctx.fillStyle = "rgba(60,30,20,0.25)"; ctx.beginPath(); ctx.ellipse(sx, ACCU.SOL, 70, 14, 0, 0, 7); ctx.fill();
      ctx.drawImage(sp, sx - w / 2, ACCU.SOL - h + bob, w, h);
    }
    // panneau OUVERT : il tombe sur la porte, se balance, et attend un clic
    if (t >= ACCU.PANNEAU) {
      const u = (t - ACCU.PANNEAU) / 0.8, chute = A.calme ? 0 : (1 - ease(u)) * -340 + (u < 1 ? 0 : 0), rebond = A.calme || u < 1 ? 0 : Math.sin((t - ACCU.PANNEAU - 0.8) * 2) * 0.06 * Math.exp(-(t - ACCU.PANNEAU - 0.8) * 0.4);
      const r = panneauRect(), sur = dans(r, G.mouse) && t >= ACCU.FIN, pulse = A.calme || t < ACCU.FIN ? 1 : 1 + 0.03 * Math.sin(t * 4);
      ctx.save(); ctx.translate(ACCU.ATTACHE.x, ACCU.ATTACHE.y + chute); ctx.rotate(rebond); ctx.scale(pulse, pulse);
      ctx.strokeStyle = "#3b2415"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-90, 20); ctx.lineTo(0, 0); ctx.lineTo(90, 20); ctx.stroke();
      ctx.fillStyle = "#c9a227"; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = sur ? "#e8b33f" : "#4c8c4a"; rr(-160, 20, 320, 130, 22); ctx.fill(); ctx.strokeStyle = "#3b2415"; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = "#f6e9cf"; ctx.lineWidth = 3; rr(-148, 32, 296, 106, 16); ctx.stroke();
      ctx.font = sf.replace("%", 62); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = sur ? "#3b2415" : "#fff"; ctx.fillText("OUVERT", 0, 70);
      ctx.font = "bold 26px 'Trebuchet MS', Verdana, sans-serif"; ctx.fillStyle = sur ? "#3b2415" : "#f6e9cf"; ctx.fillText("clique pour entrer", 0, 117);
      ctx.restore();
    }
    if (t >= ACCU.FIN) texte("Clique sur le panneau pour entrer   (ou Espace)", W / 2, 1046, 34, "#fff", "center", "#5a3a29");
    else if (t > 0.6) texte("Clique pour passer l’animation", W / 2, 1046, 26, "rgba(255,255,255,0.85)", "center", "#5a3a29", "normal");
    if (G.sortie > 0) { ctx.fillStyle = "rgba(30,15,8," + (1 - G.sortie / 0.45).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
  }


  // ------------------------------------------------------------------ la carte de la campagne (chantier 7b)
  function teinter(col) { ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const ouvrir = (mode) => { G.retourDe = G.mode; G.mode = mode; };
  const CARTE = [{ x: 300, y: 700 }, { x: 700, y: 560 }, { x: 1130, y: 430 }, { x: 1560, y: 310 }];   // centres des médaillons
  const MED_R = 92;
  const platRect = (i) => ({ x: CARTE[i].x - 180, y: CARTE[i].y + 104, w: 360, h: 146 });
  function ouvrirResto(i) {
    const r = G.camp.restos[i];
    if (!r.ouvert) { G.carteMsg = { texte: "Verrouillé : obtiens un succès de presse (barre de réputation pleine) au resto « " + RESTOS[i - 1].titre + " ».", jusqu: G.t + 5 }; sonKo(); return; }
    G.resto = i; G.libre = false; G.accueilResto = i; G.accueilSuite = "title"; G.mode = "accueil"; G.tA = 0; G.sortie = 0; sauver(); sonClic();
  }
  function entrainementLibre() { G.libre = true; G.mode = "title"; sonClic(); }
  function nouvelleCampagne() { G.camp = campVide(); G.guide = []; G.resto = 0; G.carteSel = 0; G.resetT = 0; sauver(); sonClic(); }
  function cadenas(x, y, r) {
    ctx.fillStyle = "#e8b33f"; ctx.strokeStyle = "#3b2415"; ctx.lineWidth = 6; rr(x - r * 0.5, y - r * 0.1, r, r * 0.8, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 0.32, Math.PI, 0); ctx.stroke(); ctx.fillStyle = "#3b2415"; ctx.beginPath(); ctx.arc(x, y + r * 0.28, r * 0.09, 0, 7); ctx.fill();
  }
  function vignetteResto(i, x, y, r, verrou, sur) {
    const R = RESTOS[i], etat = G.camp.restos[i], fac = img(R.facade), im = fac || img("bg_titre");
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
    if (im) { const k = im.width / W, sz = 760 * k; ctx.drawImage(im, (960 - 380) * k, (560 - 380) * k, sz, sz, x - r, y - r, 2 * r, 2 * r); } else { ctx.fillStyle = "#e8b78a"; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    if (!fac && R.tint) { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = R.tint; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.globalCompositeOperation = "source-over"; }
    if (verrou) { ctx.fillStyle = "rgba(40,28,22,0.62)"; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    ctx.restore();
    ctx.lineWidth = sur ? 12 : 9; ctx.strokeStyle = verrou ? "#8a7a6a" : etat.reussi ? "#6cb04a" : "#e8b33f"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = "#3b2415"; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, 7); ctx.stroke();
    if (verrou) cadenas(x, y, r * 0.8);
    else if (etat.reussi) dessiner("fx_etoile", x + r * 0.78, y - r * 0.78, 0.17, 0.17, "centre");
  }
  function decorCarte() {
    const bg = img("bg_carte");
    if (bg) { ctx.drawImage(bg, 0, 0, W, H); return; }
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#fbe6b0"); g.addColorStop(0.55, "#f6c27d"); g.addColorStop(1, "#e59d5c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,244,200,0.8)"; ctx.beginPath(); ctx.arc(1650, 210, 120, 0, 7); ctx.fill();
    [["#d9a35f", 560, 70], ["#c98f4c", 700, 90], ["#b87d3f", 830, 60]].forEach((c, k) => {        // collines
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, c[1] + Math.sin(x / 260 + k * 1.7) * c[2] + Math.sin(x / 90 + k) * 12);
      ctx.lineTo(W, H); ctx.fill();
    });
    ctx.fillStyle = "rgba(120,70,40,0.35)";                                                          // la capitale, au loin
    [[1700, 120, 50], [1760, 70, 40], [1820, 150, 60], [1880, 100, 40]].forEach((b) => ctx.fillRect(b[0], 360 - b[1], b[2], b[1]));
  }
  function routeCarte() {
    const pts = [{ x: -60, y: 860 }].concat(CARTE, [{ x: 1990, y: 200 }]);
    const trace = () => {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
      }
    };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    trace(); ctx.strokeStyle = "#7a4a2a"; ctx.lineWidth = 62; ctx.stroke();
    trace(); ctx.strokeStyle = "#f1d6a0"; ctx.lineWidth = 50; ctx.stroke();
    trace(); ctx.strokeStyle = "#c98f4c"; ctx.lineWidth = 4; ctx.setLineDash([22, 22]); ctx.stroke(); ctx.setLineDash([]);
  }
  function dessinerCarte() {
    decorCarte(); routeCarte();
    texte("La route du Palace", W / 2, 84, 84, "#f6e9cf", "center", "#5a3a29");
    texte("Un succès de presse (barre de réputation pleine) ouvre le restaurant suivant.", W / 2, 158, 30, "#fff", "center", "#5a3a29", "normal");
    dessiner("fx_piece", 40, 26, 0.22, 0.22, "haut"); texte(G.camp.argent + " pièces", 124, 62, 40, "#fff", "left", "#5a3a29");
    { const n = nbEtoilesGuide(); for (let k = 0; k < 3; k++) { ctx.save(); ctx.globalAlpha = k < n ? 1 : 0.3; dessiner("fx_etoile", 62 + k * 46, 128, 0.12, 0.12, "centre"); ctx.restore(); } }
    BTN.platCarte = [];
    RESTOS.forEach((R, i) => {
      const c = CARTE[i], st = G.camp.restos[i], verrou = !st.ouvert, pr = platRect(i);
      if (G.mouse.x !== undefined && (Math.hypot(G.mouse.x - c.x, G.mouse.y - c.y) < MED_R || dans(pr, G.mouse))) G.carteSel = i;
      const sel = G.carteSel === i, rr_ = MED_R * (sel && !A.calme ? 1.06 : 1);
      ctx.fillStyle = "rgba(60,30,20,0.25)"; ctx.beginPath(); ctx.ellipse(c.x, c.y + MED_R + 6, MED_R, 18, 0, 0, 7); ctx.fill();
      vignetteResto(i, c.x, c.y, rr_, verrou, sel);
      ctx.fillStyle = sel ? "#fff6dc" : FOND(); rr(pr.x, pr.y, pr.w, pr.h, 20); ctx.fill(); ctx.strokeStyle = sel ? "#e8b33f" : "#5a3a29"; ctx.lineWidth = sel ? 7 : 5; ctx.stroke();
      texte((i + 1) + ". " + R.titre, c.x, pr.y + 28, 30, ENCRE());
      texte(R.contenu, c.x, pr.y + 62, 21, ENCRE(), "center", null, "normal");
      texte("pièces × " + String(R.coef).replace(".", ",") + "  ·  " + R.tablesMax + " tables", c.x, pr.y + 90, 21, ENCRE(), "center", null, "normal");
      if (verrou) { texte("Verrouillé", c.x, pr.y + 118, 24, "#8a3b1f"); }
      else texte((st.reussi ? "★ Succès de presse  ·  " : "") + st.argent + " pièces gagnées" + (st.etoiles ? "  ·  " + "★".repeat(st.etoiles) : ""), c.x, pr.y + 118, 21, "#4c8c4a");
      BTN.platCarte.push({ i, c, pr });
    });
    if (G.carteMsg && G.t < G.carteMsg.jusqu) { ctx.fillStyle = "rgba(60,30,20,0.85)"; rr(W / 2 - 700, 868, 1400, 64, 18); ctx.fill(); texte(G.carteMsg.texte, W / 2, 900, 28, "#fff"); }
    const y = 960, h = 74;
    BTN.cb = {
      nom: bouton(40, y, 260, h, "Mon resto (N)", false, 26), presse: bouton(320, y, 290, h, "Revue de presse", false, 26), reglages: bouton(630, y, 250, h, "Réglages (R)", false, 26),
      atelier: bouton(900, y, 320, h, "Atelier déco (D)", false, 27), libre: bouton(1240, y, 340, h, "Entraînement libre (L)", false, 25), reset: bouton(1600, y, 280, h, G.t < G.resetT ? "Sûr ? Recliquer" : "Nouvelle campagne", G.t < G.resetT, 23),
    };
    texte("Resto : " + (G.nom.length > 24 ? G.nom.slice(0, 23) + "…" : G.nom), 190, 1052, 22, "#fff", "center", "#5a3a29", "normal");
    texte("← → choisir · Espace ou Entrée : entrer dans le resto", 1100, 1052, 22, "#fff", "center", "#5a3a29", "normal");
  }
  function clicCarte(p) {
    const b = BTN.cb || {};
    if (dans(b.nom, p)) { ouvrirNom(); sonClic(); }
    else if (dans(b.presse, p)) { ouvrir("presse"); sonClic(); }
    else if (dans(b.reglages, p)) { ouvrir("settings"); sonClic(); }
    else if (dans(b.atelier, p)) ouvrirAtelier();
    else if (dans(b.libre, p)) entrainementLibre();
    else if (dans(b.reset, p)) { if (G.t < G.resetT) nouvelleCampagne(); else { G.resetT = G.t + 4; sonClic(); } }
    else { const m = (BTN.platCarte || []).find((q) => Math.hypot(p.x - q.c.x, p.y - q.c.y) < MED_R || dans(q.pr, p)); if (m) ouvrirResto(m.i); }
  }

  // ------------------------------------------------------------------ l'atelier déco (chantier 7c)
  const AT = { rx: 40, ry: 300, rw: 700, rh: 88, pas: 98, ax: 780, ay: 130, aw: 1100 };       // lignes d'objets à gauche, aperçu de la salle à droite
  function ouvrirAtelier() {
    G.atelier = { resto: G.camp.restos[G.resto] && G.camp.restos[G.resto].ouvert ? G.resto : 0, onglet: 0, sel: 0, essai: null, msg: null };
    ouvrir("atelier"); sonClic();
  }
  const itemsAtelier = () => CATALOGUE[G.atelier.onglet].liste;
  const decoAtelier = () => G.camp.restos[G.atelier.resto].deco;
  function decoAvecEssai(d, essai) {                              // aperçu : la déco du resto avec l'objet survolé en plus (sans l'acheter)
    if (!essai) return d;
    const c = { papier: d.papier, nappes: d.nappes, achats: d.achats.slice() };
    if (essai.cle === "objet") { if (!c.achats.includes("objet:" + essai.id)) c.achats.push("objet:" + essai.id); } else c[essai.cle] = essai.id;
    return c;
  }
  function acheterOuChoisir(cle, id) {                            // achat (si les pièces suffisent), ou pose d'un papier / d'une nappe déjà possédé
    const A_ = G.atelier, i = A_.resto, d = G.camp.restos[i].deco, C = CATALOGUE.find((c) => c.cle === cle), it = C.liste.find((x) => x.id === id), prix = prixDeco(it.prix, i);
    if (possede(d, cle, id)) {
      if (cle === "objet") { A_.msg = { texte: "« " + it.nom + " » est déjà dans ton resto.", jusqu: G.t + 3 }; return; }
      if (d[cle] !== id) { d[cle] = id; sauver(); sonClic(); }
      return;
    }
    if (G.camp.argent < prix) { A_.msg = { texte: "Il te manque " + (prix - G.camp.argent) + " pièces pour « " + it.nom + " ». Rejoue un service pour en gagner !", jusqu: G.t + 4 }; sonKo(); return; }
    G.camp.argent -= prix; d.achats.push(cle + ":" + id); if (cle !== "objet") d[cle] = id;
    A_.msg = { texte: "Acheté : " + it.nom + " (− " + prix + " pièces).", jusqu: G.t + 3, ok: true }; sauver(); sonOk();
  }
  function changerRestoAtelier(i) {
    if (!G.camp.restos[i].ouvert) { G.atelier.msg = { texte: "Verrouillé : réussis d’abord le resto précédent (succès de presse).", jusqu: G.t + 4 }; sonKo(); return; }
    G.atelier.resto = i; G.atelier.sel = 0; sonClic();
  }
  function dessinerSalleApercu(i, d, x0, y0, w) {                 // la salle du resto i (tables vides) en miniature avec la déco d
    const k = w / W, R = RESTOS[i], bgk = img(R.salle) ? R.salle : "bg_salle", avant = decoRendu;
    ctx.save(); ctx.translate(x0, y0); ctx.scale(k, k); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    if (!dessiner(bgk, 0, 0, W / (img(bgk) ? img(bgk).width : W), H / (img(bgk) ? img(bgk).height : H), "haut")) { ctx.fillStyle = "#c9b48f"; ctx.fillRect(0, 0, W, H); }
    if (R.tint && bgk === "bg_salle") teinter(R.tint);
    decoRendu = d; papierPeint(d); dessinerObjets(d);
    dessiner("passe_plats", HATCH.x, HATCH.y, HATCH.s, HATCH.s, "haut");
    ORDRE_OUVERTURE.slice(0, R.tablesMax).sort((a, b) => a - b).forEach((t) => dessinerTable({ i: t, x: TABLE_X[t], client: null, plat: null, bulle: null }));
    decoRendu = avant; ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = "#5a3a29"; ctx.strokeRect(x0, y0, w, H * k);
  }
  function pastille(it, cle, x, y, r) {                           // petit visuel de l'objet dans la liste
    if (cle === "objet") { const im = img(it.img); if (im) { const s = (2 * r) / Math.max(im.width, im.height); ctx.drawImage(im, x - im.width * s / 2, y - im.height * s / 2, im.width * s, im.height * s); } return; }
    ctx.fillStyle = it.pastille; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#3b2415"; ctx.stroke();
  }
  function dessinerAtelier() {
    const at = G.atelier, i = at.resto, R = RESTOS[i], d = G.camp.restos[i].deco, C = CATALOGUE[at.onglet];
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#f7e3b8"); g.addColorStop(1, "#e3b27a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    texte("Atelier déco", 40, 70, 72, "#f6e9cf", "left", "#5a3a29");
    texte(R.titre + " — prix × " + String(PRIX_RESTO[i]).replace(".", ","), 40, 138, 34, ENCRE(), "left", null, "normal");
    texte(G.camp.argent + " pièces", W - 40, 62, 44, "#fff", "right", "#5a3a29");
    dessiner("fx_piece", W - 40 - ctx.measureText(G.camp.argent + " pièces").width - 70, 18, 0.2, 0.2, "haut");
    BTN.onglets = CATALOGUE.map((c, k) => bouton(40 + k * 240, 180, 225, 70, c.titre + " (" + (k + 1) + ")", at.onglet === k, 26));
    // objets du catalogue
    at.essai = null; BTN.items = [];
    C.liste.forEach((it, k) => {
      const y = AT.ry + k * AT.pas, prix = prixDeco(it.prix, i), a = possede(d, C.cle, it.id), pose = a && choisi(d, C.cle, it.id), peut = G.camp.argent >= prix;
      const r = { x: AT.rx, y, w: AT.rw, h: AT.rh }, sur = dans(r, G.mouse); if (sur) at.sel = k;
      const sel = at.sel === k;
      if (sel) at.essai = { cle: C.cle, id: it.id };
      ctx.fillStyle = pose ? "#e3f1d2" : sel ? "#fff6dc" : FOND(); rr(r.x, r.y, r.w, r.h, 18); ctx.fill(); ctx.strokeStyle = sel ? "#e8b33f" : "#5a3a29"; ctx.lineWidth = sel ? 7 : 4; ctx.stroke();
      pastille(it, C.cle, r.x + 56, r.y + r.h / 2, 32);
      texte(it.nom, r.x + 112, r.y + r.h / 2 + 2, 30, ENCRE(), "left");
      if (pose) texte(C.cle === "objet" ? "✓ Dans ton resto" : "✓ Posé", r.x + r.w - 24, r.y + r.h / 2 + 2, 26, "#2f6a2f", "right");
      else if (a) texte("Poser", r.x + r.w - 24, r.y + r.h / 2 + 2, 28, "#8a3b1f", "right");
      else texte(prix + " pièces", r.x + r.w - 24, r.y + r.h / 2 + 2, 28, peut ? "#2f6a2f" : "#a82e24", "right");
      BTN.items.push(Object.assign(r, { cle: C.cle, id: it.id }));
    });
    // aperçu en direct : la salle de ce resto avec l'objet survolé
    dessinerSalleApercu(i, decoAvecEssai(d, at.essai), AT.ax, AT.ay, AT.aw);
    texte(at.essai && !possede(d, at.essai.cle, at.essai.id) ? "Aperçu — pas encore acheté" : "Ta salle", AT.ax + AT.aw / 2, AT.ay + 619 + 34, 28, ENCRE(), "center", null, "normal");
    // choix du resto
    BTN.restosAt = RESTOS.map((Rk, k) => { const ouv = G.camp.restos[k].ouvert; const b = bouton(AT.ax + k * 280, 840, 265, 70, ouv ? (k + 1) + ". " + Rk.titre : (k + 1) + ". Verrouillé", i === k, 23); if (!ouv) { ctx.fillStyle = "rgba(60,40,30,0.45)"; rr(b.x, b.y, b.w, b.h, 20); ctx.fill(); } return b; });
    texte("Ici, les pièces rapportent × " + String(R.coef).replace(".", ",") + " mais la déco coûte × " + String(PRIX_RESTO[i]).replace(".", ",") + " : rejoue chaque resto pour t’équiper !", AT.ax + AT.aw / 2, 950, 24, ENCRE(), "center", null, "normal");
    if (at.msg && G.t < at.msg.jusqu) { ctx.fillStyle = at.msg.ok ? "rgba(47,106,47,0.92)" : "rgba(60,30,20,0.88)"; rr(490, 988, 1390, 60, 18); ctx.fill(); texte(at.msg.texte, 1185, 1019, 28, "#fff"); }
    BTN.retourAt = bouton(40, 988, 420, 70, "← Retour (Échap)", false, 28);
    texte("↑ ↓ choisir · Entrée : acheter · ← → : changer de resto", 1240, 1062, 20, ENCRE(), "center", null, "normal");
  }
  function clicAtelier(p) {
    const at = G.atelier;
    if (dans(BTN.retourAt, p)) { G.mode = G.retourDe && G.retourDe !== "atelier" ? G.retourDe : "carte"; sonClic(); return; }
    const o = (BTN.onglets || []).findIndex((b) => dans(b, p)); if (o >= 0) { at.onglet = o; at.sel = 0; sonClic(); return; }
    const r = (BTN.restosAt || []).findIndex((b) => dans(b, p)); if (r >= 0) { changerRestoAtelier(r); return; }
    const it = (BTN.items || []).find((b) => dans(b, p)); if (it) acheterOuChoisir(it.cle, it.id);
  }

  // ------------------------------------------------------------------ rendu
  function rendre() {
    ctx.clearRect(0, 0, W, H);
    if (G.mode === "accueil") { dessinerAccueil(); return; }
    if (G.mode === "carte") { dessinerCarte(); return; }
    if (G.mode === "atelier") { dessinerAtelier(); return; }
    const enCuisine = !!S_ && G.vue === "cuisine" && (G.mode === "play" || G.mode === "over");
    const R_ = S_ && (G.mode === "play" || G.mode === "over") ? S_.ctx : null, bgk = R_ && R_.salle && img(R_.salle) ? R_.salle : "bg_salle";
    if (!enCuisine && !dessiner(bgk, 0, 0, W / (img(bgk) ? img(bgk).width : W), H / (img(bgk) ? img(bgk).height : H), "haut")) { ctx.fillStyle = "#c9b48f"; ctx.fillRect(0, 0, W, H); }
    if (!enCuisine && R_ && R_.tint && bgk === "bg_salle") teinter(R_.tint);
    decoRendu = G.camp.restos[R_ && R_.id >= 0 ? R_.id : G.resto].deco;          // entraînement libre : déco du resto choisi
    if (!enCuisine && R_) papierPeint(decoRendu);
    if (G.mode === "title") { dessinerTitre(); return; }
    if (G.mode === "settings") { dessinerReglages(); return; }
    if (G.mode === "nom") { dessinerNom(); return; }
    if (G.mode === "presse") { dessinerPresse(); return; }
    if (G.mode === "lecture") { dessinerArticle(G.lecture, "Fermer (Échap)"); return; }
    if (!S_) return;
    if (enCuisine) dessinerCuisine();
    else {
      dessinerObjets(decoRendu);                                         // objets achetés à l'atelier
      // passe-plats et plats prêts
      dessiner("passe_plats", HATCH.x, HATCH.y, HATCH.s, HATCH.s, "haut");
      if (commandesEnAttente().length && !S_.panel && !A.calme) { ctx.save(); ctx.globalAlpha = 0.55 + 0.4 * Math.sin(G.t * 5); ctx.strokeStyle = "#ffd84a"; ctx.lineWidth = 7; rr(HATCH.x + 27, HATCH.y + 2, 387, 168, 14); ctx.stroke(); ctx.restore(); }
      S_.hatchQ.slice(0, 3).forEach((h, i, a) => { const x = HATCH_PLATE.x + (i - (a.length - 1) / 2) * 107; dessiner(h.dish, x, HATCH_PLATE.y, 0.25, 0.186, "bas"); texte(String(h.table + 1), x + 58, HATCH_PLATE.y - 50, 36, "#fff", "center", "#5a3a29"); });
      dessinerPorteSalle();
      dessinerRail();
      const sv = S_.serveur, derriere = sv.y < 800;
      if (derriere) dessinerServeur();
      S_.tables.forEach((tb) => { if (tableActive(tb.i)) dessinerTable(tb); });
      if (!derriere) dessinerServeur();
      dessinerAction();
      dessinerDialogue();
      dessinerFx();
    }
    dessinerHUD(); if (G.mode === "play") dessinerMessages();
    if (enCuisine) dessinerSaisie(); else dessinerPanneau();
    if (G.paused) dessinerPause();
    if (S_.article && G.mode === "play") dessinerArticle(S_.article, "Continuer (Espace)");
    if (G.mode === "over") dessinerFin();
    if (G.trans) { const a = Math.max(0, 1 - Math.abs(G.trans.t - 0.22) / 0.22); ctx.fillStyle = "rgba(30,15,8," + a.toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
  }

  // ------------------------------------------------------------------ entrées
  function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  const dans = (b, p) => b && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
  function clic(p) {
    if (G.mode === "accueil") { actionAccueil(p); return; }
    if (G.mode === "carte") { clicCarte(p); return; }
    if (G.mode === "atelier") { clicAtelier(p); return; }
    if (G.mode === "title") {
      if (dans(BTN.normal, p)) { G.chrono = "normal"; sauver(); } else if (dans(BTN.lent, p)) { G.chrono = "lent"; sauver(); } else if (dans(BTN.sans, p)) { G.chrono = "sans"; sauver(); }
      else if (BTN.groupe && BTN.groupe.some((b, k) => dans(b, p) && (G.groupe = k) >= 0)) { sauver(); sonClic(); }
      else if (BTN.duree && BTN.duree.some((b, k) => dans(b, p) && (G.duree = DUREES[k]) >= 0)) { sauver(); sonClic(); }
      else if (dans(BTN.reglages, p)) { ouvrir("settings"); sonClic(); }
      else if (dans(BTN.carte, p)) { G.mode = "carte"; sonClic(); }
      else if (BTN.atelier && dans(BTN.atelier, p)) ouvrirAtelier();
      else if (dans(BTN.cuisine, p)) { G.cuisine = G.cuisine ? 0 : 1; sauver(); sonClic(); }
      else if (dans(BTN.jouer, p)) { nouvellePartie(); sonClic(); }
      else if (dans(BTN.nom, p)) { ouvrirNom(); sonClic(); }
      else if (dans(BTN.presse, p)) { ouvrir("presse"); sonClic(); }
      return;
    }
    if (G.mode === "nom") {
      if (dans(BTN.nomOk, p)) validerNom(); else if (dans(BTN.nomDef, p)) { G.saisieNom = NOM_DEFAUT; validerNom(); }
      return;
    }
    if (G.mode === "presse") {
      const a = (BTN.art || []).find((b) => b && dans(b, p));
      if (a) { G.lecture = Object.assign({}, G.guide.find((g) => g.id === a.id)); G.mode = "lecture"; sonClic(); }
      else if (dans(BTN.presseRetour, p)) { G.mode = G.retourDe || "title"; sonClic(); }
      return;
    }
    if (G.mode === "lecture") { if (dans(BTN_ART, p)) { G.mode = "presse"; sonClic(); } return; }
    if (G.mode === "settings") {
      const b = (BTN.reg || []).find((b) => dans(b, p));
      if (b) { A[b.cle] = b.val; sauver(); sonClic(); if (b.cle === "voix" && b.val === 1) dire("Lecture à voix haute activée."); }
      else if (dans(BTN.retour, p)) { G.mode = G.retourDe || "title"; sonClic(); }
      return;
    }
    if (G.mode === "over") { if (dans(BTN.rejouer, p)) { nouvellePartie(); sonClic(); } else if (BTN.atelierFin && dans(BTN.atelierFin, p)) ouvrirAtelier(); else if (dans(BTN.carteFin, p)) { G.mode = "carte"; sonClic(); } return; }
    if (S_ && S_.article) { if (S_.article.t > 0.8) fermerArticle(); return; }
    if (G.paused) { G.paused = false; sonClic(); return; }                   // n'importe quel clic reprend la partie
    if (G.trans) return;
    if (dans(BTN_PAUSE, p)) { G.paused = true; return; }
    if (G.vue === "cuisine") { clicCuisine(p); return; }
    if (S_.dial) { avancerDialogue(); return; }
    if (S_.panel) {
      if (S_.panel.feedback) { if (dans(FEED_BTN, p)) reessayer(); else if (p.y < PCH.y - 10) S_.panel = null; return; }
      const n = S_.panel.cmd.choix.length;
      if (voixOk() && dans(ECOUTER, p)) { direCommande(S_.panel.cmd, true); return; }
      for (let i = 0; i < n; i++) { const r = briqueRect(i, n); if (dans(r, p)) { choisir(i); return; } }
      if (p.y < PCH.y - 10) S_.panel = null;          // clic hors du panneau : on ferme (la commande reste à préparer)
      return;
    }
    if (S_.cuis.ouverte && dans(DOOR, p)) { demanderCuisine(); return; }
    for (let k = 0; k < S_.tickets.length; k++) {         // clic sur un ticket du rail : aller choisir l'assiette de cette commande
      if (dans(ticketRect(k), p)) { const t = S_.tickets[k], c = S_.tables[t.table].client; if (c && c.ticket === t.id && c.etape === "choix") demanderChoix(t.table); return; }
    }
    if (dans(HATCH_RECT, p) && p.y < 400) { agirAuPasse(); return; }
    for (const tb of S_.tables) {
      if (!tableActive(tb.i)) continue;
      if (Math.abs(p.x - tb.x) < 115 && p.y > 330 && p.y < 830) {
        if (S_.serveur.carry) demanderService(tb.i); else demanderPrise(tb.i);
        return;
      }
    }
  }
  cv.addEventListener("mousemove", (e) => { G.mouse = pos(e); cv.style.cursor = "pointer"; });
  cv.addEventListener("click", (e) => clic(pos(e)));
  cv.addEventListener("touchend", (e) => { if (e.changedTouches[0]) { const p = pos(e.changedTouches[0]); G.mouse = p; clic(p); e.preventDefault(); } }, { passive: false });
  function annulerPanneau() { S_.panel = null; }
  function fermerArticle() { S_.article = null; sonClic(); }
  function ouvrirNom() {
    G.retourDe = G.mode; G.mode = "nom"; G.saisieNom = G.nom; const c = champ();
    if (c) { c.maxLength = 24; c.value = G.nom; c.focus(); c.select(); }
  }
  function validerNom() {
    const n = (G.saisieNom || "").replace(/\s+/g, " ").trim().slice(0, 24);
    G.nom = n || NOM_DEFAUT; sauver(); G.mode = G.retourDe || "title"; sonClic(); const c = champ(); if (c) { c.blur(); c.maxLength = 20; }
  }
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (G.paused && G.mode === "play") {                              // en pause : Espace, Entrée, Échap ou P reprennent (les autres touches ne font rien)
      if (k === "p" || k === "P" || k === " " || k === "Enter" || k === "Escape") { e.preventDefault(); G.paused = false; sonClic(); }
      else if (k === "m" || k === "M") G.muted = !G.muted;
      return;
    }
    if (G.mode === "play" && S_ && G.vue === "cuisine" && S_.cuis.saisie && !G.paused) {       // en train d'écrire : seules Entrée et Échap sont à nous
      if (k === "Enter") { e.preventDefault(); validerSaisie(); }
      else if (k === "Escape") { e.preventDefault(); fermerSaisie(); }
      else { const c = champ(); if (c && document.activeElement !== c) c.focus(); }
      return;
    }
    if (G.mode === "accueil") { if (k === "Enter" || k === " ") { e.preventDefault(); actionAccueil(null); } else if (k === "Escape" && G.accueilSuite === "title" && G.sortie <= 0) { G.mode = "carte"; } return; }
    if (G.mode === "carte") {
      if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); G.carteSel = (G.carteSel + 1) % RESTOS.length; sonClic(); }
      else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); G.carteSel = (G.carteSel + RESTOS.length - 1) % RESTOS.length; sonClic(); }
      else if (k === "Enter" || k === " ") { e.preventDefault(); ouvrirResto(G.carteSel); }
      else if (k === "l" || k === "L") { entrainementLibre(); }
      else if (k === "r" || k === "R") ouvrir("settings");
      else if (k === "d" || k === "D") ouvrirAtelier();
      else if (k === "n" || k === "N") { e.preventDefault(); ouvrirNom(); }
      return;
    }
    if (G.mode === "atelier") {
      const at = G.atelier, n = itemsAtelier().length;
      if (k === "Escape") { e.preventDefault(); G.mode = G.retourDe && G.retourDe !== "atelier" ? G.retourDe : "carte"; sonClic(); }
      else if (k === "ArrowDown") { e.preventDefault(); at.sel = (at.sel + 1) % n; sonClic(); }
      else if (k === "ArrowUp") { e.preventDefault(); at.sel = (at.sel + n - 1) % n; sonClic(); }
      else if (k === "ArrowRight") { e.preventDefault(); for (let j = 1; j <= RESTOS.length; j++) { const t = (at.resto + j) % RESTOS.length; if (G.camp.restos[t].ouvert) { changerRestoAtelier(t); break; } } }
      else if (k === "ArrowLeft") { e.preventDefault(); for (let j = 1; j <= RESTOS.length; j++) { const t = (at.resto + RESTOS.length - j) % RESTOS.length; if (G.camp.restos[t].ouvert) { changerRestoAtelier(t); break; } } }
      else if (k === "Enter" || k === " ") { e.preventDefault(); const it = itemsAtelier()[at.sel]; if (it) acheterOuChoisir(CATALOGUE[at.onglet].cle, it.id); }
      else if (k === "1" || k === "2" || k === "3") { at.onglet = Number(k) - 1; at.sel = 0; sonClic(); }
      return;
    }
    if (G.mode === "nom") {                                           // saisie du nom du resto (le champ caché reçoit les lettres)
      if (k === "Enter") { e.preventDefault(); validerNom(); }
      else if (k === "Escape") { e.preventDefault(); G.mode = G.retourDe || "title"; const c = champ(); if (c) { c.blur(); c.maxLength = 20; } }
      else { const c = champ(); if (c && document.activeElement !== c) c.focus(); }
      return;
    }
    if (G.mode === "presse") { if (k === "Escape" || k === "Enter") { e.preventDefault(); G.mode = G.retourDe || "title"; } return; }
    if (G.mode === "lecture") { if (k === "Escape" || k === "Enter" || k === " ") { e.preventDefault(); G.mode = "presse"; } return; }
    if (G.mode === "play" && S_ && S_.article) { if (k === " " || k === "Enter" || k === "Escape") { e.preventDefault(); if (S_.article.t > 0.8) fermerArticle(); } return; }
    if (k === "ArrowLeft") G.keys.gauche = true;
    if (k === "ArrowRight") G.keys.droite = true;
    if (k === "p" || k === "P") { if (G.mode === "play") G.paused = !G.paused; return; }
    if (k === "m" || k === "M") { G.muted = !G.muted; return; }
    if (G.mode === "title") {
      if (k === "Enter" || k === " ") { e.preventDefault(); nouvellePartie(); sonClic(); }
      else if (k === "r" || k === "R") ouvrir("settings");
      else if (k === "n" || k === "N") { e.preventDefault(); ouvrirNom(); }
      else if (k === "d" || k === "D") { if (!G.libre) ouvrirAtelier(); }
      else if (k === "Escape") { G.mode = "carte"; sonClic(); }
      return;
    }
    if (G.mode === "settings") { if (k === "Escape" || k === "Enter") { e.preventDefault(); G.mode = G.retourDe || "title"; } return; }
    if (G.mode === "over") { if (k === "Enter" || k === " ") { e.preventDefault(); nouvellePartie(); sonClic(); } else if (k === "Escape") { G.mode = "carte"; sonClic(); } return; }
    if (G.mode !== "play" || !S_ || G.paused) return;
    if (G.vue === "cuisine") {
      if (G.trans) return;
      if (/^[1-3]$/.test(k)) clicPoste(+k - 1);
      else if (k === "c" || k === "C" || k === "Escape") changerVue("salle");
      else if (k === "ArrowRight" || k === "ArrowLeft") {
        const ids = S_.tickets.filter((t) => t.cuisine && t.etat === "attente").map((t) => t.id);
        if (ids.length) { e.preventDefault(); const i = ids.indexOf(ticketSelId()); S_.cuis.sel = ids[(i + (k === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]; sonClic(); }
      }
      return;
    }
    if ((k === "c" || k === "C") && !S_.panel && !S_.dial) { demanderCuisine(); return; }
    if ((k === "ArrowLeft" || k === "ArrowRight") && !S_.panel) { e.preventDefault(); return; }
    if ((k === " " || k === "Enter") && !S_.panel) { e.preventDefault(); if (!e.repeat) agirSurPlace(); return; }
    if (S_.panel) {
      const pn = S_.panel, n = pn.cmd.choix.length;
      if (pn.feedback) {
        if (k === "Enter" || k === " ") { e.preventDefault(); if (!e.repeat) reessayer(); }
        else if (k === "Escape") annulerPanneau();
        else if (k === "l" || k === "L") direCommande(pn.cmd, false);
        return;
      }
      if (/^[1-4]$/.test(k)) { if (+k <= n) choisir(+k - 1); }
      else if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); pn.focus = pn.clavier ? (pn.focus + 1) % n : pn.focus; pn.clavier = true; }
      else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); pn.focus = pn.clavier ? (pn.focus + n - 1) % n : pn.focus; pn.clavier = true; }
      else if (k === "Enter" || k === " ") { e.preventDefault(); if (pn.clavier) choisir(pn.focus); else pn.clavier = true; }
      else if (k === "l" || k === "L") direCommande(pn.cmd, true);
      else if (k === "Escape") annulerPanneau();
      return;
    }
    if (/^[1-6]$/.test(k) && !S_.dial) { const tb = S_.tables[+k - 1]; if (tb && tableActive(tb.i)) clic({ x: tb.x, y: 600 }); }   // touches 1 à 6 : la table correspondante
  });
  const _champ = champ();
  if (_champ) {
    _champ.addEventListener("input", () => { if (G.mode === "nom") { G.saisieNom = _champ.value.replace(/[^A-Za-zÀ-ÿŒœ0-9 ’'\-]/g, "").slice(0, 24); _champ.value = G.saisieNom; return; } if (S_ && S_.cuis.saisie) majTexte(_champ.value.toLowerCase().replace(/[^a-zàâäçéèêëîïôöùûüœ]/g, "")); });
    _champ.addEventListener("blur", () => { setTimeout(() => { if (S_ && G.mode === "play" && G.vue === "cuisine" && S_.cuis.saisie && !G.paused) _champ.focus(); }, 30); });
  }
  window.addEventListener("keyup", (e) => { if (e.key === "ArrowLeft") G.keys.gauche = false; if (e.key === "ArrowRight") G.keys.droite = false; });
  window.addEventListener("blur", () => { G.keys.gauche = G.keys.droite = false; });
  document.addEventListener("visibilitychange", () => { if (document.hidden && G.mode === "play") G.paused = true; });

  // ------------------------------------------------------------------ boucle
  let last = 0;
  function boucle(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (!G.paused) update(dt);
    rendre();
    requestAnimationFrame(boucle);
  }

  // crochets de test (Playwright) : avancer le temps sans attendre
  window.__jeu = {
    G, ACCU, RESTOS, PAPIERS, NAPPES, OBJETS, CATALOGUE, PRIX_RESTO, prixDeco, possede, decoLire, campLire, ouvrirAtelier, acheterOuChoisir, changerRestoAtelier, clicAtelier, dessinerAtelier, tableActive, nbTables, ouvrirResto, ouvrir, finir, dessinerCarte, clicCarte, nouvelleCampagne, entrainementLibre, campVide, ctxResto, entrerResto, BAL, A, sauver, GUIDE, verifierGuide, fermerArticle, ouvrirNom, validerNom, CLE, get S() { return S_; }, start: nouvellePartie, clic, agirSurPlace, tableProche, choisir, ligneDialogue, avancerDialogue, ouvrirChoix, reessayer, agirAuPasse, auPasse, commandesEnAttente, demanderChoix, HATCH_STAND, HATCH_ZONE, HATCH_RECT, FEED_BTN, update, rendre, validerSaisie, changerVue, majTexte, ticketSelId, posteActif, POSTES, DOOR, DOOR_STAND, CUIS_PORTE, rectsSaisie, ticketRect,
    avancer(sec) { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); rendre(); },
    manquants() { return Object.keys(LISTE).filter((k) => !IMG[k] && !/^bg_(carte|titre_\d|salle_\d)$/.test(k)); },
  };

  charger().then(() => requestAnimationFrame(boucle));
})();
