"""Clients recolorables (chantier 7f) : découpe les planches (2 poses, fond bleu) et fabrique
 - assets/clients/<slug>_attente.png / _appel.png : sprite en couleurs d'origine (corps 'standard' 680 px de large, échelle commune)
 - assets/clients/<slug>_calques.png : planche de 2 colonnes (attente | appel) x 4 rangées :
     0 = parties fixes (couleurs d'origine), 1 = peau, 2 = cheveux, 3 = vêtement (gris d'ombrage + transparence ; teintés en code)
Usage : python3 -I tools/extract_clients_7f.py <dossier_images> <dossier_jeu>"""
import sys, os, colorsys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from chroma import key_blue

K = 1.15            # échelle commune (px source -> px sprite) : même taille de tête pour tous les nouveaux clients
CANVAS_W = 680
# slug : (fichier, bas_source ou None pour 'ligne de table - 14 px')
SRC = {
 "client_08_afro": ("1a5b8863", None), "client_09_tresses": ("3aa9f84d", None), "client_10_costume": ("829625bd", None),
 "client_11_foulard": ("0229fea8", None), "client_12_artiste": ("276863e2", None), "client_13_soiree": ("fba0871b", 640),
 "client_14_smoking": ("1f8e1a06", None), "client_15_tailleur": ("70983054", 600), "client_16_diva": ("1d76be63", 625),
 "client_17_ambassadeur": ("b4832ffe", None), "client_18_heritiere": ("02c5ddb5", None),
}

def nettoyer(rgba):
    a = np.asarray(rgba).copy().astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bleu = (b > r + 45) & (b > g + 45)
    a[..., 3] = np.where(bleu, 0, a[..., 3])
    a[..., 3] = np.clip((a[..., 3] - 100) * 255.0 / 140.0, 0, 255)       # durcit le bord : supprime les voiles translucides (bande de table, halo)
    return Image.fromarray(a.astype(np.uint8), "RGBA")

def zones(arr):
    """Classe chaque pixel : 0 fixe, 1 peau, 2 cheveux, 3 vêtement ; renvoie (classe, ombrage 0..1)."""
    rgb = arr[..., :3].astype(float) / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = d > 1e-6
    hr = ((g - b) / np.where(m, d, 1)) % 6
    h = np.where(m & (mx == r), hr, h)
    h = np.where(m & (mx == g), (b - r) / np.where(m, d, 1) + 2, h)
    h = np.where(m & (mx == b), (r - g) / np.where(m, d, 1) + 4, h)
    h = (h * 60) % 360
    s = np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0)
    v = mx
    al = arr[..., 3] > 40
    cl = np.zeros(mx.shape, np.uint8)
    peau = al & (h >= 16) & (h <= 40) & (s >= 0.22) & (s <= 0.62) & (v >= 0.62)
    cheveux = al & (h >= 12) & (h <= 40) & (s >= 0.35) & (v >= 0.26) & (v < 0.62)
    vet = al & ((h >= 345) | (h < 14)) & (s >= 0.5) & (v >= 0.45)
    from scipy import ndimage
    lab, n = ndimage.label(vet)                          # les petits morceaux rouges (lèvres, nœud, broche) restent fixes
    if n:
        tailles = ndimage.sum(vet, lab, range(1, n + 1)); vet = np.isin(lab, [i + 1 for i, t in enumerate(tailles) if t >= 2500])
    cl[cheveux] = 2; cl[peau] = 1; cl[vet] = 3
    for _ in range(2):                                   # les pixels de bord (mélange contour/zone) suivent la zone voisine
        nouveau = cl.copy()
        for z in (1, 2, 3):
            mz = cl == z
            if mz.sum() < 50: continue
            hz = np.median(h[mz]); vz = np.median(v[mz])
            dh = np.minimum(abs(h - hz), 360 - abs(h - hz))
            proche = ndimage.binary_dilation(mz, iterations=1)
            cand = proche & (cl == 0) & al & (dh < 18) & (v > 0.28) & (v < vz + 0.03) & (s > 0.12)
            nouveau[cand] = z
        cl = nouveau
    ref = {1: 0.88, 2: 0.54, 3: 0.85}                      # valeur « de base » de chaque zone (#E0A878, #8A5A3C, #D9473B)
    om = np.ones(mx.shape)
    for z, rv in ref.items():
        mz = cl == z
        base = np.median(v[mz]) if mz.sum() > 50 else rv
        om = np.where(mz, np.clip(v / max(base, 0.2), 0.55, 1.0), om)
    return cl, om

def main(src, jeu):
    out = os.path.join(jeu, "assets", "clients"); os.makedirs(out, exist_ok=True)
    for slug, (f, bas_src) in SRC.items():
        p = [x for x in os.listdir(src) if x.startswith(f)][0]
        im = Image.open(os.path.join(src, p)); w, h = im.size
        poses = [nettoyer(key_blue(im.crop((x0, 0, x1, h)))) for x0, x1 in [(0, w // 2), (w // 2, w)]]
        boites = []
        for q in poses:
            a = np.asarray(q)[..., 3]; ys, xs = np.where(a > 40); boites.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        bas = bas_src if bas_src else max(b[3] for b in boites) - 14
        haut = min(b[1] for b in boites)
        a0 = np.asarray(poses[0])[..., 3]; ys, xs = np.where(a0[haut:bas] > 40)
        cx = (xs.min() + xs.max()) / 2 if False else None
        # centre : milieu du corps (rangées du bas de la pose « attente »)
        lig = a0[max(haut, bas - 150):bas] > 40; xs2 = np.where(lig.any(0))[0]; cx = (xs2.min() + xs2.max()) / 2
        gauche = cx - CANVAS_W / (2 * K)
        layers = []
        for nom, q in zip(("attente", "appel"), poses):
            box = (int(round(gauche)), haut, int(round(gauche + CANVAS_W / K)), bas)
            arr = np.zeros((box[3] - box[1], box[2] - box[0], 4), np.uint8)
            srcA = np.asarray(q); sx0, sx1 = max(box[0], 0), min(box[2], srcA.shape[1])
            arr[:, sx0 - box[0]: sx1 - box[0]] = srcA[box[1]: box[3], sx0: sx1]
            c = Image.fromarray(arr, "RGBA").resize((CANVAS_W, int(round(arr.shape[0] * K))), Image.LANCZOS)
            c.save(os.path.join(out, "%s_%s.png" % (slug, nom)))
            layers.append(np.asarray(c))
        Hh = max(l.shape[0] for l in layers)
        sheet = Image.new("RGBA", (CANVAS_W * 2, Hh * 4), (0, 0, 0, 0))
        stats = []
        for col, l in enumerate(layers):
            cl, om = zones(l)
            al = l[..., 3]
            fixe = l.copy(); fixe[..., 3] = np.where(cl == 0, al, 0)
            pieces = [fixe]
            for z in (1, 2, 3):
                g = (om * 255).astype(np.uint8)
                pz = np.dstack([g, g, g, np.where(cl == z, al, 0).astype(np.uint8)])
                pieces.append(pz)
            stats.append([int((cl == z).sum()) for z in (1, 2, 3)])
            for row, pz in enumerate(pieces):
                sheet.paste(Image.fromarray(pz.astype(np.uint8), "RGBA"), (col * CANVAS_W, row * Hh))
        sheet.save(os.path.join(out, "%s_calques.png" % slug))
        print(slug, "taille", layers[0].shape[:2][::-1], "peau/cheveux/vet px", stats[0])
main(sys.argv[1], sys.argv[2])
