// Musiques du Resto du Passé Simple — module autonome (aucune dépendance).
// Principe : on dépose des fichiers dans assets/musique/<id>.mp3 (ou .ogg). Au démarrage, le module teste lesquels
// existent. Une piste absente = rien ne se passe (le jeu garde ses sons synthétisés comme avant).
// Dès qu'une piste existe, elle joue en boucle avec fondu enchaîné, et le joueur peut la couper (touche O ou réglage).
(function () {
  "use strict";
  var DOSSIER = "assets/musique/";
  var EXT = [".mp3", ".ogg"];
  var CLE = "resto_musique_v1";

  // id → { boucle } ; « jingle » = jeu unique, court, par-dessus l'ambiance
  var PISTES = {
    accueil: { boucle: true }, carte: { boucle: true },
    salle_1: { boucle: true }, salle_2: { boucle: true }, salle_3: { boucle: true }, salle_4: { boucle: true },
    cuisine_1: { boucle: true }, cuisine_2: { boucle: true }, cuisine_3: { boucle: true }, cuisine_4: { boucle: true },
    toque_chef: { boucle: true },
    journal: { boucle: false }
  };

  var etat = { on: true, vol: 0.6 };
  try { var sv = JSON.parse(localStorage.getItem(CLE) || "null"); if (sv) { if (typeof sv.on === "boolean") etat.on = sv.on; if (typeof sv.vol === "number") etat.vol = Math.max(0, Math.min(1, sv.vol)); } } catch (e) { /* pas de stockage */ }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* ignoré */ } }

  var url = {};            // id → URL du fichier trouvé (absent = pas de musique)
  var courant = null;      // { id, el, vol } piste d'ambiance en cours
  var voulu = null;        // id demandé par le jeu
  var debloque = false;    // vrai après le premier geste du joueur (règle des navigateurs)
  var pausee = false;
  var fondus = [];

  // ---- détection : on tente de charger les métadonnées de chaque fichier
  function sonde(id, i) {
    if (i >= EXT.length) return;
    var a = new Audio(); a.preload = "metadata";
    var fini = false;
    a.addEventListener("loadedmetadata", function () { if (fini) return; fini = true; url[id] = DOSSIER + id + EXT[i]; if (voulu === id) demarrer(); });
    a.addEventListener("error", function () { if (fini) return; fini = true; sonde(id, i + 1); });
    a.src = DOSSIER + id + EXT[i];
  }
  function detecter() { for (var id in PISTES) sonde(id, 0); }

  // ---- volumes et fondus
  function volumeFinal(v) { return Math.max(0, Math.min(1, v * etat.vol)); }
  function fondu(el, de, vers, ms, fin) {
    var t0 = Date.now(), f = { el: el };
    f.h = setInterval(function () {
      var u = Math.min(1, (Date.now() - t0) / ms);
      try { el.volume = volumeFinal(de + (vers - de) * u); } catch (e) { /* ignoré */ }
      if (u >= 1) { clearInterval(f.h); if (fin) fin(); }
    }, 50);
  }
  function arreter(p) { if (!p) return; fondu(p.el, p.vol, 0, 900, function () { try { p.el.pause(); } catch (e) { /* ignoré */ } }); }

  function demarrer() {
    if (!debloque || pausee || !etat.on) return;
    if (!voulu || !url[voulu]) { if (courant) { arreter(courant); courant = null; } return; }
    if (courant && courant.id === voulu) { if (courant.el.paused) { try { courant.el.play(); } catch (e) { /* ignoré */ } } return; }
    var ancien = courant, el = new Audio(url[voulu]);
    el.loop = !!PISTES[voulu].boucle; el.volume = 0;
    var p = { id: voulu, el: el, vol: 1 };
    courant = p;
    var pr = el.play(); if (pr && pr.catch) pr.catch(function () { /* bloqué : on réessaiera au prochain geste */ });
    fondu(el, 0, 1, 1500);
    arreter(ancien);
  }

  // ---- API publique
  var API = {
    PISTES: PISTES,
    dispo: function (id) { return !!url[id]; },
    // piste d'ambiance à jouer (null = silence). Si le fichier n'existe pas : le jeu n'entend rien de neuf.
    jouer: function (id) { voulu = id || null; demarrer(); },
    // jingle court (ex. article de journal) : l'ambiance baisse puis remonte
    jingle: function (id) {
      if (!etat.on || !debloque || !url[id]) return false;
      var el = new Audio(url[id]); el.volume = volumeFinal(1);
      if (courant) fondu(courant.el, 1, 0.25, 300);
      var rendre = function () { if (courant) fondu(courant.el, 0.25, 1, 900); };
      el.addEventListener("ended", rendre); el.addEventListener("error", rendre);
      var pr = el.play(); if (pr && pr.catch) pr.catch(rendre);
      return true;
    },
    pause: function (b) { pausee = !!b; if (courant) { if (pausee) { try { courant.el.pause(); } catch (e) { /* ignoré */ } } else demarrer(); } },
    // y a-t-il au moins une piste réelle ? (le jeu coupe alors sa petite valse synthétisée)
    aDesPistes: function () { for (var id in url) return true; return false; },
    get actif() { return etat.on; },
    set actif(b) { etat.on = !!b; sauver(); if (!etat.on) { if (courant) { arreter(courant); courant = null; } } else demarrer(); },
    basculer: function () { API.actif = !etat.on; return etat.on; },
    get volume() { return etat.vol; },
    set volume(v) { etat.vol = Math.max(0, Math.min(1, v)); sauver(); if (courant) { try { courant.el.volume = volumeFinal(1); } catch (e) { /* ignoré */ } } },
    // aide : quelle piste pour quel écran ? (mode et vue du jeu, resto = 0 à 3)
    pourEcran: function (mode, vue, resto) {
      var n = Math.max(0, Math.min(3, resto || 0)) + 1;
      if (mode === "accueil" || mode === "title") return "accueil";
      if (mode === "carte" || mode === "atelier" || mode === "presse" || mode === "lecture" || mode === "franchises") return "carte";
      if (mode === "finale") return "toque_chef";
      if (mode === "play" || mode === "over") return vue === "cuisine" ? "cuisine_" + n : "salle_" + n;
      return null;
    }
  };

  function geste() {
    if (debloque) return; debloque = true;
    window.removeEventListener("pointerdown", geste, true); window.removeEventListener("keydown", geste, true);
    demarrer();
  }
  window.addEventListener("pointerdown", geste, true);
  window.addEventListener("keydown", geste, true);
  document.addEventListener("visibilitychange", function () { API.pause(document.hidden); });
  detecter();
  window.MUSIQUE = API;
})();
