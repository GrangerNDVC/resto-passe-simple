// Le Resto du Passé Simple — prototype « salle » : 1er, 2e et 3e groupes (10 niveaux de verbes).
// Canvas logique 1920×1080. Les images absentes (clients, serveur) sont remplacées par des silhouettes.
(function () {
  "use strict";
  const W = 1920, H = 1080;
  const cv = document.getElementById("c"), ctx = cv.getContext("2d");

  // ------------------------------------------------------------------ images
  const IMG = {};
  const LISTE = {
    bg_salle: "assets/bg_salle.png",
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
  const CLIENT_CUT_Y = TABLE_TOP + 120 * S;   // bord bas du client, caché derrière la nappe
  const Y_COULOIR = 850;                   // pieds du serveur dans le couloir
  const HATCH_STAND = { x: 470, y: 345 };  // serveur au passe-plats
  const HATCH_PLATE = { x: 443, y: 268 };  // plat posé sur le comptoir
  const SERVEUR_H = 300;
  const TRAY = { x: 62, y: -232 };         // plateau du serveur (repère local, serveur tourné vers la droite)
  const CLIENT_W = 175;
  const RAIL = { x: 690, y: 14, w: 445 };
  const TEMPS_PAT = { normal: 1, lent: 0.5, sans: 0 };
  // Porte battante de la salle (mur du fond, entre le passe-plats et le rail) et position du serveur devant la porte
  const DOOR = { x: 600, y: 112, w: 104, h: 190 };
  const DOOR_STAND = { x: 652, y: 345 };
  // Cuisine (canvas 1920×1080) : 3 postes sur le sol, chef à gauche, passe-plats à droite, porte de retour à gauche
  const POSTES = [
    { k: 0, nom: "Marmite", tag: "1er groupe", couleur: "g1", x: 520, base: 700, debut: 1 },
    { k: 1, nom: "Plan de travail", tag: "2e groupe", couleur: "g2", x: 960, base: 700, debut: 6 },
    { k: 2, nom: "Plaque", tag: "3e groupe", couleur: "g3", x: 1400, base: 700, debut: 7 },
  ];
  const POSTE_IMG = ["marmite", "plan_travail", "plaque"];
  const CUIS_PORTE = { x: 30, y: 235, w: 190, h: 400 };        // porte battante de la cuisine (retour en salle)
  const CUIS_CHEF = { x: 335, base: 805, h: 310 };
  const CUIS_PASSE = { x: 1800, y: 290, s: 0.5 };              // passe-plats vu de la cuisine (dessiné en miroir ; x = bord droit)
  const poste_de = (couleur) => (couleur === "g1" ? 0 : couleur === "g2" ? 1 : 2);   // les auxiliaires (violet) se cuisent à la plaque, avec le 3e groupe

  // ------------------------------------------------------------------ réglages d'équilibrage (tout est ici)
  const BAL = {
    // Réglés par simulation (tools/test_profils.py) : élève moyen ≈ 5 min en Normal, élève en difficulté ≈ 5 min en Lent.
    patBase: 64, patPas: 4, patMin: 34,        // patience (s) = max(patMin, patBase − patPas × niveau)
    spawnBase: 14, spawnPas: 1.0, spawnServis: 0.08, spawnMin: 5.5,   // délai entre deux clients (s)
    clientsParNiveau: 8,                       // niveau +1 tous les N clients servis
    clientsParTable: 4,                        // une table de plus tous les N clients servis
    penalitePat: 0.2,                          // part de patience perdue à chaque erreur de forme
    coeurTous: 10,                             // un cœur regagné tous les N clients servis (0 = jamais)
    vies: 3,
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

  // ------------------------------------------------------------------ état
  let rndSeed = (Date.now() % 2147483646) + 1;
  const rnd = () => (rndSeed = (rndSeed * 16807) % 2147483647) / 2147483647;
  const G = { mode: "title", t: 0, chrono: "normal", duree: 0, groupe: 0, cuisine: 1, vue: "salle", trans: null, paused: false, muted: false, mouse: { x: 0, y: 0 } };   // groupe : 0 = tous, 1, 2 ou 3
  let S_ = null;     // état de partie

  // ------------------------------------------------------------------ accessibilité : réglages mémorisés dans le navigateur
  const CLE = "resto_passe_simple_reglages_v1";
  const TAILLES = [1, 1.15, 1.3];
  const A = { taille: 0, police: 0, contraste: 0, termin: 0, voix: 0, calme: 0 };
  try { if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) A.calme = 1; } catch (e) { /* tant pis */ }
  try {
    const sv = JSON.parse(localStorage.getItem(CLE) || "null");
    if (sv && sv.A) for (const k in A) if (typeof sv.A[k] === "number") A[k] = sv.A[k];
    if (sv && ["normal", "lent", "sans"].includes(sv.chrono)) G.chrono = sv.chrono;
    if (sv && [0, 3, 5, 10].includes(sv.duree)) G.duree = sv.duree;
    if (sv && [0, 1, 2, 3].includes(sv.groupe)) G.groupe = sv.groupe;
    if (sv && [0, 1].includes(sv.cuisine)) G.cuisine = sv.cuisine;
  } catch (e) { /* pas de stockage : les réglages ne seront pas mémorisés */ }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify({ A, chrono: G.chrono, duree: G.duree, groupe: G.groupe, cuisine: G.cuisine })); } catch (e) { /* ignoré */ } }
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
    let t = pv(cmd.pronom, cmd.verbe) + ", au passé simple.";
    if (avecChoix) cmd.choix.forEach((f, i) => { t += " " + (i + 1) + ", " + f + "."; });
    dire(t);
  }

  function nouvellePartie() {
    S_ = {
      score: 0, vies: BAL.vies, servis: 0, niveau: VERBES.GROUPES[G.groupe].debut, spawnT: 0.4, ticketId: 1, fin: 0,
      seance: G.duree > 0, reste: G.duree * 60, rep: 0, justes: 0, partis: 0,
      tables: TABLE_X.map((x, i) => ({ i, x, client: null, plat: null, platT: 0 })),
      serveur: { x: 330, y: Y_COULOIR, dir: 1, path: [], task: null, pose: "idle", poseT: 0, carry: null, anim: 0 },
      tickets: [], panel: null, hatchQ: [], msgs: [], fx: [], erreurs: [], combo: 0, serie: 0, cuisines: 0,
      cuis: {
        ouverte: false, sel: null, saisie: null, cloche: 0,
        postes: POSTES.map((P) => ({ k: P.k, etat: "repos", t: 0, dur: 0, ticketId: null, table: -1, dish: null, cmd: null, sansBonus: false })),
        chef: { pose: "neutre", lignes: [], t: 0, dur: 0 },
      },
    };
    G.mode = "play"; G.vue = "salle"; G.trans = null; if (champ()) champ().blur();
  }
  const nbTables = () => Math.min(6, BAL.tablesDepart + Math.floor(S_.servis / BAL.clientsParTable));
  const tableActive = (i) => ORDRE_OUVERTURE.indexOf(i) < nbTables();
  // niveau de verbes : borné par le dernier niveau du groupe choisi (le niveau de jeu, lui, continue de monter : clients plus pressés)
  const niveauVerbes = () => Math.min(VERBES.GROUPES[G.groupe].fin, S_.niveau);
  const infoNiveau = () => VERBES.NIVEAUX[niveauVerbes()];
  const rythme = () => S_.niveau - VERBES.GROUPES[G.groupe].debut + 1;      // 1 au départ, quel que soit le groupe choisi

  // ------------------------------------------------------------------ sons (très simples)
  let actx = null;
  function bip(freq, dur, type, vol, delay) {
    if (G.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + (delay || 0);
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.08, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) { /* pas de son */ }
  }
  const sonOk = () => { bip(660, 0.12, "triangle"); bip(990, 0.2, "triangle", 0.08, 0.1); };
  const sonKo = () => { bip(180, 0.3, "sawtooth", 0.07); };
  const sonCloche = () => { bip(1320, 0.5, "sine", 0.07); bip(1760, 0.4, "sine", 0.05, 0.05); };
  const sonClic = () => bip(520, 0.05, "square", 0.03);

  // ------------------------------------------------------------------ messages et effets
  const pv = (pronom, mot) => pronom + (pronom.endsWith("’") ? "" : " ") + mot;   // « J’aimai », « Tu chantas »
  function msg(texte, sous, kind, dur, note) { S_.msgs.push({ texte, sous: sous || "", note: note || "", kind: kind || "info", t: 0, dur: dur || 2.4 }); if (S_.msgs.length > 2) S_.msgs.shift(); }
  function fx(o) { o.t = 0; S_.fx.push(o); }

  // ------------------------------------------------------------------ clients
  function nouveauClient(table) {
    const vip = rnd() < 0.07;
    const slug = vip ? CLIENTS[6] : CLIENTS[Math.floor(rnd() * 6)];
    const looks = { skin: ["#f1c9a5", "#d9a47a", "#a9714c", "#f6d5b5"], shirt: ["#e8b33f", "#4c8c4a", "#d9473b", "#e8833a", "#7b4b94", "#c76b8f"], hair: ["#5a3a29", "#2e2420", "#c9a24a", "#9a9a9a", "#a24a2b"] };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const patSec = Math.max(BAL.patMin, BAL.patBase - BAL.patPas * rythme()) * (vip ? 0.8 : 1);
    table.client = { slug, vip, state: "enter", t: 0, patience: 1, patSec, cmd: null, ticket: null, tries: 0,
      look: { skin: pick(looks.skin), shirt: vip ? "#333" : pick(looks.shirt), hair: vip ? "#222" : pick(looks.hair) }, bob: rnd() * 6 };
  }
  const clientAttend = (c) => c.state === "call" || c.state === "order" || c.state === "wait";
  function smileyIdx(p) { return p > 0.85 ? 0 : p > 0.65 ? 1 : p > 0.45 ? 2 : p > 0.28 ? 3 : p > 0.12 ? 4 : 5; }

  function libererTable(table) { table.client = null; table.plat = null; table.platT = 0; }

  function clientPart(table, colere) {
    const c = table.client; if (!c) return;
    if (c.ticket) S_.tickets = S_.tickets.filter((t) => t.id !== c.ticket);
    if (S_.panel && S_.panel.table === table.i) S_.panel = null;
    if (S_.serveur.carry && S_.serveur.carry.table === table.i) S_.serveur.carry = null;
    nettoyerCuisine(table.i, c.ticket);
    if (S_.serveur.task && S_.serveur.task.table === table.i && S_.serveur.task.type === "goOrder") { S_.serveur.task = null; S_.serveur.path = []; }
    if (colere) {
      S_.combo = 0; S_.partis++; S_.serie = 0;
      c.state = "leave"; c.t = 0; c.angry = true; sonKo();
      if (S_.seance) {                       // séance : pas de cœurs, on compte seulement les clients partis
        fx({ img: "fx_croix", x: table.x, y: 470, vy: -40, dur: 1.2, scale: 0.28 });
        msg("Un client est parti sans être servi.", "", "bad", 2.2);
      } else {
        S_.vies--;
        fx({ img: "fx_coeur", x: table.x, y: 470, vy: -60, dur: 1.4, scale: 0.28 });
        msg("Un client est parti fâché !", "", "bad", 2.2);
        if (S_.vies <= 0) { S_.fin = 1.4; }
      }
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
    allerVers(sv, tb.x, Y_COULOIR);
    sonClic();
  }

  function arriveePrise(i) {
    const tb = S_.tables[i], c = tb.client, sv = S_.serveur;
    sv.task = null;
    if (!c || c.state !== "call") return;
    if (!c.cmd) {
      c.cmd = VERBES.nouvelleCommande(niveauVerbes(), rnd, G.groupe);
      c.ticket = S_.ticketId++;
      c.cuisine = S_.cuis.ouverte && rnd() < BAL.cuisineProba;
      S_.tickets.push({ id: c.ticket, table: i, cmd: c.cmd, cuisine: c.cuisine, etat: "attente" });
      if (c.cuisine) {                       // plat à fabriquer en cuisine : pas de QCM, le client attend
        c.state = "wait"; c.patSec *= BAL.cuisinePatMul; sv.pose = "idle";
        msg("Commande à cuisiner !", "Passe la porte battante (touche C) : " + pv(c.cmd.pronom, c.cmd.verbe) + ", au passé simple.", "info", 3.6);
        if (A.voix) direCommande(c.cmd, false);
        return;
      }
    } else {
      // nouvelle tentative : mêmes verbe et personne, nouveaux distracteurs
      c.cmd = Object.assign({}, c.cmd);
      c.cmd.choix = VERBES.refaireChoix(c.cmd, rnd);
    }
    c.state = "order";
    sv.pose = "idle";
    S_.panel = { table: i, cmd: c.cmd, wrongs: [], focus: 0, clavier: false };
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
    const p = S_.panel; if (!p) return;
    const tb = S_.tables[p.table], c = tb.client, sv = S_.serveur;
    if (!c) { S_.panel = null; return; }
    const choix = p.cmd.choix[idx];
    S_.panel = null;
    S_.rep++;
    if (choix === p.cmd.bonne) {
      S_.justes++;
      sonOk();
      c.state = "wait";
      S_.hatchQ.push({ dish: style(p.cmd.couleur).plat, table: p.table });
      msg("Bravo ! La commande part en cuisine.", "Porte le plat à la table " + (p.table + 1) + ".", "ok", 2.6);
      sv.task = { type: "goHatch", table: p.table };
      allerVers(sv, HATCH_STAND.x, HATCH_STAND.y);
    } else {
      sonKo();
      S_.erreurs.push({ pronom: p.cmd.pronom, verbe: p.cmd.verbe, bonne: p.cmd.bonne, choisie: choix, regle: p.cmd.regle, niveau: p.cmd.niveau });
      S_.combo = 0;
      tb.plat = "plat_rate"; tb.platT = 2.4;
      c.state = "call"; c.tries++;
      c.patience = Math.max(0.06, c.patience - BAL.penalitePat);
      sv.pose = "oups"; sv.poseT = 0.9;
      fx({ img: "fx_croix", x: tb.x, y: 470, vy: -40, dur: 1.2, scale: 0.28 });
      messageErreur(p.cmd);
    }
  }

  function demanderService(i) {
    const sv = S_.serveur;
    if (!sv.carry) return;
    if (serveurOccupe()) return;
    sv.task = { type: "goTable", table: i };
    allerVers(sv, S_.tables[i].x, Y_COULOIR);
    sonClic();
  }

  function arriveeService(i) {
    const sv = S_.serveur, tb = S_.tables[i], carry = sv.carry;
    sv.task = null;
    if (!carry) return;
    if (carry.table !== i || !tb.client) {
      sv.pose = "oups"; sv.poseT = 0.9; sonKo();
      msg("Ce n’est pas la bonne table !", "Regarde le numéro sur le ticket : table " + (carry.table + 1) + ".", "bad", 2.6);
      return;
    }
    const c = tb.client;
    const bonus = carry.sansBonus ? 0 : Math.round(10 * c.patience);
    const gain = (10 + bonus) * (c.vip ? 2 : 1) + (S_.combo >= 2 ? 5 : 0) + (carry.cuisine ? BAL.bonusCuisine : 0);
    S_.score += gain; S_.combo++; S_.servis++; S_.serie++;
    sv.carry = null;
    tb.plat = carry.dish; tb.platT = 0;
    if (c.ticket) S_.tickets = S_.tickets.filter((t) => t.id !== c.ticket);
    c.state = "eat"; c.t = 0;
    sv.pose = "content"; sv.poseT = 0.9;
    sonCloche();
    fx({ img: "fx_piece", x: tb.x + 60, y: 500, vy: -80, dur: 1.4, scale: 0.28, texte: "+" + gain });
    if (BAL.coeurTous && !S_.seance && S_.servis % BAL.coeurTous === 0 && S_.vies < BAL.vies) {
      S_.vies++; fx({ img: "fx_coeur", x: 120, y: 130, vy: -30, dur: 1.4, scale: 0.28 });
      msg("Un cœur de regagné !", "", "ok", 2.2);
    }
    if (S_.servis % BAL.clientsParNiveau === 0) {
      S_.niveau++;
      const n = S_.niveau <= VERBES.GROUPES[G.groupe].fin ? VERBES.NIVEAUX[S_.niveau] : null;
      msg("Niveau " + S_.niveau + " !", n ? "Nouveaux verbes : " + n.titre + " (" + n.detail + ")" : "Les clients sont plus pressés !", "ok", 3.4);
    }
    else if (S_.servis % BAL.clientsParTable === 0 && nbTables() <= 6) msg("Une nouvelle table est ouverte !", "", "ok", 2.2);
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
    sv.carry = { table: e.table, dish: e.dish, cuisine: !!e.cuisine, sansBonus: !!e.sansBonus };
    sonCloche();
  }

  // ------------------------------------------------------------------ mise à jour
  function update(dt) {
    G.t += dt;
    if (G.mode !== "play") return;
    const s = S_, sv = s.serveur, rate = TEMPS_PAT[G.chrono];

    if (s.fin > 0) { s.fin -= dt; if (s.fin <= 0) G.mode = "over"; }
    if (s.seance && G.mode === "play") { s.reste -= dt; if (s.reste <= 0) { s.reste = 0; s.panel = null; G.mode = "over"; return; } }

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
      if (tb.platT > 0) { tb.platT -= dt; if (tb.platT <= 0 && tb.plat === "plat_rate") tb.plat = null; }
      if (c.state === "enter" && c.t > 0.7) { c.state = "call"; c.t = 0; }
      else if (clientAttend(c)) {
        c.patience -= (dt / c.patSec) * rate;
        if (c.patience <= 0) { c.patience = 0; clientPart(tb, true); }
      } else if (c.state === "eat") {
        if (c.t > 1.4 && PLATS.includes(tb.plat)) tb.plat = "assiette_vide";
        if (c.t > 3.2) { tb.plat = null; clientPart(tb, false); }
      } else if (c.state === "leave" && c.t > 0.8) libererTable(tb);
    }

    // serveur : déplacement le long du chemin
    sv.anim += dt;
    if (sv.poseT > 0) { sv.poseT -= dt; if (sv.poseT <= 0) sv.pose = "idle"; }
    if (sv.path.length) {
      const w = sv.path[0], dx = w.x - sv.x, dy = w.y - sv.y, d = Math.hypot(dx, dy), v = 640 * dt;
      if (d <= v) { sv.x = w.x; sv.y = w.y; sv.path.shift(); if (!sv.path.length) arrivee(); }
      else { sv.x += (dx / d) * v; sv.y += (dy / d) * v; if (Math.abs(dx) > 1) sv.dir = dx > 0 ? 1 : -1; }
    }

    majCuisine(dt);
    if (G.trans) {
      G.trans.t += dt;
      if (!G.trans.fait && G.trans.t >= 0.22) { G.trans.fait = true; G.vue = G.trans.vers; entrerVue(); }
      if (G.trans.t >= 0.44) G.trans = null;
    }
    // un plat attend au passe-plats : le serveur libre va le chercher
    if (G.vue === "salle" && !G.trans && !s.panel && s.hatchQ.length && !sv.carry && !serveurOccupe() && s.fin <= 0) {
      sv.task = { type: "goHatch", table: s.hatchQ[0].table };
      allerVers(sv, HATCH_STAND.x, HATCH_STAND.y);
    }

    // effets et messages
    for (const f of s.fx) { f.t += dt; f.y += (f.vy || 0) * dt; }
    s.fx = s.fx.filter((f) => f.t < f.dur);
    for (const m of s.msgs) m.t += dt;
    s.msgs = s.msgs.filter((m) => m.t < m.dur);
  }

  function arrivee() {
    const t = S_.serveur.task; if (!t) return;
    if (t.type === "goOrder") arriveePrise(t.table);
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
  function dessinerTable(tb) {
    const col = COULEURS[tb.i], g = GEOM[col], tab = img("table_" + col);
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
      dessiner(k, tb.x + 100, 452 + rebond, 0.28, 0.28, "centre");
    }
    if (tb.client && tb.client.vip && tb.client.state !== "leave") texte("VIP", tb.x - 100, 452, 26, "#e8b33f", "center", "#5a3a29");
  }

  function dessinerClient(tb) {
    const c = tb.client, x = tb.x, y = CLIENT_CUT_Y;
    let a = 1;
    if (c.state === "enter") a = Math.min(1, c.t / 0.6);
    if (c.state === "leave") a = Math.max(0, 1 - c.t / 0.8);
    ctx.save(); ctx.globalAlpha = a;
    const appel = c.state === "call" && (A.calme || Math.sin(G.t * 6 + tb.i) > 0);   // calme : la main reste levée, sans clignoter
    const sprite = img(c.slug + (appel ? "_appel" : "_attente")) || img(c.slug + "_attente");
    const resp = A.calme ? 0 : Math.sin(G.t * 2 + c.bob) * 2;
    if (sprite) {
      const sc = CLIENT_W / (img(c.slug + "_attente") || sprite).width;
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
    const marche = sv.path.length > 0;
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
      if (im) { const s2 = 0.2; ctx.drawImage(im, TRAY.x - im.width * s2 / 2, TRAY.y + bob - im.height * s2 * 0.8 + 6, im.width * s2, im.height * s2 * 0.8); }
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
      ctx.fillStyle = "#f6e9cf"; ctx.fillRect(-40, 38, 80, 70);
      texte(t.cmd.pronom, 0, 52, 21, A.contraste ? "#000" : "#5a3a29");
      const mot = t.cmd.verbe.toUpperCase();
      texte(mot, 0, 80, Math.max(13, Math.min(21, Math.floor(92 / (mot.length * 0.72)))), A.contraste ? style(t.cmd.couleur).ticketContraste : style(t.cmd.couleur).ticket);   // le verbe doit tenir sur le ticket
      texte("table " + (t.table + 1), 0, 122, 18, A.contraste ? "#000" : "#7a5a44", "center", null, "normal");
      if (t.cuisine) {                                       // commande à cuisiner : état affiché sous le ticket, ticket choisi encadré
        const st = style(t.cmd.couleur);
        if (G.vue === "cuisine" && ticketSelId() === t.id) { ctx.strokeStyle = "#ffd84a"; ctx.lineWidth = 6; rr(-54, -4, 108, 155, 8); ctx.stroke(); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; rr(-58, -8, 116, 163, 10); ctx.stroke(); }
        texte(t.etat === "attente" ? "à cuisiner" : t.etat === "cuisson" ? "en cuisson…" : "prêt !", 0, 168, 18, "#fff", "center", st.contour);
      }
      ctx.restore();
    });
  }

  // ------------------------------------------------------------------ panneau de choix
  const PANEL = { x: 150, y: 830, w: 1620, h: 236 };
  function briqueRect(i, n) {
    const bw = 300, bh = 120, gap = 40, total = n * bw + (n - 1) * gap, x0 = PANEL.x + (PANEL.w - total) / 2;
    return { x: x0 + i * (bw + gap), y: PANEL.y + 82, w: bw, h: bh };
  }
  // terminaison d'une proposition (aide visuelle) : le radical reste blanc, la terminaison passe en jaune
  const TERMS = ["inrent", "irent", "urent", "èrent", "érent", "aient", "înmes", "întes", "âmes", "âtes", "îmes", "îtes", "ûmes", "ûtes", "imes", "ites", "umes", "utes", "ames", "ates", "ions", "iez", "ons", "ent", "ait", "ais", "ins", "int", "ez", "ai", "as", "es", "is", "it", "us", "ut", "a", "e"];
  function coupe(f) {
    for (const t of TERMS) if (f.length > t.length && f.endsWith(t)) return [f.slice(0, -t.length), t];
    return [f, ""];
  }
  const ECOUTER = { x: PANEL.x + PANEL.w - 210, y: PANEL.y + 16, w: 180, h: 48 };
  function dessinerPanneau() {
    const p = S_.panel; if (!p) return;
    ctx.fillStyle = A.contraste ? "rgba(0,0,0,0.65)" : "rgba(30,15,8,0.35)"; ctx.fillRect(0, 0, W, H);
    neuf("panneau_bois", PANEL.x, PANEL.y - 6, PANEL.w, PANEL.h + 12, 36);
    if (A.contraste) { ctx.fillStyle = "#fff"; rr(PANEL.x + 14, PANEL.y + 4, PANEL.w - 28, 70, 14); ctx.fill(); }
    texte("Table " + (p.table + 1) + " :  « " + pv(p.cmd.pronom, p.cmd.verbe) + " » au passé simple.  Quelle forme ?", PANEL.x + PANEL.w / 2 - (voixOk() ? 100 : 0), PANEL.y + 40, ts(34), ENCRE());
    if (voixOk()) {
      const sur = G.mouse.x > ECOUTER.x && G.mouse.x < ECOUTER.x + ECOUTER.w && G.mouse.y > ECOUTER.y && G.mouse.y < ECOUTER.y + ECOUTER.h;
      ctx.fillStyle = sur ? "#e8b33f" : FOND(); rr(ECOUTER.x, ECOUTER.y, ECOUTER.w, ECOUTER.h, 14); ctx.fill();
      ctx.strokeStyle = ENCRE(); ctx.lineWidth = 4; ctx.stroke();
      texte("Écouter (L)", ECOUTER.x + ECOUTER.w / 2, ECOUTER.y + ECOUTER.h / 2 + 1, 24, ENCRE());
    }
    // une seule taille de texte pour les 4 propositions (la plus petite qui les fait toutes tenir)
    let taille = ts(46);
    for (const f of p.cmd.choix) { texte("", 0, 0, taille); while (taille > 24 && ctx.measureText(f).width > 300 - 70) { taille -= 2; texte("", 0, 0, taille); } }
    p.cmd.choix.forEach((f, i) => {
      const r = briqueRect(i, p.cmd.choix.length);
      const sur = G.mouse.x > r.x && G.mouse.x < r.x + r.w && G.mouse.y > r.y && G.mouse.y < r.y + r.h;
      const e = sur && !A.calme ? 1.05 : 1, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(e, e);
      const st = style(p.cmd.couleur);
      if (A.contraste) { ctx.fillStyle = st.fondContraste; rr(-r.w / 2, -r.h / 2, r.w, r.h, 20); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.stroke(); }
      else if (!dessiner(st.brique, 0, 0, r.w / 384, r.h / 154, "centre")) { ctx.fillStyle = st.fond; rr(-r.w / 2, -r.h / 2, r.w, r.h, 20); ctx.fill(); }
      texte("", 0, 0, taille);
      const contour = A.contraste ? "#000" : st.contour, [rad, fin] = A.termin ? coupe(f) : [f, ""];
      if (fin) {
        const w1 = ctx.measureText(rad).width, w2 = ctx.measureText(fin).width, x0 = -(w1 + w2) / 2;
        texte(rad, x0, 2, taille, "#fff", "left", contour);
        texte(fin, x0 + w1, 2, taille, "#ffd84a", "left", contour);
      } else texte(f, 0, 2, taille, "#fff", "center", contour);
      texte(st.tag, r.w / 2 - 16, r.h / 2 - 17, 17, "#fff", "right", st.contour, "normal");      // le groupe est aussi écrit : la couleur ne suffit pas
      ctx.restore();
      if (p.clavier && p.focus === i) { ctx.strokeStyle = "#ffd84a"; ctx.lineWidth = 8; rr(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 26); ctx.stroke(); ctx.strokeStyle = "#000"; ctx.lineWidth = 3; rr(r.x - 12, r.y - 12, r.w + 24, r.h + 24, 30); ctx.stroke(); }
      ctx.fillStyle = FOND(); ctx.beginPath(); ctx.arc(r.x + 22, r.y + 20, 17, 0, 7); ctx.fill();
      texte(String(i + 1), r.x + 22, r.y + 21, 22, ENCRE());
    });
  }

  // ------------------------------------------------------------------ cuisine (chantier 4)
  // Le joueur passe la porte battante, choisit le poste du groupe du verbe (marmite = 1er, plan de travail = 2e, plaque = 3e),
  // ÉCRIT la forme au clavier, attend la cuisson, envoie le plat au passe-plats ; le serveur le porte ensuite à la bonne table.
  const ECOUTER_C = { x: PANEL.x + PANEL.w - 220, y: PANEL.y + 30, w: 180, h: 44 };
  const ACCENTS = ["à", "â", "ç", "é", "è", "ê", "î", "ô", "û", "ù"];
  const champ = () => document.getElementById("saisie");
  function posteActif(k) {
    const g = G.groupe;
    if (g) return g === k + 1;                                  // un seul groupe choisi : seul son poste est ouvert
    return niveauVerbes() >= POSTES[k].debut;                    // sinon les postes s'ouvrent avec les groupes
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
      Object.assign(po, { etat: "cuit", t: 0, dur: BAL.cuisson[sa.poste], ticketId: tk.id, table: tk.table, dish: style(cmd.couleur).plat, cmd, sansBonus: !!tk.aide });
      tk.etat = "cuisson";
      fermerSaisie();
      chefDit("bravo", "Bravo, c’est la bonne forme ! Ça cuit…", 3.5);
      return;
    }
    if (!sa.presque && sansAccents(rep) === sansAccents(bonne)) {          // seulement un accent : une seconde chance, sans pénalité
      sa.presque = 1; sa.indice = "Presque ! Regarde bien les accents.";
      bip(440, 0.12, "triangle"); chefDit("explique", "Presque ! Il manque ou il y a un accent de trop. Regarde bien la terminaison.", 5);
      return;
    }
    S_.rep++; sonKo();
    S_.erreurs.push({ pronom: cmd.pronom, verbe: cmd.verbe, bonne: cmd.bonne, choisie: rep, regle: cmd.regle, niveau: cmd.niveau });
    S_.combo = 0;
    const c = S_.tables[tk.table].client;
    if (c) c.patience = Math.max(0.06, c.patience - BAL.penalitePat);
    Object.assign(po, { etat: "rate", t: 0, dur: BAL.rateDuree, ticketId: tk.id, table: tk.table, dish: "plat_rate", cmd });
    fermerSaisie();
    chefDit("fache", "Raté ! " + cmd.regle.court + ". Le poste est en nettoyage, puis tu recommences.", 6);
    messageErreur(cmd);
  }

  function servirDuPoste(po) {
    S_.hatchQ.push({ dish: po.dish, table: po.table, cuisine: true, sansBonus: po.sansBonus });
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
    if (sp) { const h = 330, w = sp.width * h / sp.height; ctx.drawImage(sp, x - w / 2, b - h, w, h); } else posteCode(k, x, b, phase, cuit, st);
    ctx.restore();
    ctx.fillStyle = actif ? st.fond : "#8b7a70"; rr(x - 125, b + 14, 250, 72, 16); ctx.fill(); ctx.strokeStyle = actif ? st.contour : "#4a3a30"; ctx.lineWidth = 5; ctx.stroke();
    texte(P.nom, x, b + 40, 28, "#fff", "center", actif ? st.contour : "#4a3a30");
    texte(actif ? P.tag : "bientôt…", x, b + 69, 20, "#fff", "center", actif ? st.contour : "#4a3a30", "normal");
    if (cuit) {                                             // vapeur, étincelles et barre de cuisson
      if (!A.calme) for (let i = 0; i < 4; i++) { const u = ((G.t * 0.7 + i * 0.25) % 1); ctx.save(); ctx.globalAlpha = 0.55 * (1 - u); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - 40 + i * 27 + Math.sin(G.t * 3 + i) * 8, b - 340 - u * 90, 12 + u * 14, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = "rgba(60,30,20,0.55)"; rr(x - 95, b - 408, 190, 20, 10); ctx.fill();
      ctx.fillStyle = st.fond; rr(x - 91, b - 404, Math.max(12, 182 * po.t / po.dur), 12, 6); ctx.fill();
      texte(pv(po.cmd.pronom, po.cmd.verbe), x, b - 428, 22, "#fff", "center", "#5a3a29");
    } else if (po.etat === "pret") {
      const bob = A.calme ? 0 : Math.sin(G.t * 4) * 6;
      dessiner(po.dish, x, b - 330 + bob, 0.3, 0.3, "bas");
      texte("Prêt ! Clique", x, b - 408, 28, "#fff", "center", st.contour);
    } else if (po.etat === "rate") {
      const bob = A.calme ? 0 : Math.sin(G.t * 12) * 3;
      dessiner("plat_rate", x + bob, b - 320, 0.3, 0.3, "bas");
      texte("Raté !", x, b - 408, 30, "#d9473b", "center", "#fff7e0");
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
    ctx.fillStyle = "rgba(60,30,20,0.22)"; ctx.beginPath(); ctx.ellipse(x, b, 80, 14, 0, 0, 7); ctx.fill();
    const sp = img("chef_" + pose) || img("chef_neutre");
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
    if (sp) { const h = R.h, w = sp.width * h / sp.height; ctx.drawImage(sp, R.x + R.w / 2 - w / 2, R.y, w, h); }
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
    if (sp) { const h = R.h, w = sp.width * h / sp.height; ctx.drawImage(sp, R.x + R.w / 2 - w / 2, R.y, w, h); }
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
    ctx.fillStyle = A.contraste ? "#fff" : "rgba(246,233,207,0.94)"; rr(1190, 20, 700, 124, 20); ctx.fill(); ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; ctx.stroke();
    texte("Salle", 1232, 38, 22, ENCRE(), "center", null, "normal");
    S_.tables.forEach((tb) => {
      if (!tableActive(tb.i)) return;
      const x = 1300 + tb.i * 98, c = tb.client;
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
    texte(sa.indice || ("Table " + (tk.table + 1) + " :  écris la forme de « " + cmd.verbe + " » au passé simple (accents compris)"), PANEL.x + PANEL.w / 2 - (voixOk() ? 100 : 0), PANEL.y + 50, Math.min(ts(28), 30), sa.indice ? (A.contraste ? "#b00000" : "#d9473b") : ENCRE());
    if (voixOk()) {
      const sur = dans(ECOUTER_C, G.mouse);
      ctx.fillStyle = sur ? "#e8b33f" : FOND(); rr(ECOUTER_C.x, ECOUTER_C.y, ECOUTER_C.w, ECOUTER_C.h, 14); ctx.fill(); ctx.strokeStyle = ENCRE(); ctx.lineWidth = 4; ctx.stroke();
      texte("Écouter", ECOUTER_C.x + ECOUTER_C.w / 2, ECOUTER_C.y + ECOUTER_C.h / 2 + 1, 24, ENCRE());
    }
    // brique-pronom (fixe) + champ de saisie
    const b = R.pronom;
    if (A.contraste) { ctx.fillStyle = st.fondContraste; rr(b.x, b.y, b.w, b.h, 20); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.stroke(); }
    else if (!dessiner(st.brique, b.x, b.y, b.w / 384, b.h / 154, "haut")) { ctx.fillStyle = st.fond; rr(b.x, b.y, b.w, b.h, 20); ctx.fill(); }
    texte(cmd.pronom, b.x + b.w / 2, b.y + b.h / 2 + 2, ts(46), "#fff", "center", A.contraste ? "#000" : st.contour);
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
    [["etagere_bocaux", 700, 56, 190], ["casseroles_suspendues", 960, 44, 200], ["hotte_inox", 1400, 36, 250]].forEach(([n, x, y, h]) => { const s = img(n); if (s) ctx.drawImage(s, x - s.width * h / s.height / 2, y, s.width * h / s.height, h); });
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
  function dessinerHUD() {
    ctx.fillStyle = A.contraste ? "#ffffff" : "rgba(246,233,207,0.94)"; rr(24, 20, 410, 186, 22); ctx.fill();
    ctx.strokeStyle = "#5a3a29"; ctx.lineWidth = 4; ctx.stroke();
    dessiner("fx_piece", 44, 36, 0.2, 0.2, "haut"); texte(String(S_.score), 130, 66, 46, A.contraste ? "#000" : "#5a3a29", "left");
    if (S_.seance) {                      // séance : le temps restant remplace les cœurs
      const r = Math.ceil(S_.reste), mm = Math.floor(r / 60), ss = r % 60;
      texte("Temps : " + mm + ":" + (ss < 10 ? "0" : "") + ss, 40, 112, 44, r <= 30 ? (A.contraste ? "#b00000" : "#d9473b") : (A.contraste ? "#000" : "#5a3a29"), "left");
    } else for (let i = 0; i < BAL.vies; i++) { ctx.save(); ctx.globalAlpha = i < S_.vies ? 1 : 0.2; dessiner("fx_coeur", 52 + i * 62, 98, 0.2, 0.2, "haut"); ctx.restore(); }
    texte("Niveau " + S_.niveau + " · " + infoNiveau().titre, 40, 176, 23, A.contraste ? "#000" : "#6a4a36", "left", null, "normal");
    texte("P : pause   M : son" + (S_.cuis.ouverte ? (G.vue === "cuisine" ? "   C : salle" : "   C : cuisine") : ""), W - 30, H - 22, 22, "rgba(255,255,255,0.8)", "right", "rgba(60,30,20,0.7)", "normal");
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
    texte("Sers tes clients en choisissant la bonne forme du passé simple !", W / 2, 285, 40, "#fff", "center", "#5a3a29", "normal");
    texte("Vitesse des clients :", W / 2, 360, 34, "#fff", "center", "#5a3a29");
    BTN.normal = bouton(W / 2 - 470, 390, 290, 70, "Normal", G.chrono === "normal", 32);
    BTN.lent = bouton(W / 2 - 145, 390, 290, 70, "Lent", G.chrono === "lent", 32);
    BTN.sans = bouton(W / 2 + 180, 390, 290, 70, "Sans chrono", G.chrono === "sans", 32);
    texte("Verbes :", W / 2, 500, 34, "#fff", "center", "#5a3a29");
    BTN.groupe = [0, 1, 2, 3].map((g, k) => bouton(W / 2 - 520 + k * 270, 530, 250, 70, g ? VERBES.GROUPES[g].titre : "Tous les verbes", G.groupe === g, 27));
    texte("Type de partie :", W / 2, 632, 34, "#fff", "center", "#5a3a29");
    BTN.duree = DUREES.map((d, k) => bouton(W / 2 - 520 + k * 270, 660, 250, 84, d ? "Séance " + d + " min" : "3 cœurs", G.duree === d, 29));
    texte(G.duree ? "Séance : pas de cœurs, tu sers un maximum de clients avant la fin du temps." : "Partie classique : tu as 3 cœurs, un client qui part fâché en coûte un.", W / 2, 775, 28, "#fff", "center", "#5a3a29", "normal");
    BTN.jouer = bouton(W / 2 - 230, 830, 460, 120, "JOUER", false);
    BTN.reglages = bouton(W - 340, 28, 310, 70, "Réglages (R)", false, 30);
    BTN.cuisine = bouton(30, 28, 400, 70, G.cuisine ? "Cuisine : oui" : "Cuisine : non", !!G.cuisine, 30);
    texte("Clique sur un client qui lève la main, choisis la forme, puis emmène le plat à la bonne table.", W / 2, 1008, 30, "#fff", "center", "#5a3a29", "normal");
    if (G.cuisine) texte("Après quelques clients servis sans erreur, la cuisine s’ouvre : tu écris toi-même les plats !", W / 2, 1050, 26, "#fff", "center", "#5a3a29", "normal");
  }
  const REGLAGES = [
    { cle: "taille", titre: "Taille du texte", opts: ["Normal", "Grand", "Très grand"] },
    { cle: "police", titre: "Police", opts: ["Standard", "Lisible (dyslexie)"] },
    { cle: "contraste", titre: "Contraste", opts: ["Normal", "Élevé"] },
    { cle: "termin", titre: "Terminaison des formes en jaune", opts: ["Non", "Oui"] },
    { cle: "voix", titre: "Lecture à voix haute automatique", opts: ["Non", "Oui"] },
    { cle: "calme", titre: "Animations", opts: ["Normales", "Calmes"] },
  ];
  function dessinerReglages() {
    ctx.fillStyle = A.contraste ? "rgba(0,0,0,0.88)" : "rgba(40,20,10,0.78)"; ctx.fillRect(0, 0, W, H);
    texte("Réglages", W / 2, 80, 80, "#f6e9cf", "center", "#5a3a29");
    BTN.reg = [];
    REGLAGES.forEach((r, i) => {
      const y = 170 + i * 112, n = r.opts.length, w = 300, gap = 30, x0 = W / 2 - (n * w + (n - 1) * gap) / 2;
      texte(r.titre, W / 2, y, 32, "#fff", "center", "#5a3a29");
      r.opts.forEach((o, k) => { const b = bouton(x0 + k * (w + gap), y + 24, w, 72, o, A[r.cle] === k, 28); BTN.reg.push(Object.assign(b, { cle: r.cle, val: k })); });
    });
    ctx.fillStyle = FOND(); rr(W / 2 - 560, 845, 1120, 78, 18); ctx.fill();
    let te = ts(38); texte("", 0, 0, te);
    while (te > 20 && ctx.measureText("Exemple : ils chantèrent / nous mangeâmes").width > 1060) { te -= 2; texte("", 0, 0, te); }
    texte("Exemple : ils chantèrent / nous mangeâmes", W / 2, 885, te, ENCRE());
    BTN.retour = bouton(W / 2 - 190, 945, 380, 100, "Retour", false);
  }
  function dessinerFin() {
    ctx.fillStyle = "rgba(40,20,10,0.72)"; ctx.fillRect(0, 0, W, H);
    texte(S_.seance ? "Séance terminée !" : "Service terminé !", W / 2, 140, 100, "#f6e9cf", "center", "#5a3a29");
    texte("Score : " + S_.score + "      Clients servis : " + S_.servis, W / 2, 245, 52, "#fff", "center", "#5a3a29");
    if (S_.rep) texte("Formes justes : " + S_.justes + " sur " + S_.rep + "  (" + Math.round(100 * S_.justes / S_.rep) + " %)" + (S_.cuisines ? "      Plats cuisinés : " + S_.cuisines : ""), W / 2, 315, 42, "#fff", "center", "#5a3a29", "normal");
    const uniq = []; for (const e of S_.erreurs) if (!uniq.some((u) => u.bonne === e.bonne)) uniq.push(e);
    if (uniq.length) {
      texte("À revoir :", W / 2, 390, 44, "#e8b33f", "center", "#5a3a29");
      uniq.slice(0, 5).forEach((e, k) => texte(pv(e.pronom, e.verbe) + "   →   " + pv(e.pronom, e.bonne) + "   (" + e.regle.terminaison + ")", W / 2, 455 + k * 60, 42, "#fff", "center", "#5a3a29"));
    } else if (S_.rep) texte("Aucune erreur de forme, bravo !", W / 2, 440, 48, "#9be08f", "center", "#5a3a29");
    else texte("Aucune commande prise cette fois.", W / 2, 440, 44, "#f6e9cf", "center", "#5a3a29", "normal");
    BTN.rejouer = bouton(W / 2 - 230, 840, 460, 120, "REJOUER", false);
  }

  // ------------------------------------------------------------------ rendu
  function rendre() {
    ctx.clearRect(0, 0, W, H);
    const enCuisine = !!S_ && G.vue === "cuisine" && (G.mode === "play" || G.mode === "over");
    if (!enCuisine && !dessiner("bg_salle", 0, 0, W / (img("bg_salle") ? img("bg_salle").width : W), H / (img("bg_salle") ? img("bg_salle").height : H), "haut")) { ctx.fillStyle = "#c9b48f"; ctx.fillRect(0, 0, W, H); }
    if (G.mode === "title") { dessinerTitre(); return; }
    if (G.mode === "settings") { dessinerReglages(); return; }
    if (!S_) return;
    if (enCuisine) dessinerCuisine();
    else {
      // passe-plats et plats prêts
      dessiner("passe_plats", 300, 300, 0.62, 0.62, "haut");
      S_.hatchQ.slice(0, 3).forEach((h, i, a) => { const x = HATCH_PLATE.x + (i - (a.length - 1) / 2) * 72; dessiner(h.dish, x, HATCH_PLATE.y, 0.16, 0.12, "bas"); texte(String(h.table + 1), x + 40, HATCH_PLATE.y - 30, 30, "#fff", "center", "#5a3a29"); });
      dessinerPorteSalle();
      dessinerRail();
      const sv = S_.serveur, derriere = sv.y < 800;
      if (derriere) dessinerServeur();
      S_.tables.forEach((tb) => { if (tableActive(tb.i)) dessinerTable(tb); });
      if (!derriere) dessinerServeur();
      dessinerFx();
    }
    dessinerHUD(); if (G.mode === "play") dessinerMessages();
    if (enCuisine) dessinerSaisie(); else dessinerPanneau();
    if (G.paused) { ctx.fillStyle = "rgba(30,15,8,0.6)"; ctx.fillRect(0, 0, W, H); texte("PAUSE", W / 2, H / 2, 120, "#f6e9cf", "center", "#5a3a29"); }
    if (G.mode === "over") dessinerFin();
    if (G.trans) { const a = Math.max(0, 1 - Math.abs(G.trans.t - 0.22) / 0.22); ctx.fillStyle = "rgba(30,15,8," + a.toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
  }

  // ------------------------------------------------------------------ entrées
  function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  const dans = (b, p) => b && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
  function clic(p) {
    if (G.mode === "title") {
      if (dans(BTN.normal, p)) { G.chrono = "normal"; sauver(); } else if (dans(BTN.lent, p)) { G.chrono = "lent"; sauver(); } else if (dans(BTN.sans, p)) { G.chrono = "sans"; sauver(); }
      else if (BTN.groupe && BTN.groupe.some((b, k) => dans(b, p) && (G.groupe = k) >= 0)) { sauver(); sonClic(); }
      else if (BTN.duree && BTN.duree.some((b, k) => dans(b, p) && (G.duree = DUREES[k]) >= 0)) { sauver(); sonClic(); }
      else if (dans(BTN.reglages, p)) { G.mode = "settings"; sonClic(); }
      else if (dans(BTN.cuisine, p)) { G.cuisine = G.cuisine ? 0 : 1; sauver(); sonClic(); }
      else if (dans(BTN.jouer, p)) { nouvellePartie(); sonClic(); }
      return;
    }
    if (G.mode === "settings") {
      const b = (BTN.reg || []).find((b) => dans(b, p));
      if (b) { A[b.cle] = b.val; sauver(); sonClic(); if (b.cle === "voix" && b.val === 1) dire("Lecture à voix haute activée."); }
      else if (dans(BTN.retour, p)) { G.mode = "title"; sonClic(); }
      return;
    }
    if (G.mode === "over") { if (dans(BTN.rejouer, p)) { nouvellePartie(); sonClic(); } return; }
    if (G.paused || G.trans) return;
    if (G.vue === "cuisine") { clicCuisine(p); return; }
    if (S_.panel) {
      const n = S_.panel.cmd.choix.length;
      if (voixOk() && dans(ECOUTER, p)) { direCommande(S_.panel.cmd, true); return; }
      for (let i = 0; i < n; i++) { const r = briqueRect(i, n); if (dans(r, p)) { choisir(i); return; } }
      if (p.y < PANEL.y - 10) { const c = S_.tables[S_.panel.table].client; if (c) c.state = "call"; S_.panel = null; }   // clic hors du panneau : annuler
      return;
    }
    if (S_.cuis.ouverte && dans(DOOR, p)) { demanderCuisine(); return; }
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
  function annulerPanneau() { const c = S_.tables[S_.panel.table].client; if (c) c.state = "call"; S_.panel = null; }
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (G.mode === "play" && S_ && G.vue === "cuisine" && S_.cuis.saisie && !G.paused) {       // en train d'écrire : seules Entrée et Échap sont à nous
      if (k === "Enter") { e.preventDefault(); validerSaisie(); }
      else if (k === "Escape") { e.preventDefault(); fermerSaisie(); }
      else { const c = champ(); if (c && document.activeElement !== c) c.focus(); }
      return;
    }
    if (k === "p" || k === "P") { if (G.mode === "play") G.paused = !G.paused; return; }
    if (k === "m" || k === "M") { G.muted = !G.muted; return; }
    if (G.mode === "title") {
      if (k === "Enter" || k === " ") { e.preventDefault(); nouvellePartie(); sonClic(); }
      else if (k === "r" || k === "R") { G.mode = "settings"; }
      return;
    }
    if (G.mode === "settings") { if (k === "Escape" || k === "Enter") { e.preventDefault(); G.mode = "title"; } return; }
    if (G.mode === "over") { if (k === "Enter" || k === " ") { e.preventDefault(); nouvellePartie(); sonClic(); } return; }
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
    if ((k === "c" || k === "C") && !S_.panel) { demanderCuisine(); return; }
    if (S_.panel) {
      const pn = S_.panel, n = pn.cmd.choix.length;
      if (/^[1-4]$/.test(k)) { if (+k <= n) choisir(+k - 1); }
      else if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); pn.focus = pn.clavier ? (pn.focus + 1) % n : pn.focus; pn.clavier = true; }
      else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); pn.focus = pn.clavier ? (pn.focus + n - 1) % n : pn.focus; pn.clavier = true; }
      else if (k === "Enter" || k === " ") { e.preventDefault(); if (pn.clavier) choisir(pn.focus); else pn.clavier = true; }
      else if (k === "l" || k === "L") direCommande(pn.cmd, true);
      else if (k === "Escape") annulerPanneau();
      return;
    }
    if (/^[1-6]$/.test(k)) { const tb = S_.tables[+k - 1]; if (tb && tableActive(tb.i)) clic({ x: tb.x, y: 600 }); }   // touches 1 à 6 : la table correspondante
  });
  const _champ = champ();
  if (_champ) {
    _champ.addEventListener("input", () => { if (S_ && S_.cuis.saisie) majTexte(_champ.value.toLowerCase().replace(/[^a-zàâäçéèêëîïôöùûüœ]/g, "")); });
    _champ.addEventListener("blur", () => { setTimeout(() => { if (S_ && G.mode === "play" && G.vue === "cuisine" && S_.cuis.saisie && !G.paused) _champ.focus(); }, 30); });
  }
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
    G, BAL, A, sauver, CLE, get S() { return S_; }, start: nouvellePartie, clic, choisir, update, rendre, validerSaisie, changerVue, majTexte, ticketSelId, posteActif, POSTES, DOOR, DOOR_STAND, CUIS_PORTE, rectsSaisie, ticketRect,
    avancer(sec) { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); rendre(); },
    manquants() { return Object.keys(LISTE).filter((k) => !IMG[k]); },
  };

  charger().then(() => requestAnimationFrame(boucle));
})();
