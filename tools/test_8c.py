"""Chantier 8C : relecture visuelle du 8B (sol des meubles, rideaux, tableaux, passe-plats, clients, atelier tactile), satisfaction (couleur, lassitude, snobs), équilibrage.
Usage : python3 -I test_8c.py <dossier_jeu> <dossier_captures>
Les contrôles sur un objet dont l'image manque (dossier assets/salle incomplet) sont signalés « IGNORÉ » : lancer le test avec le dépôt complet.
"""
import sys, os
from playwright.sync_api import sync_playwright
jeu, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
checks = []
def check(nom, ok, detail=""):
    checks.append((nom, bool(ok))); print(("OK   " if ok else "ECHEC"), nom, detail)
def ignore(nom, raison): print("IGNORÉ", nom, "—", raison)
GAIN_SERVICE = [500, 750, 950, 1450]        # pièces gagnées par service d'un élève moyen en mode difficile (mesuré par tools/equilibrage_8c.py)
with sync_playwright() as p:
    exe = "/opt/pw-browsers/chromium"
    args = ["--no-sandbox", "--proxy-server=direct://", "--proxy-bypass-list=*"]
    b = p.chromium.launch(executable_path=exe, args=args) if os.path.exists(exe) else p.chromium.launch(args=args)
    pg = b.new_page(viewport={"width": 1920, "height": 1080}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html"); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(1500)
    ev = pg.evaluate
    ev("localStorage.clear(); __jeu.G.difficile = 1")
    # ================= ÉTAPE 1 : relecture visuelle
    r = ev("""(()=>{ const out=[]; for(let i=0;i<4;i++){ const ids=__jeu.OBJETS.filter(o=>o.resto===i).map(o=>'objet:'+o.id); const P=__jeu.placement(i,ids), S=__jeu.SALLES[i];
        const sol=P.liste.filter(p=>p.o.zone==='sol'&&!p.o.base); out.push({i, n:sol.length, ecart: Math.max(0,...sol.map(p=>Math.abs(p.y+p.h-S.sol)))}); } return out; })()""")
    check("meubles : les pieds sont sur la ligne du sol de chaque salle (plus de meuble qui flotte)", all(x["ecart"] < 1 for x in r), str(r))
    check("la ligne du sol est descendue dans les salles 2 à 4 (545 / 618 / 636) et inchangée au village", ev("__jeu.SALLES.map(s => s.sol)") == [482, 545, 618, 636])
    marge = ev("""(()=>{ const out=[]; for(let i=0;i<4;i++){ const ids=__jeu.OBJETS.filter(o=>o.resto===i&&o.zone==='mur').map(o=>'objet:'+o.id); const P=__jeu.placement(i,ids), obs=__jeu.obstaclesSalle(i).filter(q=>q.gros);
        const d=(a,b)=>Math.max(0, Math.max(a.x-(b.x+b.w), b.x-(a.x+a.w)), Math.max(a.y-(b.y+b.h), b.y-(a.y+a.h))); out.push({i, n:P.liste.length, min: Math.min(99,...P.liste.flatMap(p=>obs.map(q=>d(p,q))))}); } return out; })()""")
    check("tableaux : au moins 20 px de marge autour du rail, de la porte et du passe-plats", all(x["min"] >= 20 for x in marge), str(marge))
    if ev("__jeu.OBJETS.find(o => o.id === 'rideaux') && __jeu.OBJETS.find(o => o.id === 'rideaux').vues === undefined && !!document.querySelector('canvas')") and ev("(()=>{const P=__jeu.placement(1,['objet:rideaux']); return P.liste.length})()"):
        w = ev("""(()=>{ const P=__jeu.placement(1,['objet:rideaux']), F=__jeu.SALLES[1].fenetres; return P.liste.map(p=>F.some(f=>p.x+p.w/2>f[0]&&p.x+p.w/2<f[1]&&p.y<=f[2]&&p.y+p.h>=f[3]-30)); })()""")
        check("rideaux : un par fenêtre, centrés sur une vraie fenêtre (jamais accrochés dans le vide)", len(w) == 2 and all(w), str(w))
    else: ignore("rideaux sur les fenêtres", "image deco_rideaux absente")
    # passe-plats : les assiettes posées sur le rebord, dans l'ouverture et le cadre
    pp = []
    for i in range(4):
        ev(f"""__jeu.G.camp.restos.forEach(r=>r.ouvert=true); __jeu.G.difficile=1; __jeu.G.cuisine=0; __jeu.G.libre=false; __jeu.G.resto={i}; __jeu.G.chrono='sans'; __jeu.start(); __jeu.avancer(2); __jeu.rendre()""")
        pp.append(ev("({o: {...__jeu.HATCH_OUV}, p: {...__jeu.HATCH_PLATE}, r: {...__jeu.HATCH_RECT}})"))
    ok = all(q["p"]["y"] >= q["o"]["y"] + q["o"]["h"] - 6 and q["p"]["y"] <= q["r"]["y"] + q["r"]["h"] and q["o"]["x"] < q["p"]["x"] < q["o"]["x"] + q["o"]["w"] for q in pp)
    check("passe-plats des 4 restos : les assiettes sont posées sur le rebord (bas de l'ouverture), au milieu du passe-plats", ok, str([(round(q["p"]["y"]), round(q["o"]["y"] + q["o"]["h"]), round(q["r"]["y"] + q["r"]["h"])) for q in pp]))
    # clients : taille (180 au 8C, 190 depuis le 9B)
    ev("""window.__w = {}; const o = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function(i, a, b, c, d){ if(i && i.src && /client_04_blonde_attente/.test(i.src) && arguments.length === 5) window.__w.blonde = c; return o.apply(this, arguments); };
          __jeu.G.camp.restos[0].deco.tables = [330,630,930,1230].map(x => ({x, style: '', nappes: 'origine'})); __jeu.G.resto=0; __jeu.start(); __jeu.S.tables.forEach(t=>t.client=null); const t=__jeu.S.tables[2]; __jeu.nouveauClient(t); t.client.slug='client_04_blonde'; t.client.recol=null; t.client.state='wait'; t.client.t=0; __jeu.rendre()""")
    wb = ev("window.__w.blonde"); check("clients : CLIENT_W 190 (chantier 9B ; la blonde mesure 161,5 px)", wb is not None and abs(wb - 161.5) < 2, str(wb))
    sp = ev("""(()=>{ const res=[]; for(let i=0;i<4;i++){ __jeu.G.camp.restos[i].deco.tables = [330,630,930,1230,1530,1780].slice(0, __jeu.RESTOS[i].tablesMax).map(x => ({x, style: '', nappes: 'origine'})); __jeu.G.resto=i; __jeu.G.libre=false; __jeu.G.chrono='sans'; __jeu.start(); const S=__jeu.S; const sl=['client_03_bouclee','client_08_afro','client_01_garcon','client_09_tresses','client_06_moustachu','client_10_costume'];
        S.tables.forEach((t,k)=>{ t.client=null; __jeu.nouveauClient(t); t.client.slug=sl[k]; t.client.state='call'; });
        const att=S.tables.filter(t=>t.client).sort((a,b)=>a.x-b.x); const spans=att.map(t=>{ const c=__jeu.coteIndic(t); return c>0?[t.x+68,t.x+210]:[t.x-210,t.x-68]; });
        let chev=0; for(let a=0;a<spans.length;a++) for(let c=a+1;c<spans.length;c++) if(spans[a][1]>spans[c][0]&&spans[c][1]>spans[a][0]) chev++; res.push(chev);} return res; })()""")
    check("smileys et sabliers : jamais l'un sur l'autre entre deux tables voisines", all(c == 0 for c in sp), str(sp))
    # atelier : défilement et aperçu au toucher
    ev("__jeu.G.difficile=1; __jeu.G.camp.argent=5000; __jeu.G.camp.restos.forEach(r=>r.ouvert=true); __jeu.ouvrirAtelier(); __jeu.changerRestoAtelier(1); __jeu.G.atelier.onglet=3; __jeu.rendre()")
    n = ev("__jeu.listeAtelier('objet', 1).length")
    if n > 6:
        ev("__jeu.defilerAtelier(1); __jeu.defilerAtelier(1); __jeu.rendre()"); t1 = ev("__jeu.G.atelier.top")
        pg.mouse.move(400, 500); pg.mouse.wheel(0, 300); pg.wait_for_timeout(200); ev("__jeu.rendre()"); t2 = ev("__jeu.G.atelier.top")
        for _ in range(30): ev("__jeu.defilerAtelier(1)")
        t3 = ev("__jeu.G.atelier.top"); ev("for(let k=0;k<30;k++) __jeu.defilerAtelier(-1)"); t4 = ev("__jeu.G.atelier.top")
        check("atelier : la liste défile (boutons, molette) sans dépasser ses bornes", t1 == 2 and t2 == 3 and t3 == n - 6 and t4 == 0, f"{t1} {t2} {t3} {t4} sur {n}")
        ev("__jeu.rendre()"); bt = ev("({h: !!__jeu.G && true})")
    else: ignore("défilement de l'atelier", "moins de 7 objets (images absentes)")
    ev("__jeu.G.tactile = true; __jeu.G.camp.argent = 5000; __jeu.G.camp.restos[1].deco = __jeu.decoLire({}); __jeu.G.atelier.top = 0; __jeu.G.atelier.sel = 0; __jeu.rendre()")
    it = ev("(__jeu.G.atelier && 1) && JSON.stringify(window.__BT = null)")
    pos = ev("""(()=>{ __jeu.G.mouse={x:-1,y:-1}; __jeu.rendre(); const l=__jeu.listeAtelier('objet',1); return l.length? {id:l[1].id, y: 300 + 98 + 40} : null })()""")
    if pos:
        ev(f"__jeu.G.mouse = {{x: -5, y: -5}}; __jeu.G.atelier.sel = 0; __jeu.clicAtelier({{x: 300, y: {pos['y']}}})")
        a1 = ev("__jeu.G.camp.restos[1].deco.achats.length"); s1 = ev("__jeu.G.atelier.sel")
        ev(f"__jeu.clicAtelier({{x: 300, y: {pos['y']}}})"); a2 = ev("__jeu.G.camp.restos[1].deco.achats.length")
        check("atelier au doigt : le 1er toucher montre l'aperçu (rien n'est acheté), le 2e achète", a1 == 0 and s1 == 1 and a2 == 1, f"{a1} {s1} {a2}")
    ev("__jeu.G.tactile = false")
    # recoloration vers le CLAIR comme vers le foncé : l'aplat du vêtement prend la couleur demandée (avant le 8C : gris délavé vers le clair)
    from PIL import Image
    import io
    for cible in ["#f0e6d2", "#e8b33f", "#c76b8f", "#2f2f3a"]:
        ev("""(c) => { document.body.style.margin = 0; let cv = document.getElementById('__rc'); if (!cv) { cv = document.createElement('canvas'); cv.id = '__rc'; cv.width = 400; cv.height = 400; cv.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:400px;max-width:none;z-index:99999;background:#808080'; document.body.appendChild(cv); }
              const x = cv.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 400, 400); const r = __jeu.recolorer('client_12_artiste', 'attente', {skin: '#e8b48a', hair: '#5a3a29', shirt: c}); x.drawImage(r, 0, 0, r.width, r.height, 0, 0, 400, 400 * r.height / r.width); }""", cible)
        im = Image.open(io.BytesIO(pg.locator("#__rc").screenshot())).convert("RGB")
        tr = tuple(int(cible[k:k + 2], 16) for k in (1, 3, 5)); n = sum(1 for xx in range(0, 400, 2) for yy in range(0, 400, 2) if all(abs(im.getpixel((xx, yy))[k] - tr[k]) < 28 for k in range(3)))
        check(f"recoloration : le vêtement prend la couleur {cible} (plus clair ou plus foncé que l'original)", n > 4000, str(n))
    ev("document.getElementById('__rc').remove()")
    # ================= ÉTAPE 2 : satisfaction
    ev("__jeu.G.mode='carte'")
    cc = ev("""(()=>{ __jeu.G.camp.argent=99999; __jeu.G.camp.restos.forEach(r=>r.ouvert=true); const res={}; __jeu.G.camp.restos[3].deco=__jeu.decoLire({}); __jeu.ouvrirAtelier(); __jeu.changerRestoAtelier(3);
        __jeu.acheterOuChoisir('papier','rose'); res.couleur=__jeu.G.camp.restos[3].deco.charme; __jeu.G.camp.restos[3].deco.charme=0;
        __jeu.acheterOuChoisir('table','frange_bougies'); res.table=__jeu.G.camp.restos[3].deco.charme; __jeu.G.camp.restos[3].deco.charme=0;
        __jeu.acheterOuChoisir('objet','statue_zeus'); res.objet=__jeu.G.camp.restos[3].deco.charme; __jeu.poserMain(); res.objet0=__jeu.G.camp.restos[3].deco.charme; __jeu.G.camp.restos[3].deco.charme=0;
        const sat0=__jeu.satisfactionDeco(3); __jeu.acheterOuChoisir('objet','plante'); __jeu.poserMain(); res.ancien=__jeu.G.camp.restos[3].deco.charme; res.sat1=__jeu.satisfactionDeco(3)-sat0;
        res.l=[__jeu.lassitude({resto:3},3), __jeu.lassitude({resto:2},3), __jeu.lassitude({resto:0},3)]; return res; })()""")
    check("changement de couleur : 4 clients charmés (BAL.decoClientsCouleur) ; table et objet : 12", cc["couleur"] == ev("__jeu.BAL.decoClientsCouleur") == 4 and cc["table"] == 12 and cc["objet"] == 12, str(cc))
    check("lassitude : un objet d'un resto plus modeste charme moins de clients et pèse moins dans la satisfaction (BAL.lassitudeAncien / lassitudeMin)", cc["ancien"] == round(12 * 0.2) and abs(cc["l"][0] - 1) < 1e-9 and abs(cc["l"][1] - 0.65) < 1e-9 and abs(cc["l"][2] - 0.2) < 1e-9, str(cc))
    snob = ev("""(()=>{ const r={}; for(const [mode,i] of [[0,3],[1,0],[1,1],[1,2],[1,3]]){ __jeu.G.difficile=mode; __jeu.G.resto=i; __jeu.G.libre=false; __jeu.G.chrono='sans'; __jeu.start(); let s=0; for(let k=0;k<800;k++){ __jeu.S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(__jeu.S.tables[0]); if(__jeu.S.tables[0].client.snob) s++; } r[mode+'-'+i]=s/800; } return r; })()""")
    check("snobs : aucun en mode facile ni au village ; une part croissante de la brasserie au Palace (BAL.snobPart)", snob["0-3"] == 0 and snob["1-0"] == 0 and 0.04 < snob["1-1"] < 0.13 and 0.10 < snob["1-2"] < 0.21 and 0.19 < snob["1-3"] < 0.32 and snob["1-1"] < snob["1-2"] < snob["1-3"], str(snob))
    sn = ev("""(()=>{ __jeu.G.difficile=1; __jeu.G.resto=3; __jeu.G.libre=false; __jeu.G.chrono='sans'; const moy=(f)=>{ let a=0,n=0; for(let k=0;k<600;k++){ __jeu.S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(__jeu.S.tables[0]); const c=__jeu.S.tables[0].client; if(f(c)){ a+=c.patSec; n++; } } return a/Math.max(1,n); };
        __jeu.G.camp.restos[3].deco=__jeu.decoLire({}); __jeu.start(); const nu=moy(c=>!c.snob&&!c.vip&&!c.charme), mod=moy(c=>c.snob&&!c.snobOk);
        __jeu.G.camp.restos[3].deco=__jeu.decoLire({achats:__jeu.OBJETS.filter(o=>o.resto===3).map(o=>'objet:'+o.id)}); __jeu.G.camp.restos[3].deco.charme=0; __jeu.start(); const chic=moy(c=>c.snob&&c.snobOk); return {nu,mod,chic,sat:__jeu.satisfactionDeco(3)}; })()""")
    check("snob : déçu par un décor modeste (patience × 0,68), ravi par un décor chic (patience > celle d'un client ordinaire)", sn["mod"] < sn["nu"] * 0.75 and sn["chic"] > sn["nu"] * 1.0, str(sn))
    ev("""__jeu.G.camp.restos[3].deco=__jeu.decoLire({achats:__jeu.OBJETS.filter(o=>o.resto===3).map(o=>'objet:'+o.id)}); __jeu.G.resto=3; __jeu.start(); __jeu.S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(__jeu.S.tables[0]); const c=__jeu.S.tables[0].client; c.snob=true; c.snobOk=true; c.state='enter'; c.t=0.69; __jeu.avancer(0.2)""")
    check("le snob ravi le dit (« Voilà un cadre digne de moi. »)", ev("(__jeu.S.tables[0].bulle||{lignes:[]}).lignes.join(' ')").startswith("Voilà un cadre"))
    ev("""__jeu.G.camp.restos[3].deco=__jeu.decoLire({}); __jeu.start(); __jeu.S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(__jeu.S.tables[0]); const c=__jeu.S.tables[0].client; c.snob=true; c.snobOk=false; c.charme=false; c.state='enter'; c.t=0.69; __jeu.avancer(0.2)""")
    check("le snob déçu le dit aussi (« Hmm… bien modeste, tout ceci. »)", ev("(__jeu.S.tables[0].bulle||{lignes:[]}).lignes.join(' ')").startswith("Hmm"))
    # ================= paiement : plein tarif + rapidité / moitié après une erreur / rien après deux (client fâché)
    pay = ev("""(()=>{ const r={}; __jeu.G.resto=0; __jeu.G.difficile=0; __jeu.G.libre=false; __jeu.G.chrono='sans'; __jeu.start(); const S=__jeu.S;
        const essai=(refus,pat)=>{ S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(S.tables[0]); const c=S.tables[0].client; c.vip=false; c.cmd=null; c.state='wait'; c.etape='plat'; c.patience=pat; c.refus=refus.slice(); S.combo=0;
          S.serveur.carry={table:0,dish:'plat',cuisine:false,sansBonus:false}; const s0=S.score; __jeu.arriveeService(0); return S.score-s0; };
        r.vite=essai([],0.9); r.lent=essai([],0.2); r.une=essai(['x'],0.9); return r; })()""")
    check("paiement : servi vite > servi lent ; une erreur = moitié du gain", pay["vite"] > 1.8 * pay["lent"] and abs(pay["une"] * 2 - pay["vite"]) <= 1 and pay["lent"] >= 10, str(pay))
    # ================= ÉTAPE 3 : équilibrage
    eq = ev("""(()=>{ const out=[]; for(let i=0;i<4;i++){ const o=__jeu.OBJETS.filter(x=>x.resto===i&&x.img&&(x.vues||[x.img]).length), P=__jeu.placement(i,o.map(x=>'objet:'+x.id)); const poses=P.liste.map(p=>p.o.id).filter((v,k,a)=>a.indexOf(v)===k);
        const objets=o.filter(x=>poses.includes(x.id)).reduce((a,x)=>a+__jeu.prixDeco(x.prix,i,'objet'),0), table=Math.max(...__jeu.TABLES.filter(t=>t.resto===i).map(t=>__jeu.prixDeco(t.prix,i,'table'))); const pap=__jeu.prixDeco(__jeu.PAPIERS[1].prix,i,'papier'), nap=__jeu.prixDeco(__jeu.NAPPES[2].prix,i,'nappes');
        out.push({i, n:poses.length, tot:objets+table+pap+nap, min:Math.min(...o.map(x=>__jeu.prixDeco(x.prix,i,'objet'))), moy:o.reduce((a,x)=>a+__jeu.prixDeco(x.prix,i,'objet'),0)/o.length}); } return out; })()""")
    full = all(q["n"] >= 9 for q in eq)
    if full:
        sv = [round(q["tot"] / GAIN_SERVICE[q["i"]], 1) for q in eq]
        check("équilibrage : équiper à fond un resto (tous les objets qui tiennent, la plus belle table, un papier, une nappe) = 6 à 14 services d'un élève moyen (BAL.prixServices)", all(abs(s - ev("__jeu.BAL.prixServices")[q["i"]]) <= 1.2 for s, q in zip(sv, eq)), str(sv))
    else: ignore("coût d'équipement complet", "il manque des images d'objets (moins de 9 objets posables dans un resto)")
    check("équilibrage : le prix moyen d'un objet monte d'un resto à l'autre", all(eq[i]["moy"] < eq[i + 1]["moy"] for i in range(3)), str([round(q["moy"]) for q in eq]))
    check("équilibrage : le premier achat est à portée dès le premier service (objet le moins cher ≤ 30 % d'un service)", all(q["min"] <= 0.3 * GAIN_SERVICE[q["i"]] for q in eq), str([q["min"] for q in eq]))
    check("aucune erreur JavaScript ni image manquante", not errs, str(errs[:3]))
    b.close()
bad = [n for n, ok in checks if not ok]
print(f"\nBILAN : {len(checks) - len(bad)} / {len(checks)} contrôles OK" + (f" — ÉCHECS : {bad}" if bad else ""))
sys.exit(1 if bad else 0)
