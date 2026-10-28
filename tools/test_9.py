"""Chantier 9 : plus de gris sur les clients, un personnage ne revient pas trop vite, atelier déco en plein service (jeu suspendu).
Usage : python3 -I test_9.py <dossier_jeu> <dossier_captures>
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
    # --- teintes : aucun gris (saturation HSV trop faible)
    gris = ev("""(() => { const out = []; const T = __jeu.TEINTES; for (const k in T) T[k].forEach(h => { const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx > 0 && (mx - mn) / mx < 0.2 && k !== 'shirt') out.push(h); if (k === 'shirt' && mx > 0 && (mx - mn) / mx < 0.12 && mx < 200) out.push(h); }); return out; })()""")
    check("aucune teinte grise dans la recoloration (peau, cheveux, vêtements)", gris == [], str(gris))
    # --- un personnage ne revient pas avant quelques clients
    ev("__jeu.G.difficile=0; __jeu.G.libre=false; __jeu.G.resto=1; __jeu.G.chrono='sans'; __jeu.G.camp = __jeu.campVide(); __jeu.G.camp.restos.forEach(r => r.ouvert = true); __jeu.start()")
    seq = ev("(() => { const t = __jeu.S.tables[0], l = []; for (let i = 0; i < 80; i++) { __jeu.nouveauClient(t); l.push(t.client.slug); t.client = null; } return l; })()")
    mini = min((j - i for i in range(len(seq)) for j in range(i + 1, len(seq)) if seq[i] == seq[j] and seq[i] != 'client_07_critique'), default=99)
    check("même personnage : jamais deux fois à moins de 5 clients d'écart (resto 2)", mini >= 5, f"écart minimal {mini}")
    ev("__jeu.G.resto=0; __jeu.start()")
    seq = ev("(() => { const t = __jeu.S.tables[0], l = []; for (let i = 0; i < 60; i++) { __jeu.nouveauClient(t); l.push(t.client.slug); t.client = null; } return l; })()")
    mini = min((j - i for i in range(len(seq)) for j in range(i + 1, len(seq)) if seq[i] == seq[j] and seq[i] != 'client_07_critique'), default=99)
    check("même personnage : écart d'au moins 4 clients au village (réserve plus petite)", mini >= 4, f"écart minimal {mini}")
    # --- atelier en plein service
    ev("__jeu.G.difficile=1; __jeu.G.libre=false; __jeu.G.resto=0; __jeu.G.camp = __jeu.campVide(); __jeu.G.camp.argent = 5000; __jeu.start()")
    ev("__jeu.avancer(3); __jeu.rendre()"); pg.screenshot(path=out + "/9_bouton_deco.png")
    n0 = ev("__jeu.S.tables.length")
    pg.mouse.click(1920 - 214 + 90, 84 + 28)
    check("clic sur « Déco » : l'atelier s'ouvre en plein service", ev("__jeu.G.mode") == "atelier" and ev("__jeu.G.retourDe") == "play")
    t0 = ev("[__jeu.S.spawnT, __jeu.S.serveur.x, __jeu.S.tables.map(t => t.client ? t.client.patience : 1)]")
    ev("__jeu.avancer(5)")
    t1 = ev("[__jeu.S.spawnT, __jeu.S.serveur.x, __jeu.S.tables.map(t => t.client ? t.client.patience : 1)]")
    check("pendant l'atelier, le service est suspendu (clients, patience, serveur)", t0 == t1, f"{t0} / {t1}")
    ev("__jeu.G.atelier.onglet = __jeu.ongletsAtelier().findIndex(c => c.cle === 'table'); __jeu.G.atelier.sel = 0")
    a0 = ev("__jeu.G.camp.argent")
    ev("__jeu.acheterOuChoisir('table', '+'); __jeu.placerPourMoi(); __jeu.poserMain()")
    check("une table achetée en plein service est payée", ev("__jeu.G.camp.argent") < a0 and ev("__jeu.G.camp.restos[0].deco.tables.length") == n0 + 1)
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/9_atelier_en_jeu.png")
    pg.keyboard.press("Escape")
    check("retour : le service reprend, la nouvelle table est là", ev("__jeu.G.mode") == "play" and ev("__jeu.S.tables.length") == n0 + 1)
    ev("__jeu.avancer(8)")
    check("le service tourne à nouveau sans erreur", ev("__jeu.S.tables.some(t => t.client)") and not errs, str(errs[:3]))
    ev("__jeu.rendre()"); pg.screenshot(path=out + "/9_retour_service.png")
    pg.keyboard.press("d")
    check("touche D : ouvre aussi l'atelier en jeu", ev("__jeu.G.mode") == "atelier")
    pg.keyboard.press("Escape")
    ev("__jeu.G.libre = true; __jeu.start(); __jeu.rendre()")
    pg.keyboard.press("d")
    check("entraînement libre : pas d'atelier en jeu", ev("__jeu.G.mode") == "play")
    check("aucune erreur JavaScript", not errs, str(errs[:3]))
    b.close()
bad = [n for n, ok in checks if not ok]
print(f"\n{len(checks) - len(bad)} / {len(checks)} contrôles réussis")
sys.exit(1 if bad else 0)
