/* ============================================================
   COMPTES ÉLÈVES (chantier 10) : numéro à 4 chiffres, reprise de partie, espace enseignante caché.
   Modèle : le jeu de foot (js/compte.js), adapté au Resto du Passé Simple.

   Principes
   - Le jeu marche toujours sans réseau et sans compte : la mémoire principale reste le localStorage
     (js/game.js). Firebase n'en garde qu'une COPIE, dans la Realtime Database du projet LEXICA,
     à l'adresse  jeux/resto-passe-simple/<numéro>.
   - Les scripts Firebase (version « compat » 8.10.1, sans modules) ne sont chargés que quand un élève
     tape un numéro. Avec « Jouer sans compte », rien n'est chargé et rien n'est envoyé.
   - À chaque connexion : lecture de la copie du cloud, FUSION avec celle de l'appareil (on ne perd jamais
     de progression), puis envoi. On n'écrit jamais dans le cloud avant d'avoir lu et fusionné.
   - Envois économes : 5 s après la dernière modification (20 s au plus pendant une partie).
     La connexion est coupée entre deux envois (l'offre gratuite limite à 100 connexions simultanées).
   - Rien dans ce fichier n'écrit dans la console du navigateur.
   - Les réglages d'accessibilité restent propres à l'appareil : ils ne vont pas dans le cloud.

   Ce fichier ne touche jamais à l'état du jeu : il passe par window.RESTO_JEU (défini à la fin de js/game.js).

   Espace enseignante : symbole discret (⚙) en bas à droite. Connexion Firebase (e-mail + mot de passe) : ce sont les
   RÈGLES FIREBASE qui réservent la liste et la suppression à son compte. Une fois connectée : liste des comptes,
   et « Mode essai » (la page de débogage du jeu). Secours sans connexion : mot de passe de secours, qui ouvre
   UNIQUEMENT le mode essai (verrou côté navigateur : suffisant contre des « triches », pas pour protéger des données).
   ============================================================ */
(function (root) {
  "use strict";
  var C = root.RESTO_COMPTE = {};
  var doc = root.document;
  var J = root.RESTO_JEU;
  if (!J || !doc) { return; }

  /* Configuration publique du projet LEXICA (sans danger dans le code : la sécurité vient des règles Firebase). */
  var CONFIG = {
    apiKey: "AIzaSyBwoQqcFCH7ssSUyGkFd52v6Wam1O4WiVw",
    authDomain: "lexica-488e9.firebaseapp.com",
    databaseURL: "https://lexica-488e9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "lexica-488e9",
    storageBucket: "lexica-488e9.firebasestorage.app",
    messagingSenderId: "3644116964",
    appId: "1:3644116964:web:5ae47e4211bb5603c301f1"
  };
  var SDK = "https://www.gstatic.com/firebasejs/8.10.1/";
  var CHEMIN = "jeux/resto-passe-simple";
  var VERSION_TEXTE = "Version du 31/10, 8 h";                // mise à jour à chaque livraison (voir aussi les ?v= dans index.html)
  /* Mot de passe de secours : seule l'empreinte SHA-256 salée est dans le fichier (jamais le mot de passe). */
  var SEL = "resto-passe-simple|v1|Qm7x2";
  var EMPREINTE_SECOURS = "08bbf135c113cdc9fd7d50e6439f272e2680965d6ba3cda495ab106c77e1dc6a";

  /* ---------- petits outils ---------- */
  function $(id) { return doc.getElementById(id); }
  function el(tag, classe, texte) {
    var e = doc.createElement(tag);
    if (classe) { e.className = classe; }
    if (texte !== undefined) { e.textContent = texte; }
    return e;
  }
  function vider(e) { while (e.firstChild) { e.removeChild(e.firstChild); } }
  function avecDelai(promesse, ms) {
    return new Promise(function (resolve, reject) {
      var fini = false, t = setTimeout(function () { if (!fini) { fini = true; reject(new Error("delai")); } }, ms);
      promesse.then(function (v) { if (!fini) { fini = true; clearTimeout(t); resolve(v); } },
                    function (e) { if (!fini) { fini = true; clearTimeout(t); reject(e); } });
    });
  }
  // Texte stable (clés triées) pour comparer deux objets
  function stable(x) {
    if (x === null || typeof x !== "object") { return JSON.stringify(x); }
    if (x instanceof Array) { return "[" + x.map(stable).join(",") + "]"; }
    return "{" + Object.keys(x).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(x[k]); }).join(",") + "}";
  }
  function copie(x) { return JSON.parse(JSON.stringify(x)); }
  function nb(v, max) { return (typeof v === "number" && isFinite(v)) ? Math.max(0, Math.min(max || 1e12, Math.floor(v))) : 0; }

  /* SHA-256 en JavaScript simple (marche partout, même sans https) */
  function sha256(texte) {
    var s = unescape(encodeURIComponent(String(texte)));
    var K = [], H = [], i, j, p = 2, n = 0;
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    while (n < 64) {
      var premier = true;
      for (j = 2; j * j <= p; j++) { if (p % j === 0) { premier = false; break; } }
      if (premier) {
        if (n < 8) { H[n] = (Math.pow(p, 0.5) * 4294967296) | 0; }
        K[n++] = (Math.pow(p, 1 / 3) * 4294967296) | 0;
      }
      p++;
    }
    var octets = [];
    for (i = 0; i < s.length; i++) { octets.push(s.charCodeAt(i)); }
    var bits = s.length * 8;
    octets.push(0x80);
    while (octets.length % 64 !== 56) { octets.push(0); }
    for (i = 7; i >= 0; i--) { octets.push(i >= 4 ? 0 : (bits >>> (i * 8)) & 255); }
    for (var b = 0; b < octets.length; b += 64) {
      var w = [];
      for (i = 0; i < 16; i++) { w[i] = (octets[b + i * 4] << 24) | (octets[b + i * 4 + 1] << 16) | (octets[b + i * 4 + 2] << 8) | octets[b + i * 4 + 3]; }
      for (i = 16; i < 64; i++) {
        var s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), maj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var hex = "";
    for (i = 0; i < 8; i++) { hex += ("00000000" + (H[i] >>> 0).toString(16)).slice(-8); }
    return hex;
  }
  C._sha256 = sha256;   // pour les tests automatiques

  /* ============================================================
     FUSION de deux progressions (appareil / cloud) : on ne perd jamais de progression.
     Une progression : { v, maj, rec, nom, resto, guide:[{id,v,nom}], camp:{argent, franchise, restos:[…]}, stats:{j,t,rates} }
     Règles
     - « recommencé » (rec) : si l'une des deux copies est d'AVANT la dernière « Nouvelle campagne » de l'autre, on ne la reprend pas
       (le cloud ancien ne ressuscite pas une partie effacée, et inversement).
     - Par resto : ouvert = OU, réussi = OU, étoiles = max, record (meilleur) = max.
     - L'argent se dépense (atelier déco) : on garde, avec SA déco et SES pièces gagnées par resto, la copie dont le total de pièces
       gagnées (cumul) est le plus grand (à égalité : la plus récente), sans mélanger.
     - Articles du guide : union. Toque chef : étoiles et passages = max. Statistiques : max, champ par champ.
     ============================================================ */
  function cumul(p) {
    var t = 0, r = (p && p.camp && p.camp.restos instanceof Array) ? p.camp.restos : [], i;
    for (i = 0; i < r.length; i++) { t += nb(r[i] && r[i].argent, 1e9); }
    return t;
  }
  function fusion(loc, dis) {
    if (!dis || typeof dis !== "object") { return loc ? copie(loc) : null; }
    if (!loc || typeof loc !== "object") { return copie(dis); }
    var rl = nb(loc.rec), rd = nb(dis.rec);
    if (rl > rd) { return copie(loc); }
    if (rd > rl) { return copie(dis); }
    var cl = cumul(loc), cd = cumul(dis);
    var gagnant = (cl > cd) ? loc : (cd > cl ? dis : (nb(dis.maj) > nb(loc.maj) ? dis : loc));
    var autre = (gagnant === loc) ? dis : loc;
    var m = copie(gagnant);
    var n = Math.max(J.nbRestos || 0, (gagnant.camp && gagnant.camp.restos ? gagnant.camp.restos.length : 0), (autre.camp && autre.camp.restos ? autre.camp.restos.length : 0)), i;
    if (!m.camp || typeof m.camp !== "object") { m.camp = { argent: 0, restos: [] }; }
    if (!(m.camp.restos instanceof Array)) { m.camp.restos = []; }
    var ra = (autre.camp && autre.camp.restos instanceof Array) ? autre.camp.restos : [];
    for (i = 0; i < n; i++) {
      var a = m.camp.restos[i] || {}, o = ra[i] || {};
      a.ouvert = !!(a.ouvert || o.ouvert);
      a.reussi = !!(a.reussi || o.reussi);
      a.etoiles = Math.max(nb(a.etoiles, 3), nb(o.etoiles, 3));
      a.meilleur = Math.max(nb(a.meilleur, 1e9), nb(o.meilleur, 1e9));
      m.camp.restos[i] = a;
    }
    // Toque chef
    var fg = (gagnant.camp && gagnant.camp.franchise) || {}, fo = (autre.camp && autre.camp.franchise) || {};
    var essais = Math.max(nb(fg.essais, 9999), nb(fo.essais, 9999));
    m.camp.franchise = { etoiles: Math.max(nb(fg.etoiles, 3), nb(fo.etoiles, 3)), essais: essais, attente: !!((fg.attente || fo.attente) && essais === 0) };
    // articles du guide : union par numéro (ceux de la copie gardée d'abord)
    var guide = (m.guide instanceof Array) ? m.guide.slice() : [], vus = {}, g;
    for (i = 0; i < guide.length; i++) { vus[guide[i] && guide[i].id] = true; }
    var ga = (autre.guide instanceof Array) ? autre.guide : [];
    for (i = 0; i < ga.length; i++) { g = ga[i]; if (g && typeof g.id === "number" && !vus[g.id]) { guide.push(g); vus[g.id] = true; } }
    m.guide = guide.slice(0, 5);
    // nom du resto : celui de la copie gardée, sauf s'il est resté celui par défaut
    var DEF = "Chez Passé Simple";
    if ((!m.nom || m.nom === DEF) && autre.nom && autre.nom !== DEF) { m.nom = autre.nom; }
    // statistiques : max champ par champ
    var sg = (gagnant.stats && typeof gagnant.stats === "object") ? gagnant.stats : {}, so = (autre.stats && typeof autre.stats === "object") ? autre.stats : {};
    var rates = {}, k, rg = sg.rates || {}, ro = so.rates || {};
    for (k in rg) { if (rg.hasOwnProperty(k)) { rates[k] = nb(rg[k], 1e6); } }
    for (k in ro) { if (ro.hasOwnProperty(k)) { rates[k] = Math.max(rates[k] || 0, nb(ro[k], 1e6)); } }
    m.stats = { t: Math.max(nb(sg.t, 1e7), nb(so.t, 1e7)), j: Math.max(nb(sg.j, 1e7), nb(so.j, 1e7)), rates: rates };
    m.maj = Math.max(nb(loc.maj), nb(dis.maj));
    m.rec = rl;
    m.v = 3;
    return m;
  }
  C.fusion = fusion;   // pour les tests automatiques

  /* ---------- état du compte ---------- */
  var numero = null;        // numéro de l'élève connecté (null = sans compte)
  var etat = "sans";        // sans | attente | ok | hors
  var session = 0;          // change à chaque changement d'élève : les opérations en retard sont ignorées
  var fusionFaite = false;  // on n'écrit jamais avant d'avoir lu et fusionné
  var enCours = false, fileRappels = [];
  var minuteur = null, debutAttente = 0, relance = null, aPousser = false;
  var modeConnexion = null; // "nouvelle" (le numéro doit être libre) ou "reprendre" (le numéro doit exister)
  var localConnu = false;   // ce numéro a déjà une copie sur cet appareil
  var fb = null, db = null, auth = null, ops = 0, coupure = null;

  C.numero = function () { return numero; };
  C.etat = function () { return etat; };
  C.disponible = function () { return !!(root.location && root.location.protocol !== "file:"); };

  function texteEtat() {
    if (!numero) { return "Sans compte : ta partie reste sur cet appareil."; }
    var t = "☁ Élève " + numero + " · ";
    if (etat === "ok") { return t + "partie sauvegardée ✔"; }
    if (etat === "attente") { return t + "sauvegarde…"; }
    return t + "hors connexion (ta partie reste ici et sera envoyée plus tard)";
  }
  function afficherEtat() { var e = $("rc-etat-texte"); if (e) { e.textContent = texteEtat(); e.className = "rc-etat-" + (numero ? etat : "sans"); } }
  function fixerEtat(x) { etat = x; afficherEtat(); }
  C.texteEtat = texteEtat;

  /* ---------- chargement de Firebase (seulement quand il sert) ---------- */
  function chargerScript(url, fin) {
    var s = doc.createElement("script"), fait = false, t;
    function ok(v) { if (!fait) { fait = true; clearTimeout(t); fin(v); } }
    t = setTimeout(function () { ok(new Error("delai")); }, 12000);
    s.onload = function () { ok(null); };
    s.onerror = function () { ok(new Error("reseau")); };
    s.src = url; doc.head.appendChild(s);
  }
  function charger(fin) {
    if (root.firebase && root.firebase.database && root.firebase.auth) { fin(null); return; }
    chargerScript(SDK + "firebase-app.js", function (e1) {
      if (e1) { fin(e1); return; }
      chargerScript(SDK + "firebase-auth.js", function (e2) {
        if (e2) { fin(e2); return; }
        chargerScript(SDK + "firebase-database.js", function (e3) { fin(e3 || null); });
      });
    });
  }
  function init() {
    fb = root.firebase;
    if (!fb.apps.length) { fb.initializeApp(CONFIG); }
    if (!auth) { auth = fb.auth(); }
    if (!db) { db = fb.database(); db.goOffline(); }   // la connexion ne s'ouvre que pendant un échange
  }
  function ouvrir() { ops++; clearTimeout(coupure); coupure = null; try { db.goOnline(); } catch (e) {} }
  function fermer() {
    ops = Math.max(0, ops - 1);
    if (ops === 0) { clearTimeout(coupure); coupure = setTimeout(function () { if (ops === 0) { try { db.goOffline(); } catch (e) {} } }, 3000); }
  }
  function premierEtat() {
    return new Promise(function (resolve) {
      var off = auth.onAuthStateChanged(function (u) { off(); resolve(u); });
    });
  }
  // S'assure d'être connecté de façon anonyme (jamais avec le compte enseignant)
  function preparer(fin) {
    charger(function (err) {
      if (err) { fin(err); return; }
      try { init(); } catch (e) { fin(e); return; }
      avecDelai(premierEtat(), 8000).then(function (u) {
        if (u && !u.email) { return u; }
        var avant = u ? auth.signOut() : Promise.resolve();
        return avecDelai(avant.then(function () { return auth.signInAnonymously(); }), 12000);
      }).then(function () { fin(null); }, function (e) { fin(e || new Error("auth")); });
    });
  }

  /* ---------- synchronisation ---------- */
  // refus : "pris" | "inconnu" (le numéro n'est pas utilisable) ; une opération d'une session abandonnée est ignorée
  function terminer(ok, jeton, refus) {
    if (jeton !== session) { return; }
    enCours = false;
    var q = fileRappels; fileRappels = [];
    if (!ok && numero && !refus) { fixerEtat("hors"); }
    q.forEach(function (f) { try { f(ok, refus); } catch (e) {} });
  }
  function refuser(code) { var e = new Error("refus"); e.refus = code; return e; }
  function synchroniser(rappel) {
    if (!numero) { if (rappel) { rappel(false); } return; }
    if (rappel) { fileRappels.push(rappel); }
    if (enCours) { return; }
    enCours = true; fixerEtat("attente");
    var n = numero, jeton = session;
    function perime() { return n !== numero || jeton !== session; }
    preparer(function (err) {
      if (err || perime()) { terminer(false, jeton); return; }
      ouvrir();
      var ref = db.ref(CHEMIN + "/" + n);
      var lecture = avecDelai(ref.once("value"), 10000);        // on lit TOUJOURS avant d'écrire (même pour les envois suivants)
      lecture.then(function (snap) {
        if (perime()) { throw new Error("perime"); }
        var distant = null, existe = !!(snap && snap.exists());
        if (existe) {
          var v = snap.val();
          try { distant = JSON.parse(v.donnees); } catch (e) { distant = null; }
        }
        var mon;
        if (!fusionFaite) {
          if (modeConnexion === "nouvelle") {
            if (existe) { throw refuser("pris"); }                      // ce numéro appartient déjà à quelqu'un
            J.remplacer(null); distant = null;                          // départ à zéro (une vieille copie locale n'est pas reprise)
          } else if (modeConnexion === "reprendre" && !existe && !localConnu) {
            throw refuser("inconnu");                                   // numéro inconnu : probablement une faute de frappe
          }
          modeConnexion = null;
          var local = J.exporter(), fus = fusion(local, distant);
          if (fus && stable(fus) !== stable(local)) { J.remplacer(fus); }
          fusionFaite = true;
          mon = J.exporter();
        } else {
          // Envois suivants : si un autre appareil a ajouté quelque chose dans le nuage entre-temps, on l'y garde (union) sans toucher à la partie en cours ici
          mon = J.exporter();
          var u = fusion(mon, distant);
          if (u && stable(u) !== stable(mon)) { mon = u; }
        }
        var envoyee = J.exporter().maj;
        return avecDelai(ref.set({ v: 1, maj: fb.database.ServerValue.TIMESTAMP, donnees: JSON.stringify(mon) }), 15000).then(function () {
          if (perime()) { return; }
          aPousser = (J.exporter().maj !== envoyee);
          if (aPousser) { planifier(); } else { fixerEtat("ok"); }
        });
      }).then(function () { fermer(); terminer(true, jeton); },
              function (e) { fermer(); terminer(false, jeton, e && e.refus); });
    });
  }
  function pousser() {
    clearTimeout(minuteur); minuteur = null; debutAttente = 0; clearTimeout(relance); relance = null;
    if (!numero) { return; }
    synchroniser(function (ok) {
      if (!ok && numero) { clearTimeout(relance); relance = setTimeout(pousser, 45000); }
    });
  }
  function planifier() {
    if (!numero) { return; }
    aPousser = true;
    if (etat !== "attente") { fixerEtat("attente"); }
    var maintenant = Date.now();
    if (!debutAttente) { debutAttente = maintenant; }
    clearTimeout(minuteur);
    minuteur = setTimeout(pousser, (maintenant - debutAttente >= 20000) ? 0 : 5000);
  }
  function arreterMinuteurs() { clearTimeout(minuteur); clearTimeout(relance); minuteur = null; relance = null; debutAttente = 0; }

  /* ---------- connexion d'un élève ---------- */
  // mode : "nouvelle" (le numéro doit être libre) ou "reprendre" (le numéro doit exister)
  // rappel("ok" | "hors" | "pris" | "inconnu" | "impossible")
  //   hors       : pas de réseau, mais l'élève reprend sa partie gardée sur cet appareil (envoi plus tard)
  //   impossible : pas de réseau et le numéro ne peut pas être vérifié : on n'entre pas
  function annuler() {
    arreterMinuteurs(); session++;
    numero = null; fusionFaite = false; enCours = false; fileRappels = []; aPousser = false; modeConnexion = null; localConnu = false;
    J.brancher(null); J.utiliser(null); fixerEtat("sans");
  }
  C.connecter = function (n, mode, rappel) {
    arreterMinuteurs();
    session++; numero = String(n); fusionFaite = false; enCours = false; fileRappels = []; aPousser = false;
    modeConnexion = (mode === "nouvelle") ? "nouvelle" : "reprendre";
    localConnu = J.existe(numero);
    J.utiliser(numero);
    J.brancher(planifier);
    fixerEtat("attente");
    // sans vérification possible, seule une partie déjà présente sur l'appareil peut être reprise
    var verificationIndispensable = (modeConnexion === "nouvelle") || !localConnu;
    var fini = false;
    function fin(r) { if (!fini) { fini = true; rappel(r); } }
    if (!C.disponible()) { if (verificationIndispensable) { annuler(); fin("impossible"); } else { fixerEtat("hors"); fin("hors"); } return; }
    var t = setTimeout(function () {
      if (verificationIndispensable) { annuler(); fin("impossible"); return; }
      if (etat === "attente") { fixerEtat("hors"); }
      fin("hors");
    }, 9000);
    synchroniser(function (ok, refus) {
      clearTimeout(t);
      if (refus) { annuler(); fin(refus); return; }
      if (!ok) {
        if (verificationIndispensable) { annuler(); fin("impossible"); return; }
        clearTimeout(relance); relance = setTimeout(pousser, 45000);
        fin("hors"); return;
      }
      fin("ok");
    });
  };
  C.sansCompte = function () {
    arreterMinuteurs(); session++; numero = null; fusionFaite = false; aPousser = false; enCours = false; fileRappels = [];
    J.brancher(null); J.utiliser(null); fixerEtat("sans");
  };

  /* ============================================================
     INTERFACE (tout est créé ici : index.html n'a qu'une ligne à ajouter)
     ============================================================ */
  var ecranOuvert = false, profOuvert = false;
  J.bloque = function () { return ecranOuvert || profOuvert; };

  var CSS = [
    ".rc-cache{display:none !important}",
    "#rc-ecran,#rc-prof{position:fixed;left:0;top:0;right:0;bottom:0;z-index:50;display:flex;align-items:flex-start;justify-content:center;background:rgba(43,26,18,.96);font-family:Georgia,'Times New Roman',serif;color:#4a2f22;overflow:auto;padding:12px;box-sizing:border-box}",
    "#rc-prof{background:rgba(43,26,18,.9);z-index:60}",
    ".rc-carte{margin:auto 0;background:#f6e9cf;border:6px solid #5a3a29;border-radius:24px;padding:24px 28px;max-width:640px;width:100%;box-sizing:border-box;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.5)}",
    ".rc-carte h1{margin:0 0 8px;font-size:34px;color:#8a3b1f}",
    ".rc-carte h2{margin:0 0 10px;font-size:26px;color:#8a3b1f}",
    ".rc-carte p{margin:8px 0;font-size:20px;line-height:1.35}",
    ".rc-carte input[type=text],.rc-carte input[type=password],.rc-carte input[type=email],.rc-carte input[type=number],.rc-carte select{font:inherit;font-size:22px;padding:10px 12px;border:4px solid #5a3a29;border-radius:14px;background:#fffaf0;color:#4a2f22;box-sizing:border-box}",
    "#rc-numero{width:9ch;font-size:44px !important;text-align:center;letter-spacing:.3ch}",
    ".rc-btn{font:inherit;font-size:22px;font-weight:bold;padding:12px 18px;margin:6px;border:4px solid #5a3a29;border-radius:16px;background:#e8b33f;color:#3b2415;cursor:pointer;touch-action:manipulation}",
    ".rc-btn:disabled{opacity:.5;cursor:default}",
    ".rc-btn.rc-calme{background:#fffaf0}",
    ".rc-btn.rc-petit{font-size:16px;padding:6px 10px;margin:2px;border-width:3px;border-radius:10px}",
    "#rc-message,#rc-prof-msg{min-height:1.4em;font-size:20px;color:#8a3b1f;font-weight:bold}",
    ".rc-version{font-size:14px !important;opacity:.7;margin-top:14px !important}",
    "#rc-etat{position:fixed;right:calc(8px + env(safe-area-inset-right,0px));top:calc(6px + env(safe-area-inset-top,0px));text-align:right;z-index:40;font:14px system-ui,sans-serif;color:#fff;background:rgba(43,26,18,.62);border-radius:12px;padding:5px 10px;max-width:52vw;line-height:1.25}",
    "#rc-etat button{font:inherit;color:#ffd84a;background:none;border:0;text-decoration:underline;cursor:pointer;padding:0 0 0 6px}",
    "#rc-etat .rc-v{display:block;font-size:11px;opacity:.75}",
    "#rc-etat .rc-essai{color:#ffb3a8;font-weight:bold}",
    "#rc-engrenage{position:fixed;right:calc(4px + env(safe-area-inset-right,0px));bottom:calc(2px + env(safe-area-inset-bottom,0px));z-index:40;width:44px;height:44px;border:0;background:none;color:#fff;font-size:22px;opacity:.12;cursor:pointer;padding:0}",
    "#rc-engrenage:hover,#rc-engrenage:focus{opacity:.5}",
    "#rc-barre{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(2px + env(safe-area-inset-bottom,0px));z-index:45;display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-items:center;background:rgba(217,71,59,.92);border-radius:10px;padding:2px 6px;font:12px system-ui,sans-serif;color:#fff;max-width:98vw}",
    "#rc-barre button{font:inherit;font-weight:bold;padding:3px 7px;border:2px solid #5a3a29;border-radius:7px;background:#fffaf0;color:#3b2415;cursor:pointer;touch-action:manipulation}",
    "#rc-prof .rc-carte{max-width:1100px}",
    ".rc-filtres{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;margin:8px 0}",
    ".rc-filtres label{font-size:16px}",
    ".rc-filtres input,.rc-filtres select{font-size:16px !important;padding:5px 8px !important;border-width:3px !important}",
    ".rc-tableau{max-height:46vh;overflow:auto;margin:6px 0;border:3px solid #5a3a29;border-radius:10px;background:#fffaf0}",
    ".rc-tableau table{border-collapse:collapse;width:100%;font:15px system-ui,sans-serif;text-align:left}",
    ".rc-tableau th,.rc-tableau td{padding:5px 8px;border-bottom:1px solid #d8c7a3;vertical-align:top}",
    ".rc-tableau thead th{position:sticky;top:0;background:#e8b33f;z-index:1}",
    ".rc-tableau tr.rc-ancien td,.rc-tableau tr.rc-ancien th{background:#ffe3b8}",
    "#rc-secours{margin-top:8px}",
    ".rc-lien{background:none;border:0;color:#8a3b1f;text-decoration:underline;font:inherit;font-size:16px;cursor:pointer}"
  ].join("\n");

  function construire() {
    var st = el("style"); st.appendChild(doc.createTextNode(CSS)); doc.head.appendChild(st);

    /* écran du numéro */
    var e = el("div"); e.id = "rc-ecran"; e.className = "rc-cache";
    e.setAttribute("role", "dialog"); e.setAttribute("aria-label", "Ton numéro d'élève");
    var c = el("div", "rc-carte");
    c.appendChild(el("h1", "", "Le Resto du Passé Simple"));
    var f = el("div"); f.id = "rc-formulaire";
    f.appendChild(el("p", "", "Écris ton numéro à 4 chiffres pour reprendre ta partie, ou commence une nouvelle partie."));
    var inp = el("input"); inp.type = "text"; inp.id = "rc-numero"; inp.maxLength = 4; inp.setAttribute("inputmode", "numeric"); inp.setAttribute("pattern", "[0-9]*");
    inp.setAttribute("autocomplete", "off"); inp.setAttribute("aria-label", "Numéro à 4 chiffres");
    f.appendChild(inp);
    var l1 = el("div");
    var b1 = el("button", "rc-btn", "Reprendre ma partie"); b1.id = "rc-reprendre"; b1.type = "button";
    var b2 = el("button", "rc-btn", "Nouvelle partie"); b2.id = "rc-nouvelle"; b2.type = "button";
    l1.appendChild(b1); l1.appendChild(b2); f.appendChild(l1);
    var m = el("p"); m.id = "rc-message"; m.setAttribute("aria-live", "polite"); f.appendChild(m);
    c.appendChild(f);
    var ind = el("p", "", "Les comptes marchent seulement sur le site en ligne. Ici, tu peux jouer sans compte."); ind.id = "rc-indispo"; ind.className = "rc-cache"; c.appendChild(ind);
    var b3 = el("button", "rc-btn rc-calme", "Jouer sans compte"); b3.id = "rc-sans"; b3.type = "button"; c.appendChild(b3);
    c.appendChild(el("p", "rc-version", VERSION_TEXTE));
    e.appendChild(c); doc.body.appendChild(e);

    /* pastille d'état + ⚙ */
    var p = el("div"); p.id = "rc-etat"; p.className = "rc-cache";
    var t = el("span"); t.id = "rc-etat-texte"; p.appendChild(t);
    var ch = el("button", "", "Changer d'élève"); ch.id = "rc-changer"; ch.type = "button"; p.appendChild(ch);
    var es = el("span", "rc-essai", " 🛠 Mode essai"); es.id = "rc-etat-essai"; es.className = "rc-essai rc-cache"; p.appendChild(es);
    p.appendChild(el("span", "rc-v", VERSION_TEXTE));
    doc.body.appendChild(p);
    var g = el("button", "", "⚙"); g.id = "rc-engrenage"; g.type = "button"; g.setAttribute("aria-label", "Espace enseignante"); doc.body.appendChild(g);

    /* barre d'essai (en service, en mode essai seulement) */
    var bar = el("div"); bar.id = "rc-barre"; bar.className = "rc-cache";
    bar.appendChild(el("span", "", "🛠 Essai :"));
    [["Menu essai", function () { J.essai.menu(); }],
     ["+50 réputation", function () { J.essai.repu(50); }],
     ["Succès de presse", function () { J.essai.succes(); }],
     ["Ouvrir la cuisine", function () { J.essai.cuisine(); }],
     ["Niveau +1", function () { J.essai.niveau(); }],
     ["Client suivant", function () { J.essai.clientSuivant(); }],
     ["Finir le service", function () { J.essai.finir(); }]].forEach(function (x) {
      var b = el("button", "", x[0]); b.type = "button"; b.onclick = x[1]; bar.appendChild(b);
    });
    doc.body.appendChild(bar);

    /* fenêtre de l'enseignante */
    var pr = el("div"); pr.id = "rc-prof"; pr.className = "rc-cache";
    pr.setAttribute("role", "dialog"); pr.setAttribute("aria-label", "Espace enseignante");
    var pc = el("div", "rc-carte");
    pc.appendChild(el("h2", "", "Espace enseignante"));
    var cx = el("div"); cx.id = "rc-prof-connexion";
    var em = el("input"); em.type = "email"; em.id = "rc-prof-email"; em.placeholder = "E-mail"; em.setAttribute("autocomplete", "username"); em.setAttribute("aria-label", "E-mail");
    var mp = el("input"); mp.type = "password"; mp.id = "rc-prof-mdp"; mp.placeholder = "Mot de passe"; mp.setAttribute("autocomplete", "current-password"); mp.setAttribute("aria-label", "Mot de passe");
    var ok = el("button", "rc-btn", "Se connecter"); ok.id = "rc-prof-ok"; ok.type = "button";
    var ko = el("button", "rc-btn rc-calme", "Fermer"); ko.id = "rc-prof-fermer1"; ko.type = "button";
    cx.appendChild(em); cx.appendChild(doc.createTextNode(" ")); cx.appendChild(mp); cx.appendChild(el("br")); cx.appendChild(ok); cx.appendChild(ko);
    var lien = el("p"); var bl = el("button", "rc-lien", "Pas de connexion ?"); bl.id = "rc-lien-secours"; bl.type = "button"; lien.appendChild(bl); cx.appendChild(lien);
    var sec = el("div"); sec.id = "rc-secours"; sec.className = "rc-cache";
    sec.appendChild(el("p", "", "Mot de passe de secours : il ouvre seulement le mode essai."));
    var sm = el("input"); sm.type = "password"; sm.id = "rc-secours-mdp"; sm.placeholder = "Mot de passe de secours"; sm.setAttribute("autocomplete", "off"); sm.setAttribute("aria-label", "Mot de passe de secours");
    var so = el("button", "rc-btn", "Ouvrir le mode essai"); so.id = "rc-secours-ok"; so.type = "button";
    sec.appendChild(sm); sec.appendChild(doc.createTextNode(" ")); sec.appendChild(so);
    cx.appendChild(sec);
    pc.appendChild(cx);

    var li = el("div"); li.id = "rc-prof-liste"; li.className = "rc-cache";
    var fil = el("div", "rc-filtres");
    function champ(lib, node) { var lb = el("label", "", lib + " "); lb.appendChild(node); fil.appendChild(lb); return node; }
    var tri = el("select"); tri.id = "rc-tri";
    [["numero", "numéro"], ["progression", "progression (la plus avancée d'abord)"], ["recent", "dernière activité (récente d'abord)"], ["ancien", "dernière activité (ancienne d'abord)"]].forEach(function (o) { var op = el("option", "", o[1]); op.value = o[0]; tri.appendChild(op); });
    champ("Trier par", tri);
    var fi = el("input"); fi.type = "text"; fi.id = "rc-filtre"; fi.size = 6; fi.setAttribute("inputmode", "numeric"); fi.placeholder = "début du n°";
    champ("Numéro", fi);
    var rs = el("select"); rs.id = "rc-filtre-restos";
    [["", "tous"], ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]].forEach(function (o) { var op = el("option", "", o[1]); op.value = o[0]; rs.appendChild(op); });
    champ("Restos réussis", rs);
    var tq = el("select"); tq.id = "rc-filtre-toque";
    [["", "peu importe"], ["oui", "joué"], ["non", "pas encore"]].forEach(function (o) { var op = el("option", "", o[1]); op.value = o[0]; tq.appendChild(op); });
    champ("Toque chef", tq);
    li.appendChild(fil);
    var tb = el("div", "rc-tableau");
    var tab = el("table"), th = el("thead"), trh = el("tr");
    ["Numéro", "Dernière activité", "Restos réussis", "Étoiles de la maison", "Pièces gagnées", "Toque chef", "Formes justes", "Verbes les plus ratés", ""].forEach(function (x) { trh.appendChild(el("th", "", x)); });
    th.appendChild(trh); tab.appendChild(th);
    var corps = el("tbody"); corps.id = "rc-lignes"; tab.appendChild(corps); tb.appendChild(tab); li.appendChild(tb);
    var rsum = el("p"); rsum.id = "rc-resume"; rsum.style.fontSize = "16px"; li.appendChild(rsum);
    var inact = el("div", "rc-filtres");
    var lj = el("label", "", "Comptes inactifs depuis "); var jours = el("input"); jours.type = "number"; jours.id = "rc-jours"; jours.value = "180"; jours.min = "1"; jours.style.width = "8ch"; lj.appendChild(jours); lj.appendChild(doc.createTextNode(" jours "));
    var bv = el("button", "rc-btn rc-petit", "Supprimer les comptes inactifs"); bv.id = "rc-vider"; bv.type = "button";
    inact.appendChild(lj); inact.appendChild(bv); li.appendChild(inact);
    var be = el("button", "rc-btn", "🛠 Mode essai"); be.id = "rc-essai"; be.type = "button";
    var bf = el("button", "rc-btn rc-calme", "Fermer (déconnexion)"); bf.id = "rc-prof-fermer2"; bf.type = "button";
    li.appendChild(be); li.appendChild(bf);
    pc.appendChild(li);
    var pm = el("p"); pm.id = "rc-prof-msg"; pm.setAttribute("aria-live", "polite"); pc.appendChild(pm);
    pr.appendChild(pc); doc.body.appendChild(pr);
  }

  /* ---------- écran du numéro ---------- */
  function montrerEcran(oui) {
    ecranOuvert = oui; $("rc-ecran").className = oui ? "" : "rc-cache";
    majPastille();
  }
  function boutonsNumero(occupe) { $("rc-nouvelle").disabled = occupe; $("rc-reprendre").disabled = occupe; }
  var MESSAGES = {
    pris: "Ce numéro est déjà pris. Si c'est ta partie, clique sur « Reprendre ma partie ».",
    inconnu: "Je ne trouve pas ce numéro. Vérifie-le, ou clique sur « Nouvelle partie » si tu joues pour la première fois.",
    impossible: "Pas de connexion : je ne peux pas vérifier ton numéro. Réessaie plus tard, ou joue sans compte."
  };
  C.demarrer = function () {
    J.pause();
    $("rc-numero").value = ""; $("rc-message").textContent = "";
    boutonsNumero(false);
    var dispo = C.disponible();
    $("rc-formulaire").className = dispo ? "" : "rc-cache";
    $("rc-indispo").className = dispo ? "rc-cache" : "";
    montrerEcran(true);
    if (dispo) { try { $("rc-numero").focus(); } catch (e) {} }
  };
  function jouerAvecNumero(mode) {
    var brut = String($("rc-numero").value || "").replace(/\s+/g, "");
    var msg = $("rc-message");
    if (!/^[0-9]{4}$/.test(brut)) { msg.textContent = "Ton numéro a 4 chiffres. Vérifie-le."; return; }
    msg.textContent = "Vérification…";
    boutonsNumero(true);
    C.connecter(brut, mode, function (res) {
      if (res === "ok" || res === "hors") {
        msg.textContent = "";
        montrerEcran(false); J.demarrer(); afficherEtat();
        return;
      }
      boutonsNumero(false);
      msg.textContent = MESSAGES[res] || "Échec de la connexion.";
    });
  }
  // Changer d'élève : on envoie d'abord ce qui n'est pas parti (4 s au plus), puis retour à l'écran du numéro
  C.changer = function () {
    function fin() { C.sansCompte(); C.demarrer(); }
    if (!numero || !aPousser) { fin(); return; }
    var fait = false;
    function une() { if (!fait) { fait = true; fin(); } }
    setTimeout(une, 4000);
    synchroniser(une);
  };

  /* ---------- pastille d'état, barre d'essai ---------- */
  function majPastille() {
    var s = J.etat(), p = $("rc-etat"), b = $("rc-barre");
    var visible = !ecranOuvert && !profOuvert && s.mode !== "play" && s.mode !== "finale" && s.mode !== "atelier";          // en haut à droite : libre sur la carte et les menus ; caché en service et à l'atelier (compteur de pièces)
    p.className = visible ? "" : "rc-cache";
    $("rc-etat-essai").className = s.debug ? "rc-essai" : "rc-essai rc-cache";
    $("rc-changer").style.display = s.debug ? "none" : "";
    b.className = (s.debug && s.enService && !profOuvert && !ecranOuvert) ? "" : "rc-cache";
  }

  /* ---------- espace enseignante ---------- */
  var donneesProf = [], echecsSecours = 0, blocageSecours = 0;
  function profMessage(t) { $("rc-prof-msg").textContent = t || ""; }
  function profEtape(nom) {
    ["rc-prof-connexion", "rc-prof-liste"].forEach(function (x) { $(x).className = (x === nom) ? "" : "rc-cache"; });
    profMessage("");
  }
  function messageErreur(e) {
    var c = e && e.code ? String(e.code) : "";
    if (/wrong-password|user-not-found|invalid-credential|invalid-email|missing-password/.test(c)) { return "E-mail ou mot de passe incorrect."; }
    if (/too-many-requests/.test(c)) { return "Trop d'essais : attends quelques minutes."; }
    if (/network/.test(c) || (e && (e.message === "reseau" || e.message === "delai"))) { return "Pas de connexion : réessaie plus tard (ou utilise « Pas de connexion ? »)."; }
    if (/permission/i.test(c + " " + (e && e.message ? e.message : ""))) { return "Ce compte n'a pas accès à la liste."; }
    return "Échec (" + (c || "inconnu") + ").";
  }
  C.ouvrirProf = function () {
    J.pause();
    profOuvert = true;
    $("rc-prof-email").value = ""; $("rc-prof-mdp").value = ""; $("rc-secours-mdp").value = "";
    $("rc-secours").className = "rc-cache";
    vider($("rc-lignes"));
    profEtape("rc-prof-connexion");
    $("rc-prof").className = "";
    majPastille();
    try { $("rc-prof-email").focus(); } catch (e) {}
  };
  C.fermerProf = function () {
    profOuvert = false;
    $("rc-prof").className = "rc-cache";
    $("rc-prof-email").value = ""; $("rc-prof-mdp").value = ""; $("rc-secours-mdp").value = "";
    vider($("rc-lignes")); donneesProf = [];
    majPastille();
    if (auth) {   // déconnexion de l'enseignante ; les élèves retrouvent la connexion anonyme conservée entre les visites
      try { auth.signOut().then(function () { return auth.setPersistence(fb.auth.Auth.Persistence.LOCAL); }).then(null, function () {}); } catch (e) {}
    }
  };
  function connexionProf() {
    var email = String($("rc-prof-email").value || "").replace(/^\s+|\s+$/g, ""), mdp = $("rc-prof-mdp").value;
    $("rc-prof-mdp").value = "";
    if (!email || !mdp) { profMessage("Écris ton e-mail et ton mot de passe."); return; }
    profMessage("Connexion…");
    $("rc-prof-ok").disabled = true;
    charger(function (err) {
      if (err) { $("rc-prof-ok").disabled = false; profMessage(messageErreur(err)); return; }
      try { init(); } catch (e) { $("rc-prof-ok").disabled = false; profMessage(messageErreur(e)); return; }
      auth.setPersistence(fb.auth.Auth.Persistence.SESSION)
        .then(function () { return avecDelai(auth.signInWithEmailAndPassword(email, mdp), 15000); })
        .then(function () { if (!profOuvert) { return null; } return chargerListe(); })
        .then(function () { $("rc-prof-ok").disabled = false; },
              function (e) { $("rc-prof-ok").disabled = false; if (profOuvert) { profMessage(messageErreur(e)); } });
    });
  }
  // Secours : ouvre UNIQUEMENT le mode essai (jamais la liste ni la suppression des comptes)
  function secours() {
    var mdp = $("rc-secours-mdp").value;
    $("rc-secours-mdp").value = "";
    if (Date.now() < blocageSecours) { profMessage("Trop d'essais : attends quelques secondes."); return; }
    if (!mdp) { return; }
    if (sha256(SEL + "|" + mdp) !== EMPREINTE_SECOURS) {
      echecsSecours++;
      if (echecsSecours >= 5) { echecsSecours = 0; blocageSecours = Date.now() + 30000; profMessage("Trop d'essais : attends 30 secondes."); }
      else { profMessage("Mot de passe incorrect."); }
      return;
    }
    echecsSecours = 0;
    entrerEssai();
  }
  function entrerEssai() {
    C.fermerProf();
    C.sansCompte();           // jamais d'envoi vers le cloud en mode essai
    montrerEcran(false);
    J.entrerEssai();
    majPastille();
  }

  /* ---------- liste des comptes ---------- */
  function resumerCompte(num, v) {
    var d = null, r = { numero: num, maj: (typeof v.maj === "number") ? v.maj : 0, lisible: false, reussis: 0, etoiles: 0, pieces: 0, toque: -1, pct: -1, rates: "" };
    try { d = JSON.parse(v.donnees); } catch (e) { d = null; }
    if (!d || typeof d !== "object") { return r; }
    r.lisible = true;
    var restos = (d.camp && d.camp.restos instanceof Array) ? d.camp.restos : [], i;
    for (i = 0; i < restos.length; i++) {
      if (restos[i] && restos[i].reussi) { r.reussis++; }
      r.etoiles += nb(restos[i] && restos[i].etoiles, 3);
      r.pieces += nb(restos[i] && restos[i].argent, 1e9);
    }
    var fr = d.camp && d.camp.franchise;
    if (fr && nb(fr.essais) > 0) { r.toque = nb(fr.etoiles, 3); r.etoiles += r.toque; }
    var s = d.stats;
    if (s && nb(s.t) > 0) { r.pct = Math.round(100 * Math.min(nb(s.j), nb(s.t)) / nb(s.t)); }
    if (s && s.rates && typeof s.rates === "object") {
      r.rates = Object.keys(s.rates).sort(function (a, b) { return (nb(s.rates[b]) - nb(s.rates[a])) || (a < b ? -1 : 1); }).slice(0, 5)
        .map(function (k) { return k + " (" + nb(s.rates[k]) + ")"; }).join(", ");
    }
    return r;
  }
  function chargerListe() {
    profMessage("Lecture de la liste…");
    ouvrir();
    return avecDelai(db.ref(CHEMIN).once("value"), 15000).then(function (snap) {
      fermer();
      donneesProf = [];
      snap.forEach(function (enfant) { donneesProf.push(resumerCompte(enfant.key, enfant.val() || {})); });
      profEtape("rc-prof-liste");
      afficherListe();
    }, function (e) { fermer(); throw e; });
  }
  function dateCourte(ms) {
    if (!ms) { return "?"; }
    var d = new Date(ms), j = d.getDate(), m = d.getMonth() + 1;
    return (j < 10 ? "0" : "") + j + "/" + (m < 10 ? "0" : "") + m + "/" + d.getFullYear();
  }
  function afficherListe() {
    var corps = $("rc-lignes"), tri = $("rc-tri").value, filtre = String($("rc-filtre").value || "").replace(/\s+/g, "");
    var fr = $("rc-filtre-restos").value, ft = $("rc-filtre-toque").value, total = J.nbRestos || 4, maxEt = total * 3 + 3;
    var jours = parseInt($("rc-jours").value, 10); if (!(jours > 0)) { jours = 180; }
    var limite = Date.now() - jours * 86400000;
    var l = donneesProf.filter(function (x) {
      if (filtre && x.numero.indexOf(filtre) !== 0) { return false; }
      if (fr !== "" && (!x.lisible || x.reussis !== parseInt(fr, 10))) { return false; }
      if (ft === "oui" && x.toque < 0) { return false; }
      if (ft === "non" && x.toque >= 0) { return false; }
      return true;
    });
    l.sort(function (a, b) {
      if (tri === "progression") { return (b.etoiles - a.etoiles) || (b.reussis - a.reussis) || (b.pieces - a.pieces) || (a.numero < b.numero ? -1 : 1); }
      if (tri === "recent") { return (b.maj - a.maj) || (a.numero < b.numero ? -1 : 1); }
      if (tri === "ancien") { return (a.maj - b.maj) || (a.numero < b.numero ? -1 : 1); }
      return a.numero < b.numero ? -1 : (a.numero > b.numero ? 1 : 0);
    });
    vider(corps);
    l.forEach(function (x) {
      var tr = el("tr", (x.maj && x.maj < limite) ? "rc-ancien" : "");
      tr.appendChild(el("th", "", x.numero));
      tr.appendChild(el("td", "", dateCourte(x.maj)));
      if (!x.lisible) { var ti = el("td", "", "illisible"); ti.colSpan = 6; tr.appendChild(ti); }
      else {
        tr.appendChild(el("td", "", x.reussis + " / " + total));
        tr.appendChild(el("td", "", x.etoiles + " / " + maxEt));
        tr.appendChild(el("td", "", String(x.pieces)));
        tr.appendChild(el("td", "", x.toque < 0 ? "—" : (new Array(x.toque + 1).join("★") + new Array(4 - x.toque).join("☆"))));
        tr.appendChild(el("td", "", x.pct < 0 ? "—" : x.pct + " %"));
        tr.appendChild(el("td", "", x.rates || "—"));
      }
      var td = el("td"), b = el("button", "rc-btn rc-petit", "Supprimer");
      b.onclick = function () { supprimer([x.numero]); };
      td.appendChild(b); tr.appendChild(td);
      corps.appendChild(tr);
    });
    var anciens = donneesProf.filter(function (x) { return x.maj && x.maj < limite; }).length;
    $("rc-resume").textContent = donneesProf.length + " compte" + (donneesProf.length > 1 ? "s" : "") + " · " + l.length + " affiché" + (l.length > 1 ? "s" : "") +
      " · " + anciens + " inactif" + (anciens > 1 ? "s" : "") + " depuis plus de " + jours + " jours (en orange)";
    $("rc-vider").disabled = anciens === 0;
  }
  function supprimer(liste) {
    if (!liste.length) { return; }
    var q = liste.length === 1 ? ("Supprimer le compte " + liste[0] + " ? Sa progression sera perdue.") : ("Supprimer " + liste.length + " comptes ? Leur progression sera perdue.");
    if (!root.confirm(q)) { return; }
    var u = {};
    liste.forEach(function (n) { u[CHEMIN + "/" + n] = null; });
    profMessage("Suppression…");
    ouvrir();
    avecDelai(db.ref().update(u), 15000).then(function () {
      fermer();
      donneesProf = donneesProf.filter(function (x) { return liste.indexOf(x.numero) < 0; });
      afficherListe(); profMessage(liste.length === 1 ? "Compte supprimé." : (liste.length + " comptes supprimés."));
    }, function (e) { fermer(); profMessage(messageErreur(e)); });
  }
  function supprimerAnciens() {
    var jours = parseInt($("rc-jours").value, 10); if (!(jours > 0)) { return; }
    var limite = Date.now() - jours * 86400000;
    supprimer(donneesProf.filter(function (x) { return x.maj && x.maj < limite; }).map(function (x) { return x.numero; }));
  }

  /* ---------- branchements ---------- */
  function brancher() {
    $("rc-nouvelle").onclick = function () { jouerAvecNumero("nouvelle"); };
    $("rc-reprendre").onclick = function () { jouerAvecNumero("reprendre"); };
    // la touche Entrée = « Reprendre » : si c'est une première fois, le message renvoie vers « Nouvelle partie »
    $("rc-numero").onkeydown = function (ev) { if (ev.keyCode === 13) { jouerAvecNumero("reprendre"); } };
    $("rc-numero").oninput = function () { this.value = this.value.replace(/[^0-9]/g, "").slice(0, 4); };
    $("rc-sans").onclick = function () { C.sansCompte(); montrerEcran(false); J.demarrer(); afficherEtat(); };
    $("rc-changer").onclick = function () { C.changer(); };
    $("rc-engrenage").onclick = function () { C.ouvrirProf(); };
    $("rc-prof-ok").onclick = connexionProf;
    $("rc-prof-mdp").onkeydown = function (ev) { if (ev.keyCode === 13) { connexionProf(); } };
    $("rc-lien-secours").onclick = function () { $("rc-secours").className = ""; try { $("rc-secours-mdp").focus(); } catch (e) {} };
    $("rc-secours-ok").onclick = secours;
    $("rc-secours-mdp").onkeydown = function (ev) { if (ev.keyCode === 13) { secours(); } };
    $("rc-prof-fermer1").onclick = C.fermerProf;
    $("rc-prof-fermer2").onclick = C.fermerProf;
    $("rc-tri").onchange = afficherListe;
    $("rc-filtre").oninput = afficherListe;
    $("rc-filtre-restos").onchange = afficherListe;
    $("rc-filtre-toque").onchange = afficherListe;
    $("rc-jours").oninput = afficherListe;
    $("rc-vider").onclick = supprimerAnciens;
    $("rc-essai").onclick = entrerEssai;
    // Si l'élève ferme la page ou change d'onglet : on tente d'envoyer ce qui reste
    doc.addEventListener("visibilitychange", function () { if (doc.hidden && numero && aPousser) { pousser(); } });
    root.addEventListener("pagehide", function () { if (numero && aPousser) { pousser(); } });
    root.addEventListener("online", function () { if (numero && etat === "hors") { pousser(); } });
    setInterval(majPastille, 400);
  }

  /* ---------- démarrage ---------- */
  function demarrage() {
    construire(); brancher();
    J.ouvrirProf = C.ouvrirProf;      // le point caché du jeu (en bas à droite) ouvre la même fenêtre
    var q = (root.location && root.location.search) || "", h = (root.location && root.location.hostname) || "";
    var local = (root.location.protocol === "file:" || h === "localhost" || h === "127.0.0.1");
    afficherEtat();
    // Hors ligne (fichier ouvert directement) : le jeu démarre comme avant ; « ?compte » dans l'adresse montre quand même l'écran du numéro
    if (C.disponible() || /[?&]compte\b/.test(q)) { C.demarrer(); }
    if (local && /[?&]tout\b/.test(q)) { J.entrerEssai(); montrerEcran(false); }          // raccourci local : « ?tout » ouvre le mode essai (jamais en ligne)
    majPastille();
  }
  if (doc.readyState === "loading") { doc.addEventListener("DOMContentLoaded", demarrage); } else { demarrage(); }
})(typeof window !== "undefined" ? window : this);
