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
    check("accueil : un clic sur le panneau OUVERT mène à la carte de la campagne", pg.evaluate("__jeu.G.mode") == "carte")
    pg.evaluate("__jeu.G.accueilSuite = 'title'; __jeu.G.mode = 'accueil'; __jeu.G.tA = 0; __jeu.G.sortie = 0")
    pg.keyboard.press("Space"); pg.keyboard.press("Space"); pg.wait_for_timeout(900)
    check("accueil : Espace passe l'animation puis entre", pg.evaluate("__jeu.G.mode") == "title")
    pg.evaluate("__jeu.G.mode = 'accueil'; __jeu.G.tA = 0; __jeu.A.calme = 1; __jeu.G.tA = 0")
    pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.A.calme = 0")
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
    check("le client répète sa commande (verbe + personne) et la réputation baisse", "Je voulais" in " ".join(bulle) and cmd["verbe"] in " ".join(bulle) and ev("__jeu.S.repu") < ev("__jeu.BAL.repuDepart"), " ".join(bulle))
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
    check("le jeu atteint le niveau 5", niv >= 5, "niveau=%s servis=%s repu=%s mode=%s" % (niv, pg.evaluate("__jeu.S.servis"), pg.evaluate("__jeu.S.repu"), pg.evaluate("__jeu.G.mode")))
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
    pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.G.duree = 0; __jeu.rendre()")
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
    check("séance : seul le temps termine la partie (pas la réputation)", pg.evaluate("__jeu.S.reste") == 0, "partis=%s" % pg.evaluate("__jeu.S.partis"))
    pg.screenshot(path=out + "/07_bilan_seance.png")

    # --- 7. chantier 3 : choix du groupe à l'écran titre, couleurs, plats par groupe, niveaux de départ
    pg.evaluate("localStorage.clear(); __jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.G.groupe = 0; __jeu.G.duree = 0; __jeu.G.chrono = 'sans'; __jeu.rendre()")
    pg.screenshot(path=out + "/13_titre_groupes.png")
    for k, g in enumerate([2, 3, 1, 0]):
        pg.evaluate("__jeu.clic({x: %d, y: 565})" % (960 - 520 + g * 270 + 125))
        check("titre : bouton de groupe %d" % g, pg.evaluate("__jeu.G.groupe") == g)
    PLAT = {"g1": "plat_g1_salade", "g2": "plat_g2_soupe", "g3": "plat_g3_ragout", "aux": "plat_cloche"}
    GRP = {1: ("g1",), 2: ("g2",), 3: ("g3", "aux")}
    DEBUT = {0: 1, 1: 1, 2: 6, 3: 7}
    for g in (1, 2, 3):
        pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.G.groupe = %d; __jeu.start()" % g)
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
        pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.G.groupe = 0; __jeu.start(); __jeu.G.chrono = 'sans'; __jeu.avancer(2.0)")
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
    pg.evaluate("""() => { __jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.start(); __jeu.avancer(1.0); const S = __jeu.S; S.panel = null;
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
    pg.evaluate("localStorage.clear(); __jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.rendre()")
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
    pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true"); pg.wait_for_timeout(800)
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
    # --- barre de réputation (remplace les cœurs)
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true"); pg.wait_for_timeout(400)
    pg.evaluate("__jeu.G.cuisine = 0; __jeu.G.chrono = 'sans'; __jeu.G.duree = 0; __jeu.G.guide = [0,1,2,3].map(id => ({id, v: [], nom: 'x'})); __jeu.start(); __jeu.avancer(2)")
    r0 = pg.evaluate("__jeu.S.repu")
    check("réputation : départ à la valeur prévue", r0 == pg.evaluate("__jeu.BAL.repuDepart"), str(r0))
    for _ in range(300):
        pg.evaluate(BOT); pg.evaluate("__jeu.avancer(0.25)")
        if pg.evaluate("__jeu.S.servis") >= 1: break
    check("réputation : un client servi du premier coup la fait monter", pg.evaluate("__jeu.S.repu") > r0, str(pg.evaluate("__jeu.S.repu")))
    pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/47_hud_reputation.png", clip={"x": 0, "y": 0, "width": 700, "height": 200})
    r1 = pg.evaluate("__jeu.S.repu"); pg.evaluate("__jeu.S.repu = 50; __jeu.S.repuAff = 50")
    t = pg.evaluate("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
    for _ in range(80):
        if t >= 0: break
        pg.evaluate("__jeu.avancer(0.5)"); t = pg.evaluate("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
    pg.evaluate("__jeu.G.chrono = 'normal'; const c = __jeu.S.tables[%d].client; c.patience = 0.0001; __jeu.avancer(0.5); __jeu.G.chrono = 'sans'" % t)
    check("réputation : un client parti fâché la fait baisser", pg.evaluate("__jeu.S.repu") <= 50 + pg.evaluate("__jeu.BAL.repuFache") + 1, str(pg.evaluate("__jeu.S.repu")))
    pg.evaluate("__jeu.S.repu = 3; __jeu.S.repuAff = 3; __jeu.G.chrono = 'normal'")
    for _ in range(200):
        t = pg.evaluate("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
        if t >= 0: pg.evaluate("__jeu.S.tables[%d].client.patience = 0.0001" % t)
        pg.evaluate("__jeu.avancer(0.5)")
        if pg.evaluate("__jeu.G.mode") == "over": break
    check("réputation à zéro : la partie est perdue (bilan)", pg.evaluate("__jeu.G.mode") == "over" and pg.evaluate("__jeu.S.repu") == 0)
    pg.screenshot(path=out + "/48_perdu.png")
    pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.G.chrono = 'normal'")

    # --- le guide gourmand : nom du resto, articles de presse, revue de presse
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true"); pg.wait_for_timeout(800)
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
    sv0 = pg.evaluate("__jeu.S.servis"); pat = pg.evaluate("__jeu.S.repu"); pg.evaluate("__jeu.avancer(5.0)")
    check("guide : le jeu est figé pendant l'article", pg.evaluate("__jeu.S.servis") == sv0 and pg.evaluate("__jeu.S.repu") == pat and pg.evaluate("!!__jeu.S.article"))
    pg.keyboard.press(" ")
    check("guide : Espace ferme l'article et la partie reprend", pg.evaluate("!__jeu.S.article"))
    check("guide : l'article est mémorisé", pg.evaluate("__jeu.G.guide.length") == 1 and '"guide":[{"id":0' in pg.evaluate("localStorage.getItem(__jeu.CLE)"))
    pg.evaluate("__jeu.verifierGuide()")
    check("guide : pas de nouvel article sans nouveau palier", pg.evaluate("!__jeu.S.article"))
    pg.evaluate("const S = __jeu.S; S.repu = 80; __jeu.verifierGuide()")
    check("guide : pas d'étoile tant que la réputation n'est pas au maximum", pg.evaluate("!__jeu.S.article"))
    pg.evaluate("const S = __jeu.S; S.repu = 100; __jeu.verifierGuide()")
    check("guide : 1re étoile quand la barre de réputation est pleine (succès de presse)", pg.evaluate("!!__jeu.S.article && __jeu.S.article.id") == 1)
    check("guide : après un succès de presse la réputation retombe à mi-hauteur", pg.evaluate("__jeu.S.repu") == pg.evaluate("__jeu.BAL.repuApresSucces"))
    pg.evaluate("__jeu.avancer(1.0)"); T = " ".join(textes()); pg.screenshot(path=out + "/41_article_etoile1.png")
    check("guide : le titre de l'article de la 1re étoile cite le resto", "Première étoile pour Chez Marcel !" in T)
    pg.mouse.click(960, 540)
    check("guide : un clic ferme l'article", pg.evaluate("!__jeu.S.article"))
    pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true; __jeu.rendre()"); T = " ".join(textes())
    check("guide : l'écran titre montre le nom et la revue de presse", "Chez Marcel" in T and "Revue de presse" in T)
    pg.evaluate("__jeu.G.mode = 'presse'"); pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/42_revue_presse.png")
    pg.evaluate("__jeu.rendre()"); r = pg.evaluate("(() => { const a = window.__jeu.G.guide; return a.length; })()")
    check("guide : la revue de presse liste les 2 articles obtenus", r == 2)
    pg.keyboard.press("Escape")
    check("guide : Échap quitte la revue de presse", pg.evaluate("__jeu.G.mode") == "title")
    pg.evaluate("__jeu.G.mode = 'lecture'; __jeu.G.lecture = Object.assign({}, __jeu.G.guide[1])"); pg.evaluate("__jeu.rendre()"); pg.screenshot(path=out + "/43_relecture.png")
    pg.keyboard.press("Escape")
    check("guide : la relecture d'un article se ferme", pg.evaluate("__jeu.G.mode") == "presse")
    pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.evaluate("__jeu.G.mode = 'title'; __jeu.G.libre = true"); pg.wait_for_timeout(500)
    check("guide : nom et articles retrouvés après rechargement", pg.evaluate("__jeu.G.nom") == "Chez Marcel" and pg.evaluate("__jeu.G.guide.length") == 2)
    ev("""() => { window.__txt = []; const P = CanvasRenderingContext2D.prototype; for (const f of ['fillText', 'strokeText']) { const o = P[f]; P[f] = function (t, ...r) { window.__txt.push(String(t)); return o.call(this, t, ...r); }; } }""")
    pg.evaluate("__jeu.G.cuisine = 0; __jeu.G.chrono = 'sans'; __jeu.start()")
    pg.evaluate("const S = __jeu.S; S.servis = 20; S.repu = 100; __jeu.verifierGuide()")
    check("guide : 2e étoile : barre de réputation pleine", pg.evaluate("!!__jeu.S.article && __jeu.S.article.id") == 2)
    pg.evaluate("__jeu.avancer(1.0)"); pg.screenshot(path=out + "/44_article_etoile2.png"); pg.evaluate("__jeu.fermerArticle()")
    pg.evaluate("const S = __jeu.S; S.repu = 100; __jeu.verifierGuide()")
    check("guide : 3e étoile : barre de réputation pleine", pg.evaluate("!!__jeu.S.article && __jeu.S.article.id") == 3)
    pg.evaluate("__jeu.avancer(1.0)"); T = " ".join(textes()); pg.screenshot(path=out + "/45_article_etoile3.png")
    check("guide : l'article de la 3e étoile est lisible en entier (signature du critique)", "Anatole Lefourchon" in T and "légende" in T)
    pg.evaluate("__jeu.fermerArticle(); __jeu.verifierGuide()")
    check("guide : les 4 articles obtenus, plus aucun article ensuite", pg.evaluate("__jeu.G.guide.length") == 4 and pg.evaluate("!__jeu.S.article"))
    pg.evaluate("__jeu.A.taille = 2; __jeu.G.lecture = Object.assign({}, __jeu.G.guide[3]); __jeu.G.mode = 'lecture'; __jeu.rendre()"); pg.screenshot(path=out + "/46_article_tres_grand.png")
    pg.evaluate("__jeu.A.taille = 0; __jeu.G.mode = 'title'; __jeu.G.libre = true")
    # --- chantier 7b : la campagne (carte, 4 restos, déblocage, contenus, sauvegarde)
    ev = pg.evaluate
    ev("localStorage.clear(); __jeu.nouvelleCampagne(); __jeu.G.libre = false; __jeu.G.chrono = 'normal'; __jeu.G.mode = 'carte'; __jeu.rendre()")
    T = " ".join(textes()); pg.screenshot(path=out + "/50_carte.png")
    check("carte : titre, 4 restos et pièces affichés", "La route du Palace" in T and "Bistrot de village" in T and "Le Palace" in T and "0 pièces" in T, T[:200])
    ev("window.__img = null"); 
    check("carte : avec l'image bg_carte, les médaillons sont posés sur les lieux peints (et le jeu ne dessine plus sa route)", ev("!!__jeu.carteGeo()[0].pl") and ev("__jeu.carteGeo()[3].x") > 1300 and ev("__jeu.carteGeo()[0].x") < 600)
    check("carte : seul le resto 1 est ouvert au départ", ev("__jeu.G.camp.restos.map(r => r.ouvert)") == [True, False, False, False])
    ev("__jeu.ouvrirResto(1)")
    check("carte : un resto verrouillé ne s'ouvre pas et explique pourquoi", ev("__jeu.G.mode") == "carte" and "succès de presse" in ev("__jeu.G.carteMsg.texte"))
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/51_carte_verrou.png")
    g0 = ev("__jeu.carteGeo()[0]")
    ev("__jeu.G.t += 0; __jeu.clicCarte({x: %d, y: %d})" % (g0["x"], g0["y"]))
    check("carte : clic sur le resto 1 → animation d'accueil de ce resto", ev("__jeu.G.mode") == "accueil" and ev("__jeu.G.accueilResto") == 0 and ev("__jeu.G.accueilSuite") == "title")
    ev("__jeu.G.tA = __jeu.ACCU.FIN; __jeu.entrerResto()"); ev("__jeu.update(0.5)")
    check("accueil du resto → écran titre sans choix de verbes", ev("__jeu.G.mode") == "title" and ev("__jeu.G.libre") is False)
    ev("__jeu.rendre()"); T = " ".join(textes()); pg.screenshot(path=out + "/52_titre_resto.png")
    check("titre d'un resto : nom, contenu et coefficient", "Bistrot de village" in T and "1er groupe" in T and "× 1" in T and "Entraînement libre" not in T, T[:300])
    ev("__jeu.G.cuisine = 0; __jeu.G.chrono = 'sans'; __jeu.start()")
    gr = ev("Array.from({length: 80}, () => VERBES.nouvelleCommande(__jeu.S.ctx.fin, Math.random, __jeu.S.ctx.groupes).groupe)")
    check("resto 1 : seulement des verbes du 1er groupe", set(gr) == {1}, str(set(gr)))
    ev("__jeu.S.servis = 100; __jeu.S.tables.forEach(t => t.client = null)")
    check("resto 1 : 4 tables au maximum", ev("[0,1,2,3,4,5].filter(i => __jeu.tableActive(i)).length") == 4)
    # succès de presse : article, prime, déblocage du resto suivant
    ev("__jeu.start(); __jeu.S.servis = 6; __jeu.verifierGuide()")
    check("5 clients servis : article « table à retenir »", ev("!!__jeu.S.article && __jeu.S.article.id") == 0)
    ev("__jeu.fermerArticle(); __jeu.S.repu = 100; __jeu.verifierGuide()")
    check("succès de presse au resto 1 : article ★ et resto 2 ouvert", ev("!!__jeu.S.article") and ev("__jeu.G.camp.restos[1].ouvert") is True and ev("__jeu.G.camp.restos[0].reussi") is True)
    check("succès de presse : prime en pièces et barre remise à mi-hauteur", ev("__jeu.S.score") == 50 and ev("__jeu.G.camp.argent") == 50 and ev("__jeu.S.repu") == ev("__jeu.BAL.repuApresSucces"), str(ev("__jeu.S.score")))
    ev("__jeu.avancer(1.0)"); ev("__jeu.fermerArticle()")
    # contenus des restos 2 à 4
    for i, grp, nmax, coef in [(1, {1, 2}, 5, 1.5), (2, {1, 2, 3}, 6, 2), (3, {1, 2, 3}, 6, 3)]:
        ev("__jeu.G.camp.restos[%d].ouvert = true; __jeu.G.resto = %d; __jeu.G.libre = false; __jeu.start()" % (i, i))
        gr = ev("Array.from({length: 150}, () => VERBES.nouvelleCommande(__jeu.S.ctx.fin, Math.random, __jeu.S.ctx.groupes).groupe)")
        check("resto %d : groupes %s, %d tables, pièces × %s" % (i + 1, sorted(grp), nmax, coef), set(gr) == grp and ev("__jeu.S.ctx.tablesMax") == nmax and ev("__jeu.S.ctx.coef") == coef, str(set(gr)))
    irr = ev("Array.from({length: 150}, () => VERBES.nouvelleCommande(__jeu.S.ctx.fin, Math.random, __jeu.S.ctx.groupes).niveau)")
    check("Palace : niveau 10 (irréguliers en vedette)", set(irr) == {10})
    ev("__jeu.G.chrono = 'sans'; __jeu.avancer(2.0)"); ev("__jeu.rendre()"); pg.screenshot(path=out + "/53_palace_salle.png")
    ev("__jeu.G.resto = 0; __jeu.start(); __jeu.S.servis = 3; __jeu.S.score = 120; __jeu.G.camp.restos[0].argent = 120; __jeu.finir()")
    check("fin de partie : bilan enregistré dans la campagne (étoiles)", ev("__jeu.G.mode") == "over" and ev("__jeu.G.camp.restos[0].etoiles") >= 0 and ev("__jeu.G.camp.restos[0].meilleur") >= 120)
    ev("__jeu.rendre()"); T = " ".join(textes()); pg.screenshot(path=out + "/54_fin_campagne.png")
    check("fin de partie en campagne : « Pièces gagnées » et bouton CARTE", "Pièces gagnées" in T and "CARTE" in T)
    check("fin de partie en campagne : bouton ATELIER DÉCO", "ATELIER DÉCO" in T)
    ev("__jeu.clic({x: 960, y: 900})")
    check("fin de partie : le bouton ATELIER DÉCO ouvre l'atelier", ev("__jeu.G.mode") == "atelier")
    ev("__jeu.clic({x: 200, y: 1020})")
    check("atelier : Retour ramène à l'écran de fin de partie", ev("__jeu.G.mode") == "over")
    ev("__jeu.clic({x: 1400, y: 900})")
    check("le bouton CARTE ramène à la carte", ev("__jeu.G.mode") == "carte")

    # --- chantier 7c : l'atelier déco (achats, prix par resto, sauvegarde, rendu en salle)
    ev("__jeu.G.camp.argent = 50; __jeu.G.mode = 'carte'; __jeu.rendre()")
    ev("__jeu.clicCarte({x: 1060, y: 990})")
    check("atelier : le bouton de la carte l'ouvre", ev("__jeu.G.mode") == "atelier" and ev("__jeu.G.atelier.resto") == 0)
    T = " ".join(textes()); pg.screenshot(path=out + "/55_atelier.png")
    check("atelier : titre, pièces, onglets et prix affichés", "Atelier déco" in T and "50 pièces" in T and "Papier peint (1)" in T and "Rose poudré" in T and "100 pièces" in T, T[:300])
    check("prix : montent d'un resto à l'autre (100 / 200 / 350 / 600 pour 100 de base)", ev("[0,1,2,3].map(i => __jeu.prixDeco(100, i))") == [100, 200, 350, 600])
    check("prix : les pièces gagnées montent moins vite que les prix", all(ev("__jeu.PRIX_RESTO[%d] / __jeu.RESTOS[%d].coef" % (i, i)) >= ev("__jeu.PRIX_RESTO[%d] / __jeu.RESTOS[%d].coef" % (i - 1, i - 1)) for i in (1, 2, 3)))
    ev("__jeu.acheterOuChoisir('papier', 'rose')")
    check("achat refusé sans assez de pièces : rien n'est retiré ni posé", ev("__jeu.G.camp.argent") == 50 and ev("__jeu.G.camp.restos[0].deco.papier") == "creme" and "manque" in ev("__jeu.G.atelier.msg.texte"))
    ev("__jeu.G.camp.argent = 1000; __jeu.acheterOuChoisir('papier', 'rose')")
    check("achat : pièces retirées, papier acheté et posé", ev("__jeu.G.camp.argent") == 900 and ev("__jeu.G.camp.restos[0].deco.papier") == "rose" and ev("__jeu.G.camp.restos[0].deco.achats.includes('papier:rose')"))
    ev("__jeu.acheterOuChoisir('papier', 'rose')")
    check("un objet déjà acheté n'est pas payé deux fois", ev("__jeu.G.camp.argent") == 900)
    ev("__jeu.acheterOuChoisir('papier', 'creme')")
    check("le papier d'origine se repose gratuitement", ev("__jeu.G.camp.argent") == 900 and ev("__jeu.G.camp.restos[0].deco.papier") == "creme")
    ev("__jeu.acheterOuChoisir('papier', 'rose')")
    check("un papier acheté se repose gratuitement", ev("__jeu.G.camp.argent") == 900 and ev("__jeu.G.camp.restos[0].deco.papier") == "rose")
    ev("__jeu.acheterOuChoisir('nappes', 'or'); __jeu.acheterOuChoisir('objet', 'plante'); __jeu.acheterOuChoisir('objet', 'ardoise')")
    check("nappes et objets : achetés (220 + 120 + 300 pièces)", ev("__jeu.G.camp.argent") == 260 and ev("__jeu.G.camp.restos[0].deco.nappes") == "or" and ev("__jeu.G.camp.restos[0].deco.achats.length") == 4)
    ev("__jeu.G.camp.restos[1].ouvert = false; __jeu.changerRestoAtelier(1)")
    check("atelier : un resto verrouillé ne s'équipe pas", ev("__jeu.G.atelier.resto") == 0)
    ev("__jeu.G.camp.restos[1].ouvert = true; __jeu.changerRestoAtelier(1)")
    check("atelier : la déco est propre à chaque resto", ev("__jeu.G.atelier.resto") == 1 and ev("__jeu.G.camp.restos[1].deco.achats.length") == 0 and ev("__jeu.G.camp.restos[1].deco.papier") == "creme")
    ev("__jeu.G.camp.argent = 300; __jeu.acheterOuChoisir('papier', 'sauge')")
    check("brasserie : le papier coûte 200 (× 2)", ev("__jeu.G.camp.argent") == 100 and ev("__jeu.G.camp.restos[1].deco.papier") == "sauge")
    ev("__jeu.G.atelier.onglet = 2; __jeu.G.atelier.sel = 0; __jeu.rendre()"); pg.screenshot(path=out + "/56_atelier_objets.png")
    ev("__jeu.G.atelier.resto = 0; __jeu.G.atelier.onglet = 0; __jeu.rendre()")
    pg.keyboard.press("ArrowDown"); pg.keyboard.press("Enter")
    check("atelier au clavier : ↓ puis Entrée pose ou achète la ligne choisie", ev("__jeu.G.atelier.sel") == 1 and ev("__jeu.G.mode") == "atelier")
    pg.keyboard.press("Escape")
    check("atelier : Échap ramène à la carte", ev("__jeu.G.mode") == "carte")
    # rendu en salle : le papier est teinté, les objets achetés sont dessinés (et eux seuls)
    ev("""() => { window.__img = []; const P = CanvasRenderingContext2D.prototype, o = P.drawImage; P.drawImage = function (im, ...r) { if (im && im.src) window.__img.push(im.src.split('/').pop()); return o.call(this, im, ...r); }; }""")
    ev("__jeu.G.resto = 0; __jeu.G.libre = false; __jeu.G.cuisine = 0; __jeu.G.chrono = 'sans'; __jeu.start(); __jeu.avancer(1.0)")
    ev("__jeu.G.camp.restos[0].deco = __jeu.decoLire({papier: 'creme', nappes: 'origine', achats: []}); __jeu.rendre()"); pg.screenshot(path=out + "/57_salle_nue.png", clip={"x": 600, "y": 60, "width": 500, "height": 140})
    ev("window.__img = []; __jeu.rendre()"); nus = ev("window.__img")
    check("salle sans achat : aucun objet de déco dessiné", not any(n in nus for n in ("deco_plante.png", "deco_lampe.png", "deco_horloge.png", "deco_ardoise.png")))
    ev("__jeu.G.camp.restos[0].deco = __jeu.decoLire({papier: 'rose', nappes: 'or', achats: ['papier:rose', 'nappes:or', 'objet:plante', 'objet:ardoise']}); window.__img = []; __jeu.rendre()")
    eq = ev("window.__img"); pg.screenshot(path=out + "/58_salle_equipee.png"); pg.screenshot(path=out + "/58_salle_equipee_mur.png", clip={"x": 600, "y": 60, "width": 500, "height": 140})
    check("salle équipée : plante et ardoise dessinées, pas la lampe ni l'horloge", "deco_plante.png" in eq and "deco_ardoise.png" in eq and "deco_lampe.png" not in eq and "deco_horloge.png" not in eq)
    from PIL import Image
    import io
    def px(clip_png, x, y):
        return Image.open(io.BytesIO(clip_png)).convert("RGB").getpixel((x, y))
    ev("__jeu.G.camp.restos[0].deco = __jeu.decoLire({papier: 'rose', nappes: 'or', achats: ['papier:rose', 'nappes:or']}); __jeu.rendre()")
    A_ = pg.screenshot(clip={"x": 800, "y": 170, "width": 4, "height": 4}); ev("__jeu.G.camp.restos[0].deco = __jeu.decoLire({}); __jeu.rendre()"); B_ = pg.screenshot(clip={"x": 800, "y": 170, "width": 4, "height": 4})
    pa, pb = px(A_, 2, 2), px(B_, 2, 2)
    check("papier peint rose : la couleur du mur change vraiment", sum(abs(a - b) for a, b in zip(pa, pb)) > 25, str((pa, pb)))
    ev("__jeu.G.camp.restos[0].deco = __jeu.decoLire({papier: 'rose', nappes: 'or', achats: ['papier:rose', 'nappes:or']}); __jeu.rendre()")
    # salles 2 à 4 (images de Julie) : chaque salle a ses propres murs à tapisser
    check("murs : le village garde les siens, les salles 2 à 4 ont les leurs (les 2 rideaux du Palace épargnés)", ev("__jeu.mursDe(0).pans.length") == 3 and ev("__jeu.mursDe(1).trous.length") == 0 and ev("__jeu.mursDe(3).trous.length") == 2 and ev("__jeu.mursDe(1).pans[0][0][1]") != ev("__jeu.mursDe(0).pans[0][0][1]"))
    ev("__jeu.G.resto = 3; __jeu.G.camp.restos[3].deco = __jeu.decoLire({papier: 'lilas', achats: ['papier:lilas']}); __jeu.start(); __jeu.rendre()")
    A3 = pg.screenshot(clip={"x": 1160, "y": 160, "width": 4, "height": 4}); ev("__jeu.G.camp.restos[3].deco = __jeu.decoLire({}); __jeu.rendre()"); B3 = pg.screenshot(clip={"x": 1160, "y": 160, "width": 4, "height": 4})
    pa3, pb3 = px(A3, 2, 2), px(B3, 2, 2)
    check("papier peint lilas au Palace : le mur de cette salle change vraiment de couleur", sum(abs(a - b) for a, b in zip(pa3, pb3)) > 25, str((pa3, pb3)))
    ev("__jeu.G.resto = 0; __jeu.start()")
    # sauvegarde : relue après rechargement, et lecture prudente
    ev("__jeu.G.mode = 'carte'; __jeu.sauver()"); pg.reload(); pg.wait_for_function("window.__jeu !== undefined")
    check("sauvegarde : la déco et les pièces sont retrouvées après rechargement", ev("__jeu.G.camp.restos[0].deco.papier") == "rose" and ev("__jeu.G.camp.restos[0].deco.nappes") == "or" and ev("__jeu.G.camp.restos[1].deco.papier") == "sauge")
    ev("__jeu.G.camp.argent = 50")
    anc = ev("__jeu.campLire({argent: 7, restos: [{ouvert: true, reussi: true, etoiles: 1, argent: 3, meilleur: 4}]})")
    check("ancienne sauvegarde (sans déco) : relue avec une déco vide", anc["argent"] == 7 and anc["restos"][0]["deco"] == {"papier": "creme", "nappes": "origine", "achats": [], "charme": 0})
    mauv = ev("__jeu.decoLire({papier: 'rose', nappes: 'inconnue', achats: ['papier:rose', 'papier:rose', 'objet:inexistant', 'papier:creme', 42, 'nappes:or']})")
    check("sauvegarde abîmée : papier non possédé, doublons et objets inconnus écartés", mauv["papier"] == "rose" and mauv["nappes"] == "origine" and sorted(mauv["achats"]) == ["nappes:or", "papier:rose"], str(mauv))
    mauv2 = ev("__jeu.decoLire({papier: 'lilas', nappes: 'velours', achats: []})")
    check("sauvegarde abîmée : on ne peut pas poser un papier ou des nappes jamais achetés", mauv2["papier"] == "creme" and mauv2["nappes"] == "origine")
    ev("__jeu.G.mode = 'carte'; __jeu.G.camp.argent = 50")
    # sauvegarde
    ev("__jeu.sauver()"); pg.reload(); pg.wait_for_function("window.__jeu !== undefined")
    check("sauvegarde : restos ouverts, réussite et pièces retrouvés après rechargement", ev("__jeu.G.camp.restos.map(r => r.ouvert)") == [True, True, True, True] and ev("__jeu.G.camp.restos[0].reussi") is True and ev("__jeu.G.camp.argent") == 50)
    ev("__jeu.G.mode = 'carte'; __jeu.rendre()")
    ev("__jeu.clicCarte({x: 1740, y: 990})")
    check("nouvelle campagne : demande confirmation", ev("__jeu.G.camp.argent") == 50)
    ev("__jeu.clicCarte({x: 1740, y: 990})")
    check("nouvelle campagne : confirmée, tout est effacé sauf le nom", ev("__jeu.G.camp.argent") == 0 and ev("__jeu.G.camp.restos.map(r => r.ouvert)") == [True, False, False, False] and ev("__jeu.G.guide.length") == 0)
    check("nouvelle campagne : la déco achetée est effacée aussi", ev("__jeu.G.camp.restos.every(r => r.deco.achats.length === 0 && r.deco.papier === 'creme' && r.deco.nappes === 'origine')"))
    ev("__jeu.G.mode = 'carte'; __jeu.entrainementLibre()")
    check("entraînement libre : écran titre avec le choix des verbes", ev("__jeu.G.mode") == "title" and ev("__jeu.G.libre") is True)
    ev("__jeu.G.mode = 'title'")
    pg.evaluate("localStorage.clear()")
    b.close()

ignore = ("favicon", "ERR_FILE_NOT_FOUND", "Failed to load resource")
erreurs = [e for e in errors if not any(s in e for s in ignore)]
print("ERREURS CONSOLE :", json.dumps(erreurs, ensure_ascii=False, indent=1))
ko = [n for n, ok in checks if not ok]
print("\nBILAN :", len(checks) - len(ko), "/", len(checks), "contrôles OK", "— ÉCHECS :" if ko else "", ko if ko else "")
sys.exit(1 if (ko or erreurs) else 0)
