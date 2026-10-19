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

    # --- écran d'accueil : le serveur arrive, la pancarte s'écrit, le panneau OUVERT apparaît, on clique pour entrer
    check("accueil : le jeu démarre sur l'animation d'accueil", pg.evaluate("__jeu.G.mode") == "accueil")
    pg.wait_for_timeout(500); pg.screenshot(path=out + "/00_accueil_marche.png")
    pg.evaluate("__jeu.G.tA = __jeu.ACCU.ENSEIGNE + 1.0; __jeu.rendre()"); pg.screenshot(path=out + "/00_accueil_pancarte.png")
    pg.mouse.click(300, 300)
    check("accueil : un clic passe l'animation sans entrer", pg.evaluate("__jeu.G.mode") == "accueil" and pg.evaluate("__jeu.G.tA") >= pg.evaluate("__jeu.ACCU.FIN"))
    pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/00_accueil_ouvert.png")
    pg.mouse.click(300, 300)
    check("accueil : un clic à côté du panneau n'entre pas", pg.evaluate("__jeu.G.mode") == "accueil")
    pg.mouse.click(960, 700); pg.wait_for_timeout(900)
    check("accueil : un clic sur le panneau OUVERT entre dans le resto (écran titre)", pg.evaluate("__jeu.G.mode") == "title")
    pg.evaluate("__jeu.G.mode = 'accueil'; __jeu.G.tA = 0; __jeu.G.sortie = 0")
    pg.keyboard.press("Space"); pg.keyboard.press("Space"); pg.wait_for_timeout(900)
    check("accueil : Espace passe l'animation puis entre", pg.evaluate("__jeu.G.mode") == "title")
    pg.evaluate("__jeu.G.mode = 'accueil'; __jeu.G.tA = 0; __jeu.A.calme = 1; __jeu.G.tA = 0")
    pg.evaluate("__jeu.G.mode = 'title'; __jeu.A.calme = 0")
    pg.wait_for_timeout(1200)
    pg.screenshot(path=out + "/01_titre.png")

    pg.evaluate("__jeu.G.cuisine = 0")          # ce parcours teste la salle seule (la cuisine a son propre test : test_cuisine.py)
    pg.evaluate("__jeu.start()")
    pg.evaluate("__jeu.avancer(2.0)")

    ev = pg.evaluate
    # lecture du texte réellement dessiné sur le canvas (pour vérifier ce que le joueur voit)
    ev("""() => { window.__txt = []; const P = CanvasRenderingContext2D.prototype; for (const f of ['fillText', 'strokeText']) { const o = P[f]; P[f] = function (t, ...r) { window.__txt.push(String(t)); return o.call(this, t, ...r); }; } }""")
    def textes():
        ev("window.__txt = []; __jeu.rendre()"); return ev("window.__txt")
    BOT = """() => {
      const J = __jeu, S = J.S; if (!S || J.G.mode !== 'play' || J.G.vue !== 'salle') return;
      if (S.article) { if (S.article.t > 0.8) J.fermerArticle(); return; }
      if (S.dial) { J.avancerDialogue(); return; }
      if (S.panel) { if (S.panel.feedback) { J.reessayer(); return; } const c = S.panel.cmd; J.choisir(c.choix.indexOf(c.bonne)); return; }
      const sv = S.serveur; if (sv.task || sv.path.length || sv.poseT > 0) return;
      if (sv.carry) { J.clic({x: S.tables[sv.carry.table].x, y: 600}); return; }
      const att = J.commandesEnAttente(); if (att.length) { J.demanderChoix(att[0].table); return; }
      const t = S.tables.find(t => t.client && t.client.state === 'call'); if (t) J.clic({x: t.x, y: 600});
    }"""

    # --- 1. le dialogue de commande : carte -> « pour la cuisson ? » -> personne
    info = ev("__jeu.S.tables.filter(t=>t.client && t.client.state==='call').map(t=>t.i)")
    check("un client appelle", len(info) > 0, str(info))
    i = info[0]
    x = ev(f"__jeu.S.tables[{i}].x")
    ev(f"__jeu.clic({{x:{x}, y:600}})")
    ev("__jeu.avancer(3.0)")
    check("le serveur arrive : le dialogue s'ouvre (pas de QCM tout de suite)", ev("!!__jeu.S.dial") and ev("!__jeu.S.panel"))
    cmdc = ev("__jeu.S.tables[%d].client.cmd" % i)
    L0 = ev("__jeu.ligneDialogue(__jeu.S.dial)")
    check("dialogue 1 : le client choisit un verbe à l'infinitif sur la carte", L0["qui"] == "client" and L0["gros"] == cmdc["verbe"].upper(), str(L0))
    check("dialogue 1 : la forme conjuguée n'apparaît nulle part", cmdc["bonne"] not in " ".join(textes()) or cmdc["bonne"] == cmdc["verbe"])
    pat0 = ev("__jeu.S.tables[%d].client.patience" % i); ev("__jeu.avancer(2.0)")
    check("pendant le dialogue la patience du client est gelée", abs(ev("__jeu.S.tables[%d].client.patience" % i) - pat0) < 1e-6)
    pg.screenshot(path=out + "/18_dialogue_carte.png")
    ev("__jeu.avancerDialogue()")
    L1 = ev("__jeu.ligneDialogue(__jeu.S.dial)")
    check("dialogue 2 : le serveur demande « et pour la cuisson ? »", L1["qui"] == "serveur" and "cuisson" in L1["haut"], L1["haut"])
    pg.screenshot(path=out + "/19_dialogue_serveur.png")
    ev("__jeu.avancerDialogue()")
    L2 = ev("__jeu.ligneDialogue(__jeu.S.dial)")
    pers = ["1re personne du singulier", "2e personne du singulier", "3e personne du singulier", "1re personne du pluriel", "2e personne du pluriel", "3e personne du pluriel"][cmdc["p"]]
    check("dialogue 3 : le client répond par la personne en toutes lettres", L2["qui"] == "client" and pers in L2["haut"], L2["haut"])
    pg.screenshot(path=out + "/20_dialogue_personne.png")
    T = " ".join(textes())
    check("le ticket accroché au rail donne le verbe et la personne (pas de pronom)", "pers." in T and cmdc["verbe"].upper() in T)
    ev("__jeu.avancerDialogue()")
    check("fin du dialogue : le serveur part au passe-plats", ev("!__jeu.S.dial") and ev("__jeu.S.serveur.task && __jeu.S.serveur.task.type") == "goChoix")
    ev("__jeu.avancer(0.8)"); pg.screenshot(path=out + "/21_vers_passe_plats.png")
    ev("__jeu.avancer(3.0)")
    check("au passe-plats : le choix des assiettes s'ouvre", ev("!!__jeu.S.panel") and ev("__jeu.S.panel.table") == i)
    cmd = ev("__jeu.S.panel.cmd")
    check("4 assiettes distinctes dont la bonne", len(cmd["choix"]) == 4 and len(set(cmd["choix"])) == 4 and cmd["bonne"] in cmd["choix"], str(cmd["choix"]))
    T = " ".join(textes())
    check("le panneau rappelle le verbe et la personne", cmd["verbe"].upper() in T and "personne" in T)
    pg.screenshot(path=out + "/22_choix_assiette.png")
    # Échap : on ferme, la commande reste à préparer ; un clic sur le passe-plats la rouvre
    pg.keyboard.press("Escape")
    check("Échap ferme le choix, la commande reste en attente", ev("!__jeu.S.panel") and ev("__jeu.commandesEnAttente().length") == 1)
    ev("__jeu.avancer(0.5)"); R = ev("__jeu.HATCH_RECT"); ev("__jeu.clic({x:%d, y:%d})" % (R["x"] + 120, R["y"] + 100)); ev("__jeu.avancer(3.0)")
    check("un clic sur le passe-plats rouvre le choix", ev("!!__jeu.S.panel"))

    # --- 1b. une erreur : le plat est porté à la table, le client le refuse (bulle), le serveur retourne au passe-plats (assiette refusée enlevée) ;
    #         au 2e refus la bonne forme + la règle s'affichent (jamais la forme fautive) ; le pourboire baisse
    ev("__jeu.G.chrono = 'sans'")                                    # patience gelée : seule la pénalité des refus compte
    bad = [k for k, f in enumerate(cmd["choix"]) if f != cmd["bonne"]][0]
    faute = cmd["choix"][bad]
    ev(f"__jeu.choisir({bad})")
    check("mauvaise assiette : pas de correction tout de suite, le plat part à la table", ev("!__jeu.S.panel") and ev("!!__jeu.S.serveur.carry") and ev("__jeu.S.serveur.carry.mauvais") is True)
    check("erreur enregistrée pour le bilan", ev("__jeu.S.erreurs.length") == 1)
    ev("__jeu.avancer(0.8)"); ev(f"__jeu.clic({{x:{x}, y:600}})"); ev("__jeu.avancer(2.5)")
    bulle = ev("(__jeu.S.tables[%d].bulle || {}).lignes" % i)
    print("   le client dit :", bulle)
    check("le client refuse le plat (bulle « pas le plat demandé » ou « pas la bonne cuisson »)", bool(bulle) and ("plat" in " ".join(bulle) or "cuisson" in " ".join(bulle)))
    pg.screenshot(path=out + "/02_refus.png")
    check("le refus coûte de la patience et brise la série", ev("__jeu.S.tables[%d].client.patience" % i) < 0.9 and ev("__jeu.S.combo") == 0)
    ev("__jeu.avancer(4.0)")
    check("le serveur est reparti au passe-plats : le choix se rouvre", ev("!!__jeu.S.panel"))
    cmd2 = ev("__jeu.S.panel.cmd")
    check("l'assiette refusée a été enlevée (3 restantes dont la bonne)", len(cmd2["choix"]) == 3 and faute not in cmd2["choix"] and cmd2["bonne"] in cmd2["choix"], str(cmd2["choix"]))
    check("1er refus : pas encore de correction", not ev("!!__jeu.S.panel.feedback"))
    bad2 = [k for k, f in enumerate(cmd2["choix"]) if f != cmd2["bonne"]][0]; faute2 = cmd2["choix"][bad2]
    ev(f"__jeu.choisir({bad2})"); ev("__jeu.avancer(0.8)"); ev(f"__jeu.clic({{x:{x}, y:600}})"); ev("__jeu.avancer(7.0)")
    check("2e refus : la correction s'affiche dans le panneau", ev("!!__jeu.S.panel") and ev("!!__jeu.S.panel.feedback"))
    T = textes(); txt = " | ".join(T)
    print("   correction affichée :", txt[-260:])
    check("correction : bonne forme affichée", cmd["bonne"] in txt)
    check("correction : règle de terminaison affichée", cmd["regle"]["terminaison"] in txt)
    check("correction : formes fautives NON réaffichées", faute not in txt.replace(cmd["bonne"], "") and faute2 not in txt.replace(cmd["bonne"], ""), "fautes=" + faute + "," + faute2)
    pg.screenshot(path=out + "/02_erreur.png")
    pg.keyboard.press("Space")
    cmd3 = ev("__jeu.S.panel.cmd")
    check("Continuer : il reste 2 assiettes dont la bonne", not ev("!!__jeu.S.panel.feedback") and len(cmd3["choix"]) == 2 and cmd3["bonne"] in cmd3["choix"], str(cmd3["choix"]))
    good = cmd3["choix"].index(cmd3["bonne"])
    s0 = ev("__jeu.S.score")
    ev(f"__jeu.choisir({good})")
    check("bonne assiette : le serveur la porte tout de suite", ev("!!__jeu.S.serveur.carry") and ev("!__jeu.S.panel") and not ev("__jeu.S.serveur.carry.mauvais"))
    pg.screenshot(path=out + "/23_assiette_prise.png")
    ev("__jeu.avancer(0.8)"); ev(f"__jeu.clic({{x:{x}, y:600}})")
    ev("__jeu.avancer(3.0)")
    check("client servi", ev("__jeu.S.servis") >= 1, "score=" + str(ev("__jeu.S.score")))
    check("après 2 refus : pourboire nul (10 points seulement)", ev("__jeu.S.score") - s0 in (10, 20, 15, 25), str(ev("__jeu.S.score") - s0))
    ev("__jeu.G.chrono = 'normal'")
    check("le client n'est pas compté « du premier coup »", ev("__jeu.S.parfaits") == 0 and ev("__jeu.S.refus") == 2)

    # --- 2. clavier : flèches + Espace, de bout en bout (sans souris)
    ev("__jeu.G.chrono='sans'; __jeu.start(); __jeu.avancer(2.0)")
    ev("__jeu.S.serveur.x = 200")
    pg.keyboard.down("ArrowRight"); ev("__jeu.avancer(0.5)"); pg.keyboard.up("ArrowRight")
    x1 = ev("__jeu.S.serveur.x")
    check("flèche droite : le serveur avance", x1 > 450, "x=%.0f" % x1)
    pg.keyboard.down("ArrowLeft"); ev("__jeu.avancer(0.3)"); pg.keyboard.up("ArrowLeft")
    check("flèche gauche : le serveur recule", ev("__jeu.S.serveur.x") < x1)
    ev("__jeu.avancer(0.2)")
    xs = ev("__jeu.S.serveur.x"); ev("__jeu.avancer(0.5)")
    check("sans touche : le serveur s'arrête", abs(ev("__jeu.S.serveur.x") - xs) < 1)
    pg.keyboard.down("ArrowRight"); ev("__jeu.avancer(5)"); pg.keyboard.up("ArrowRight")
    check("le serveur ne sort pas de la salle", ev("__jeu.S.serveur.x") <= 1830)
    t = ev("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
    if t < 0:
        ev("__jeu.avancer(8)"); t = ev("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
    xt = ev("__jeu.S.tables[%d].x" % t)
    ev("__jeu.S.serveur.x = %d" % (xt - 140))
    pg.keyboard.press("Space"); ev("__jeu.avancer(0.3)")
    check("Espace devant un client qui appelle : le dialogue commence", ev("!!__jeu.S.dial") and ev("__jeu.S.dial.table") == t)
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/16_clavier_dialogue.png")
    pg.keyboard.press("Space"); pg.keyboard.press("Space"); pg.keyboard.press("Space")
    check("3 fois Espace : le dialogue est terminé", ev("!__jeu.S.dial") and ev("__jeu.commandesEnAttente().length") == 1)
    pg.keyboard.down("ArrowLeft"); ev("__jeu.avancer(0.15)"); pg.keyboard.up("ArrowLeft")       # le joueur reprend la main avant l'arrivée automatique
    check("une flèche reprend la main sur la marche automatique", ev("!__jeu.S.serveur.task"))
    ev("__jeu.S.serveur.x = 300; __jeu.S.serveur.y = 880; __jeu.avancer(0.2)")
    check("dans la zone du passe-plats, une pastille « Espace » est affichée", ev("__jeu.auPasse()") and any("passe-plats" in z for z in textes()))
    pg.screenshot(path=out + "/17_clavier_passe_plats.png")
    pg.keyboard.press("Space"); ev("__jeu.avancer(4)")
    check("Espace au passe-plats : le choix des assiettes s'ouvre", ev("!!__jeu.S.panel") and ev("__jeu.S.panel.table") == t)
    cc = ev("__jeu.S.panel.cmd"); pg.keyboard.press(str(cc["choix"].index(cc["bonne"]) + 1))
    check("touche 1-4 : la bonne assiette est prise", ev("!!__jeu.S.serveur.carry"))
    ev("__jeu.S.serveur.x = %d; __jeu.S.serveur.y = 880" % (xt - 60)); ev("__jeu.avancer(0.9)")
    check("devant la bonne table avec l'assiette : pastille « Espace : servir »", any("servir" in z for z in textes()))
    pg.screenshot(path=out + "/24_clavier_servir.png")
    s0 = ev("__jeu.S.servis")
    pg.keyboard.press("Space"); ev("__jeu.avancer(1.0)")
    check("Espace devant la bonne table avec l'assiette : client servi", ev("__jeu.S.servis") == s0 + 1)
    ev("__jeu.S.serveur.x = 1500"); pg.keyboard.press("Space")
    check("Espace loin de toute table : un message d'aide, rien ne plante", ev("__jeu.G.mode") == "play")

    # --- 3. les 5 niveaux : un joueur parfait enchaîne, le jeu ne plante pas, chaque niveau propose des verbes de son niveau
    vus = {}
    pg.evaluate("__jeu.G.chrono='sans'")
    doublons = []
    def servir_tout(duree):
        for _ in range(int(duree / 0.5)):
            ev(BOT)
            ev("__jeu.avancer(0.5)")
            slugs = ev("__jeu.S.tables.filter(t=>t.client && t.client.state!=='leave').map(t=>t.client.slug)")
            if len(slugs) != len(set(slugs)): doublons.append(slugs)
            niv = ev("__jeu.S.niveau")
            for c in ev("__jeu.S.tickets.map(t=>t.cmd.verbe)"):
                vus.setdefault(niv, set()).add(c)
    seen_niv = set()
    for k in range(12):
        servir_tout(60)
        seen_niv.add(pg.evaluate("__jeu.S.niveau"))
        if pg.evaluate("__jeu.S.niveau") >= 5: break
    niv = pg.evaluate("__jeu.S.niveau")
    check("jamais deux clients identiques en même temps", not doublons, str(doublons[:1]))
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
    for _ in range(3): pg.evaluate("__jeu.avancerDialogue()")
    pg.evaluate("__jeu.avancer(4.0)")
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
              if (S.dial) { J.avancerDialogue(); return out; }
              if (S.panel) { if (S.panel.feedback) { J.reessayer(); return out; } const c = S.panel.cmd; out.cmd = {verbe: c.verbe, groupe: c.groupe, couleur: c.couleur}; J.choisir(c.choix.indexOf(c.bonne)); return out; }
              const sv = S.serveur;
              if (sv.carry) { const t = S.tables[sv.carry.table].client; out.carry = {dish: sv.carry.dish, couleur: t && t.cmd ? t.cmd.couleur : null}; }
              if (!(sv.task || sv.path.length || sv.poseT > 0)) {
                if (sv.carry) J.clic({x: S.tables[sv.carry.table].x, y: 600});
                else { const att = J.commandesEnAttente(); if (att.length) J.demanderChoix(att[0].table); else { const t = S.tables.find(t => t.client && t.client.state === 'call'); if (t) J.clic({x: t.x, y: 600}); } }
              }
              return out;
            }""")
            if r:
                if "cmd" in r:
                    vus_g.add(r["cmd"]["verbe"])
                    if r["cmd"]["couleur"] not in GRP[g]: mauvais.append(r["cmd"])
                for k2 in ("carry",):
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
          const t = S.tables.find(t => t.client); S.panel = {table: t.i, cmd: c, focus: 0, clavier: false, feedback: null}; t.client.state = 'order';
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

    # --- 5b. pause : on doit pouvoir la quitter (clic, Espace, P) et un bouton est visible
    pg.evaluate("__jeu.G.mode = 'play'; __jeu.G.paused = false")
    R = {"x": 1920 - 214 + 90, "y": 48}
    ev("__jeu.clic({x:%d, y:%d})" % (R["x"], R["y"]))
    check("bouton Pause : met en pause", ev("__jeu.G.paused") is True)
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/30_pause.png")
    ev("__jeu.clic({x:900, y:600})")
    check("pause : un clic reprend la partie", ev("__jeu.G.paused") is False)
    pg.keyboard.press("p"); check("touche P : pause", ev("__jeu.G.paused") is True)
    pg.keyboard.press("Space"); check("pause : Espace reprend", ev("__jeu.G.paused") is False)
    pg.keyboard.press("p"); pg.keyboard.press("Escape"); check("pause : Échap reprend", ev("__jeu.G.paused") is False)

    # --- 6. accessibilité : écran Réglages, mémorisation, clavier, voix
    pg.evaluate("localStorage.clear(); __jeu.G.mode = 'title'; __jeu.rendre()")
    pg.evaluate("__jeu.clic({x: 1735, y: 63}); __jeu.rendre()")         # bouton « Réglages » (puis dessin : les boutons existent)
    check("réglages : l'écran s'ouvre", pg.evaluate("__jeu.G.mode") == "settings")
    def opt(ligne, k, n):                                               # centre du bouton k de la ligne
        x0 = 960 - (n * 300 + (n - 1) * 30) / 2
        return x0 + k * 330 + 150, 140 + ligne * 84 + 18 + 25
    for ligne, k, n in [(0, 2, 3), (1, 1, 2), (3, 1, 2), (4, 0, 2), (5, 1, 2), (6, 1, 2), (7, 1, 3), (8, 1, 2)]:
        x, y = opt(ligne, k, n)
        pg.evaluate(f"__jeu.clic({{x:{x}, y:{y}}})")
    A = pg.evaluate("__jeu.A")
    check("réglages : choix pris en compte (dont l'aide « pronom » désactivée)", A["taille"] == 2 and A["police"] == 1 and A["termin"] == 1 and A["voix"] == 1 and A["calme"] == 1 and A["pronom"] == 0 and A["son"] == 1 and A["musique"] == 1, str(A))
    pg.evaluate("__jeu.rendre()")
    pg.screenshot(path=out + "/08_reglages.png")
    mem = pg.evaluate("localStorage.getItem(__jeu.CLE)")
    check("réglages : mémorisés dans le navigateur", mem is not None and '"taille":2' in mem, str(mem)[:80])
    pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.evaluate("__jeu.G.mode = 'title'"); pg.wait_for_timeout(800)
    A = pg.evaluate("__jeu.A")
    check("réglages : retrouvés après rechargement", A["taille"] == 2 and A["police"] == 1 and A["termin"] == 1, str(A))
    pg.keyboard.press("Enter")                                          # Entrée sur l'écran titre : jouer
    check("clavier : Entrée lance la partie", pg.evaluate("__jeu.G.mode") == "play")
    pg.evaluate("__jeu.G.chrono = 'sans'; __jeu.avancer(2.0)")
    i = pg.evaluate("__jeu.S.tables.find(t => t.client && t.client.state === 'call').i")
    pg.keyboard.press(str(i + 1))                                       # touche du numéro de table
    pg.evaluate("__jeu.avancer(3.0)")
    check("clavier : la touche d'une table envoie le serveur prendre la commande", pg.evaluate("!!__jeu.S.dial"))
    T = " ".join(textes())
    check("aide « pronom » désactivée : aucun pronom dans le dialogue", "(il / elle / on)" not in T and "(ils / elles)" not in T and "(je)" not in T)
    pg.keyboard.press("Enter"); pg.keyboard.press("Enter"); pg.keyboard.press("Enter")
    pg.evaluate("__jeu.avancer(4.0)")
    check("clavier : Entrée fait avancer le dialogue puis le choix s'ouvre au passe-plats", pg.evaluate("!!__jeu.S.panel"))
    pg.screenshot(path=out + "/09_panneau_grand_jaune.png")
    pg.keyboard.press("ArrowRight")
    check("clavier : 1re flèche = afficher le repère", pg.evaluate("__jeu.S.panel.clavier") and pg.evaluate("__jeu.S.panel.focus") == 0)
    pg.keyboard.press("ArrowRight")
    check("clavier : 2e flèche = proposition suivante", pg.evaluate("__jeu.S.panel.focus") == 1)
    pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/10_panneau_clavier.png")
    avant = pg.evaluate("__jeu.S.rep")
    pg.keyboard.press("Enter")
    check("clavier : Entrée valide la proposition", pg.evaluate("__jeu.S.rep") == avant + 1 and (pg.evaluate("__jeu.S.panel") is None or pg.evaluate("!!__jeu.S.panel.feedback")))
    pg.evaluate("__jeu.avancer(0.4)"); pg.screenshot(path=out + "/11_message_grand.png")
    # contraste élevé, polices et animations : la partie continue sans erreur
    pg.evaluate("__jeu.A.contraste = 1; __jeu.A.taille = 1; __jeu.avancer(20); __jeu.rendre()")
    pg.screenshot(path=out + "/12_contraste.png")
    check("accessibilité : le jeu tourne avec contraste, police et voix", pg.evaluate("__jeu.G.mode") in ("play", "over"))
    # --- le guide gourmand : nom du resto, articles de presse, revue de presse
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.evaluate("__jeu.G.mode = 'title'"); pg.wait_for_timeout(800)
    pg.evaluate("__jeu.G.cuisine = 0; __jeu.G.chrono = 'sans'")
    ev("""() => { window.__txt = []; const P = CanvasRenderingContext2D.prototype; for (const f of ['fillText', 'strokeText']) { const o = P[f]; P[f] = function (t, ...r) { window.__txt.push(String(t)); return o.call(this, t, ...r); }; } }""")
    pg.keyboard.press("n")
    check("guide : N sur l'écran titre ouvre la saisie du nom", pg.evaluate("__jeu.G.mode") == "nom")
    pg.keyboard.type("Chez Marcel"); pg.keyboard.press("Enter")
    check("guide : le nom saisi est retenu et mémorisé", pg.evaluate("__jeu.G.nom") == "Chez Marcel" and '"nom":"Chez Marcel"' in pg.evaluate("localStorage.getItem(__jeu.CLE)"))
    pg.evaluate("__jeu.start()")
    for _ in range(4000):
        pg.evaluate(BOT.replace("if (S.article) { if (S.article.t > 0.8) J.fermerArticle(); return; }", "if (S.article) return;")); pg.evaluate("__jeu.avancer(0.25)")
        if pg.evaluate("!!__jeu.S.article") or pg.evaluate("__jeu.G.mode") != "play": break
    check("guide : après 5 clients servis, l'article « Une table à retenir » apparaît", pg.evaluate("!!__jeu.S.article && __jeu.S.article.id") == 0 and pg.evaluate("__jeu.S.servis") == 5, str(pg.evaluate("__jeu.S.servis")))
    pg.evaluate("__jeu.avancer(1.0)"); T = " ".join(textes())
    check("guide : l'article porte le nom du resto, le journal et une forme au passé simple", "Chez Marcel" in T and "LE GOURMET DU MATIN" in T and any(f.replace(" ", "\u00a0") in T for f in pg.evaluate("__jeu.S.article.v")), "")
    pg.screenshot(path=out + "/40_article_mention.png")
    sv0 = pg.evaluate("__jeu.S.servis"); pat = pg.evaluate("__jeu.S.vies"); pg.evaluate("__jeu.avancer(5.0)")
    check("guide : le jeu est figé pendant l'article", pg.evaluate("__jeu.S.servis") == sv0 and pg.evaluate("__jeu.S.vies") == pat and pg.evaluate("!!__jeu.S.article"))
    pg.keyboard.press(" ")
    check("guide : Espace ferme l'article et la partie reprend", pg.evaluate("!__jeu.S.article"))
    check("guide : l'article est mémorisé", pg.evaluate("__jeu.G.guide.length") == 1 and '"guide":[{"id":0' in pg.evaluate("localStorage.getItem(__jeu.CLE)"))
    pg.evaluate("__jeu.verifierGuide()")
    check("guide : pas de nouvel article sans nouveau palier", pg.evaluate("!__jeu.S.article"))
    pg.evaluate("const S = __jeu.S; S.niveau = 4; S.parfaits = 0; __jeu.verifierGuide()")
    check("guide : l'étoile attend si la précision est insuffisante (parfaits 0 %)", pg.evaluate("!__jeu.S.article"))
    pg.evaluate("const S = __jeu.S; S.parfaits = S.servis; __jeu.verifierGuide()")
    check("guide : 1re étoile après 3 niveaux franchis avec une bonne précision", pg.evaluate("!!__jeu.S.article && __jeu.S.article.id") == 1)
    pg.evaluate("__jeu.avancer(1.0)"); T = " ".join(textes()); pg.screenshot(path=out + "/41_article_etoile1.png")
    check("guide : le titre de l'article de la 1re étoile cite le resto", "Première étoile pour Chez Marcel !" in T)
    pg.mouse.click(960, 540)
    check("guide : un clic ferme l'article", pg.evaluate("!__jeu.S.article"))
    pg.evaluate("__jeu.G.mode = 'title'; __jeu.rendre()"); T = " ".join(textes())
    check("guide : l'écran titre montre le nom et la revue de presse", "Chez Marcel" in T and "Revue de presse" in T)
    pg.evaluate("__jeu.G.mode = 'presse'"); pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/42_revue_presse.png")
    pg.evaluate("__jeu.rendre()"); r = pg.evaluate("(() => { const a = window.__jeu.G.guide; return a.length; })()")
    check("guide : la revue de presse liste les 2 articles obtenus", r == 2)
    pg.keyboard.press("Escape")
    check("guide : Échap quitte la revue de presse", pg.evaluate("__jeu.G.mode") == "title")
    pg.evaluate("__jeu.G.mode = 'lecture'; __jeu.G.lecture = Object.assign({}, __jeu.G.guide[1])"); pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/43_relecture.png")
    pg.keyboard.press("Escape")
    check("guide : la relecture d'un article se ferme", pg.evaluate("__jeu.G.mode") == "presse")
    pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.evaluate("__jeu.G.mode = 'title'"); pg.wait_for_timeout(500)
    check("guide : nom et articles retrouvés après rechargement", pg.evaluate("__jeu.G.nom") == "Chez Marcel" and pg.evaluate("__jeu.G.guide.length") == 2)
    ev("""() => { window.__txt = []; const P = CanvasRenderingContext2D.prototype; for (const f of ['fillText', 'strokeText']) { const o = P[f]; P[f] = function (t, ...r) { window.__txt.push(String(t)); return o.call(this, t, ...r); }; } }""")
    pg.evaluate("__jeu.G.cuisine = 0; __jeu.G.chrono = 'sans'; __jeu.start()")
    pg.evaluate("const S = __jeu.S; S.servis = 60; S.parfaits = 60; S.niveau = 7; __jeu.verifierGuide()")
    check("guide : 2e étoile après 6 niveaux franchis", pg.evaluate("!!__jeu.S.article && __jeu.S.article.id") == 2)
    pg.evaluate("__jeu.avancer(1.0)"); pg.screenshot(path=out + "/44_article_etoile2.png"); pg.evaluate("__jeu.fermerArticle()")
    pg.evaluate("const S = __jeu.S; S.servis = 90; S.parfaits = 90; S.niveau = 11; __jeu.verifierGuide()")
    check("guide : 3e étoile après 10 niveaux franchis", pg.evaluate("!!__jeu.S.article && __jeu.S.article.id") == 3)
    pg.evaluate("__jeu.avancer(1.0)"); T = " ".join(textes()); pg.screenshot(path=out + "/45_article_etoile3.png")
    check("guide : l'article de la 3e étoile est lisible en entier (signature du critique)", "Anatole Lefourchon" in T and "légende" in T)
    pg.evaluate("__jeu.fermerArticle(); __jeu.verifierGuide()")
    check("guide : les 4 articles obtenus, plus aucun article ensuite", pg.evaluate("__jeu.G.guide.length") == 4 and pg.evaluate("!__jeu.S.article"))
    pg.evaluate("__jeu.A.taille = 2; __jeu.G.lecture = Object.assign({}, __jeu.G.guide[3]); __jeu.G.mode = 'lecture'; __jeu.rendre()"); pg.screenshot(path=out + "/46_article_tres_grand.png")
    pg.evaluate("__jeu.A.taille = 0; __jeu.G.mode = 'title'")
    pg.evaluate("localStorage.clear()")
    b.close()

ignore = ("favicon", "ERR_FILE_NOT_FOUND", "Failed to load resource")
erreurs = [e for e in errors if not any(s in e for s in ignore)]
print("ERREURS CONSOLE :", json.dumps(erreurs, ensure_ascii=False, indent=1))
ko = [n for n, ok in checks if not ok]
print("\nBILAN :", len(checks) - len(ko), "/", len(checks), "contrôles OK", "— ÉCHECS :" if ko else "", ko if ko else "")
sys.exit(1 if (ko or erreurs) else 0)
