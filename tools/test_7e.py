"""Chantier 7E : article « légende » du Palace, émission Toque chef (épreuve passé simple / imparfait), étoiles de franchise, écran des franchises.
Usage : python3 -I test_7e.py <dossier_jeu> <dossier_captures>
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
    ev("localStorage.clear(); __jeu.G.camp = __jeu.campVide(); __jeu.G.guide = []; __jeu.G.camp.restos.forEach(r => r.ouvert = true)")
    check("données : 16 phrases d'épreuve, 5 articles", ev("[PRESSE.EPREUVE.length, PRESSE.ARTICLES.length]") == [16, 5])
    check("chaque phrase a un trou et une seule bonne forme", ev("PRESSE.EPREUVE.every(e => e.t.includes('___') && ['ps','imp'].includes(e.bon) && e.ps && e.imp && e.ps !== e.imp && e.regle)"))
    # --- réussite du Palace
    ev("__jeu.G.difficile=0; __jeu.G.libre=false; __jeu.G.resto=3; __jeu.G.chrono='sans'; __jeu.start()")
    ev("__jeu.G.guide = [{id: 0, v: ['a', 'b', 'c'], nom: 'x'}]")
    ev("__jeu.S.servis = 8; __jeu.S.vus = []; __jeu.S.repu = 100; __jeu.verifierGuide()")
    check("Palace réussi : article 4 « légende » publié", ev("__jeu.G.guide.some(a => a.id === 4)") and ev("__jeu.S.article && __jeu.S.article.id") == 4)
    check("Palace réussi : l'émission est en attente", ev("__jeu.G.camp.franchise.attente") is True)
    check("l'article 4 ne compte pas comme une étoile du guide (max 3)", ev("__jeu.G.guide.filter(a => a.id >= 1 && a.id <= 3).length") <= 3)
    pg.wait_for_timeout(100); ev("__jeu.avancer(1); __jeu.rendre()"); pg.screenshot(path=out + "/7e_article.png")
    ev("__jeu.fermerArticle(); __jeu.G.mode = 'carte'; __jeu.avancer(0.2)")
    check("retour à la carte : l'émission se lance toute seule", ev("__jeu.G.mode") == "finale" and ev("__jeu.G.camp.franchise.attente") is False)
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/7e_intro.png")
    # --- épreuve : toutes bonnes
    pg.keyboard.press("Space")
    check("intro → première phrase", ev("__jeu.G.toque.phase") == "q")
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/7e_question.png")
    def bonne():
        return ev("(() => { const T = __jeu.G.toque, e = PRESSE.EPREUVE[T.liste[T.q].i]; const f = T.liste[T.q].ordre ? [e.ps, e.imp] : [e.imp, e.ps]; return f.indexOf(e[e.bon]); })()")
    def fausse(): return 1 - bonne()
    ids = ev("__jeu.G.toque.liste.map(l => l.i)")
    check("6 phrases différentes", len(set(ids)) == 6)
    for q in range(6):
        ev(f"__jeu.repondreFinale({bonne()})")
        if q == 0: ev("__jeu.rendre()"); pg.screenshot(path=out + "/7e_retour.png")
        check(f"phrase {q+1} : bonne réponse reconnue", ev("__jeu.G.toque.phase") == "fb" and ev("__jeu.G.toque.rep.bon") is True)
        pg.keyboard.press("Space")
    check("0 faute → bilan, 3 étoiles, franchise enregistrée", ev("__jeu.G.toque.phase") == "bilan" and ev("__jeu.G.toque.etoiles") == 3 and ev("__jeu.G.camp.franchise.etoiles") == 3 and ev("__jeu.G.camp.franchise.essais") == 1)
    ev("__jeu.avancer(3.5)"); pg.screenshot(path=out + "/7e_bilan.png")
    check("les 3 étoiles s'allument et des confettis tombent", ev("__jeu.G.toque.vues") == 3 and ev("__jeu.G.toque.conf.length") > 0)
    # --- rejouer avec fautes : le meilleur résultat est gardé
    ev("__jeu.lancerFinale()")
    ev("__jeu.G.toque.phase = 'q'")
    for q in range(6):
        ev(f"__jeu.repondreFinale({fausse() if q < 4 else bonne()})"); ev("__jeu.G.toque.t = 5"); pg.keyboard.press("Space")
    check("4 fautes → 1 étoile affichée", ev("__jeu.G.toque.etoiles") == 1 and ev("__jeu.G.toque.fautes") == 4)
    check("le meilleur résultat (3 étoiles) est conservé, 2 essais", ev("__jeu.G.camp.franchise.etoiles") == 3 and ev("__jeu.G.camp.franchise.essais") == 2)
    # --- sauvegarde
    ev("__jeu.sauver()")
    sv = ev("JSON.parse(localStorage.getItem(__jeu.CLE))")
    check("sauvegarde : version 2 + franchise", sv.get("version") == 2 and sv["camp"]["franchise"]["etoiles"] == 3)
    ev("__jeu.G.camp = __jeu.campLire(JSON.parse(localStorage.getItem(__jeu.CLE)).camp)")
    check("rechargement : la franchise est relue", ev("__jeu.G.camp.franchise.etoiles") == 3 and ev("__jeu.G.camp.franchise.essais") == 2)
    check("ancienne sauvegarde (sans franchise) acceptée", ev("(() => { const o = JSON.parse(localStorage.getItem(__jeu.CLE)).camp; delete o.franchise; return __jeu.campLire(o).franchise.etoiles; })()") == 0)
    # --- écran des franchises
    ev("__jeu.G.camp.restos.forEach((r, i) => { r.etoiles = i % 3 + 1; r.reussi = true; })")
    ev("__jeu.G.mode = 'carte'; __jeu.rendre()"); pg.screenshot(path=out + "/7e_carte.png")
    pg.keyboard.press("f")
    check("touche F : écran des franchises", ev("__jeu.G.mode") == "franchises")
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/7e_franchises.png")
    pg.keyboard.press("Enter")
    check("Entrée sur les franchises : l'émission se relance", ev("__jeu.G.mode") == "finale" and ev("__jeu.G.toque.phase") == "intro")
    pg.keyboard.press("Escape")
    check("Échap : retour à la carte", ev("__jeu.G.mode") == "carte")
    # --- le jeu ordinaire ne lance pas l'émission, l'entraînement libre n'écrit pas d'article 4
    ev("__jeu.G.camp = __jeu.campVide(); __jeu.G.guide = []; __jeu.G.mode = 'carte'; __jeu.avancer(0.5)")
    check("sans réussite du Palace, pas d'émission", ev("__jeu.G.mode") == "carte")
    ev("__jeu.G.libre = true; __jeu.G.groupe = 1; __jeu.G.guide = [0,1,2,3].map(id => ({id, v: ['a','b','c'], nom: 'x'})); __jeu.start(); __jeu.S.servis = 8; __jeu.S.repu = 100; __jeu.verifierGuide()")
    check("entraînement libre : pas d'article « légende »", ev("__jeu.G.guide.some(a => a.id === 4)") is False)
    check("aucune erreur JavaScript", not errs, str(errs[:3]))
    b.close()
bad = [n for n, ok in checks if not ok]
print(f"\n{len(checks) - len(bad)} / {len(checks)} contrôles réussis")
sys.exit(1 if bad else 0)
