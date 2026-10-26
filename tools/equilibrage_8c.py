"""Chantier 8C : équilibrage de la déco. Fait jouer un robot (profils parfait / moyen / en difficulté) à chaque resto de la campagne, en mode facile (le robot ne cuisine pas),
mesure les pièces gagnées jusqu'au premier succès de presse, estime le bonus de cuisine du mode difficile, puis calcule combien de services il faut pour s'équiper.
Usage : python3 -I equilibrage_8c.py <dossier_jeu> [duree_max_s]
"""
import sys, os, json
from playwright.sync_api import sync_playwright
jeu = sys.argv[1]; MAX = float(sys.argv[2]) if len(sys.argv) > 2 else 1500

BOT = """
(cfg) => {
  const J = window.__jeu;
  const R = (() => { let s = cfg.seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const B = { wait: 0, stat: { rep: 0, ok: 0 } };
  window.__bot = B;
  B.tick = (dt) => {
    const S = J.S; if (!S || J.G.mode !== 'play') return;
    if (S.article) { J.fermerArticle(); return; }          // l'article du guide (5 clients servis) bloque le jeu : le robot le ferme
    if (S.panel) {
      B.wait += dt;
      if (B.wait >= cfg.delay) {
        B.wait = 0; const c = S.panel.cmd, bon = c.choix.indexOf(c.bonne);
        const juste = R() < cfg.acc; B.stat.rep++; if (juste) B.stat.ok++;
        const faux = c.choix.map((_, k) => k).filter((k) => k !== bon);
        J.choisir(juste ? bon : faux[Math.floor(R() * faux.length)]);
      }
      return;
    }
    B.wait = 0;
    const sv = S.serveur; if (sv.task || sv.path.length || sv.poseT > 0) return;
    if (sv.carry) { J.clic({ x: S.tables[sv.carry.table].x, y: 600 }); return; }
    const t = S.tables.filter((t) => t.client && t.client.state === 'call').sort((a, b) => a.client.patience - b.client.patience)[0];
    if (t) J.clic({ x: t.x, y: 600 });
  };
}
"""

PROFILS = [("parfait (100 %, 2 s)", dict(acc=1.0, delay=2.0, seed=7)), ("moyen (70 %, 5 s)", dict(acc=0.70, delay=5.0, seed=11)), ("en difficulté (50 %, 8 s)", dict(acc=0.50, delay=8.0, seed=13, chrono='lent'))]

def service(pg, i, cfg):
    pg.evaluate("""(i) => { __jeu.G.camp.restos.forEach(r => r.ouvert = true); __jeu.G.difficile = 0; __jeu.G.cuisine = 0; __jeu.G.libre = false; __jeu.G.chrono = 'normal'; __jeu.G.duree = 0; __jeu.G.resto = i; window.__a0 = __jeu.G.camp.argent; __jeu.start(); window.__bot = null; }""", i)
    pg.evaluate(BOT, cfg)
    pg.evaluate("(c) => { __jeu.G.chrono = c; }", cfg.get('chrono', 'normal'))          # l'élève en difficulté joue en « Lent »
    t = 0.0
    while t < MAX and pg.evaluate("__jeu.G.mode") == "play" and pg.evaluate("__jeu.S.succes") == 0:
        pg.evaluate("() => { for (let k = 0; k < 20; k++) { if (window.__bot) __bot.tick(1/20); __jeu.update(1/20); } }")
        t += 1.0
    return pg.evaluate("({gain: __jeu.G.camp.argent - window.__a0, servis: __jeu.S.servis, succes: __jeu.S.succes, mode: __jeu.G.mode, niveau: __jeu.S.niveau})") | {"duree": t}

with sync_playwright() as p:
    exe = "/opt/pw-browsers/chromium"
    b = p.chromium.launch(executable_path=exe, args=["--no-sandbox"]) if os.path.exists(exe) else p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html"); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.clear()")
    bal = pg.evaluate("({coef: __jeu.RESTOS.map(r => r.coef), cu: __jeu.BAL.cuisineApres, cp: __jeu.BAL.cuisineProba, bc: __jeu.BAL.bonusCuisine})")
    res = {}
    print("== Pièces gagnées par service (jusqu'au premier succès de presse, mode facile) ==")
    for i in range(4):
        for nom, cfg in PROFILS:
            r = service(pg, i, cfg)
            cuis = max(0, r["servis"] - bal["cu"]) * bal["cp"] * bal["bc"] * bal["coef"][i] if r["succes"] else 0          # estimation du bonus de cuisine du mode difficile
            r["gain_dur"] = r["gain"] + round(cuis); res[(i, nom)] = r
            print("resto %d  %-26s %4.0f s  servis %3d  gain %5d  (≈ %5d en difficile)  %s" % (i + 1, nom, r["duree"], r["servis"], r["gain"], r["gain_dur"], "succès" if r["succes"] else "PAS DE SUCCÈS [" + r["mode"] + "]"))
    cat = pg.evaluate("""(() => { return [0,1,2,3].map(i => { const o = __jeu.OBJETS.filter(o => o.resto === i), P = __jeu.placement(i, o.map(x => 'objet:' + x.id));
        const poses = P.liste.map(p => p.o.id).filter((v, k, a) => a.indexOf(v) === k), pr = (x) => __jeu.prixDeco(x.prix, i, 'objet');
        const tables = __jeu.TABLES.filter(t => t.resto === i), cher = tables.reduce((m, t) => Math.max(m, __jeu.prixDeco(t.prix, i, 'table')), 0);
        const col = __jeu.PAPIERS.slice(1).concat(__jeu.NAPPES.slice(1)); return { n: o.length, poses: poses.length, objets: o.filter(x => poses.includes(x.id)).reduce((a, x) => a + pr(x), 0), table: cher,
          papier: __jeu.prixDeco(__jeu.PAPIERS[1].prix, i, 'papier'), nappes: __jeu.prixDeco(__jeu.NAPPES[2].prix, i, 'nappes'), min: Math.min(...o.map(pr)), max: Math.max(...o.map(pr)) }; }); })()""")
    print("\n== Équipement (objets qui tiennent dans la salle + plus belle table + 1 papier + 1 nappe) et nombre de services ==")
    for i in range(4):
        c = cat[i]; tot = c["objets"] + c["table"] + c["papier"] + c["nappes"]
        g = {nom: res[(i, nom)]["gain_dur"] for nom, _ in PROFILS}
        print("resto %d : %2d/%2d objets posables, objet %d–%d, objets %d + table %d + papier %d + nappes %d = %d pièces" % (i + 1, c["poses"], c["n"], c["min"], c["max"], c["objets"], c["table"], c["papier"], c["nappes"], tot))
        print("          services nécessaires : " + " ; ".join("%s %.1f" % (nom, tot / max(1, v)) for nom, v in g.items()) + "   |  1er achat (objet le moins cher) après %.1f service(s) moyen(s)" % (c["min"] / max(1, g["moyen (70 %, 5 s)"])))
    b.close()
print("erreurs JS :", errs or "aucune")
