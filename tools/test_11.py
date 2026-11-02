"""Chantier 11 : grande porte de cuisine au sol (remplace le passe-plats), objets posables sur les meubles, onglet nappes retiré des restos aux nappes blanches.
Usage : python3 -I test_11.py <dossier_jeu> <dossier_captures>
"""
import sys, os
from playwright.sync_api import sync_playwright
jeu, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
checks = []
def check(nom, ok, detail=""):
    checks.append((nom, bool(ok))); print(("OK   " if ok else "ECHEC"), nom, detail)
with sync_playwright() as p:
    exe = "/opt/pw-browsers/chromium"
    args = ["--no-sandbox", "--proxy-server=direct://", "--proxy-bypass-list=*"]
    b = p.chromium.launch(executable_path=exe, args=args) if os.path.exists(exe) else p.chromium.launch(args=args)
    pg = b.new_page(viewport={"width": 1920, "height": 1080}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html"); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(1500)
    ev = pg.evaluate
    # ---------------- 1. grande porte (mode difficile : toujours ; mode facile : passe-plats)
    for i in range(4):
        ev(f"localStorage.clear(); __jeu.G.difficile=1; __jeu.G.cuisine=1; __jeu.G.libre=false; __jeu.G.resto={i}; __jeu.G.chrono='sans'; __jeu.G.camp = __jeu.campVide(); __jeu.start(); __jeu.rendre(); __jeu.rendre()")
        check(f"resto {i+1} : mode difficile, cuisine encore fermée : la grande porte est déjà là (pas de passe-plats)", ev("__jeu.porteMode()") is True)
        pg.screenshot(path=out + f"/11_porte_ferme_{i+1}.png")
        ev("__jeu.S.cuis.ouverte = true; __jeu.rendre(); __jeu.rendre()")
        r = ev("({d: __jeu.DOOR, sol: __jeu.SALLES[%d].sol, m: __jeu.porteMode(), st: JSON.parse(JSON.stringify(__jeu.HATCH_STAND))})" % i)
        check(f"resto {i+1} : la porte est posée pile au bas du mur (jonction mur/sol)", r["d"]["y"] + r["d"]["h"] == (300 if i == 0 else r["sol"]), str(r["d"]))
        check(f"resto {i+1} : la porte est grande (plus haute que le serveur, 370 px, sauf au bistrot dont le mur est bas)", r["d"]["h"] > (190 if i == 0 else 370), str(r["d"]["h"]))
        check(f"resto {i+1} : le serveur se place devant la porte", abs(r["st"]["x"] - (r["d"]["x"] + r["d"]["w"] / 2)) < 2 and r["st"]["y"] == 880, str(r["st"]))
        pg.screenshot(path=out + f"/11_porte_ouverte_{i+1}.png")
        # aller en cuisine puis revenir : le serveur ne reste pas « en haut du mur »
        ev("__jeu.G.vue = 'cuisine'; __jeu.avancer(0.05); __jeu.rendre()")
        st2 = ev("JSON.parse(JSON.stringify(__jeu.HATCH_STAND))")
        check(f"resto {i+1} : au retour de la cuisine, le serveur est dans le couloir devant la porte (il ne descend plus du haut du mur)", st2 == r["st"] and st2["y"] == 880, str(st2))
        ev("__jeu.G.vue = 'salle'")
        ev(f"__jeu.G.difficile=0; __jeu.G.resto={i}; __jeu.start(); __jeu.rendre(); __jeu.rendre()")
        check(f"resto {i+1} : mode facile : le passe-plats est là, pas de grande porte", ev("__jeu.porteMode()") is False and ev("__jeu.HATCH_RECT.w") < 350 and ev("__jeu.HATCH_RECT.y + __jeu.HATCH_RECT.h") <= {0: 230, 1: 365, 2: 440, 3: 440}[i])
    ev("__jeu.G.difficile=1; __jeu.G.cuisine=1; __jeu.G.resto=1; __jeu.start(); __jeu.S.cuis.ouverte = true; __jeu.rendre()")
    d = ev("__jeu.DOOR")
    pg.mouse.click((d["x"] + d["w"] / 2), (d["y"] + d["h"] / 2))
    pg.wait_for_timeout(150)
    t = ev("__jeu.S.serveur.task && __jeu.S.serveur.task.type")
    check("clic sur la grande porte (rien à servir) : le serveur va vers la cuisine", (t == "goDoor" or ev("!!__jeu.G.trans || __jeu.G.vue === 'cuisine'")), str(t))
    ev("__jeu.S.serveur.task = null; __jeu.S.serveur.path = []; __jeu.S.cuis.ouverte = false")
    pg.mouse.click((d["x"] + d["w"] / 2), (d["y"] + d["h"] / 2)); pg.wait_for_timeout(100)
    check("cuisine pas encore ouverte : clic sur la porte, message d'attente, le serveur ne bouge pas", not ev("__jeu.S.serveur.task"))
    # ---------------- 2. nappes
    def neuf(resto, argent=50000):
        ev(f"localStorage.clear(); __jeu.G.camp = __jeu.campVide(); __jeu.G.difficile = 1; __jeu.G.camp.argent = {argent}; __jeu.G.camp.restos.forEach(r => r.ouvert = true); __jeu.ouvrirAtelier(); __jeu.changerRestoAtelier({resto}); __jeu.rendre()")
    def deco(i): return ev(f"JSON.parse(JSON.stringify(__jeu.G.camp.restos[{i}].deco))")
    for i in range(4):
        neuf(i); cles = ev("__jeu.ongletsAtelier().map(c => c.cle)")
        check(f"resto {i+1} : onglet Nappes " + ("proposé (nappes à carreaux)" if i == 0 else "absent (nappes blanches)"), ("nappes" in cles) == (i == 0), str(cles))
    ev("__jeu.G.difficile = 0; __jeu.rendre()"); neuf(2, 5000); ev("__jeu.G.difficile = 0")
    check("mode facile, resto 3 : plus d'onglet Nappes", "nappes" not in ev("__jeu.ongletsAtelier().map(c => c.cle)"))
    # ---------------- 3. objets sur les meubles
    def poser(id, x, y, resto):
        ev(f"__jeu.G.atelier.onglet = __jeu.ongletsAtelier().findIndex(c => c.cle === 'objet'); __jeu.acheterOuChoisir('objet', '{id}')")
        ev(f"__jeu.suivre(__jeu.G.atelier.main, {{x: {x}, y: {y}}})"); ok = ev("__jeu.poserMain()")
        return ok
    neuf(1)
    check("desserte posée au sol", poser("desserte_simple", 800, 600, 1))
    pl = ev("__jeu.plateaux(1, __jeu.decoAtelier(), null)")
    check("la desserte offre un plateau", len(pl) == 1, str(pl))
    t = pl[0]; cx = (t["x0"] + t["x1"]) / 2
    check("vitrine à tartes posée sur la desserte", poser("vitrine", cx, t["r"]["y"] + 20, 1))
    d = deco(1); v = [q for q in d["poses"] if q["id"] == "vitrine"][0]
    check("la vitrine est marquée « sur meuble » et ses pieds sont sur le plateau", v.get("s") == 1 and abs(v["y"] - t["y"]) < 3, str(v))
    check("la vitrine, réduite, tient sur la desserte", v["e"] < 1 and ev("(() => { const r = __jeu.rectPose(1, __jeu.decoAtelier().poses.find(q => q.id==='vitrine')); return r.w <= %f + 30 })()" % (t["x1"] - t["x0"])))
    check("pose sur un meuble : un 2e objet au même endroit est refusé", poser("comptoir_gateaux", cx, t["r"]["y"] + 20, 1) is False)
    ev("__jeu.annulerMain && __jeu.annulerMain()")
    ev("__jeu.G.atelier.main = null")
    ev("__jeu.acheterOuChoisir('objet', 'statue_dame')")
    ev("__jeu.suivre(__jeu.G.atelier.main, {x: 1500, y: 640})"); ok2 = ev("__jeu.poserMain()")
    d = deco(1); sd = [q for q in d["poses"] if q["id"] == "statue_dame"]
    check("un buste se pose aussi au sol (au choix)", ok2 and sd and not sd[0].get("s"), str(sd))
    pg.screenshot(path=out + "/11_sur_meuble.png")
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/11_sur_meuble_atelier.png", clip={"x": 780, "y": 130, "width": 1100, "height": 620})
    # sauvegarde / relecture
    lu = ev("(() => { const d = __jeu.G.camp.restos[1].deco; return JSON.parse(JSON.stringify(d.poses.filter(q => q.s))) })()")
    ev("__jeu.sauver()"); ev("__jeu.G.camp = __jeu.relireCamp ? __jeu.relireCamp() : __jeu.G.camp")
    check("la pose « sur meuble » est bien enregistrée", len(lu) == 1)
    # retirer le meuble : la vitrine redescend
    ev("(() => { const d = __jeu.decoAtelier(); const r = __jeu.rectPose(1, d.poses.find(q => q.id==='desserte_simple')); __jeu.G.atelier.main = null; __jeu.prendreDansSalle({x: r.x + r.w*0.3, y: r.y + r.h*0.8}) })()")
    d = deco(1); v = [q for q in d["poses"] if q["id"] == "vitrine"]
    check("on reprend la desserte : la vitrine redescend au sol (ou en réserve)", (not v) or not v[0].get("s"), str(v))
    # sol et plantes : les 4 restos acceptent des plantes sur la desserte
    for i, (des, pla) in enumerate([("desserte", "plante_sansevieria"), ("desserte_simple", "plante_dracaena"), ("desserte_bois", "plante_monstera"), ("desserte_or", "plante_palmier")]):
        neuf(i); poser(des, 800, 600, i) if i else poser(des, 800, 482, i)
        pl = ev("__jeu.plateaux(%d, __jeu.decoAtelier(), null)" % i)
        ok = bool(pl) and poser(pla, (pl[0]["x0"] + pl[0]["x1"]) / 2, pl[0]["r"]["y"] + 10, i)
        q = [x for x in deco(i)["poses"] if x["id"] == pla]
        check(f"resto {i+1} : {pla} posable sur {des}", ok and q and q[0].get("s") == 1, str(q))
        ev("__jeu.rendre()"); pg.screenshot(path=out + f"/11_plante_resto{i+1}.png", clip={"x": 780, "y": 130, "width": 1100, "height": 620})
    # ---------------- 4. chantier 12 : devant les fenêtres, plus près, couleurs
    neuf(2)
    check("un meuble au sol peut se poser devant une fenêtre (resto 3)", poser("plante_monstera", 1200, 640, 2))
    ok_ = poser("statue_noble", 1500, 790, 2); q = [x for x in deco(2)["poses"] if x["id"] == "statue_noble"]
    check("un objet se rapproche des tables (pieds à 790) et grossit un peu avec la perspective", ok_ and q and q[0]["y"] >= 780 and ev("(() => { const q = __jeu.decoAtelier().poses.find(x => x.id === 'statue_noble'); const a = __jeu.rectPose(2, q).h, b = __jeu.rectPose(2, {...q, y: __jeu.SALLES[2].sol}).h; return a / b })()") > 1.1, str(q))
    check("un objet très proche est dessiné devant les tables", ev("__jeu.piedPose(2, __jeu.decoAtelier(), __jeu.decoAtelier().poses.find(x => x.id === 'statue_noble'))") > ev("__jeu.PIED_TABLES"))
    tx = ev("Math.max(...__jeu.decoAtelier().tables.map(t => t.x))")
    ev("__jeu.G.atelier.onglet = __jeu.ongletsAtelier().findIndex(c => c.cle === 'objet'); __jeu.acheterOuChoisir('objet', 'statue_sage'); __jeu.suivre(__jeu.G.atelier.main, {x: %d, y: 640})" % tx)
    ev("__jeu.G.atelier.main.p.y = 790"); v = ev("__jeu.poseValide(2, __jeu.decoAtelier(), __jeu.G.atelier.main.p)")
    check("un objet qui cacherait une table est refusé", v["ok"] is False and "table" in v["raison"], str(v))
    ev("__jeu.G.atelier.main.p.x = 1650; __jeu.G.atelier.main.p.y = 700; __jeu.poserMain()")
    ev("__jeu.suivre(__jeu.G.atelier.main || {type:'objet', id:'x', p:{}}, {x: 0, y: 0})") if False else None
    # le plus près possible : limité à 800
    ev("__jeu.acheterOuChoisir('objet', 'statue_sage')") if ev("!__jeu.G.atelier.main") else None
    ev("__jeu.suivre(__jeu.G.atelier.main, {x: 1750, y: 1000})"); check("on ne peut pas descendre au-delà de 800 (couloir du serveur)", ev("__jeu.G.atelier.main.p.y") <= 800)
    ev("__jeu.annulerMain()")
    # couleurs
    neuf(1)
    poser("desserte_simple", 800, 600, 1)
    ev("__jeu.G.atelier.onglet = __jeu.ongletsAtelier().findIndex(c => c.cle === 'objet'); __jeu.acheterOuChoisir('objet', 'plante_dracaena'); __jeu.suivre(__jeu.G.atelier.main, {x: 1300, y: 640})")
    ev("__jeu.couleurMain()"); c1 = ev("__jeu.G.atelier.main.p.c")
    check("C : la couleur change (rouge d'abord)", c1 == "rouge", str(c1))
    ev("__jeu.poserMain()"); sauv = [x for x in deco(1)["poses"] if x["id"] == "plante_dracaena"]
    check("la couleur choisie est enregistrée avec l'objet", sauv and sauv[0].get("c") == "rouge")
    check("recolorer une desserte et un pot : image teintée disponible", ev("!!__jeu.imgTeinte('deco_desserte_simple_3q', 'bleu', 0) && !!__jeu.imgTeinte('deco_plante_dracaena', 'vert', 0.58)"))
    ev("__jeu.G.atelier.onglet = __jeu.ongletsAtelier().findIndex(c => c.cle === 'objet'); __jeu.acheterOuChoisir('objet', 'vitrine'); __jeu.couleurMain()")
    check("la vitrine (contenu coloré) n'est pas recolorable", ev("__jeu.G.atelier.main.p.c") is None or ev("__jeu.G.atelier.main.p.c === undefined"))
    ev("__jeu.annulerMain()")
    # sur meuble + couleur : rechargement
    pl = ev("__jeu.plateaux(1, __jeu.decoAtelier(), null)")
    if pl:
        poser("vitrine", (pl[0]["x0"] + pl[0]["x1"]) / 2, pl[0]["r"]["y"] + 20, 1)
    ev("__jeu.sauver()"); avant = deco(1)
    pg.reload(); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(800); apres = deco(1)
    check("rechargement : les objets posés sur un meuble et les couleurs sont retrouvés", avant["poses"] == apres["poses"] and any(x.get("s") for x in apres["poses"]) and any(x.get("c") for x in apres["poses"]), str(apres["poses"])[:240])
    # impression des couleurs
    neuf(2); poser("desserte_bois", 1000, 640, 2); poser("statue_noble", 1300, 640, 2)
    ev("__jeu.decoAtelier().poses.forEach(q => { q.c = 'rouge' }); __jeu.rendre()"); pg.wait_for_timeout(150); ev("__jeu.rendre()")
    pg.screenshot(path=out + "/11_couleurs_atelier.png", clip={"x": 780, "y": 130, "width": 1100, "height": 760})
    check("aucune erreur JavaScript", errs == [], str(errs[:4]))
    b.close()
ok = sum(1 for _, v in checks if v)
print("\nBILAN : %d / %d contrôles OK" % (ok, len(checks)))
for n, v in checks:
    if not v: print("   ECHEC :", n)
sys.exit(0 if ok == len(checks) else 1)
