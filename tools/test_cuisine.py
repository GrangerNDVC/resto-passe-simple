"""Test du chantier 4 (cuisine) dans Chromium : porte, postes, saisie au clavier, cuisson, passe-plats, service, erreurs.
Usage : python3 -I test_cuisine.py <dossier_jeu> <dossier_captures>
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
    ev = pg.evaluate

    # --- 0. bouton « Cuisine : oui/non » à l'écran titre
    ev("localStorage.clear(); __jeu.G.mode='title'; __jeu.G.cuisine=1; __jeu.rendre()")
    pg.screenshot(path=out + "/c01_titre.png")
    ev("__jeu.clic({x: 230, y: 63})")
    check("titre : le bouton Cuisine bascule sur « non »", ev("__jeu.G.cuisine") == 0)
    ev("__jeu.clic({x: 230, y: 63})")
    check("titre : et revient sur « oui »", ev("__jeu.G.cuisine") == 1)

    # --- 1. la cuisine s'ouvre après N clients servis sans client parti fâché
    ev("__jeu.BAL.cuisineApres = 2; __jeu.BAL.cuisineProba = 1; __jeu.G.chrono = 'sans'; __jeu.G.groupe = 0; __jeu.start()")
    check("cuisine fermée au départ", ev("__jeu.S.cuis.ouverte") is False)
    BOT = """() => {
      const J = __jeu, S = J.S; if (!S || J.G.mode !== 'play' || J.G.vue !== 'salle') return;
      if (S.dial) { J.avancerDialogue(); return; }
      if (S.panel) { if (S.panel.feedback) { J.reessayer(); return; } const c = S.panel.cmd; J.choisir(c.choix.indexOf(c.bonne)); return; }
      const sv = S.serveur; if (sv.task || sv.path.length || sv.poseT > 0) return;
      if (sv.carry) { J.clic({x: S.tables[sv.carry.table].x, y: 600}); return; }
      const att = J.commandesEnAttente(); if (att.length) { J.demanderChoix(att[0].table); return; }
      const t = S.tables.find(t => t.client && t.client.state === 'call'); if (t) J.clic({x: t.x, y: 600});
    }"""
    def prendre_commande(i):                                # clic sur la table, dialogue en 3 temps
        xx = ev(f"__jeu.S.tables[{i}].x"); ev(f"__jeu.clic({{x:{xx}, y:600}})"); ev("__jeu.avancer(3.0)")
        for _ in range(3):
            if ev("!!__jeu.S.dial"): ev("__jeu.avancerDialogue()")
        ev("__jeu.avancer(0.3)")
    for _ in range(300):
        ev(BOT); ev("__jeu.avancer(0.5)")
        if ev("__jeu.S.cuis.ouverte") or ev("__jeu.S.servis") >= 2: break
    # les 2 premiers clients sont des QCM tant que la cuisine est fermée
    ev("__jeu.avancer(0.1)")
    check("la cuisine s'ouvre après 2 clients servis d'affilée", ev("__jeu.S.cuis.ouverte") is True, "servis=%s" % ev("__jeu.S.servis"))
    check("message d'annonce", any("cuisine est ouverte" in m for m in ev("__jeu.S.msgs.map(m=>m.texte)")))
    ev("__jeu.avancer(5)")
    pg.screenshot(path=out + "/c02_porte_salle.png")

    # --- 2. une commande à cuisiner : pas de QCM, ticket « à cuisiner », client en attente
    for _ in range(80):
        t = ev("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
        if t >= 0: break
        ev("__jeu.avancer(0.5)")
    x = ev(f"__jeu.S.tables[{t}].x")
    prendre_commande(t)
    tk = ev("__jeu.S.tickets.find(t => t.cuisine)")
    check("commande à cuisiner : ticket marqué cuisine, pas de choix d'assiette", tk is not None and ev("!__jeu.S.panel") and tk["etat"] == "attente", str(tk and tk["cmd"]["verbe"]))
    check("le client attend (état wait)", ev(f"__jeu.S.tables[{t}].client.state") == "wait")

    # --- 3. la porte : serveur -> porte -> cuisine
    D = ev("__jeu.DOOR"); ev(f"__jeu.clic({{x:{D['x'] + D['w'] / 2}, y:{D['y'] + 90}}})")
    ev("__jeu.avancer(2.5)")
    check("on passe la porte : vue cuisine", ev("__jeu.G.vue") == "cuisine")
    ev("__jeu.avancer(0.5)"); pg.screenshot(path=out + "/c03_cuisine.png")
    cmd = tk["cmd"]; k_bon = {"g1": 0, "g2": 1, "g3": 2, "aux": 2}[cmd["couleur"]]
    P = ev("__jeu.POSTES")
    def clic_poste(k): ev(f"__jeu.clic({{x:{P[k]['x']}, y:{P[k]['base'] - 150}}})")

    # --- 4. mauvais poste : le chef corrige, pas de saisie
    k_mal = (k_bon + 1) % 3
    if ev(f"__jeu.posteActif({k_mal})"):
        clic_poste(k_mal)
        check("mauvais poste : pas de saisie, chef fâché", ev("!__jeu.S.cuis.saisie") and ev("__jeu.S.cuis.chef.pose") == "fache")
    ev("__jeu.avancer(1)")

    # --- 5. bon poste : saisie au VRAI clavier (champ invisible)
    clic_poste(k_bon)
    check("bon poste : la saisie s'ouvre", ev("!!__jeu.S.cuis.saisie"))
    check("le champ de saisie a le focus", ev("document.activeElement && document.activeElement.id") == "saisie")
    bonne = cmd["bonne"]
    sans = __import__("unicodedata").normalize("NFD", bonne)
    sans = "".join(c for c in sans if not __import__("unicodedata").combining(c))
    pg.keyboard.type("x")                                  # lettre quelconque : ne doit pas déclencher P (pause), M, C...
    pg.keyboard.press("Backspace")
    pg.keyboard.type("pmc"); pg.keyboard.press("Backspace"); pg.keyboard.press("Backspace"); pg.keyboard.press("Backspace")
    check("taper p, m, c ne met pas en pause et ne quitte pas", not ev("__jeu.G.paused") and ev("__jeu.G.vue") == "cuisine" and ev("__jeu.S.cuis.saisie.texte") == "", ev("__jeu.S.cuis.saisie.texte"))
    if sans != bonne:                                      # forme avec accent : essai sans accent = « presque », sans pénalité
        pg.keyboard.type(sans); pg.keyboard.press("Enter")
        pat0 = ev("__jeu.S.tables[%d].client.patience" % tk["table"])
        check("accent oublié : « presque », saisie ouverte, aucune erreur comptée", ev("!!__jeu.S.cuis.saisie") and ev("__jeu.S.cuis.saisie.presque") == 1 and ev("__jeu.S.erreurs.length") == 0)
        pg.screenshot(path=out + "/c04_presque.png")
        for _ in range(len(sans)): pg.keyboard.press("Backspace")
    # erreur franche
    faux = "zzz"
    pg.keyboard.type(faux)
    pat_av = ev("__jeu.S.tables[%d].client.patience" % tk["table"])
    pg.keyboard.press("Enter"); ev("__jeu.avancer(0.3)")
    check("forme fausse : plat raté au poste", ev(f"__jeu.S.cuis.postes[{k_bon}].etat") == "rate" and ev("!__jeu.S.cuis.saisie"))
    txt = " || ".join(ev("__jeu.S.msgs.map(m=>[m.texte,m.sous,m.note].join(' | '))"))
    check("message : bonne forme + règle, jamais la forme fautive", bonne in txt and cmd["regle"]["terminaison"] in txt and faux not in txt, txt[:120])
    check("patience du client réduite", ev("__jeu.S.tables[%d].client.patience" % tk["table"]) < pat_av)
    check("erreur enregistrée pour le bilan", ev("__jeu.S.erreurs.length") == 1)
    pg.screenshot(path=out + "/c05_rate.png")
    clic_poste(k_bon)
    check("poste bloqué pendant le nettoyage", ev("!__jeu.S.cuis.saisie"))
    ev("__jeu.avancer(3.2)")
    check("poste de nouveau libre", ev(f"__jeu.S.cuis.postes[{k_bon}].etat") == "repos")
    ev("__jeu.avancer(2)")                                  # laisse le message disparaître : la bonne forme ne reste pas à l'écran
    clic_poste(k_bon)
    pg.keyboard.type(bonne); pg.screenshot(path=out + "/c06_saisie.png"); pg.keyboard.press("Enter"); ev("__jeu.avancer(0.2)")
    check("bonne forme (avec accents tapés au clavier) : ça cuit", ev(f"__jeu.S.cuis.postes[{k_bon}].etat") == "cuit", bonne)
    ev("__jeu.avancer(1.5)"); pg.screenshot(path=out + "/c07_cuisson.png")
    ev("__jeu.avancer(6)")
    check("cuisson terminée : plat prêt", ev(f"__jeu.S.cuis.postes[{k_bon}].etat") == "pret")
    pg.screenshot(path=out + "/c08_pret.png")
    clic_poste(k_bon)
    check("clic sur le plat prêt : il part au passe-plats", ev("__jeu.S.hatchQ.length") == 1 and ev(f"__jeu.S.cuis.postes[{k_bon}].etat") == "repos")
    pg.screenshot(path=out + "/c09_passe_plats.png")

    # --- 6. retour en salle par la porte, service automatique
    C = ev("__jeu.CUIS_PORTE"); ev(f"__jeu.clic({{x:{C['x'] + 90}, y:{C['y'] + 200}}})"); ev("__jeu.avancer(0.8)")
    check("retour en salle", ev("__jeu.G.vue") == "salle")
    ev("__jeu.avancer(4)")
    check("le serveur va chercher le plat tout seul", ev("!!__jeu.S.serveur.carry") and ev("__jeu.S.hatchQ.length") == 0)
    pg.screenshot(path=out + "/c10_salle_plat.png")
    s0 = ev("__jeu.S.servis")
    ev(f"__jeu.clic({{x:{x}, y:600}})"); ev("__jeu.avancer(3)")
    check("plat cuisiné servi à la bonne table", ev("__jeu.S.servis") == s0 + 1 and ev("__jeu.S.cuisines") == 1, "score=%s" % ev("__jeu.S.score"))

    # --- 7. un client part pendant que son plat cuit : tout est nettoyé
    ev("__jeu.G.chrono = 'normal'")
    for _ in range(80):
        t2 = ev("(() => { const t = __jeu.S.tables.find(t => t.client && t.client.state === 'call'); return t ? t.i : -1; })()")
        if t2 >= 0: break
        ev("__jeu.avancer(0.5)")
    prendre_commande(t2)
    ev(f"__jeu.clic({{x:{D['x'] + D['w'] / 2}, y:{D['y'] + 90}}})"); ev("__jeu.avancer(2.5)")
    tk2 = ev("__jeu.S.tickets.find(t => t.cuisine && t.etat === 'attente')")
    k2 = {"g1": 0, "g2": 1, "g3": 2, "aux": 2}[tk2["cmd"]["couleur"]]
    clic_poste(k2); pg.keyboard.type(tk2["cmd"]["bonne"]); pg.keyboard.press("Enter"); ev("__jeu.avancer(0.2)")
    check("2e plat en cuisson", ev(f"__jeu.S.cuis.postes[{k2}].etat") == "cuit")
    ev(f"__jeu.S.tables[{tk2['table']}].client.patience = 0.0001"); ev("__jeu.avancer(0.5)")
    check("le client est parti : poste, ticket et passe-plats nettoyés", ev(f"__jeu.S.cuis.postes[{k2}].etat") == "repos" and not ev("__jeu.S.tickets.some(t => t.id === %d)" % tk2["id"]) and ev("__jeu.S.hatchQ.length") == 0)
    check("la série sans client parti retombe à 0", ev("__jeu.S.serie") == 0)
    pg.screenshot(path=out + "/c11_client_parti.png")
    ev("__jeu.G.vue = 'salle'; __jeu.G.trans = null")

    # --- 8. partie complète automatique avec un joueur parfait en salle ET en cuisine (mode lent) : aucune erreur, ça avance
    ev("__jeu.BAL.cuisineApres = 3; __jeu.BAL.cuisineProba = 0.6; __jeu.G.chrono = 'lent'; __jeu.G.duree = 0; __jeu.G.groupe = 0; __jeu.start()")
    SOAK = """() => {
      const J = __jeu, S = J.S, G = J.G; if (!S || G.mode !== 'play' || G.trans) return;
      const cu = S.cuis;
      if (G.vue === 'cuisine') {
        if (cu.saisie) { const tk = S.tickets.find(t => t.id === cu.saisie.ticketId); if (tk) { J.majTexte(tk.cmd.bonne); J.validerSaisie(); } return; }
        const pret = cu.postes.findIndex(p => p.etat === 'pret');
        if (pret >= 0) { J.clic({x: J.POSTES[pret].x, y: J.POSTES[pret].base - 150}); return; }
        const sel = J.ticketSelId();
        if (sel) { const tk = S.tickets.find(t => t.id === sel); const k = {g1:0,g2:1,g3:2,aux:2}[tk.cmd.couleur]; if (cu.postes[k].etat === 'repos') { J.clic({x: J.POSTES[k].x, y: J.POSTES[k].base - 150}); return; } }
        if (!cu.postes.some(p => p.etat === 'cuit') || !sel) { if (!sel && !cu.postes.some(p => p.etat === 'cuit' || p.etat === 'pret')) J.changerVue('salle'); }
        return;
      }
      if (S.dial) { J.avancerDialogue(); return; }
      if (S.panel) { if (S.panel.feedback) { J.reessayer(); return; } const c = S.panel.cmd; J.choisir(c.choix.indexOf(c.bonne)); return; }
      const sv = S.serveur; if (sv.task || sv.path.length || sv.poseT > 0) return;
      if (sv.carry) { J.clic({x: S.tables[sv.carry.table].x, y: 600}); return; }
      const att0 = J.commandesEnAttente(); if (att0.length) { J.demanderChoix(att0[0].table); return; }
      const t = S.tables.find(t => t.client && t.client.state === 'call'); if (t) { J.clic({x: t.x, y: 600}); return; }
      const att = S.tickets.some(t => t.cuisine && t.etat === 'attente') || cu.postes.some(p => p.etat === 'pret');
      if (att && cu.ouverte) J.clic({x: J.DOOR.x + 50, y: J.DOOR.y + 90});
    }"""
    for _ in range(1200):
        ev(SOAK); ev("__jeu.avancer(0.5)")
        if ev("__jeu.G.mode") != "play": break
    S = ev("({servis: __jeu.S.servis, cuisines: __jeu.S.cuisines, vies: __jeu.S.vies, partis: __jeu.S.partis, niveau: __jeu.S.niveau, mode: __jeu.G.mode, erreurs: __jeu.S.erreurs.length, ouverte: __jeu.S.cuis.ouverte})")
    print("   parcours parfait :", S)
    check("joueur parfait salle + cuisine : plats cuisinés servis", S["cuisines"] >= 10 and S["servis"] >= 30, str(S))
    check("joueur parfait : aucune erreur de forme", S["erreurs"] == 0)
    check("joueur parfait : le jeu ne reste pas bloqué", S["niveau"] >= 4, "niveau=%s" % S["niveau"])
    pg.screenshot(path=out + "/c12_parcours.png")
    ev("__jeu.G.vue = 'cuisine'; __jeu.G.trans = null; __jeu.rendre()")
    pg.screenshot(path=out + "/c13_cuisine_parcours.png")

    # --- 9. cuisine désactivée : jamais de commande à cuisiner
    ev("__jeu.G.cuisine = 0; __jeu.BAL.cuisineApres = 1; __jeu.G.chrono = 'sans'; __jeu.start()")
    for _ in range(300):
        ev(BOT); ev("__jeu.avancer(0.5)")
        if ev("__jeu.S.servis") >= 6: break
    check("cuisine désactivée : elle ne s'ouvre jamais", ev("__jeu.S.cuis.ouverte") is False and not ev("__jeu.S.tickets.some(t => t.cuisine)"), "servis=%s" % ev("__jeu.S.servis"))
    ev("localStorage.clear()")
    b.close()

ignore = ("favicon", "ERR_FILE_NOT_FOUND", "Failed to load resource")
erreurs = [e for e in errors if not any(s in e for s in ignore)]
print("ERREURS CONSOLE :", json.dumps(erreurs, ensure_ascii=False, indent=1))
ko = [n for n, ok in checks if not ok]
print("\nBILAN :", len(checks) - len(ko), "/", len(checks), "contrôles OK", "— ÉCHECS :" if ko else "", ko if ko else "")
sys.exit(1 if (ko or erreurs) else 0)
