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
    # ---------------- 1. grande porte
    for i in range(4):
        ev(f"localStorage.clear(); __jeu.G.difficile=1; __jeu.G.cuisine=1; __jeu.G.libre=false; __jeu.G.resto={i}; __jeu.G.chrono='sans'; __jeu.G.camp = __jeu.campVide(); __jeu.start(); __jeu.rendre()")
        h0 = ev("[__jeu.HATCH_RECT.x, __jeu.HATCH_RECT.w]")
        check(f"resto {i+1} : cuisine fermée, le passe-plats est là, pas de grande porte", ev("__jeu.porteMode()") is False)
        pg.screenshot(path=out + f"/11_porte_ferme_{i+1}.png")
        ev("__jeu.S.cuis.ouverte = true; __jeu.rendre(); __jeu.rendre()")
        r = ev("({d: __jeu.DOOR, sol: __jeu.SALLES[%d].sol, m: __jeu.porteMode(), st: __jeu.HATCH_STAND})" % i)
        check(f"resto {i+1} : cuisine ouverte → la grande porte remplace le passe-plats", r["m"] is True)
        check(f"resto {i+1} : la porte est posée pile au bas du mur (jonction mur/sol)", r["d"]["y"] + r["d"]["h"] == (320 if i == 0 else r["sol"]), str(r["d"]))
        check(f"resto {i+1} : la porte est grande (plus haute que le serveur, 370 px, sauf au bistrot dont le mur est bas)", r["d"]["h"] > (190 if i == 0 else 370), str(r["d"]["h"]))
        check(f"resto {i+1} : le serveur se place devant la porte", abs(r["st"]["x"] - (r["d"]["x"] + r["d"]["w"] / 2)) < 2 and r["st"]["y"] <= 880)
        pg.screenshot(path=out + f"/11_porte_ouverte_{i+1}.png")
    # clic sur la porte : sans assiette en attente → la cuisine
    ev("__jeu.G.mouse = {x:0,y:0}")
    d = ev("__jeu.DOOR")
    pg.mouse.click((d["x"] + d["w"] / 2) * 1 * (1920 / 1920), (d["y"] + d["h"] / 2))
    pg.wait_for_timeout(150)
    t = ev("__jeu.S.serveur.task && __jeu.S.serveur.task.type")
    check("clic sur la grande porte (rien à servir) : le serveur va vers la cuisine", t == "goDoor", str(t))
    # retour à la salle fermée : le passe-plats revient (nouvelle partie)
    ev("__jeu.start(); __jeu.rendre()")
    check("nouvelle partie : cuisine à nouveau fermée, passe-plats rétabli", ev("__jeu.porteMode()") is False and abs(ev("__jeu.HATCH_RECT.x") - 190) < 1)
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
    check("aucune erreur JavaScript", errs == [], str(errs[:4]))
    b.close()
ok = sum(1 for _, v in checks if v)
print("\nBILAN : %d / %d contrôles OK" % (ok, len(checks)))
for n, v in checks:
    if not v: print("   ECHEC :", n)
sys.exit(0 if ok == len(checks) else 1)
