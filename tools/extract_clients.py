"""Découpe, détoure et cadre les planches de clients (2 poses côte à côte, fond bleu) -> assets/clients/<nom>_attente.png / _appel.png
Usage : python3 -I clients.py <dossier_sortie>"""
import sys, os
sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
import numpy as np
from PIL import Image
from chroma import key_blue, interior_leak
U = "/root/.claude/uploads/765de623-ae40-597b-86c6-ec180199580b/"
FICHIERS = [("0470f4ab","client_07_critique"),("22928c22","client_01_garcon"),("3c8cc7cf","client_02_papy"),("a7dfbb54","client_03_bouclee"),("7ea86d6a","client_04_blonde"),("7ea44988","client_05_mamie"),("3ce70bb9","client_06_moustachu")]
CORPS, CANVAS_W, RETRAIT = 480, 680, 12      # largeur du corps (poses « attente ») après mise à l'échelle, largeur de toile commune, bas coupé (ligne de table)
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
for f, slug in FICHIERS:
    im = Image.open(U + f + "-image.jpg"); w, h = im.size
    poses = [key_blue(im.crop((x0, 0, x1, h))) for x0, x1 in [(0, w // 2), (w // 2, w)]]
    boites = []
    for p in poses:
        a = np.asarray(p)[..., 3]; ys, xs = np.where(a > 40)
        boites.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    bas = max(b[3] for b in boites) - RETRAIT                 # on coupe la fine ligne de table sous le client
    # corps = largeur de la pose « attente » à mi-hauteur (hors ligne et hors bras levé)
    a0 = np.asarray(poses[0])[..., 3]; ys, xs = np.where(a0[: bas] > 40)
    x0a, x1a = xs.min(), xs.max() + 1
    k = CORPS / (x1a - x0a)
    cx = (x0a + x1a) / 2
    haut = min(b[1] for b in boites)
    gauche = cx - CANVAS_W / (2 * k)
    res = []
    for nom, p in zip(("attente", "appel"), poses):
        box = (int(round(gauche)), haut, int(round(gauche + CANVAS_W / k)), bas)
        arr = np.zeros((box[3] - box[1], box[2] - box[0], 4), np.uint8)
        src = np.asarray(p)
        sx0, sx1 = max(box[0], 0), min(box[2], src.shape[1])
        arr[:, sx0 - box[0]: sx1 - box[0]] = src[box[1]: box[3], sx0: sx1]
        c = Image.fromarray(arr, "RGBA").resize((CANVAS_W, int(round(arr.shape[0] * k))), Image.LANCZOS)
        c.save(os.path.join(out, "%s_%s.png" % (slug, nom)))
        al = np.asarray(c)[..., 3]; ys2, xs2 = np.where(al > 40)
        res.append((c.size, int(xs2.min()), int(xs2.max()), round(interior_leak(c), 4), int((al[-3:] > 40).any(axis=0).sum())))
    print(slug, "attente", res[0], "appel", res[1])
