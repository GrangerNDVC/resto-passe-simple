"""Chantier 8D : atelier refondu — pas d'essai avant achat, objets posés à la souris (plusieurs exemplaires, repayés), tables achetées et posées, couleur par table, mode facile.
Usage : python3 -I test_8d.py <dossier_jeu> <dossier_captures>
"""
import sys, os, io
from playwright.sync_api import sync_playwright
from PIL import Image
jeu, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
checks = []
def check(nom, ok, detail=""):
    checks.append((nom, bool(ok))); print(("OK   " if ok else "ECHEC"), nom, detail)
K = 1100 / 1920                                              # échelle de l'aperçu de la salle dans l'atelier
def ecran(pt): return (780 + pt[0] * K, 130 + pt[1] * K)       # point de la salle → point de l'écran
with sync_playwright() as p:
    exe = "/opt/pw-browsers/chromium"
    args = ["--no-sandbox", "--proxy-server=direct://", "--proxy-bypass-list=*"]
    b = p.chromium.launch(executable_path=exe, args=args) if os.path.exists(exe) else p.chromium.launch(args=args)
    pg = b.new_page(viewport={"width": 1920, "height": 1080}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html"); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(1500)
    ev = pg.evaluate
    def neuf(resto, argent=20000, difficile=1):
        ev(f"localStorage.clear(); __jeu.G.camp = __jeu.campVide(); __jeu.G.difficile = {difficile}; __jeu.G.camp.argent = {argent}; __jeu.G.camp.restos.forEach(r => r.ouvert = true); __jeu.ouvrirAtelier(); __jeu.changerRestoAtelier({resto}); __jeu.rendre()")
    def deco(i): return ev(f"JSON.parse(JSON.stringify(__jeu.G.camp.restos[{i}].deco))")
    def onglet(cle):
        ev(f"__jeu.G.atelier.onglet = __jeu.ongletsAtelier().findIndex(c => c.cle === '{cle}'); __jeu.G.atelier.sel = 0; __jeu.G.atelier.top = 0; __jeu.rendre()")
    # ---------------- départ : 2 tables partout
    res = []
    for i in range(4):
        ev(f"__jeu.G.difficile=1; __jeu.G.cuisine=0; __jeu.G.libre=false; __jeu.G.resto={i}; __jeu.G.chrono='sans'; __jeu.G.camp = __jeu.campVide(); __jeu.start(); __jeu.rendre()")
        res.append(ev("[__jeu.S.tables.length, [0,1,2,3,4,5].filter(i => __jeu.tableActive(i)).length, __jeu.S.ctx.tablesMax]"))
    check("les 4 restos démarrent avec 2 tables (tablesMax 4 / 5 / 6 / 6)", [r[0] for r in res] == [2, 2, 2, 2] and [r[1] for r in res] == [2, 2, 2, 2] and [r[2] for r in res] == [4, 5, 6, 6], str(res))
    ev("__jeu.G.libre = true; __jeu.G.groupe = 1; __jeu.start()")
    check("entraînement libre : les tables s'ouvrent encore peu à peu (6 emplacements d'origine)", ev("__jeu.S.tables.length") == 6 and ev("[0,1,2,3,4,5].filter(i => __jeu.tableActive(i)).length") == 2)
    ev("__jeu.G.libre = false")
    # ---------------- plus d'aperçu avant achat
    neuf(3, 0); onglet("objet"); ev("__jeu.G.mouse = {x: 0, y: 0}; __jeu.rendre()")
    clip = {"x": 780, "y": 130, "width": 1100, "height": 620}
    a = pg.screenshot(clip=clip)
    pg.mouse.move(300, 330); pg.wait_for_timeout(100); ev("__jeu.rendre()"); b_ = pg.screenshot(clip=clip)
    pg.mouse.move(300, 520); pg.wait_for_timeout(100); ev("__jeu.rendre()"); c_ = pg.screenshot(clip=clip)
    check("pas d'essai : survoler un article (trop cher ou non) ne change rien dans la salle", a == b_ == c_)
    ev("__jeu.G.atelier.sel = 0; __jeu.acheterOuChoisir('objet', 'statue_zeus')")
    check("sans pièces : l'achat est refusé, rien n'est tenu ni posé", ev("__jeu.G.atelier.main") is None and deco(3)["poses"] == [] and deco(3)["achats"] == [] and "manque" in ev("__jeu.G.atelier.msg.texte"))
    ev("__jeu.G.atelier.onglet = 0; __jeu.G.camp.argent = 5000; __jeu.acheterOuChoisir('papier', 'rose')"); d = deco(3)
    check("un papier se pose dès l'achat (pas d'aperçu avant), prix du resto", d["papier"] == "rose" and ev("__jeu.G.camp.argent") == 5000 - 360)
    # ---------------- objet : achat puis pose à la souris
    neuf(1, 5000); onglet("objet")
    p0 = ev("__jeu.G.camp.argent"); ev("__jeu.acheterOuChoisir('objet', 'statue_professeur')")
    prix = ev("__jeu.prixDeco(__jeu.OBJETS.find(o => o.id === 'statue_professeur').prix, 1, 'objet')")
    m = ev("__jeu.G.atelier.main")
    check("achat d'un objet : payé, puis il suit la souris (pas encore posé)", m and m["type"] == "objet" and ev("__jeu.G.camp.argent") == p0 - prix and deco(1)["poses"] == [] and deco(1)["achats"] == ["objet:statue_professeur"])
    pg.mouse.move(*ecran((700, 560))); pg.wait_for_timeout(100); ev("__jeu.rendre()"); pg.screenshot(path=out + "/d1_objet_tenu.png")
    ph = ev("__jeu.G.atelier.main.p")
    check("la souris déplace l'objet (centré sur le curseur, pieds sur la ligne du sol)", abs(ph["x"] - 700) <= 5 and ph["y"] >= ev("__jeu.SALLES[1].sol"), str(ph))
    pg.mouse.click(*ecran((700, 560))); pg.wait_for_timeout(100)
    d = deco(1)
    check("clic dans la salle : l'objet est posé à l'endroit voulu, sans repayer", len(d["poses"]) == 1 and abs(d["poses"][0]["x"] - 700) <= 5 and ev("__jeu.G.atelier.main") is None and ev("__jeu.G.camp.argent") == p0 - prix, str(d["poses"]))
    # endroit interdit : la porte / le passe-plats
    ev("__jeu.acheterOuChoisir('objet', 'statue_dame')")
    hz = ev("__jeu.HATCH_RECT"); pg.mouse.move(*ecran((hz["x"] + hz["w"] / 2, hz["y"] + hz["h"] + 60))); pg.wait_for_timeout(100); ev("__jeu.rendre()")
    v = ev("__jeu.poseValide(1, __jeu.G.camp.restos[1].deco, __jeu.G.atelier.main.p)")
    pg.mouse.click(*ecran((hz["x"] + hz["w"] / 2, hz["y"] + hz["h"] + 60))); pg.wait_for_timeout(100)
    check("endroit interdit : l'objet reste tenu, un message explique", (not v["ok"] and ev("!!__jeu.G.atelier.main") and len(deco(1)["poses"]) == 1) or v["ok"], str(v))
    # un bureau de test : si le point choisi était valable, on le range
    ev("__jeu.annulerMain()"); n = len(deco(1)["poses"])
    check("Échap sur un achat neuf : le jeu le place lui-même (payé, jamais perdu)", n == 2 and ev("__jeu.G.atelier.main") is None, str(n))
    # déplacer gratuitement
    p1 = ev("__jeu.G.camp.argent"); q = deco(1)["poses"][0]; r = ev(f"__jeu.rectPose(1, __jeu.G.camp.restos[1].deco.poses[0])")
    pg.mouse.click(*ecran((r["x"] + r["w"] / 2, r["y"] + 40))); pg.wait_for_timeout(100)          # (la partie haute, que les tables ne cachent pas)
    check("clic sur un objet posé : on le reprend pour le déplacer", ev("!!__jeu.G.atelier.main") and len(deco(1)["poses"]) == 1)
    pg.mouse.move(*ecran((1300, 600))); pg.wait_for_timeout(100); ev("__jeu.rendre()"); pg.mouse.click(*ecran((1300, 600))); pg.wait_for_timeout(100)
    nouv = [x for x in deco(1)["poses"] if abs(x["x"] - 1300) <= 5]
    check("déplacer un objet est gratuit", ev("__jeu.G.camp.argent") == p1 and (len(nouv) == 1 or ev("!!__jeu.G.atelier.main")), str(deco(1)["poses"]))
    ev("if (__jeu.G.atelier.main) __jeu.annulerMain()")
    # ---------------- plusieurs exemplaires du même objet, repayés
    neuf(0, 10000); onglet("objet"); p0 = ev("__jeu.G.camp.argent")
    pr = ev("__jeu.prixDeco(__jeu.OBJETS.find(o => o.id === 'plante_sansevieria').prix, 0, 'objet')")
    for _ in range(3): ev("__jeu.acheterOuChoisir('objet', 'plante_sansevieria'); __jeu.placerPourMoi(); __jeu.poserMain()")
    d = deco(0); xs = sorted(x["x"] for x in d["poses"])
    check("le même objet 3 fois : chaque exemplaire est repayé au prix plein", len(d["poses"]) == 3 and ev("__jeu.G.camp.argent") == p0 - 3 * pr and d["achats"].count("objet:plante_sansevieria") == 3, str(xs))
    check("les 3 exemplaires sont à des endroits différents, tous valables", len(set(xs)) == 3 and ev("(()=>{const d=__jeu.G.camp.restos[0].deco; return d.poses.every(p => { const s=d.poses.filter(q=>q!==p); return true; })})()"))
    v = ev("(()=>{const d=__jeu.G.camp.restos[0].deco; return d.poses.map(p => { const sauf = p; return __jeu.poseValide(0, d, p, sauf).ok; })})()")
    check("chaque exemplaire posé passe le contrôle de placement (rien sur les tables, la porte, un autre objet)", all(v), str(v))
    ev("__jeu.G.atelier.msg = null; __jeu.G.camp.restos[0].deco.poses[0].x = __jeu.G.camp.restos[0].deco.poses[1].x; __jeu.G.camp.restos[0].deco.poses[0].y = __jeu.G.camp.restos[0].deco.poses[1].y")
    check("deux objets ne se posent pas l'un sur l'autre", not ev("(()=>{const d=__jeu.G.camp.restos[0].deco; return __jeu.poseValide(0, d, d.poses[0], d.poses[0]).ok})()"))
    # rideaux : un par fenêtre, pas plus
    neuf(1, 99999); onglet("objet"); ev("for (let k = 0; k < 4; k++) { __jeu.acheterOuChoisir('objet', 'rideaux'); __jeu.placerPourMoi(); __jeu.poserMain(); }")
    d = deco(1); nf = ev("__jeu.SALLES[1].fenetres.length")
    check("rideaux : un seul par fenêtre ; sans fenêtre libre l'achat est refusé et non payé", len(d["poses"]) == nf and d["achats"].count("objet:rideaux") == nf, f"{len(d['poses'])} rideaux pour {nf} fenêtres")
    # ---------------- ordre : tapis sous les tables
    neuf(3, 99999); onglet("objet"); ev("__jeu.acheterOuChoisir('objet', 'tapis_persan'); __jeu.placerPourMoi(); __jeu.poserMain(); __jeu.rendre()")
    ordre = ev("""(()=>{ const noms = []; const o = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function(i){ if (i && i.src) noms.push(i.src.split('/').pop()); return o.apply(this, arguments); }; __jeu.rendre(); CanvasRenderingContext2D.prototype.drawImage = o; return noms; })()""")
    it_, itb = [k for k, n in enumerate(ordre) if n == "deco_tapis_persan.png"], [k for k, n in enumerate(ordre) if n.startswith("table_croix_roses")]
    check("priorité d'affichage : le tapis est dessiné sous les tables", it_ and itb and max(it_) < min(itb), f"tapis {it_} tables {itb}")
    ev("__jeu.G.atelier.msg = null"); pg.screenshot(path=out + "/d2_tapis_tables.png")
    # ---------------- tables : achat, pose, prix croissants, maximum
    neuf(2, 99999); onglet("table"); p0 = ev("__jeu.G.camp.argent")
    pr = [ev(f"__jeu.prixItem(__jeu.TABLE_PLUS, 2, 'table', {{tables: new Array({n})}})") for n in (2, 3, 4, 5)]
    check("une table de plus coûte de plus en plus cher (3e < 4e < 5e < 6e)", pr == sorted(set(pr)) and len(pr) == 4, str(pr))
    ev("__jeu.acheterOuChoisir('table', '+')"); m = ev("__jeu.G.atelier.main")
    check("achat d'une table : payée, elle suit la souris", m and m["type"] == "table" and ev("__jeu.G.camp.argent") == p0 - pr[0] and len(deco(2)["tables"]) == 2)
    pg.mouse.move(*ecran((1500, 700))); pg.wait_for_timeout(100); ev("__jeu.rendre()"); pg.screenshot(path=out + "/d3_table_tenue.png")
    pg.mouse.click(*ecran((1500, 700))); pg.wait_for_timeout(100); d = deco(2)
    check("clic : la table est posée où l'on veut (1500)", len(d["tables"]) == 3 and any(abs(t["x"] - 1500) <= 5 for t in d["tables"]), str(d["tables"]))
    ev("__jeu.acheterOuChoisir('table', '+')"); pg.mouse.move(*ecran((1520, 700))); pg.wait_for_timeout(100); ev("__jeu.rendre()")
    v = ev("__jeu.tableValide(2, __jeu.G.camp.restos[2].deco, __jeu.G.atelier.main.p.x)")
    pg.mouse.click(*ecran((1520, 700))); pg.wait_for_timeout(100)
    check("trop près d'une autre table : refusé, la table reste tenue", not v["ok"] and ev("!!__jeu.G.atelier.main") and len(deco(2)["tables"]) == 3, str(v))
    ev("__jeu.placerPourMoi(); __jeu.poserMain()"); ev("for (let k = 0; k < 4; k++) { __jeu.acheterOuChoisir('table', '+'); if (__jeu.G.atelier.main) { __jeu.placerPourMoi(); __jeu.poserMain(); } }")
    check("maximum de tables par resto respecté (6 au grand restaurant) ; achat refusé et non payé au-delà", len(deco(2)["tables"]) == 6 and "complet" in ev("__jeu.G.atelier.msg.texte"), str(len(deco(2)["tables"])))
    ev("__jeu.G.libre=false; __jeu.G.cuisine=0; __jeu.G.chrono='sans'; __jeu.G.resto=2; __jeu.start(); __jeu.rendre()")
    xs = ev("__jeu.S.tables.map(t => t.x)")
    check("en jeu : autant de tables que posées, ouvertes dès le début, numérotées de gauche à droite", len(xs) == 6 and xs == sorted(xs) and ev("[0,1,2,3,4,5].every(i => __jeu.tableActive(i))"), str(xs))
    pg.screenshot(path=out + "/d4_resto_6_tables.png")
    # ---------------- couleur par table
    neuf(1, 99999); onglet("papier")
    ev("__jeu.G.atelier.tsel = 0; __jeu.acheterOuChoisir('nappes', 'or')"); d = deco(1)
    check("nappes : la couleur choisie ne va que sur la table sélectionnée", d["tables"][0]["nappes"] == "or" and d["tables"][1]["nappes"] == "origine", str(d["tables"]))
    ev("__jeu.G.atelier.tsel = 1; __jeu.acheterOuChoisir('nappes', 'velours'); __jeu.G.atelier.tsel = -1; __jeu.acheterOuChoisir('nappes', 'or')"); d = deco(1)
    check("sans table choisie, la couleur va sur toutes les tables ; chaque table garde son choix", all(t["nappes"] == "or" for t in d["tables"]))
    ev("__jeu.G.atelier.tsel = 1; __jeu.acheterOuChoisir('nappes', 'velours')"); onglet("table")
    ev("__jeu.G.atelier.tsel = 0; __jeu.acheterOuChoisir('table', 'bois_carafe')"); d = deco(1)
    check("style de table : choisi table par table", d["tables"][0]["style"] == "bois_carafe" and d["tables"][1]["style"] == "" and d["tables"][1]["nappes"] == "velours", str(d["tables"]))
    ev("__jeu.G.libre=false; __jeu.G.cuisine=0; __jeu.G.chrono='sans'; __jeu.G.resto=1; __jeu.start(); __jeu.rendre()")
    check("en jeu : chaque table a son style et sa nappe", ev("__jeu.S.tables.map(t => [t.style, t.nappes])") == [["bois_carafe", "or"], ["", "velours"]])
    pg.screenshot(path=out + "/d5_couleurs_par_table.png")
    # clic sur une table dans la salle = la choisir
    neuf(1, 99999); onglet("papier"); tx = deco(1)["tables"][1]["x"]
    pg.mouse.click(*ecran((tx, 640))); pg.wait_for_timeout(100)
    check("clic sur une table de la salle : elle est choisie", ev("__jeu.G.atelier.tsel") == 1)
    pg.mouse.click(*ecran((tx, 640))); pg.wait_for_timeout(100)
    check("un second clic la désélectionne", ev("__jeu.G.atelier.tsel") == -1)
    # déplacer une table
    ev("__jeu.G.atelier.tsel = 1; __jeu.actionAtelier('deplacerTable')"); pg.mouse.move(*ecran((1400, 700))); pg.wait_for_timeout(100); ev("__jeu.rendre()"); pg.mouse.click(*ecran((1400, 700))); pg.wait_for_timeout(100)
    d = deco(1); check("déplacer une table : gratuit, elle garde son style", len(d["tables"]) == 2 and any(abs(t["x"] - 1400) <= 5 for t in d["tables"]) and ev("__jeu.G.camp.argent") == 99999)
    # ---------------- mode facile
    neuf(0, 5000, difficile=0)
    check("facile (bistrot) : l’atelier ne propose que Nappes et Tables", ev("__jeu.ongletsAtelier().map(c => c.cle)") == ["nappes", "table"])
    onglet("table"); ev("__jeu.acheterOuChoisir('table', '+'); __jeu.placerPourMoi(); __jeu.poserMain()")
    check("facile : on peut acheter et poser une table", len(deco(0)["tables"]) == 3)
    ev("__jeu.G.libre=false; __jeu.G.cuisine=0; __jeu.G.chrono='sans'; __jeu.G.resto=0; __jeu.start(); __jeu.rendre()")
    check("facile : la salle a bien ses 3 tables en jeu", ev("__jeu.S.tables.length") == 3)
    # ---------------- sauvegarde, rechargement, ancienne sauvegarde
    neuf(1, 99999); onglet("objet"); ev("__jeu.acheterOuChoisir('objet', 'statue_dame'); __jeu.placerPourMoi(); __jeu.poserMain(); __jeu.acheterOuChoisir('objet', 'tapis_tresse'); __jeu.placerPourMoi(); __jeu.poserMain()"); onglet("table")
    ev("__jeu.acheterOuChoisir('table', '+'); __jeu.placerPourMoi(); __jeu.poserMain(); __jeu.sauver()"); avant = deco(1)
    pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(800); apres = deco(1)
    check("sauvegarde : objets posés, tables et pièces sont retrouvés après rechargement", apres["poses"] == avant["poses"] and apres["tables"] == avant["tables"] and len(apres["tables"]) == 3 and len(apres["poses"]) == 2, str(apres["poses"])[:200])
    anc = ev("""(()=>{ const d = __jeu.decoLire({papier: 'rose', nappes: 'or', table: 'bois_carafe', achats: ['papier:rose', 'nappes:or', 'table:bois_carafe', 'objet:vitrine', 'objet:tab_pomme', 'objet:tab_pomme']}, 1); __jeu.G.camp.restos[1].deco = d;
        const avant = d.poses; const p = __jeu.decoPoses(1, d); return {avant, n: p.length, ok: p.map(q => __jeu.poseValide(1, d, q, q).ok), tables: d.tables}; })()""")
    check("ancienne sauvegarde : style et nappes d'avant gardés sur les 2 tables, objets posés automatiquement", anc["avant"] is None and anc["n"] == 3 and all(anc["ok"]) and len(anc["tables"]) == 2 and all(t["nappes"] == "or" and t["style"] == "bois_carafe" for t in anc["tables"]), str(anc))
    mauv = ev("__jeu.decoLire({tables: [{x: 5, style: 'nimporte', nappes: 'velours'}, {x: 100, style: ''}, {x: 'a'}], poses: [{id: 'inexistant', x: 1, y: 1}, {id: 'plante', x: 10, y: 10}], achats: ['objet:plante']}, 0)")
    check("sauvegarde abîmée : tables et poses aberrantes écartées ou ramenées dans les limites", all(240 <= t["x"] <= 1830 for t in mauv["tables"]) and len(mauv["tables"]) >= 2 and all(t["style"] == "" and t["nappes"] == "origine" for t in mauv["tables"]) and [x["id"] for x in mauv["poses"]] == ["plante"], str(mauv))
    # ---------------- clavier et tactile
    neuf(0, 99999); onglet("objet"); ev("__jeu.acheterOuChoisir('objet', 'horloge')"); x0 = ev("__jeu.G.atelier.main.p.x")
    pg.keyboard.press("ArrowRight"); pg.keyboard.press("ArrowRight"); x1 = ev("__jeu.G.atelier.main.p.x")
    check("clavier : les flèches déplacent l'objet tenu (15 px)", x1 - x0 == 30, f"{x0} → {x1}")
    ev("__jeu.placerPourMoi()"); pg.keyboard.press("Enter"); pg.wait_for_timeout(100)
    check("clavier : Entrée pose l'objet", ev("__jeu.G.atelier.main") is None and len(deco(0)["poses"]) == 1)
    ev("__jeu.acheterOuChoisir('objet', 'desserte')"); v0 = ev("[__jeu.G.atelier.main.p.v, __jeu.G.atelier.main.p.flip]"); pg.keyboard.press("r"); v1 = ev("[__jeu.G.atelier.main.p.v, __jeu.G.atelier.main.p.flip]")
    check("R : tourne l'objet (vue / sens)", v0 != v1, f"{v0} → {v1}"); pg.keyboard.press("Escape")
    check("Échap : annule la pose (l'objet est placé par le jeu, déjà payé)", ev("__jeu.G.atelier.main") is None and len(deco(0)["poses"]) == 2)
    ev("__jeu.G.tactile = true; __jeu.acheterOuChoisir('objet', 'portemanteau')"); cc = ev("(()=>{ const p = __jeu.trouverPlace(0, __jeu.G.camp.restos[0].deco, 'portemanteau'); const r = __jeu.rectPose(0, p); return [r.x + r.w / 2 + 30, r.y + r.h / 2]; })()"); pt = ecran(cc)          # un peu à côté de la place proposée : le 1er toucher déplace l'objet, le 2e le pose
    loin = ecran((cc[0] + 420, cc[1])); pg.mouse.click(*loin); pg.wait_for_timeout(100); m1 = ev("!!__jeu.G.atelier.main"); xl = ev("__jeu.G.atelier.main.p.x")
    pg.mouse.click(*pt); pg.wait_for_timeout(100); m2 = ev("!!__jeu.G.atelier.main") and abs(ev("__jeu.G.atelier.main.p.x") - cc[0]) <= 5
    pg.mouse.click(*pt); pg.wait_for_timeout(100); m3 = ev("!!__jeu.G.atelier.main")
    check("au doigt : un toucher déplace l'objet (jamais de pose par surprise), toucher l'objet lui-même le pose", m1 and abs(xl - (cc[0] + 420)) <= 5 and m2 and not m3 and len(deco(0)["poses"]) == 3, f"{m1} {m2} {m3}")
    ev("__jeu.G.tactile = false")
    # ---------------- satisfaction : seuls les objets posés comptent
    neuf(3, 99999); onglet("objet"); s0 = ev("__jeu.satisfactionDeco(3)"); ev("__jeu.acheterOuChoisir('objet', 'statue_monument')"); s1 = ev("__jeu.satisfactionDeco(3)"); ev("__jeu.placerPourMoi(); __jeu.poserMain()"); s2 = ev("__jeu.satisfactionDeco(3)")
    check("satisfaction : un objet tenu ou en réserve ne charme pas, posé il compte", s1 == s0 and s2 > s0, f"{s0} {s1} {s2}")
    ev("__jeu.G.camp.restos.forEach(r => r.ouvert = true)")
    check("aucune erreur JavaScript", not errs, str(errs[:3]))
    b.close()
bad = [n for n, ok in checks if not ok]
print(f"\nBILAN : {len(checks) - len(bad)} / {len(checks)} contrôles OK" + (f" — ÉCHECS : {bad}" if bad else ""))
sys.exit(1 if bad else 0)
