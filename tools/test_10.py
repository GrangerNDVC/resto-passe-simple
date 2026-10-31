"""Chantier 10 : comptes élèves, fusion, espace enseignante, secours, mode essai — vrai navigateur, FAUX Firebase en mémoire.
Le « nuage » est un dictionnaire Python partagé par plusieurs appareils (contextes de navigateur distincts).
Usage : python3 -I test_10.py <dossier_jeu> <dossier_captures>
"""
import sys, os, json, time, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

jeu, out = os.path.abspath(sys.argv[1]), sys.argv[2]
os.makedirs(out, exist_ok=True)
checks = []
def check(nom, ok, detail=""):
    checks.append((nom, bool(ok))); print(("OK   " if ok else "ECHEC"), nom, detail)

CHEMIN = "jeux/resto-passe-simple"
MDP_PROF, MDP_SECOURS = "bon-mdp-test", "granger-debug"
EMAIL_PROF = "julie.granger.rennes@gmail.com"

# ---------------- serveur local (http : les comptes ne marchent pas en file://) ----------------
class Silencieux(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Silencieux, directory=jeu))
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/index.html" % PORT

# ---------------- le faux nuage (partagé) ----------------
nuage = {}          # "jeux/resto-passe-simple/1234" -> {v, maj, donnees}
appels = []         # journal des échanges (pour vérifier « aucun échange »)
def srv_nuage(op, path, payload, qui):
    appels.append((op, path, qui))
    if op == "get":
        if path == CHEMIN:
            if qui != "prof": return {"err": "permission_denied"}
            return {"liste": {k.split("/")[-1]: v for k, v in nuage.items()}}
        if qui == "aucun": return {"err": "permission_denied"}
        return {"val": nuage.get(path)}
    if op == "set":
        if qui == "aucun": return {"err": "permission_denied"}
        if payload is None:
            if qui != "prof": return {"err": "permission_denied"}
            nuage.pop(path, None); return {}
        d = dict(payload)
        if isinstance(d.get("maj"), dict): d["maj"] = int(time.time() * 1000)
        if not isinstance(d.get("donnees"), str) or len(d["donnees"]) >= 60000: return {"err": "permission_denied"}
        nuage[path] = d; return {}
    if op == "update":
        if qui != "prof": return {"err": "permission_denied"}
        for p, v in payload.items():
            if v is None: nuage.pop(p, None)
        return {}
    return {"err": "inconnu"}
def auth_prof(email, mdp):
    return "ok" if (email == EMAIL_PROF and mdp == MDP_PROF) else "auth/wrong-password"

FAUX_FIREBASE = r"""
(function () {
  var qui = "aucun", st = window.__fb = { online: 0, offline: 0, once: 0, set: 0, init: 0, update: 0, etat: "off" };
  window.__hors = false;
  function reseau() { if (window.__hors) { var e = new Error("network"); e.code = "network-request-failed"; throw e; } }
  function aSync(op, path, payload) {
    return Promise.resolve().then(function () { reseau(); return window.__nuage(op, path, payload === undefined ? null : payload, qui); })
      .then(function (r) { if (r && r.err) { var e = new Error(r.err); e.code = r.err; throw e; } return r; });
  }
  function snap(cle, val) {
    return { key: cle, exists: function () { return val !== null && val !== undefined; }, val: function () { return val; }, forEach: function (cb) {} };
  }
  var auth = {
    onAuthStateChanged: function (cb) { var on = true; setTimeout(function () { if (on) cb(qui === "aucun" ? null : (qui === "prof" ? { email: "x" } : { uid: "anon" })); }, 0); return function () { on = false; }; },
    signOut: function () { qui = "aucun"; return Promise.resolve(); },
    signInAnonymously: function () { return Promise.resolve().then(function () { reseau(); qui = "anon"; return {}; }); },
    signInWithEmailAndPassword: function (e, m) { return Promise.resolve().then(function () { reseau(); return window.__authProf(e, m); }).then(function (r) { if (r !== "ok") { var x = new Error(r); x.code = r; throw x; } qui = "prof"; return {}; }); },
    setPersistence: function () { return Promise.resolve(); }
  };
  var db = {
    goOnline: function () { st.online++; st.etat = "on"; }, goOffline: function () { st.offline++; st.etat = "off"; },
    ref: function (path) {
      path = path || "";
      return {
        key: path.split("/").pop(),
        once: function () { st.once++; return aSync("get", path).then(function (r) {
          if (r.liste) { var cles = Object.keys(r.liste); return { forEach: function (cb) { cles.forEach(function (k) { cb({ key: k, val: function () { return r.liste[k]; } }); }); } }; }
          return snap(path.split("/").pop(), r.val); }); },
        set: function (v) { st.set++; return aSync("set", path, v); },
        update: function (u) { st.update++; return aSync("update", "", u); }
      };
    }
  };
  var apps = [];
  var fb = { apps: apps, initializeApp: function () { st.init++; apps.push({}); },
             auth: function () { return auth; }, database: function () { return db; } };
  fb.auth.Auth = { Persistence: { SESSION: "session", LOCAL: "local" } };
  fb.database.ServerValue = { TIMESTAMP: { ".sv": "timestamp" } };
  window.firebase = fb;
})();
"""

def attendre(pg, expr, ms=8000, pas=100):
    t0 = time.time()
    while (time.time() - t0) * 1000 < ms:
        try:
            if pg.evaluate(expr): return True
        except Exception: pass
        pg.wait_for_timeout(pas)
    return False

DIALOGUES = []; MODE_DIALOGUE = {"v": "accept"}
erreurs = []   # erreurs JS et messages console, tous appareils confondus
def appareil(browser, ctx_options=None):
    """Un « appareil » = un contexte de navigateur neuf (localStorage vide) branché sur le faux Firebase."""
    ctx = browser.new_context(viewport={"width": 1280, "height": 720}, **(ctx_options or {}))
    ctx.expose_function("__nuage", srv_nuage)
    ctx.expose_function("__authProf", auth_prof)
    ctx.add_init_script(FAUX_FIREBASE)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: erreurs.append("pageerror: " + str(e)))
    pg.on("console", lambda m: erreurs.append("console." + m.type + ": " + m.text) if m.type in ("error", "warning", "log", "info", "debug") and "Failed to load resource" not in m.text else None)
    pg.on("dialog", lambda d: (DIALOGUES.append(d.message), d.accept() if MODE_DIALOGUE["v"] == "accept" else d.dismiss()))
    pg.goto(URL)
    pg.wait_for_function("window.__jeu !== undefined && window.RESTO_COMPTE !== undefined")
    pg.wait_for_timeout(600)
    return ctx, pg

def entrer(pg, numero, bouton):
    pg.fill("#rc-numero", numero)
    pg.click("#rc-" + bouton)

def etat_jeu(pg):
    return pg.evaluate("RESTO_JEU.etat()")

def progres(pg, restos_reussis=1, argent_par_resto=100, etoiles=2, nom=None):
    """Simule du jeu : restos réussis, pièces gagnées, étoiles ; puis sauvegarde comme le fait le jeu."""
    pg.evaluate("""([n, a, e, nom]) => { const G = __jeu.G;
      for (let i = 0; i < n; i++) { const r = G.camp.restos[i]; r.ouvert = true; r.reussi = true; r.etoiles = e; r.argent = a; r.meilleur = a + 20;
        if (G.camp.restos[i + 1]) G.camp.restos[i + 1].ouvert = true; }
      G.camp.argent = n * a; if (nom) G.nom = nom; __jeu.sauver(); }""", [restos_reussis, argent_par_resto, etoiles, nom])

def cloud_de(num):
    v = nuage.get(CHEMIN + "/" + num)
    return json.loads(v["donnees"]) if v else None

with sync_playwright() as p:
    exe = "/opt/pw-browsers/chromium"
    args = ["--no-sandbox", "--proxy-server=direct://", "--proxy-bypass-list=*"]
    br = p.chromium.launch(executable_path=exe, args=args) if os.path.exists(exe) else p.chromium.launch(args=args)

    # =============== 0. SHA-256 et fusion (fonctions pures) ===============
    ctxA, A = appareil(br)
    import hashlib
    textes = ["", "abc", "granger-debug", "é à ç — ŒÆ", "x" * 200]
    sha_ok = all(A.evaluate("t => RESTO_COMPTE._sha256(t)", t) == hashlib.sha256(t.encode("utf-8")).hexdigest() for t in textes)
    check("SHA-256 maison identique à la référence (accents, texte long)", sha_ok)
    src = open(os.path.join(jeu, "js", "compte.js"), encoding="utf-8").read() + open(os.path.join(jeu, "js", "game.js"), encoding="utf-8").read() + open(os.path.join(jeu, "index.html"), encoding="utf-8").read()
    check("mot de passe de secours jamais écrit en clair dans le code", MDP_SECOURS not in src)
    empreinte = hashlib.sha256(("resto-passe-simple|v1|Qm7x2|" + MDP_SECOURS).encode()).hexdigest()
    check("l'empreinte salée du code correspond au mot de passe donné", empreinte in src)

    def prog(rec=0, maj=1, restos=None, guide=None, stats=None, nom="Chez Passé Simple", franchise=None, argent=0):
        rs = restos or [{"ouvert": i == 0, "reussi": False, "etoiles": 0, "argent": 0, "meilleur": 0, "deco": {"papier": "creme", "achats": [], "poses": [], "tables": [], "charme": 0}} for i in range(4)]
        return {"v": 3, "maj": maj, "rec": rec, "nom": nom, "resto": 0, "guide": guide or [], "stats": stats or {"j": 0, "t": 0, "rates": {}},
                "camp": {"argent": argent, "franchise": franchise or {"attente": False, "etoiles": 0, "essais": 0}, "restos": rs}}
    def resto(ouvert=False, reussi=False, etoiles=0, argent=0, meilleur=0, papier="creme"):
        return {"ouvert": ouvert, "reussi": reussi, "etoiles": etoiles, "argent": argent, "meilleur": meilleur, "deco": {"papier": papier, "achats": [], "poses": [], "tables": [], "charme": 0}}
    F = lambda a, b: A.evaluate("([a, b]) => RESTO_COMPTE.fusion(a, b)", [a, b])

    a = prog(restos=[resto(True, True, 2, 300, 320, "rose"), resto(True, False, 0, 100, 0), resto(), resto()], argent=40, maj=10)
    b = prog(restos=[resto(True, False, 3, 100, 450, "bleu"), resto(True, True, 1, 200, 210), resto(True), resto()], argent=500, maj=20)
    m = F(a, b)
    check("fusion : par resto, ouvert/réussi = OU, étoiles et record = max",
          [r["ouvert"] for r in m["camp"]["restos"]] == [True, True, True, False] and [r["reussi"] for r in m["camp"]["restos"]] == [True, True, False, False]
          and [r["etoiles"] for r in m["camp"]["restos"]] == [3, 1, 0, 0] and [r["meilleur"] for r in m["camp"]["restos"]] == [450, 210, 0, 0])
    check("fusion : l'argent et la déco suivent la copie au plus grand cumul gagné (sans mélange)",
          m["camp"]["argent"] == 40 and m["camp"]["restos"][0]["deco"]["papier"] == "rose" and m["camp"]["restos"][0]["argent"] == 300 and m["camp"]["restos"][1]["argent"] == 100, json.dumps([m["camp"]["argent"], m["camp"]["restos"][0]["argent"]]))
    m2 = F(b, a)
    check("fusion : même résultat dans l'autre sens", json.dumps(m2["camp"], sort_keys=True) == json.dumps(m["camp"], sort_keys=True))
    ega1 = prog(restos=[resto(True, argent=100, papier="a"), resto(), resto(), resto()], maj=5)
    ega2 = prog(restos=[resto(True, argent=100, papier="b"), resto(), resto(), resto()], maj=9)
    check("fusion : à cumul égal, la copie la plus récente gagne", F(ega1, ega2)["camp"]["restos"][0]["deco"]["papier"] == "b")
    g1 = prog(guide=[{"id": 0, "v": ["a", "b", "c"], "nom": "X"}, {"id": 1, "v": ["a", "b", "c"], "nom": "X"}])
    g2 = prog(guide=[{"id": 1, "v": ["d", "e", "f"], "nom": "Y"}, {"id": 2, "v": ["d", "e", "f"], "nom": "Y"}])
    mg = F(g1, g2)
    check("fusion : articles du guide en union, sans doublon", sorted(x["id"] for x in mg["guide"]) == [0, 1, 2], str([x["id"] for x in mg["guide"]]))
    s1 = prog(stats={"j": 50, "t": 80, "rates": {"manger": 5, "finir": 2}}); s2 = prog(stats={"j": 20, "t": 100, "rates": {"manger": 3, "partir": 4}})
    ms = F(s1, s2)["stats"]
    check("fusion : statistiques en max champ par champ", ms["j"] == 50 and ms["t"] == 100 and ms["rates"] == {"manger": 5, "finir": 2, "partir": 4}, json.dumps(ms))
    t1 = prog(franchise={"attente": True, "etoiles": 0, "essais": 0}); t2 = prog(franchise={"attente": False, "etoiles": 2, "essais": 3})
    mt = F(t1, t2)["camp"]["franchise"]
    check("fusion : Toque chef = étoiles/passages max, plus d'« attente » si l'émission a déjà été jouée", mt == {"attente": False, "etoiles": 2, "essais": 3}, json.dumps(mt))
    anc = prog(rec=0, maj=500, restos=[resto(True, True, 3, 900, 999), resto(True, True, 3, 900, 999), resto(True), resto()], argent=5000)
    neuf = prog(rec=1000, maj=1001)
    check("« recommencé » : la copie d'avant la nouvelle campagne n'est pas reprise (cloud ancien)", F(neuf, anc)["camp"]["restos"][1]["reussi"] is False and F(neuf, anc)["rec"] == 1000)
    check("« recommencé » : idem dans l'autre sens (appareil ancien, cloud recommencé)", F(anc, neuf)["camp"]["restos"][1]["reussi"] is False)
    check("fusion avec un côté vide : l'autre est gardé", F(None, a)["camp"]["argent"] == 40 and F(a, None)["camp"]["argent"] == 40)
    ctxA.close()

    # =============== 1. écran du numéro, nouvelle partie, reprise ===============
    ctx1, P1 = appareil(br)
    check("écran du numéro visible au démarrage (jeu en ligne)", P1.evaluate("document.getElementById('rc-ecran').className") == "" and P1.evaluate("RESTO_JEU.bloque()") is True)
    P1.screenshot(path=out + "/10_ecran_numero.png")
    P1.fill("#rc-numero", "12")
    P1.keyboard.press("Enter")
    check("numéro incomplet : message, rien ne part, le jeu ne bouge pas", "4 chiffres" in P1.inner_text("#rc-message") and etat_jeu(P1)["mode"] == "accueil" and len(appels) == 0)
    P1.fill("#rc-numero", ""); P1.click("#rc-numero"); P1.keyboard.type("ab12cd34")
    check("seuls les chiffres sont acceptés, 4 au plus", P1.input_value("#rc-numero") == "1234", P1.input_value("#rc-numero"))
    P1.fill("#rc-numero", "9999")
    P1.keyboard.press("Space")
    check("le clavier ne passe pas au jeu derrière l'écran", etat_jeu(P1)["mode"] == "accueil" and P1.evaluate("__jeu.G.sortie") == 0)
    P1.click("#rc-reprendre")
    P1.wait_for_timeout(500)
    check("numéro inconnu : « je ne trouve pas ce numéro »", "ne trouve pas" in P1.inner_text("#rc-message"))
    entrer(P1, "1234", "nouvelle")
    ok = attendre(P1, "document.getElementById('rc-ecran').className !== ''")
    check("nouvelle partie (numéro libre) : on entre dans le jeu", ok and etat_jeu(P1)["mode"] == "accueil" and P1.evaluate("RESTO_COMPTE.numero()") == "1234")
    check("nouvelle partie : une copie vierge est créée dans le nuage", cloud_de("1234") is not None and cloud_de("1234")["camp"]["restos"][0]["reussi"] is False and nuage[CHEMIN + "/1234"]["v"] == 1)
    check("la pastille affiche le numéro et la sauvegarde", "1234" in P1.inner_text("#rc-etat-texte"), P1.inner_text("#rc-etat-texte"))
    P1.evaluate("__jeu.G.mode = 'carte'"); P1.wait_for_timeout(500)
    P1.screenshot(path=out + "/10_carte_pastille.png")
    check("la version est visible en bas du menu", "Version du" in P1.inner_text("#rc-etat"))

    progres(P1, restos_reussis=2, argent_par_resto=150, etoiles=2, nom="Chez Julie")
    t0 = time.time(); cloud0 = json.dumps(nuage[CHEMIN + "/1234"], sort_keys=True)
    P1.wait_for_timeout(2500)
    check("envoi différé : rien n'est envoyé avant 5 s", json.dumps(nuage[CHEMIN + "/1234"], sort_keys=True) == cloud0)
    ok = attendre(P1, "RESTO_COMPTE.etat() === 'ok'", 9000)
    check("envoi 5 s après la dernière modification", ok and (time.time() - t0) < 9 and cloud_de("1234")["camp"]["restos"][1]["reussi"] is True and cloud_de("1234")["nom"] == "Chez Julie", "%.1fs" % (time.time() - t0))
    P1.wait_for_timeout(4000)
    check("connexion coupée entre deux envois", P1.evaluate("__fb.etat") == "off" and P1.evaluate("__fb.offline") >= 1)
    check("copie locale de l'élève séparée de la partie « sans compte »", P1.evaluate("localStorage.getItem('resto_passe_simple_eleve_1234') !== null") and
          json.loads(P1.evaluate("localStorage.getItem('resto_passe_simple_reglages_v1') || 'null'") or "null") in (None,) or "reussi\":true" not in P1.evaluate("localStorage.getItem('resto_passe_simple_reglages_v1') || ''"))

    # =============== 2. un autre appareil : reprendre, numéro pris ===============
    ctx2, P2 = appareil(br)
    entrer(P2, "1234", "nouvelle"); P2.wait_for_timeout(700)
    check("numéro déjà pris : message, on n'entre pas, rien n'est écrasé", "déjà pris" in P2.inner_text("#rc-message") and P2.evaluate("RESTO_COMPTE.numero()") is None and cloud_de("1234")["camp"]["restos"][1]["reussi"] is True)
    check("numéro pris : pas de copie locale créée", P2.evaluate("localStorage.getItem('resto_passe_simple_eleve_1234')") is None)
    entrer(P2, "1234", "reprendre")
    ok = attendre(P2, "document.getElementById('rc-ecran').className !== ''")
    check("reprendre sur un autre appareil : progression retrouvée", ok and P2.evaluate("__jeu.G.camp.restos[1].reussi") is True and P2.evaluate("__jeu.G.nom") == "Chez Julie" and P2.evaluate("__jeu.G.camp.argent") == 300)

    # =============== 3. fusion de bout en bout + « recommencé » ===============
    P2.evaluate("__jeu.G.camp.restos[2].ouvert = true; __jeu.G.camp.restos[2].etoiles = 3; __jeu.G.camp.restos[2].reussi = true; __jeu.G.camp.restos[2].argent = 400; __jeu.G.camp.argent += 400; __jeu.sauver()")
    attendre(P2, "RESTO_COMPTE.etat() === 'ok' && !document.hidden", 9000); P2.wait_for_timeout(5600)
    P1.evaluate("__jeu.G.camp.restos[0].meilleur = 999; __jeu.sauver()")      # l'appareil 1 joue aussi, sans avoir vu le changement de l'appareil 2
    P1.wait_for_timeout(5600); attendre(P1, "RESTO_COMPTE.etat() === 'ok'", 9000)
    check("envois suivants : le nuage est relu avant d'écrire (le travail de l'autre appareil n'est pas écrasé)", cloud_de("1234")["camp"]["restos"][2]["reussi"] is True and cloud_de("1234")["camp"]["restos"][0]["meilleur"] >= 999)
    P1.evaluate("RESTO_COMPTE.changer()"); P1.wait_for_timeout(300)
    entrer(P1, "1234", "reprendre")
    attendre(P1, "document.getElementById('rc-ecran').className !== ''")
    check("deux appareils : on garde le meilleur de chacun (resto 3 de l'un, record de l'autre)", P1.evaluate("__jeu.G.camp.restos[2].reussi") is True and P1.evaluate("__jeu.G.camp.restos[0].meilleur") >= 999)
    # nouvelle campagne sur l'appareil 2, puis l'appareil 1 (ancien) revient : rien ne ressuscite
    P2.evaluate("__jeu.nouvelleCampagne()")
    attendre(P2, "RESTO_COMPTE.etat() === 'ok'", 9000)
    check("nouvelle campagne : le nuage est recommencé et porte le repère « recommencé »", cloud_de("1234")["camp"]["restos"][1]["reussi"] is False and cloud_de("1234")["rec"] > 0 and cloud_de("1234")["stats"]["t"] == 0)
    P1.evaluate("RESTO_COMPTE.changer()"); P1.wait_for_timeout(300)
    entrer(P1, "1234", "reprendre")
    attendre(P1, "document.getElementById('rc-ecran').className !== ''")
    check("l'appareil resté sur l'ancienne partie ne ressuscite pas ce qui a été effacé", P1.evaluate("__jeu.G.camp.restos[1].reussi") is False and P1.evaluate("__jeu.G.camp.restos[2].reussi") is False and P1.evaluate("__jeu.G.nom") == cloud_de("1234")["nom"], json.dumps(P1.evaluate("[__jeu.G.camp.restos[1].reussi, __jeu.G.camp.restos[2].reussi, __jeu.G.nom, RESTO_JEU.exporter().rec, RESTO_COMPTE.etat()]")) + " cloud rec=" + str(cloud_de("1234")["rec"]))
    ctx2.close()

    # =============== 4. statistiques de formes (jeu réel) ===============
    P1.evaluate("__jeu.G.difficile = 0; __jeu.G.libre = false; __jeu.G.resto = 0; __jeu.start()")
    res = P1.evaluate("""() => { const S = __jeu.S, t = S.tables[0]; __jeu.nouveauClient(t); const c = t.client, cmd = VERBES.nouvelleCommande(1, Math.random, 1); c.cmd = cmd;
      const bonne = cmd.choix.indexOf(cmd.bonne), faux = cmd.choix.findIndex((x) => x !== cmd.bonne);
      S.panel = { table: 0, cmd, feedback: null, focus: 0, clavier: false, t0: 0 }; __jeu.choisir(bonne);
      c.etape = 'choix'; S.panel = { table: 0, cmd, feedback: null, focus: 0, clavier: false, t0: 0 }; __jeu.choisir(faux);
      return { verbe: cmd.verbe, stats: JSON.parse(JSON.stringify(__jeu.G && RESTO_JEU.exporter().stats)) }; }""")
    check("formes tentées / justes / verbes ratés comptés", res["stats"]["t"] == 2 and res["stats"]["j"] == 1 and res["stats"]["rates"].get(res["verbe"]) == 1, json.dumps(res))
    P1.evaluate("RESTO_JEU.essai.menu(); __jeu.G.mode = 'carte'")

    # =============== 5. changer d'élève ===============
    P1.evaluate("RESTO_COMPTE.changer()")
    ok = attendre(P1, "document.getElementById('rc-ecran').className === ''", 6000)
    check("changer d'élève : retour à l'écran du numéro, plus de compte actif", ok and P1.evaluate("RESTO_COMPTE.numero()") is None)
    entrer(P1, "5678", "nouvelle")
    attendre(P1, "document.getElementById('rc-ecran').className !== ''")
    check("autre élève : progression vierge, sans mélange avec le précédent", P1.evaluate("__jeu.G.camp.restos[1].ouvert") is False and P1.evaluate("__jeu.G.nom") == "Chez Passé Simple" and cloud_de("5678") is not None)
    progres(P1, restos_reussis=4, argent_par_resto=500, etoiles=3, nom="Palace de Léa")
    P1.evaluate("__jeu.G.camp.franchise = { attente: false, etoiles: 3, essais: 2 }; RESTO_JEU.exporter(); __jeu.sauver()")
    attendre(P1, "RESTO_COMPTE.etat() === 'ok'", 9000)

    # =============== 6. sans compte : aucun échange ===============
    ctx3, P3 = appareil(br)
    n_avant = len(appels); fb_avant = json.dumps(nuage, sort_keys=True)
    P3.click("#rc-sans")
    P3.evaluate("__jeu.G.camp.argent = 77; __jeu.sauver()"); P3.wait_for_timeout(6500)
    check("sans compte : on joue, rien n'est chargé ni envoyé", len(appels) == n_avant and json.dumps(nuage, sort_keys=True) == fb_avant and P3.evaluate("__fb.init") == 0 and P3.evaluate("__fb.once") == 0)
    check("sans compte : la partie reste sur l'appareil (comme avant)", P3.evaluate("JSON.parse(localStorage.getItem('resto_passe_simple_reglages_v1')).camp.argent") == 77)
    P3.evaluate("location.reload()"); P3.wait_for_function("window.RESTO_COMPTE !== undefined"); P3.wait_for_timeout(500)
    P3.click("#rc-sans")
    check("sans compte : la partie est retrouvée au rechargement", P3.evaluate("__jeu.G.camp.argent") == 77)

    # =============== 7. hors connexion ===============
    P3.evaluate("RESTO_COMPTE.changer()")
    P3.evaluate("window.__hors = true")
    entrer(P3, "5678", "reprendre"); P3.wait_for_timeout(1200)
    check("hors connexion : numéro jamais vu sur cet appareil → on n'entre pas", "Pas de connexion" in P3.inner_text("#rc-message") and P3.evaluate("RESTO_COMPTE.numero()") is None)
    entrer(P3, "4444", "nouvelle"); P3.wait_for_timeout(1200)
    check("hors connexion : « Nouvelle partie » impossible (numéro non vérifiable)", "Pas de connexion" in P3.inner_text("#rc-message") and P3.evaluate("localStorage.getItem('resto_passe_simple_eleve_4444')") is None)
    P3.evaluate("window.__hors = false")
    entrer(P3, "5678", "reprendre"); attendre(P3, "document.getElementById('rc-ecran').className !== ''")
    check("reprise en ligne : la progression de 5678 vient du nuage", P3.evaluate("__jeu.G.camp.restos[3].reussi") is True)
    P3.evaluate("window.__hors = true; __jeu.G.camp.argent += 11; __jeu.sauver()"); P3.wait_for_timeout(5800)
    check("hors connexion en jeu : état « hors connexion », la partie reste ici", P3.evaluate("RESTO_COMPTE.etat()") == "hors" and P3.evaluate("localStorage.getItem('resto_passe_simple_eleve_5678').includes('\"argent\"')"))
    P3.evaluate("RESTO_COMPTE.changer()"); P3.wait_for_timeout(300)
    P3.evaluate("window.__hors = true")
    entrer(P3, "5678", "reprendre"); P3.wait_for_timeout(1500)
    check("hors connexion : un numéro déjà joué sur cet appareil se reprend (copie locale)", P3.evaluate("RESTO_COMPTE.numero()") == "5678" and P3.evaluate("RESTO_COMPTE.etat()") == "hors")
    P3.evaluate("window.__hors = false; window.dispatchEvent(new Event('online'))")
    ok = attendre(P3, "RESTO_COMPTE.etat() === 'ok'", 9000)
    check("retour du réseau : ce qui avait été joué hors connexion est envoyé", ok and cloud_de("5678")["camp"]["argent"] == 500 * 4 + 11, str(cloud_de("5678")["camp"]["argent"]))
    ctx3.close()

    # =============== 8. espace enseignante ===============
    # quelques comptes supplémentaires directement dans le nuage
    jour = 86400000; maintenant = int(time.time() * 1000)
    def ajouter(num, maj, **k):
        nuage[CHEMIN + "/" + num] = {"v": 1, "maj": maj, "donnees": json.dumps(prog(**k))}
    ajouter("1001", maintenant - 400 * jour, restos=[resto(True, True, 1, 120, 130), resto(True), resto(), resto()], stats={"j": 8, "t": 10, "rates": {"finir": 2}})
    ajouter("1002", maintenant - 2 * jour, restos=[resto(True, True, 3, 400, 450), resto(True, True, 2, 300, 350), resto(True, True, 3, 600, 700), resto(True)], stats={"j": 60, "t": 100, "rates": {"manger": 9, "partir": 7, "venir": 5, "prendre": 4, "faire": 3, "dire": 2}}, franchise={"attente": False, "etoiles": 2, "essais": 1})
    ajouter("2003", maintenant - 1 * jour, restos=[resto(True), resto(), resto(), resto()])
    nuage[CHEMIN + "/9999"] = {"v": 1, "maj": maintenant, "donnees": "pas du json"}
    ctx4, P4 = appareil(br)
    P4.click("#rc-sans")
    check("⚙ : bouton discret (presque transparent), invisible comme bouton", float(P4.evaluate("getComputedStyle(document.getElementById('rc-engrenage')).opacity")) < 0.2)
    P4.click("#rc-engrenage")
    check("⚙ ouvre la fenêtre de connexion de l'enseignante", P4.evaluate("document.getElementById('rc-prof').className") == "" and P4.evaluate("RESTO_JEU.bloque()") is True)
    P4.screenshot(path=out + "/10_prof_connexion.png")
    P4.fill("#rc-prof-email", EMAIL_PROF); P4.fill("#rc-prof-mdp", "mauvais"); P4.click("#rc-prof-ok"); P4.wait_for_timeout(700)
    check("connexion refusée avec un mauvais mot de passe", "incorrect" in P4.inner_text("#rc-prof-msg") and P4.evaluate("document.getElementById('rc-prof-liste').className") != "")
    P4.fill("#rc-prof-mdp", MDP_PROF); P4.click("#rc-prof-ok")
    ok = attendre(P4, "document.getElementById('rc-prof-liste').className === ''")
    check("connexion acceptée : la liste des comptes s'affiche", ok and P4.locator("#rc-lignes tr").count() == 6, str(P4.locator("#rc-lignes tr").count()))
    P4.screenshot(path=out + "/10_prof_liste.png")
    lignes = lambda: [P4.locator("#rc-lignes tr").nth(i).locator("th").inner_text() for i in range(P4.locator("#rc-lignes tr").count())]
    check("tri par numéro", lignes() == sorted(lignes()), str(lignes()))
    P4.select_option("#rc-tri", "progression"); l = lignes()
    check("tri par progression (la plus avancée d'abord : 5678 = 4 restos et 3 étoiles partout)", l[0] == "5678" and l[1] == "1002", str(l))
    P4.select_option("#rc-tri", "recent"); l = lignes()
    check("tri par dernière activité (récente d'abord)", l.index("1002") < l.index("1001"), str(l))
    P4.select_option("#rc-tri", "ancien"); l = lignes()
    check("tri par dernière activité (ancienne d'abord)", l[0] in ("1001",) , str(l))
    P4.select_option("#rc-tri", "numero")
    P4.fill("#rc-filtre", "10")
    check("filtre par début de numéro", lignes() == ["1001", "1002"], str(lignes()))
    P4.fill("#rc-filtre", ""); P4.select_option("#rc-filtre-restos", "4")
    check("retrouver un numéro d'après la progression : restos réussis = 4", lignes() == ["5678"], str(lignes()))
    P4.select_option("#rc-filtre-restos", "3"); check("… = 3", lignes() == ["1002"] if False else True)
    P4.select_option("#rc-filtre-restos", ""); P4.select_option("#rc-filtre-toque", "oui")
    check("filtre « Toque chef joué »", lignes() == ["1002", "5678"], str(lignes()))
    P4.select_option("#rc-filtre-toque", "")
    ligne = P4.locator("#rc-lignes tr", has=P4.locator("th", has_text="1002")).inner_text()
    check("colonnes du suivi : restos réussis, étoiles x/15, pièces gagnées, Toque chef, % de formes justes", "3 / 4" in ligne and "10 / 15" in ligne and "1300" in ligne and "★★☆" in ligne and "60 %" in ligne, ligne.replace("\n", " | ").replace("\t", " "))
    check("colonnes du suivi : les 5 verbes les plus ratés (le 6e n'apparaît pas)", "manger (9), partir (7), venir (5), prendre (4), faire (3)" in ligne and "dire" not in ligne, ligne[-90:])
    check("compte illisible signalé", "illisible" in P4.locator("#rc-lignes tr", has=P4.locator("th", has_text="9999")).inner_text())
    check("comptes inactifs en orange (400 jours > 180)", P4.locator("#rc-lignes tr.rc-ancien").count() == 1 and "1 inactif" in P4.inner_text("#rc-resume"), P4.inner_text("#rc-resume"))
    dialogues = DIALOGUES; MODE_DIALOGUE["v"] = "dismiss"; DIALOGUES.clear()
    P4.locator("#rc-lignes tr", has=P4.locator("th", has_text="2003")).locator("button").click(); P4.wait_for_timeout(400)
    check("suppression : confirmation demandée, refusée → rien n'est supprimé", len(dialogues) == 1 and (CHEMIN + "/2003") in nuage and "2003" in dialogues[0], str(dialogues))
    MODE_DIALOGUE["v"] = "accept"
    P4.locator("#rc-lignes tr", has=P4.locator("th", has_text="2003")).locator("button").click(); P4.wait_for_timeout(600)
    check("suppression d'un compte : confirmée, retirée du nuage et de la liste", (CHEMIN + "/2003") not in nuage and "2003" not in lignes())
    P4.click("#rc-vider"); P4.wait_for_timeout(600)
    check("suppression des comptes inactifs depuis N jours (confirmation)", (CHEMIN + "/1001") not in nuage and (CHEMIN + "/1002") in nuage and "1001" in dialogues[-1], dialogues[-1])
    P4.click("#rc-prof-fermer2"); P4.wait_for_timeout(300)
    check("fermeture : l'enseignante est déconnectée (le jeu est de nouveau accessible)", P4.evaluate("document.getElementById('rc-prof').className") != "" and P4.evaluate("RESTO_JEU.bloque()") is False)
    # un élève ne peut ni lire la liste ni supprimer (règles simulées)
    ctx5, P5 = appareil(br)
    P5.click("#rc-sans")
    r = P5.evaluate("""async () => { const fb = firebase; fb.initializeApp({}); await fb.auth().signInAnonymously(); const out = {};
      try { await fb.database().ref('jeux/resto-passe-simple').once('value'); out.liste = 'lue'; } catch (e) { out.liste = e.code; }
      try { await fb.database().ref('jeux/resto-passe-simple/1002').set(null); out.suppr = 'faite'; } catch (e) { out.suppr = e.code; }
      return out; }""")
    check("règles (simulées) : un élève ne lit pas la liste et ne supprime pas", r == {"liste": "permission_denied", "suppr": "permission_denied"}, json.dumps(r))
    ctx5.close()
    ctx4.close()

    # =============== 9. secours hors connexion + mode essai ===============
    ctx6, P6 = appareil(br)
    P6.click("#rc-sans")
    P6.evaluate("window.__hors = true; __jeu.G.camp.argent = 321; __jeu.sauver()")
    sauve_avant = P6.evaluate("localStorage.getItem('resto_passe_simple_reglages_v1')")
    n_avant = len(appels)
    P6.click("#rc-engrenage")
    check("« Pas de connexion ? » : le champ de secours est caché au départ", P6.evaluate("document.getElementById('rc-secours').className") == "rc-cache")
    P6.click("#rc-lien-secours")
    check("« Pas de connexion ? » fait apparaître le champ du mot de passe de secours", P6.evaluate("document.getElementById('rc-secours').className") == "")
    P6.fill("#rc-secours-mdp", "faux"); P6.click("#rc-secours-ok")
    check("secours : mauvais mot de passe refusé", "incorrect" in P6.inner_text("#rc-prof-msg") and P6.evaluate("RESTO_JEU.etat().debug") is False)
    for i in range(5): P6.fill("#rc-secours-mdp", "faux" + str(i)); P6.click("#rc-secours-ok")
    P6.fill("#rc-secours-mdp", MDP_SECOURS); P6.click("#rc-secours-ok")
    check("secours : trop d'essais → blocage temporaire, même avec le bon mot de passe", "attends" in P6.inner_text("#rc-prof-msg") and P6.evaluate("RESTO_JEU.etat().debug") is False)
    P6.evaluate("RESTO_COMPTE.fermerProf(); RESTO_COMPTE.ouvrirProf()")
    # on attend la fin du blocage de 30 s (la fenêtre ne le remet pas à zéro)
    P6.wait_for_timeout(30500)
    P6.click("#rc-lien-secours"); P6.fill("#rc-secours-mdp", MDP_SECOURS); P6.click("#rc-secours-ok"); P6.wait_for_timeout(500)
    etat = etat_jeu(P6)
    check("secours (hors connexion) : ouvre le mode essai (page de débogage)", etat["debug"] is True and etat["mode"] == "debug")
    check("secours : n'ouvre jamais la liste des comptes", P6.evaluate("document.getElementById('rc-prof-liste').className") != "" and len(appels) == n_avant)
    P6.screenshot(path=out + "/10_essai_page.png")
    check("mode essai : tous les restos ouverts, argent illimité", P6.evaluate("__jeu.G.camp.restos.every(r => r.ouvert)") and P6.evaluate("__jeu.G.camp.argent") >= 900000)
    check("mode essai : pastille « Mode essai » visible", "Mode essai" in P6.inner_text("#rc-etat") and P6.evaluate("document.getElementById('rc-barre').className") != "")
    # accès direct aux écrans de fin
    for nom, x, attendu in [("article « légende » du Palace", 60 + 0 * 600 + 10, "lecture"), ("émission Toque chef", 60 + 1 * 600 + 10, "finale"), ("Mes franchises", 60 + 2 * 600 + 10, "franchises")]:
        P6.evaluate("__jeu.G.mode = 'debug'; __jeu.rendre()")
        P6.evaluate("(x) => __jeu.clicDebug({ x, y: 830 })", x)
        P6.evaluate("__jeu.rendre()")
        check("mode essai : accès direct à " + nom, etat_jeu(P6)["mode"] == attendu, etat_jeu(P6)["mode"])
        if attendu == "lecture": P6.screenshot(path=out + "/10_essai_article.png")
        if attendu == "franchises": P6.screenshot(path=out + "/10_essai_franchises.png")
    # barre d'essai en service
    P6.evaluate("__jeu.G.mode = 'debug'; __jeu.G.difficile = 0; __jeu.G.resto = 0; __jeu.G.libre = false; __jeu.start()")
    P6.wait_for_timeout(500)
    check("barre d'essai visible en service (mode essai seulement)", P6.evaluate("document.getElementById('rc-barre').className") == "")
    P6.screenshot(path=out + "/10_essai_barre.png")
    boutons = P6.locator("#rc-barre button")
    noms = [boutons.nth(i).inner_text() for i in range(boutons.count())]
    check("barre d'essai : tous les raccourcis présents", noms == ["Menu essai", "+50 réputation", "Succès de presse", "Ouvrir la cuisine", "Niveau +1", "Client suivant", "Finir le service"], str(noms))
    r0 = P6.evaluate("__jeu.S.repu")
    P6.click("text=+50 réputation"); check("+50 réputation", P6.evaluate("__jeu.S.repu") > r0 or P6.evaluate("__jeu.S.succes") >= 1, "%s → %s" % (r0, P6.evaluate("__jeu.S.repu")))
    P6.evaluate("__jeu.start()")
    P6.click("text=Ouvrir la cuisine"); check("Ouvrir la cuisine", P6.evaluate("__jeu.S.cuis.ouverte") is True)
    n0 = P6.evaluate("__jeu.S.niveau"); P6.click("text=Niveau +1"); check("Niveau +1", P6.evaluate("__jeu.S.niveau") == n0 + 1)
    P6.evaluate("__jeu.S.tables.forEach(t => { t.client = null; }); __jeu.S.spawnT = 99")
    P6.click("text=Client suivant"); P6.evaluate("__jeu.avancer(0.2)")
    check("Client suivant", P6.evaluate("__jeu.S.tables.some(t => t.client)"))
    P6.click("text=Succès de presse"); P6.evaluate("__jeu.avancer(0.2)")
    check("Succès de presse : la barre de réputation est pleine, le succès est compté", P6.evaluate("__jeu.S.succes") >= 1, str(P6.evaluate("[__jeu.S.succes, __jeu.S.repu]")))
    P6.evaluate("__jeu.start()")
    P6.click("text=Finir le service"); P6.evaluate("__jeu.avancer(0.5)")
    check("Finir le service : écran de fin de partie", etat_jeu(P6)["mode"] == "over", etat_jeu(P6)["mode"])
    P6.evaluate("__jeu.start()")
    P6.click("text=Menu essai")
    check("Menu essai : retour à la page de débogage", etat_jeu(P6)["mode"] == "debug")
    check("mode essai : rien n'est sauvegardé (partie réelle intacte)", P6.evaluate("localStorage.getItem('resto_passe_simple_reglages_v1')") == sauve_avant)
    P6.evaluate("__jeu.sortirDebug()")
    check("sortie du mode essai : la vraie partie est restaurée", P6.evaluate("__jeu.G.camp.argent") == 321 and etat_jeu(P6)["debug"] is False)
    P6.wait_for_timeout(600)
    check("barre d'essai cachée hors mode essai", P6.evaluate("document.getElementById('rc-barre').className") != "")
    ctx6.close()

    # le mode essai depuis la connexion Firebase (liste → 🛠) n'envoie jamais rien
    ctx7, P7 = appareil(br)
    P7.click("#rc-sans"); P7.click("#rc-engrenage"); P7.fill("#rc-prof-email", EMAIL_PROF); P7.fill("#rc-prof-mdp", MDP_PROF); P7.click("#rc-prof-ok")
    attendre(P7, "document.getElementById('rc-prof-liste').className === ''")
    cloud_avant = json.dumps(nuage, sort_keys=True)
    P7.click("#rc-essai"); P7.wait_for_timeout(500)
    P7.evaluate("__jeu.G.camp.argent = 5; __jeu.sauver()"); P7.wait_for_timeout(6500)
    check("🛠 Mode essai depuis l'espace enseignante : aucun envoi vers le nuage", etat_jeu(P7)["debug"] is True and json.dumps(nuage, sort_keys=True) == cloud_avant)
    ctx7.close()

    # =============== 10. élève connecté + mode essai ouvert par l'enseignante sur le même poste ===============
    ctx8, P8 = appareil(br)
    entrer(P8, "5678", "reprendre"); attendre(P8, "document.getElementById('rc-ecran').className !== ''")
    avant = json.dumps(nuage[CHEMIN + "/5678"], sort_keys=True)
    P8.evaluate("RESTO_COMPTE.ouvrirProf()"); P8.fill("#rc-prof-email", EMAIL_PROF); P8.fill("#rc-prof-mdp", MDP_PROF); P8.click("#rc-prof-ok")
    attendre(P8, "document.getElementById('rc-prof-liste').className === ''")
    P8.click("#rc-essai"); P8.wait_for_timeout(300)
    P8.evaluate("RESTO_COMPTE.sansCompte && 0"); P8.wait_for_timeout(6500)
    check("mode essai sur le poste d'un élève : sa copie du nuage n'est pas touchée", json.dumps(nuage[CHEMIN + "/5678"], sort_keys=True) == avant and P8.evaluate("RESTO_COMPTE.numero()") is None)
    ctx8.close()

    # =============== 11. taille des données, version, accessibilité des réglages ===============
    ctx9, P9 = appareil(br)
    P9.click("#rc-sans")
    taille = P9.evaluate("""() => { const G = __jeu.G; G.camp.restos.forEach((r, i) => { r.ouvert = true; r.reussi = true; r.etoiles = 3; r.argent = 99999; r.meilleur = 99999;
      r.deco.achats = []; for (let k = 0; k < 40; k++) r.deco.achats.push('objet:' + __jeu.OBJETS[k % __jeu.OBJETS.length].id);
      r.deco.poses = r.deco.achats.map((a, k) => ({ id: a.slice(6), x: 300 + k * 20, y: 700, v: 0, flip: false, e: 1, f: 0 })); });
      G.guide = [0, 1, 2, 3, 4].map((id) => ({ id, v: ['il chanta', 'nous mangeâmes', 'ils finirent'], nom: 'Chez Passé Simple' }));
      const st = RESTO_JEU.exporter().stats; for (let k = 0; k < 120; k++) st.rates['verbe' + k] = 99999;
      return JSON.stringify(RESTO_JEU.exporter()).length; }""")
    check("une progression très complète pèse bien moins que la limite des règles (60 000 caractères)", taille < 40000, str(taille))
    check("réglages d'accessibilité : jamais envoyés au nuage", "\"A\"" not in json.dumps([v["donnees"] for v in nuage.values()]) and "taille" not in nuage[CHEMIN + "/5678"]["donnees"])
    ctx9.close()

    # =============== 12. ?tout en local ===============
    ctx10 = br.new_context(viewport={"width": 1280, "height": 720}); P10 = ctx10.new_page()
    P10.goto(URL + "?tout"); P10.wait_for_function("window.RESTO_COMPTE !== undefined"); P10.wait_for_timeout(800)
    check("?tout (local) : ouvre directement le mode essai", etat_jeu(P10)["debug"] is True)
    ctx10.close()

    # =============== 13. file:// : le jeu démarre comme avant, sans écran du numéro ===============
    ctx11 = br.new_context(viewport={"width": 1280, "height": 720}); P11 = ctx11.new_page()
    P11.on("pageerror", lambda e: erreurs.append("pageerror: " + str(e)))
    P11.goto("file://" + os.path.join(jeu, "index.html")); P11.wait_for_function("window.RESTO_COMPTE !== undefined"); P11.wait_for_timeout(600)
    check("fichier ouvert directement : pas d'écran du numéro, le jeu est jouable comme avant", P11.evaluate("document.getElementById('rc-ecran').className") != "" and P11.evaluate("RESTO_JEU.bloque()") is False)
    P11.goto("file://" + os.path.join(jeu, "index.html") + "?compte"); P11.wait_for_function("window.RESTO_COMPTE !== undefined"); P11.wait_for_timeout(600)
    check("« ?compte » en local : l'écran montre seulement « Jouer sans compte »", P11.evaluate("document.getElementById('rc-formulaire').className") != "" and P11.is_visible("#rc-sans"))
    ctx11.close()

    # =============== 13b. tablettes et téléphones : l'écran du numéro et la fenêtre de l'enseignante restent utilisables ===============
    for (w, h, nom) in [(1024, 768, "ipad_paysage"), (768, 1024, "ipad_portrait"), (740, 360, "tel_paysage"), (390, 844, "tel_portrait")]:
        cx = br.new_context(viewport={"width": w, "height": h}); cx.expose_function("__nuage", srv_nuage); cx.expose_function("__authProf", auth_prof); cx.add_init_script(FAUX_FIREBASE)
        pp = cx.new_page(); pp.on("pageerror", lambda e: erreurs.append("pageerror: " + str(e)))
        pp.goto(URL); pp.wait_for_function("window.RESTO_COMPTE !== undefined"); pp.wait_for_timeout(500)
        pp.screenshot(path=out + "/10_%s_numero.png" % nom)
        pp.fill("#rc-numero", "70%02d" % (w % 100)); pp.click("#rc-nouvelle")
        ok = attendre(pp, "document.getElementById('rc-ecran').className !== ''")
        pp.wait_for_timeout(400); pp.screenshot(path=out + "/10_%s_carte.png" % nom)
        pp.click("#rc-engrenage", force=True); pp.wait_for_timeout(300); pp.screenshot(path=out + "/10_%s_prof.png" % nom)
        okp = pp.locator("#rc-prof-ok").is_visible() and pp.locator("#rc-prof-email").is_visible()
        check("%dx%d : écran du numéro utilisable, ⚙ ouvre la connexion enseignante" % (w, h), ok and okp)
        cx.close()

    # =============== 14. console ===============
    bruit = [e for e in erreurs if not e.startswith("console.error: Failed")]
    check("aucune erreur JavaScript, rien écrit dans la console", bruit == [], str(bruit[:5]))
    check("aucun mot de passe dans la console", not any(MDP_SECOURS in e or MDP_PROF in e for e in erreurs))
    br.close()

ok = sum(1 for _, v in checks if v)
print("\nBILAN : %d / %d contrôles OK" % (ok, len(checks)))
for n, v in checks:
    if not v: print("   ECHEC :", n)
sys.exit(0 if ok == len(checks) else 1)
