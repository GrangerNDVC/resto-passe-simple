"""Chantier 8A : mode difficile, sablier de patience, temps de cuisine, passe-plats / porte.
Usage : python3 -I test_8a.py <dossier_jeu> <dossier_captures>
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
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html"); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(800)
    ev = pg.evaluate
    ev("localStorage.clear()")
    # ---- mode facile / difficile
    check("premier lancement : mode facile par défaut", ev("__jeu.G.difficile") == 0)
    ev("__jeu.G.mode = 'carte'; __jeu.rendre(); __jeu.ouvrirAtelier()")
    check("facile (chantier 8D) : l'atelier s'ouvre, mais ne propose que les tables et les nappes", ev("__jeu.G.mode") == "atelier" and ev("__jeu.ongletsAtelier().map(c => c.cle)") == ["nappes", "table"])
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/a1_atelier_facile.png"); ev("__jeu.G.mode = 'carte'")
    ev("__jeu.G.difficile = 1; __jeu.ouvrirAtelier()")
    check("difficile : l'atelier s'ouvre", ev("__jeu.G.mode") == "atelier")
    # déco : le papier peint n'est visible qu'en difficile
    def pixel_mur():
        ev("__jeu.G.mode = 'play'; __jeu.rendre()")
        import io
        from PIL import Image
        return Image.open(io.BytesIO(pg.screenshot(clip={"x": 1000, "y": 150, "width": 1, "height": 1}))).convert("RGB").getpixel((0, 0))
    ev("__jeu.G.chrono = 'sans'; __jeu.G.cuisine = 0; __jeu.G.libre = false; __jeu.G.resto = 0; __jeu.G.camp.restos[0].deco.achats = ['papier:rose']; __jeu.G.camp.restos[0].deco.papier = 'rose'; __jeu.start(); __jeu.avancer(0.1)")
    ev("__jeu.G.difficile = 1"); pd = pixel_mur()
    ev("__jeu.G.difficile = 0"); pf = pixel_mur()
    check("mode facile : le papier peint acheté n'apparaît pas (déco de base)", pd != pf, f"difficile={pd} facile={pf}")
    ev("__jeu.G.difficile = 1")
    # ---- cuisine : + 1 minute d'écriture, dégressif
    ev("__jeu.BAL.cuisineProba = 1; __jeu.BAL.cuisineApres = 0")
    ev("__jeu.G.cuisine = 1; __jeu.G.chrono = 'normal'; __jeu.start(); __jeu.avancer(2.0)")
    # mesure directe du bonus
    bonus = ev("__jeu.BAL.cuisinePlus")
    check("cuisine : bonus d'écriture ≥ 60 s au resto 1, dégressif ensuite", bonus[0] >= 60 and all(bonus[i] >= bonus[i + 1] for i in range(3)), str(bonus))
    ev("__jeu.G.resto = 0; __jeu.G.libre = false; __jeu.G.chrono = 'normal'; __jeu.start(); __jeu.avancer(0.2)")
    ev("__jeu.S.cuis.ouverte = true; __jeu.avancer(2.0)")
    r = ev("""() => { const J = __jeu;
      const tb = J.S.tables.find(t => t.client && t.client.state === 'call'); if (!tb) return null;
      const c = tb.client, base = c.patSec; J.clic({ x: tb.x, y: 600 });
      for (let g = 0; g < 80 && c.etape !== 'cuisine'; g++) { J.avancer(0.3); if (J.S.dial) J.avancerDialogue(); }
      return { base, apres: c.patSec, cuisine: c.cuisine, etape: c.etape }; }""")
    check("cuisine : la patience du client à cuisiner = ×2,3 + 60 s (chantier 12 : plus de temps)", r and r["cuisine"] and abs(r["apres"] - (r["base"] * 2.3 + 60)) < 0.01, str(r))
    # ---- sablier
    ev("__jeu.G.cuisine = 0; __jeu.G.chrono = 'sans'; __jeu.G.resto = 0; __jeu.start(); __jeu.avancer(2.5)")
    ok = ev("""() => { const J = __jeu; const tb = J.S.tables.find(t => t.client); if (!tb) return null; const c = tb.client; c.state = 'wait';
      J.G.chrono = 'normal'; c.patience = 0.9; J.update(0.01); const p0 = c.palier;
      c.patience = 0.5; J.update(0.01); const flip = c.flipAt !== undefined; const p1 = c.palier;
      return { p0, p1, flip, table: tb.i }; }""")
    check("sablier : il se retourne quand le client change de palier d'humeur", ok and ok["flip"] and ok["p0"] != ok["p1"], str(ok))
    for k, pat in enumerate([0.95, 0.7, 0.5, 0.35, 0.2, 0.06]):
        ev("(pat => { const J = __jeu; const tb = J.S.tables.find(t => t.client); tb.client.patience = pat; tb.client.state = 'wait'; tb.client.flipAt = undefined; J.G.chrono = 'sans'; J.rendre(); })(%s)" % pat)
        if k in (0, 2, 5): pg.screenshot(path=out + f"/a2_sablier_{k}.png")
    ev("(() => { const J = __jeu; const tb = J.S.tables.find(t => t.client); tb.client.flipAt = J.G.t - 0.3; J.rendre(); })()")
    pg.screenshot(path=out + "/a2_sablier_retournement.png")
    # ---- passe-plats et porte : ni chevauchement, ni sortie de la salle
    g = ev("(() => { const J = __jeu; return { h: J.HATCH_RECT, d: J.DOOR }; })()")
    h, d = g["h"], g["d"]
    check("chantier 12 : en mode difficile la grande porte remplace le passe-plats (même emplacement, aucun chevauchement de deux objets)", h["x"] == d["x"] and h["w"] == d["w"] and h["y"] == d["y"], str(g))
    check("la porte ne touche pas le rail des tickets (x ≥ 690)", d["x"] + d["w"] <= 700, str(d))
    check("le passe-plats tient dans le mur (bas du comptoir avant la plinthe + 80 px)", h["y"] + h["h"] <= 380, str(h))
    ev("__jeu.G.cuisine = 1; __jeu.start(); __jeu.avancer(0.3); __jeu.S.cuis.ouverte = true; __jeu.rendre()")
    pg.screenshot(path=out + "/a3_porte_passe_plats.png")
    check("aucune erreur JavaScript", not errs, str(errs))
    b.close()
bad = [n for n, ok in checks if not ok]
print("\nBILAN :", len(checks) - len(bad), "/", len(checks), "contrôles OK", "" if not bad else bad)
sys.exit(1 if bad else 0)
