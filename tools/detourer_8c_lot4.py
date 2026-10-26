"""Lot 4 (8C) : tableaux, lustres, miroirs -> <sortie>/<nom>.png (fond bleu retiré, recadré).
Usage : python3 -I detourer_8c_lot4.py <dossier_sortie>
Les noms viennent du catalogue OBJETS de js/game.js ; l'association image -> nom est faite d'après ce que montre chaque image."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage
from chroma import key_blue, trim, interior_leak

A = "/mnt/user-data/attachments/fcf437ad-9efe-53c0-9883-e74232a6aef7/"
IMAGES = [
    ("419d07a2", "deco_tableau_spirales"), ("0882bac9", "deco_tableau_abstrait_rouge"), ("1c534ab4", "deco_tableau_abstrait_orne"), ("85b35648", "deco_tableau_tulipes"),
    ("627765b2", "deco_tableau_tournesols"),
    ("b2d5fb9d", "deco_lustre_bougies"), ("83e14339", "deco_lustre_abat_jour"), ("5a1c1573", "deco_lustre_spheres"), ("5ecaf82d", "deco_lustre_losanges"),
    ("3bc69979", "deco_lustre_perles"), ("17a64d91", "deco_lustre_verriere"), ("20648779", "deco_lustre_globes"), ("1889f264", "deco_lustre_poutres"),
    ("7a742a92", "deco_miroir_ovale"), ("8eda35f1", "deco_miroir_rectangle"),
    ("a2527360", "deco_tableau_kandinsky"), ("9b915acc", "deco_tableau_briques"), ("d5d938d3", "deco_tableau_eclaboussures"),
    ("a66b20f5", "deco_tableau_pomme"), ("f422acc7", "deco_tableau_lune"),
]

def dur(rgba):
    arr = np.array(rgba); a = arr[..., 3] > 128
    lab, n = ndimage.label(a)
    if n > 1:
        t = np.bincount(lab.ravel()); t[0] = 0
        a = np.isin(lab, [i for i in range(1, n + 1) if t[i] > 0.002 * a.size])
    arr[..., 3] = np.where(a, 255, 0); arr[..., :3] = np.where(a[..., None], arr[..., :3], 0)
    return Image.fromarray(arr, "RGBA")

def fichier(p): return A + [x for x in os.listdir(A) if x.startswith(p)][0]
def rapport(nom, r):
    a = np.asarray(r)
    bleu = ((a[..., 2].astype(int) - np.maximum(a[..., 0], a[..., 1]).astype(int)) > 60) & (a[..., 3] > 0)
    print(f"{nom:30s} {r.width:4d}x{r.height:<4d} fuite={interior_leak(r):.4f} bleus={int(bleu.sum())}")

def purger_bleu(rgba, seuil=18, plein=55):
    """Bleu du fond resté visible à travers les mailles / halos de lampe (aucun bleu n'est voulu dans ces objets) : on le rend transparent."""
    a = np.array(rgba).astype(np.float32)
    bl = a[..., 2] - np.maximum(a[..., 0], a[..., 1])
    k = np.clip((plein - bl) / (plein - seuil), 0, 1)
    a[..., 3] *= k
    return Image.fromarray(a.astype(np.uint8), "RGBA")

PURGER = {"deco_lustre_losanges", "deco_lustre_spheres", "deco_lustre_verriere"}

if __name__ == "__main__":
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for p, nom in IMAGES:
        r = dur(key_blue(Image.open(fichier(p))))
        if nom in PURGER: r = purger_bleu(r)
        r = trim(r, pad=2); r.save(os.path.join(out, nom + ".png"), optimize=True); rapport(nom, r)
