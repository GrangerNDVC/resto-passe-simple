"""Simule des profils de joueurs pour vérifier que la difficulté reste jouable.
Usage : python3 -I test_profils.py <dossier_jeu> [duree_max_s]
Profils : parfait rapide, élève moyen (70 %, 5 s par choix), élève en difficulté (50 %, 8 s), joueur absent.
Sortie : durée survécue, clients servis, niveau atteint, réussite (mode classique, vitesse Normal) puis mode séance.
"""
import sys, os, json
from playwright.sync_api import sync_playwright

jeu = sys.argv[1]
MAX = float(sys.argv[2]) if len(sys.argv) > 2 else 900
OVERRIDES = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}     # essai de réglages : '{"patBase": 60, "spawnMin": 4}'
CHRONO = OVERRIDES.pop('chrono', 'normal')
SEANCE = len(sys.argv) <= 4 or sys.argv[4] != "classique"

BOT = """
(cfg) => {
  const J = window.__jeu;
  const R = (() => { let s = cfg.seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const B = { wait: 0, stat: { rep: 0, ok: 0 } };
  window.__bot = B;
  B.tick = (dt) => {
    const S = J.S; if (!S || J.G.mode !== 'play') return;
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

PROFILS = [
    ("parfait rapide (100 %, 2 s)", dict(acc=1.0, delay=2.0, seed=7)),
    ("élève moyen (70 %, 5 s)", dict(acc=0.70, delay=5.0, seed=11)),
    ("élève en difficulté (50 %, 8 s)", dict(acc=0.50, delay=8.0, seed=13)),
    ("joueur absent", None),
]

def jouer(pg, cfg, duree_seance=0):
    pg.evaluate("(d) => { __jeu.G.libre = true; __jeu.G.chrono = '%s'; __jeu.G.duree = d;" % CHRONO + " __jeu.start(); window.__bot = null; }", duree_seance)
    if OVERRIDES: pg.evaluate("(o) => Object.assign(__jeu.BAL, o)", OVERRIDES)
    if cfg: pg.evaluate(BOT, cfg)
    t = 0.0
    while t < MAX and pg.evaluate("__jeu.G.mode") == "play":
        pg.evaluate("(a) => { for (let i = 0; i < 20; i++) { if (window.__bot) __bot.tick(1/20); __jeu.update(1/20); } }", 0)
        t += 1.0
    S = pg.evaluate("({servis: __jeu.S.servis, niveau: __jeu.S.niveau, repu: __jeu.S.repu, score: __jeu.S.score, rep: __jeu.S.rep, justes: __jeu.S.justes, partis: __jeu.S.partis, mode: __jeu.G.mode})")
    S["duree"] = t
    return S

with sync_playwright() as p:
    exe = "/opt/pw-browsers/chromium"
    b = p.chromium.launch(executable_path=exe, args=["--no-sandbox"]) if os.path.exists(exe) else p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html")
    pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(800)
    print("== Mode classique (3 cœurs), vitesse Normal ; plafond de simulation :", int(MAX), "s ==")
    for nom, cfg in PROFILS:
        r = jouer(pg, cfg)
        fin = "toujours en jeu" if r["mode"] == "play" else "partie terminée"
        print("%-34s %5.0f s (%4.1f min)  servis %3d  niveau %d  repu %d  réussite %s  [%s]" % (
            nom, r["duree"], r["duree"] / 60, r["servis"], r["niveau"], r["repu"],
            ("%d %%" % round(100 * r["justes"] / r["rep"])) if r["rep"] else "-", fin))
    print("\n== Mode séance 5 min ==")
    for nom, cfg in (PROFILS if SEANCE else []):
        r = jouer(pg, cfg, 5)
        print("%-34s %5.0f s  servis %3d  niveau %d  partis %d  réussite %s  [%s]" % (
            nom, r["duree"], r["servis"], r["niveau"], r["partis"],
            ("%d %%" % round(100 * r["justes"] / r["rep"])) if r["rep"] else "-", "terminée" if r["mode"] == "over" else "EN COURS"))
    b.close()
print("erreurs JS :", errs or "aucune")
