"""Parcours automatique du jeu dans Chromium : captures + erreurs console + vérifications du chantier 2.
Usage : python3 -I test_jeu.py <dossier_jeu> <dossier_captures>
"""
import sys, os, json
from playwright.sync_api import sync_playwright

jeu, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
errors, checks = [], []

def check(nom, ok, detail=""):
    checks.append((nom, bool(ok)))
    print(("OK   " if ok else "ECHEC"), nom, detail)

with sync_playwright() as p:
    exe = "/opt/pw-browsers/chromium"
    b = p.chromium.launch(executable_path=exe, args=["--no-sandbox","--disable-background-networking","--disable-sync","--no-first-run","--proxy-server=direct://","--proxy-bypass-list=*"]) if os.path.exists(exe) else p.chromium.launch(args=["--no-sandbox","--disable-background-networking","--disable-sync","--no-first-run","--proxy-server=direct://","--proxy-bypass-list=*"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errors.append("console." + m.type + ": " + m.text) if m.type in ("error", "warning") else None)
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html")
    pg.wait_for_function("window.__jeu !== undefined")
    pg.wait_for_timeout(1200)
    pg.screenshot(path=out + "/01_titre.png")

    pg.evaluate("__jeu.G.cuisine = 0")          # ce parcours teste la salle seule (la cuisine a son propre test : test_cuisine.py)
    pg.evaluate("__jeu.start()")
    pg.evaluate("__jeu.avancer(2.0)")

    # --- 1. une erreur : message = bonne forme + règle, JAMAIS la forme fautive
    info = pg.evaluate("__jeu.S.tables.filter(t=>t.client && t.client.state==='call').map(t=>t.i)")
    check("un client appelle", len(info) > 0, str(info))
    i = info[0]
    x = pg.evaluate(f"__jeu.S.tables[{i}].x")
    pg.evaluate(f"__jeu.clic({{x:{x}, y:600}})")
    pg.evaluate("__jeu.avancer(3.0)")
    check("panneau ouvert", pg.evaluate("!!__jeu.S.panel"))
    cmd = pg.evaluate("__jeu.S.panel.cmd")
    check("4 choix distincts", len(cmd["choix"]) == 4 and len(set(cmd["choix"])) == 4, str(cmd["choix"]))
    bad = [k for k, f in enumerate(cmd["choix"]) if f != cmd["bonne"]][0]
    faute = cmd["choix"][bad]
    pg.evaluate(f"__jeu.choisir({bad})")
    pg.evaluate("__jeu.avancer(0.5)")
    msgs = pg.evaluate("__jeu.S.msgs.map(m=>[m.texte,m.sous,m.note].join(' | '))")
    txt = " || ".join(msgs)
    print("   message d'erreur :", txt)
    check("message : bonne forme affichée", cmd["bonne"] in txt)
    check("message : règle de terminaison affichée", cmd["regle"]["terminaison"] in txt)
    check("message : forme fautive NON réaffichée", faute not in txt.replace(cmd["bonne"], ""), "faute=" + faute)
    pg.screenshot(path=out + "/02_erreur.png")

    # --- 2. nouvelle tentative : mêmes verbe/personne, bonne forme présente, 4 choix distincts
    pg.evaluate("__jeu.avancer(2.5)")
    pg.evaluate(f"__jeu.clic({{x:{x}, y:600}})")
    pg.evaluate("__jeu.avancer(3.0)")
    cmd2 = pg.evaluate("__jeu.S.panel.cmd")
    check("nouvelle tentative : même verbe et même bonne forme", cmd2["verbe"] == cmd["verbe"] and cmd2["bonne"] == cmd["bonne"])
    check("nouvelle tentative : 4 choix distincts avec la bonne forme", len(set(cmd2["choix"])) == 4 and cmd2["bonne"] in cmd2["choix"])
    good = cmd2["choix"].index(cmd2["bonne"])
    pg.evaluate(f"__jeu.choisir({good})")
    pg.evaluate("__jeu.avancer(3.3)")
    check("plat porté", pg.evaluate("!!__jeu.S.serveur.carry"))
    pg.evaluate(f"__jeu.clic({{x:{x}, y:600}})")
    pg.evaluate("__jeu.avancer(3.0)")
    check("client servi", pg.evaluate("__jeu.S.servis") >= 1, "score=" + str(pg.evaluate("__jeu.S.score")))

    # --- 2b. marche au clavier : flèches + Espace (sans souris)
    pg.evaluate("__jeu.G.chrono='sans'; __jeu.start(); __jeu.avancer(2.0)")
    pg.evaluate("__jeu.S.serveur.x = 200")
    pg.keyboard.down("ArrowRight"); pg.evaluate("__jeu.avancer(0.5)"); pg.keyboard.up("ArrowRight")
    x1 = pg.evaluate("__jeu.S.serveur.x")
    check("flèche droite : le serveur avance", x1 > 450, "x=%.0f" % x1)
    pg.keyboard.down("ArrowLeft"); pg.evaluate("__jeu.avancer(0.3)"); pg.keyboard.up("ArrowLeft")
    check("flèche gauche : le serveur recule", pg.evaluate("__jeu.S.serveur.x") < x1)
    pg.evaluate("__jeu.avancer(0.2)")
    xs = pg.evaluate("__jeu.S.serveur.x"); pg.evaluate("__jeu.avancer(0.5)")
    check("sans touche : le serveur s'arrête", abs(pg.evaluate("__jeu.S.serveur.x") - xs) < 1)
    pg.keyboard.down("ArrowRight"); pg.evaluate("__jeu.avancer(5)"); pg.keyboard.up("ArrowRight")
    check("le serveur ne sort pas de la salle", pg.evaluate("__jeu.S.serveur.x") <= 1830)
    t = pg.evaluate("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
    if t < 0:
        pg.evaluate("__jeu.avancer(8)"); t = pg.evaluate("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
    xt = pg.evaluate("__jeu.S.tables[%d].x" % t)
    pg.evaluate("__jeu.S.serveur.x = %d" % (xt + 40))
    pg.keyboard.press("Space"); pg.evaluate("__jeu.avancer(0.3)")
    check("Espace devant un client qui appelle : le panneau s'ouvre", pg.evaluate("!!__jeu.S.panel") and pg.evaluate("__jeu.S.panel.table") == t)
    pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/16_clavier_panneau.png")
    cc = pg.evaluate("__jeu.S.panel.cmd"); pg.keyboard.press(str(cc["choix"].index(cc["bonne"]) + 1))
    pg.evaluate("__jeu.avancer(4)")
    check("le plat est pris automatiquement au passe-plats", pg.evaluate("!!__jeu.S.serveur.carry"))
    pg.keyboard.down("ArrowRight"); pg.evaluate("__jeu.avancer(0.2)"); pg.keyboard.up("ArrowRight")     # le joueur marche : on peut reprendre la main
    pg.evaluate("__jeu.S.serveur.x = %d; __jeu.S.serveur.y = 880" % (xt - 30)); pg.evaluate("__jeu.avancer(0.2)")
    pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/17_clavier_servir.png")
    s0 = pg.evaluate("__jeu.S.servis")
    pg.keyboard.press("Space"); pg.evaluate("__jeu.avancer(1.0)")
    check("Espace devant la bonne table avec le plat : client servi", pg.evaluate("__jeu.S.servis") == s0 + 1)
    pg.evaluate("__jeu.S.serveur.x = 1500"); pg.keyboard.press("Space")
    check("Espace loin de toute table : un message d'aide, rien ne plante", pg.evaluate("__jeu.G.mode") == "play")

    # --- 3. les 5 niveaux : un joueur parfait enchaîne, le jeu ne plante pas, chaque niveau propose des verbes de son niveau
    vus = {}
    pg.evaluate("__jeu.G.chrono='sans'")
    def servir_tout(duree):
        for _ in range(int(duree / 0.5)):
            pg.evaluate("""() => {
              const J = __jeu, S = J.S; if (!S || J.G.mode !== 'play') return;
              if (S.panel) { const c = S.panel.cmd; J.choisir(c.choix.indexOf(c.bonne)); return; }
              const sv = S.serveur; if (sv.task || sv.path.length || sv.poseT > 0) return;
              if (sv.carry) { J.clic({x: S.tables[sv.carry.table].x, y: 600}); return; }
              const t = S.tables.find(t => t.client && t.client.state === 'call');
              if (t) J.clic({x: t.x, y: 600});
            }""")
            pg.evaluate("__jeu.avancer(0.5)")
            niv = pg.evaluate("__jeu.S.niveau")
            for c in pg.evaluate("__jeu.S.tickets.map(t=>t.cmd.verbe)"):
                vus.setdefault(niv, set()).add(c)
    seen_niv = set()
    for k in range(12):
        servir_tout(60)
        seen_niv.add(pg.evaluate("__jeu.S.niveau"))
        if pg.evaluate("__jeu.S.niveau") >= 5: break
    niv = pg.evaluate("__jeu.S.niveau")
    check("le jeu atteint le niveau 5", niv >= 5, "niveau=%s servis=%s vies=%s mode=%s" % (niv, pg.evaluate("__jeu.S.servis"), pg.evaluate("__jeu.S.vies"), pg.evaluate("__jeu.G.mode")))
    pg.screenshot(path=out + "/03_niveau5.png")
    hud = pg.evaluate("__jeu.S.niveau")
    # un ticket du niveau courant ne doit jamais contenir un verbe d'un niveau supérieur
    niveaux = pg.evaluate("Object.fromEntries(VERBES.VERBES.map(v=>[v.inf, v.niveau]))")
    trop = [(n, v) for n, vs in vus.items() for v in vs if niveaux[v] > n]
    check("aucun verbe d'un niveau supérieur au niveau en cours", not trop, str(trop[:3]))
    tous = set().union(*vus.values()) if vus else set()
    print("   verbes vus sur les tickets pendant le parcours :", len(tous))

    # --- 4. joueur absent : fin de partie propre + écran de bilan avec les règles
    pg.evaluate("__jeu.G.chrono='normal'")
    pg.evaluate("__jeu.start()")
    pg.evaluate("__jeu.avancer(2.0)")
    t = pg.evaluate("__jeu.S.tables.find(t=>t.client && t.client.state==='call').i")
    xx = pg.evaluate(f"__jeu.S.tables[{t}].x")
    pg.evaluate(f"__jeu.clic({{x:{xx}, y:600}})")
    pg.evaluate("__jeu.avancer(3.0)")
    c = pg.evaluate("__jeu.S.panel.cmd")
    pg.evaluate(f"__jeu.choisir({[k for k, f in enumerate(c['choix']) if f != c['bonne']][0]})")
    pg.evaluate("__jeu.avancer(400)")
    check("joueur absent : fin de partie", pg.evaluate("__jeu.G.mode") == "over")
    pg.screenshot(path=out + "/04_bilan.png")

    # --- 5. mode séance : choix de la durée à l'écran titre, pas de cœurs, fin au bout du temps, bilan
    pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.duree = 0; __jeu.rendre()")
    pg.screenshot(path=out + "/05_titre_seance.png")
    pg.evaluate("__jeu.clic({x: 960 - 520 + 270 + 125, y: 700})")      # bouton « Séance 3 min »
    check("titre : clic sur « Séance 3 min »", pg.evaluate("__jeu.G.duree") == 3)
    pg.evaluate("__jeu.clic({x: 960, y: 890})")                        # JOUER
    check("séance démarrée avec 180 s", pg.evaluate("__jeu.G.mode") == "play" and pg.evaluate("__jeu.S.seance") and abs(pg.evaluate("__jeu.S.reste") - 180) < 1)
    pg.evaluate("__jeu.avancer(60)")
    check("séance : le temps s'écoule", 100 < pg.evaluate("__jeu.S.reste") < 130, "reste=%.0f" % pg.evaluate("__jeu.S.reste"))
    pg.screenshot(path=out + "/06_seance_hud.png")
    pg.evaluate("__jeu.avancer(200)")
    check("séance : fin au bout du temps", pg.evaluate("__jeu.G.mode") == "over" and pg.evaluate("__jeu.S.reste") == 0)
    check("séance : aucun cœur perdu", pg.evaluate("__jeu.S.vies") == 3, "partis=%s" % pg.evaluate("__jeu.S.partis"))
    pg.screenshot(path=out + "/07_bilan_seance.png")

    # --- 7. chantier 3 : choix du groupe à l'écran titre, couleurs, plats par groupe, niveaux de départ
    pg.evaluate("localStorage.clear(); __jeu.G.mode = 'title'; __jeu.G.groupe = 0; __jeu.G.duree = 0; __jeu.G.chrono = 'sans'; __jeu.rendre()")
    pg.screenshot(path=out + "/13_titre_groupes.png")
    for k, g in enumerate([2, 3, 1, 0]):
        pg.evaluate("__jeu.clic({x: %d, y: 565})" % (960 - 520 + g * 270 + 125))
        check("titre : bouton de groupe %d" % g, pg.evaluate("__jeu.G.groupe") == g)
    PLAT = {"g1": "plat_g1_salade", "g2": "plat_g2_soupe", "g3": "plat_g3_ragout", "aux": "plat_cloche"}
    GRP = {1: ("g1",), 2: ("g2",), 3: ("g3", "aux")}
    DEBUT = {0: 1, 1: 1, 2: 6, 3: 7}
    for g in (1, 2, 3):
        pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.groupe = %d; __jeu.start()" % g)
        check("groupe %d : niveau de départ %d" % (g, DEBUT[g]), pg.evaluate("__jeu.S.niveau") == DEBUT[g])
        vus_g, mauvais, plats_ok, plats_n, brique_ok = set(), [], 0, 0, True
        for _ in range(240):
            r = pg.evaluate("""() => {
              const J = __jeu, S = J.S; if (J.G.mode !== 'play') return null;
              let out = {};
              if (S.panel) { const c = S.panel.cmd; out.cmd = {verbe: c.verbe, groupe: c.groupe, couleur: c.couleur}; J.choisir(c.choix.indexOf(c.bonne)); return out; }
              const sv = S.serveur;
              if (S.hatchPlat) { const t = S.tables[S.hatchPlat.table].client; out.hatch = {dish: S.hatchPlat.dish, couleur: t && t.cmd ? t.cmd.couleur : null}; }
              if (sv.carry) { const t = S.tables[sv.carry.table].client; out.carry = {dish: sv.carry.dish, couleur: t && t.cmd ? t.cmd.couleur : null}; }
              if (!(sv.task || sv.path.length || sv.poseT > 0)) {
                if (sv.carry) J.clic({x: S.tables[sv.carry.table].x, y: 600});
                else { const t = S.tables.find(t => t.client && t.client.state === 'call'); if (t) J.clic({x: t.x, y: 600}); }
              }
              return out;
            }""")
            if r:
                if "cmd" in r:
                    vus_g.add(r["cmd"]["verbe"])
                    if r["cmd"]["couleur"] not in GRP[g]: mauvais.append(r["cmd"])
                for k2 in ("hatch", "carry"):
                    if k2 in r and r[k2]["couleur"]:
                        plats_n += 1
                        if r[k2]["dish"] == PLAT[r[k2]["couleur"]]: plats_ok += 1
            pg.evaluate("__jeu.avancer(0.5)")
        check("groupe %d : que des verbes du groupe, bonne couleur" % g, not mauvais and len(vus_g) > 3, "%d verbes vus, mauvais=%s" % (len(vus_g), mauvais[:2]))
        check("groupe %d : le plat suit la couleur de la commande" % g, plats_n > 0 and plats_ok == plats_n, "%d/%d" % (plats_ok, plats_n))
        check("groupe %d : le jeu continue sans erreur" % g, pg.evaluate("__jeu.G.mode") in ("play", "over"))
    # captures des 4 couleurs de brique : on fabrique une commande de chaque couleur
    for coul, niv in (("g1", 1), ("g2", 6), ("g3", 9), ("aux", 8)):
        pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.groupe = 0; __jeu.start(); __jeu.G.chrono = 'sans'; __jeu.avancer(2.0)")
        ok = pg.evaluate("""(coul) => {
          const J = __jeu, S = J.S; let c = null;
          for (let k = 0; k < 500 && (!c || c.couleur !== coul); k++) c = VERBES.nouvelleCommande(10, Math.random, 0);
          if (c.couleur !== coul) return false;
          const t = S.tables.find(t => t.client); S.panel = {table: t.i, cmd: c, wrongs: [], focus: 0, clavier: false}; t.client.state = 'order';
          J.rendre(); return c.verbe + ' / ' + c.bonne;
        }""", coul)
        check("capture brique %s" % coul, ok, str(ok))
        pg.screenshot(path=out + "/14_panneau_%s.png" % coul)
    # plat servi : une table avec chaque plat
    pg.evaluate("""() => { __jeu.G.mode = 'title'; __jeu.start(); __jeu.avancer(1.0); const S = __jeu.S; S.panel = null;
      const noms = ['plat_g1_salade', 'plat_g2_soupe', 'plat_g3_ragout', 'plat_cloche'];
      S.tables.slice(0, 4).forEach((t, i) => { t.client = {slug: 'client_01_garcon', vip: false, state: 'eat', t: 0, patience: 1, patSec: 99, cmd: null, ticket: null, tries: 0, look: {skin:'#f1c9a5',shirt:'#e8b33f',hair:'#5a3a29'}, bob: 0}; t.plat = noms[i]; });
      S.servis = 12; __jeu.rendre(); }""")
    pg.screenshot(path=out + "/15_plats_groupes.png")
    pg.evaluate("__jeu.G.groupe = 0; localStorage.clear()")

    # --- 6. accessibilité : écran Réglages, mémorisation, clavier, voix
    pg.evaluate("localStorage.clear(); __jeu.G.mode = 'title'; __jeu.rendre()")
    pg.evaluate("__jeu.clic({x: 1735, y: 63}); __jeu.rendre()")         # bouton « Réglages » (puis dessin : les boutons existent)
    check("réglages : l'écran s'ouvre", pg.evaluate("__jeu.G.mode") == "settings")
    def opt(ligne, k, n):                                               # centre du bouton k de la ligne
        x0 = 960 - (n * 300 + (n - 1) * 30) / 2
        return x0 + k * 330 + 150, 170 + ligne * 112 + 24 + 36
    for ligne, k, n in [(0, 2, 3), (1, 1, 2), (3, 1, 2), (4, 1, 2), (5, 1, 2)]:
        x, y = opt(ligne, k, n)
        pg.evaluate(f"__jeu.clic({{x:{x}, y:{y}}})")
    A = pg.evaluate("__jeu.A")
    check("réglages : choix pris en compte", A["taille"] == 2 and A["police"] == 1 and A["termin"] == 1 and A["voix"] == 1 and A["calme"] == 1, str(A))
    pg.evaluate("__jeu.rendre()")
    pg.screenshot(path=out + "/08_reglages.png")
    mem = pg.evaluate("localStorage.getItem(__jeu.CLE)")
    check("réglages : mémorisés dans le navigateur", mem is not None and '"taille":2' in mem, str(mem)[:80])
    pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(800)
    A = pg.evaluate("__jeu.A")
    check("réglages : retrouvés après rechargement", A["taille"] == 2 and A["police"] == 1 and A["termin"] == 1, str(A))
    pg.keyboard.press("Enter")                                          # Entrée sur l'écran titre : jouer
    check("clavier : Entrée lance la partie", pg.evaluate("__jeu.G.mode") == "play")
    pg.evaluate("__jeu.G.chrono = 'sans'; __jeu.avancer(2.0)")
    i = pg.evaluate("__jeu.S.tables.find(t => t.client && t.client.state === 'call').i")
    pg.keyboard.press(str(i + 1))                                       # touche du numéro de table
    pg.evaluate("__jeu.avancer(3.0)")
    check("clavier : la touche d'une table prend la commande", pg.evaluate("!!__jeu.S.panel"))
    pg.screenshot(path=out + "/09_panneau_grand_jaune.png")
    pg.keyboard.press("ArrowRight")
    check("clavier : 1re flèche = afficher le repère", pg.evaluate("__jeu.S.panel.clavier") and pg.evaluate("__jeu.S.panel.focus") == 0)
    pg.keyboard.press("ArrowRight")
    check("clavier : 2e flèche = proposition suivante", pg.evaluate("__jeu.S.panel.focus") == 1)
    pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/10_panneau_clavier.png")
    avant = pg.evaluate("__jeu.S.rep")
    pg.keyboard.press("Enter")
    check("clavier : Entrée valide la proposition", pg.evaluate("__jeu.S.panel") is None and pg.evaluate("__jeu.S.rep") == avant + 1)
    pg.evaluate("__jeu.avancer(0.4)"); pg.screenshot(path=out + "/11_message_grand.png")
    # contraste élevé, polices et animations : la partie continue sans erreur
    pg.evaluate("__jeu.A.contraste = 1; __jeu.A.taille = 1; __jeu.avancer(20); __jeu.rendre()")
    pg.screenshot(path=out + "/12_contraste.png")
    check("accessibilité : le jeu tourne avec contraste, police et voix", pg.evaluate("__jeu.G.mode") in ("play", "over"))
    pg.evaluate("localStorage.clear()")
    b.close()

ignore = ("favicon", "ERR_FILE_NOT_FOUND", "Failed to load resource")
erreurs = [e for e in errors if not any(s in e for s in ignore)]
print("ERREURS CONSOLE :", json.dumps(erreurs, ensure_ascii=False, indent=1))
ko = [n for n, ok in checks if not ok]
print("\nBILAN :", len(checks) - len(ko), "/", len(checks), "contrôles OK", "— ÉCHECS :" if ko else "", ko if ko else "")
sys.exit(1 if (ko or erreurs) else 0)
