"""Chantier 8B : décor par resto, placement sans chevauchement, tables et chaises, nouveaux clients recolorés, satisfaction.
Usage : python3 -I test_8b.py <dossier_jeu> <dossier_captures>
"""
import sys, os, io
from playwright.sync_api import sync_playwright
from PIL import Image
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
    pg.goto("file://" + os.path.abspath(jeu) + "/index.html"); pg.wait_for_function("window.__jeu !== undefined"); pg.wait_for_timeout(1200)
    ev = pg.evaluate
    ev("localStorage.clear(); __jeu.G.difficile = 1")
    # ---- catalogue : 2 à 3 (4 au plus) objets de chaque sorte par resto, prix et tailles qui montent
    kinds = ev("""(()=>{const k=(o)=>o.zone==='tapis'?'tapis':o.zone==='plafond'?'lustre':/^tab_|^miroir/.test(o.id)?'mur':/^statue/.test(o.id)?'statue':/^plante/.test(o.id)?'plante':/^(piano|desserte)/.test(o.id)?'meuble':'autre'; const r={}; __jeu.OBJETS.forEach(o=>{const a=k(o); r[a]=r[a]||[0,0,0,0]; r[a][o.resto]++;}); return r;})()""")
    ok = all(all(n <= 4 for n in v) for k, v in kinds.items() if k != "autre") and kinds["tapis"][0] >= 2 and all(n >= 2 for n in kinds["tapis"]) and all(n >= 2 for n in kinds["lustre"][1:])
    check("catalogue : 2 à 4 objets de chaque sorte par resto", ok, str(kinds))
    chers = ev("""(()=>{const m=(i,f)=>{const l=__jeu.OBJETS.filter(o=>o.resto===i&&f(o)); return l.length? l.reduce((a,o)=>a+o.prix,0)/l.length : null}; const t=(i)=>m(i,o=>o.zone==='tapis'); const l=(i)=>m(i,o=>o.zone==='plafond'); const s=(i)=>m(i,o=>/^statue/.test(o.id)); return {t:[0,1,2,3].map(t), l:[1,2,3].map(l), s:[1,2,3].map(s)};})()""")
    croiss = lambda v: all(v[i] < v[i + 1] for i in range(len(v) - 1))
    check("plus l'image est chic, plus le resto est élevé : prix moyens croissants (tapis, lustres, bustes)", all(croiss(v) for v in chers.values()), str(chers))
    larg = ev("[0,1,2,3].map(i => Math.max(...__jeu.OBJETS.filter(o => o.resto === i && o.zone === 'tapis').map(o => o.w)))")
    check("les tapis sont plus grands à chaque resto (le Palace a les plus grands)", croiss(larg), str(larg))
    # ---- placement : chaque objet seul, puis tout acheté : jamais de chevauchement
    seul = ev("(()=>{const o=[]; __jeu.OBJETS.forEach(x=>{ if(__jeu.placement(x.resto,['objet:'+x.id]).rates.length) o.push(x.id);}); return o;})()")
    check("chaque objet trouve une place dans son resto", not seul, str(seul))
    res = ev("""(()=>{const out=[]; const touche=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
      for(let i=0;i<4;i++){ const ids=__jeu.OBJETS.filter(o=>o.resto===i).map(o=>'objet:'+o.id); const P=__jeu.placement(i,ids); const obs=__jeu.obstaclesSalle(i); let bad=0, pair=0, n=0;
        P.liste.forEach(p=>{ if(p.o.zone!=='tapis'&&p.o.zone!=='coin'&&p.o.zone!=='fenetre'&&obs.some(q=>touche(p,q)&&!(q.table&&p.o.zone==='sol'))) bad++;          // un meuble peut être en partie caché par une table (PART_TABLE_MAX)
        n++; });
        const L=P.liste.filter(p=>p.o.zone!=='tapis'&&p.o.zone!=='fenetre'); for(let a=0;a<L.length;a++) for(let c=a+1;c<L.length;c++) if(touche(L[a],L[c])) pair++;
        const T=P.liste.filter(p=>p.o.zone==='tapis'); for(let a=0;a<T.length;a++) for(let c=a+1;c<T.length;c++) if(touche(T[a],T[c])) pair++;
        out.push({i,n,bad,pair,rates:P.rates.length}); } return out;})()""")
    check("tout acheté : aucun objet sur les tables, le passe-plats, la porte, le rail, les fenêtres ni l'affichage, ni sur un autre objet", all(r["bad"] == 0 and r["pair"] == 0 and r["n"] > 5 for r in res), str(res))
    # ---- objet refusé s'il n'y a plus de place
    ev("""__jeu.G.camp.argent = 99999; __jeu.G.camp.restos[3].deco = __jeu.decoLire({}); __jeu.ouvrirAtelier(); __jeu.changerRestoAtelier(3);
          __jeu.G.camp.restos.forEach(r=>r.ouvert=true); __jeu.changerRestoAtelier(3);
          __jeu.OBJETS.filter(o=>o.resto===3).forEach(o=>__jeu.acheterOuChoisir('objet',o.id));""")
    ach = ev("__jeu.G.camp.restos[3].deco.achats.length"); tot = ev("__jeu.OBJETS.filter(o=>o.resto===3).length")
    check("atelier : un objet qui ne tient plus est refusé (pas payé) ; le reste s'achète", 0 < ach < tot and ev("__jeu.placement(3, __jeu.G.camp.restos[3].deco.achats).rates.length") == 0, f"{ach}/{tot} achetés")
    # ---- rendu des 4 restos équipés
    for i in range(4):
        ev(f"""__jeu.G.difficile=1; __jeu.G.cuisine=0; __jeu.G.libre=false; __jeu.G.resto={i}; __jeu.G.chrono='sans'; __jeu.G.camp.restos.forEach(r=>r.ouvert=true);
          __jeu.G.camp.restos[{i}].deco=__jeu.decoLire({{achats:__jeu.OBJETS.filter(o=>o.resto==={i}).map(o=>'objet:'+o.id)}}); __jeu.start(); __jeu.avancer(8); __jeu.rendre()""")
        pg.screenshot(path=f"{out}/b{i+1}_resto_equipe.png")
    # ---- tables et chaises par resto
    tabs = ev("[0,1,2,3].map(i => __jeu.TABLES.filter(t => t.resto === i).map(t => t.id + ':' + t.prix))")
    check("tables : une table de base gratuite par resto, des variantes payantes ensuite", all(any(x.endswith(":0") for x in t) for t in tabs) and all(len(t) >= 2 for t in tabs[1:]) and len(tabs[0]) == 1, str(tabs))
    def images_dessinees():
        pg.evaluate("""window.__img = []; if(!window.__hook){ const o = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function(i){ if(i && i.src) window.__img.push(i.src.split('/').pop()); return o.apply(this, arguments); }; window.__hook = 1; }""")
        ev("__jeu.rendre()"); return set(ev("window.__img"))
    for i in range(1, 4):
        ev(f"__jeu.G.resto={i}; __jeu.G.camp.restos[{i}].deco=__jeu.decoLire({{}}); __jeu.start(); __jeu.avancer(8)")
        base = [t for t in tabs[i] if t.endswith(":0")][0].split(":")[0]
        vu = images_dessinees()
        tb = ev(f"__jeu.TABLES.find(t=>t.id==='{base}').img")
        check(f"resto {i+1} : table de base et chaise de ce resto dessinées", (tb + ".png") in vu and (["chaise.png", "chaise_brasserie.png", "chaise_gala.png", "chaise_palace.png"][i]) in vu, tb)
        alt = [t for t in tabs[i] if not t.endswith(":0")][0].split(":")[0]
        ev(f"__jeu.G.camp.argent=99999; __jeu.ouvrirAtelier(); __jeu.changerRestoAtelier({i}); __jeu.acheterOuChoisir('table','{alt}'); __jeu.G.mode='play'; __jeu.start(); __jeu.avancer(8)")
        vu = images_dessinees(); ta = ev(f"__jeu.TABLES.find(t=>t.id==='{alt}').img")
        check(f"resto {i+1} : la variante payante « {alt} » remplace la table", (ta + ".png") in vu and (tb + ".png") not in vu)
    # ---- clients : casting par resto, recoloration
    cast = ev("""(()=>{const r={}; for(let i=0;i<4;i++){ __jeu.G.resto=i; __jeu.G.libre=false; __jeu.start(); const c={}; for(let k=0;k<600;k++){ const s=__jeu.tirerClient([]); c[s]=(c[s]||0)+1;} r[i]=c;} return r;})()""")
    nouv = lambda c: sum(v for k, v in c.items() if int(k.split("_")[1]) >= 8)
    check("casting : resto 1 = anciens + 2 nouveaux (lot A) ; le lot D n'arrive qu'au Palace", nouv(cast["0"]) > 100 and all(int(k.split("_")[1]) <= 9 for k in cast["0"] if int(k.split("_")[1]) >= 8) and not any(k in cast["0"] or k in cast["1"] or k in cast["2"] for k in ("client_16_diva", "client_17_ambassadeur", "client_18_heritiere")) and "client_16_diva" in cast["3"], str({k: nouv(v) for k, v in cast.items()}))
    check("casting : les anciens clients deviennent rares aux restos 2 à 4", sum(v for k, v in cast["3"].items() if int(k.split("_")[1]) < 8) < 0.3 * 600 and sum(v for k, v in cast["1"].items() if int(k.split("_")[1]) < 8) < 0.5 * 600)
    diff = ev("""(()=>{const rc={skin:'#7b4a2e',hair:'#cfc9bd',shirt:'#2f6a8f'}; const a=__jeu.recolorer('client_08_afro','attente',rc); const b=__jeu.recolorer('client_08_afro','attente',rc);
        const c=document.createElement('canvas'); c.width=a.width; c.height=a.height; return {meme: a===b, canvas: a instanceof HTMLCanvasElement, w:a.width};})()""")
    check("recoloration : un calque est produit (mis en cache) pour la peau, les cheveux et le vêtement", diff["canvas"] and diff["meme"], str(diff))
    ev("""__jeu.G.camp.restos[3].deco.tables = [330,630,930,1230,1530,1780].map(x => ({x, style: '', nappes: 'origine'})); __jeu.G.resto=3; __jeu.start(); const S=__jeu.S; S.tables.forEach((t,i)=>{ t.client={slug:['client_08_afro','client_11_foulard','client_13_soiree','client_16_diva','client_18_heritiere','client_09_tresses'][i],vip:false,state:'wait',t:0,patience:.9,patSec:50,cmd:null,ticket:null,tries:0,refus:[],corrige:false,look:{skin:'#fff',shirt:'#fff',hair:'#000'},bob:0,recol:{skin:'#9a6743',hair:'#2a1d17',shirt:'#2f6a8f'}};}); __jeu.rendre()""")
    pg.screenshot(path=f"{out}/b5_clients_recolores.png", clip={"x": 0, "y": 350, "width": 1920, "height": 450})
    im = Image.open(f"{out}/b5_clients_recolores.png").convert("RGB"); bleu = sum(1 for x in range(0, 1920, 6) for y in range(0, 450, 6) if (lambda c: c[2] > 150 and c[2] > c[0] + 60 and c[2] > c[1] + 30)(im.getpixel((x, y))))
    check("recoloration visible à l'écran (vêtements bleus des clients)", bleu > 10, str(bleu))          # seuil abaissé : clients 10 % plus petits depuis le 8C
    # ---- satisfaction : un achat charme les clients suivants (patience rallongée, bulle, cœur) — seulement en difficile
    ev("""__jeu.G.difficile=1; __jeu.G.camp.restos[1].deco=__jeu.decoLire({}); __jeu.G.camp.argent=99999; __jeu.ouvrirAtelier(); __jeu.changerRestoAtelier(1); __jeu.acheterOuChoisir('objet','vitrine'); __jeu.poserMain(); __jeu.G.mode='play'""")
    ch = ev("__jeu.G.camp.restos[1].deco.charme"); check("achat d'un objet : les clients suivants sont charmés", ch == ev("__jeu.BAL.decoClients"), str(ch))
    ev("__jeu.G.camp.restos[1].deco.papier='rose'; __jeu.G.resto=1; __jeu.G.libre=false; __jeu.G.chrono='sans'; __jeu.start()")
    ev("__jeu.S.tables.forEach(t=>t.client=null); __jeu.G.camp.restos[1].deco.charme=2")
    r = ev("""(()=>{const S=__jeu.S; const base=__jeu.BAL.patBase; let pats=[]; for(let k=0;k<2;k++){ S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(S.tables[0]); pats.push([S.tables[0].client.patSec, S.tables[0].client.charme]); }
       S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(S.tables[0]); pats.push([S.tables[0].client.patSec, S.tables[0].client.charme]); return pats;})()""")
    check("clients charmés : patience plus longue, N décroît, ensuite plus de bonus", r[0][1] and r[1][1] and not r[2][1] and r[0][0] > r[2][0] * 1.02 and ev("__jeu.G.camp.restos[1].deco.charme") == 0, str(r))
    ev("__jeu.G.camp.restos[1].deco.charme=3; __jeu.G.difficile=0; __jeu.S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(__jeu.S.tables[0])")
    check("mode facile : aucun bonus de décor", not ev("__jeu.S.tables[0].client.charme"))
    ev("__jeu.BAL.snobPart = [0, 0, 0, 0]")          # un client snob (au hasard) parlerait à la place du client charmé : on les écarte pour ce contrôle
    ev("""__jeu.G.difficile=1; __jeu.G.camp.restos[1].deco.charme=1; __jeu.S.tables.forEach(t=>t.client=null); __jeu.nouveauClient(__jeu.S.tables[0]); const c=__jeu.S.tables[0].client; c.state='enter'; c.t=0.69; __jeu.avancer(0.2)""")
    check("le client charmé dit « Qu'il est beau, ce restaurant ! »", ev("(__jeu.S.tables[0].bulle||{lignes:[]}).lignes.join(' ')").startswith("Qu’il est beau"))
    # ---- ancienne sauvegarde et sauvegarde abîmée : table inconnue écartée
    sv = ev("__jeu.decoLire({table:'inconnue', achats:['table:croix','objet:vitrine']})")
    check("sauvegarde : table inconnue ou non possédée écartée", all(x["style"] == "" for x in sv["tables"]) and "table:croix" in sv["achats"])
    check("aucune erreur JavaScript ni image manquante", not errs, str(errs[:3]))
    b.close()
bad = [n for n, ok in checks if not ok]
print(f"\nBILAN : {len(checks) - len(bad)} / {len(checks)} contrôles OK" + (f" — ÉCHECS : {bad}" if bad else ""))
sys.exit(1 if bad else 0)
