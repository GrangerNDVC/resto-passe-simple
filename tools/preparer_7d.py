#!/usr/bin/env python3
"""Prépare une image du chantier 7d : recadre en 16:9, passe en 1920×1080, convertit au bon format, vérifie quelques points.
Usage : python3 -I tools/preparer_7d.py <image_source> <nom_cible> <dossier_du_jeu>
  nom_cible : bg_titre_2 | bg_titre_3 | bg_titre_4 | bg_salle_2 | bg_salle_3 | bg_salle_4 | bg_carte
Écrit <dossier_du_jeu>/assets/<nom_cible>.jpg (façades et carte) ou .png (salles). Ne modifie jamais l'image source.
"""
import sys, os
from PIL import Image

CIBLES = {"bg_titre_2": "jpg", "bg_titre_3": "jpg", "bg_titre_4": "jpg", "bg_salle_2": "png", "bg_salle_3": "png", "bg_salle_4": "png", "bg_carte": "jpg"}
W, H = 1920, 1080

def main():
    if len(sys.argv) != 4 or sys.argv[2] not in CIBLES:
        print(__doc__); sys.exit(2)
    src, cible, jeu = sys.argv[1:4]
    im = Image.open(src).convert("RGB")
    w, h = im.size
    print(f"Source : {w}×{h}")
    if abs(w / h - W / H) > 0.01:                                       # recadrage centré en 16:9
        if w / h > W / H: nw = round(h * W / H); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else: nh = round(w * H / W); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
        print("Recadrée en 16:9 (centrée) :", im.size, "— vérifie que rien d'important n'a été coupé.")
    if im.size != (W, H): im = im.resize((W, H), Image.LANCZOS)
    avert = []
    px = im.load()
    # 1. aucune couleur bleue franche (hors ciel : tiers haut des façades et de la carte)
    y0 = int(H * 0.35) if cible.startswith("bg_titre") or cible == "bg_carte" else 0
    n = bleu = 0
    for y in range(y0, H, 6):
        for x in range(0, W, 6):
            r, g, b = px[x, y]; n += 1
            if b > r + 60 and b > g + 30: bleu += 1
    if bleu / n > 0.02: avert.append(f"{100 * bleu / n:.1f} % de pixels bleus (hors ciel) : le style du jeu évite le bleu — regénère ou retouche.")
    # 2. salles : murs clairs (le papier peint acheté se pose par transparence multiplicative), sol assez clair
    def lum(box, med=False):
        r = im.crop(box)
        if med:                                                          # médiane : insensible aux rideaux, lampes et poutres
            h = r.convert("L").histogram(); tot = sum(h); cum = 0
            for k, n in enumerate(h):
                cum += n
                if cum >= tot / 2: return k
        c = r.resize((1, 1), Image.BOX).getpixel((0, 0)); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
    if cible.startswith("bg_salle"):
        mur = lum((160, 150, 1760, 205), med=True)      # bande de papier peint, sous la poutre et au-dessus du lambris dans toutes les salles
        if mur < 170: avert.append(f"Mur du fond trop sombre (luminosité {mur:.0f}/255, il en faut ≥ 170) : le papier peint recoloré par le joueur serait sale.")
        sol = lum((200, 700, 1700, 1050))
        if sol < 110: avert.append(f"Sol très sombre (luminosité {sol:.0f}/255) : clients et plats risquent d'être peu lisibles.")
    out = os.path.join(jeu, "assets", cible + "." + CIBLES[cible])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if CIBLES[cible] == "jpg": im.save(out, quality=92, optimize=True)
    else: im.save(out, optimize=True)
    print("Écrit :", out, f"({os.path.getsize(out) // 1024} Ko)")
    for a in avert: print("ATTENTION :", a)
    if not avert: print("Contrôles automatiques OK. À regarder toi-même : pancarte / porte / fenêtres aux bons endroits (voir docs/PROMPTS_7D.md).")

main()
