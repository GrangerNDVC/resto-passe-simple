"""Extrait les sprites de la cuisine depuis les planches générées (fond bleu) vers assets/cuisine/.

Usage : python3 -I extract_cuisine.py <postes.png> <chef.png> <cuisine_deco.png> [dossier_du_jeu]
  (chaque planche est facultative : mets "-" pour en sauter une)

Planches attendues (voir docs/assets_manifest.json) :
  postes.png        3 colonnes x 2 lignes : marmite_repos, plan_travail_repos, plaque_repos / marmite_actif, plan_travail_actif, plaque_actif
  chef.png          les 4 premiers chefs dans l'ordre de lecture : chef_neutre, chef_explique, chef_bravo, chef_fache
                    (grille 2x2, ou 4 colonnes x 2 lignes : seule la rangée du haut est utilisée, la suivante est ignorée)
  cuisine_deco.png  2 colonnes x 2 lignes : etagere_bocaux, casseroles_suspendues / hotte_inox, porte_battante
Le jeu lit assets/cuisine/<nom>.png ; tant qu'un fichier manque, il dessine une version provisoire en code.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage
from chroma import key_blue, grid_sprites, interior_leak

FEUILLES = [
    ("postes", 3, 2, ["marmite_repos", "plan_travail_repos", "plaque_repos", "marmite_actif", "plan_travail_actif", "plaque_actif"]),
    ("chef", 2, 2, ["chef_neutre", "chef_explique", "chef_bravo", "chef_fache"]),
    ("cuisine_deco", 2, 2, ["etagere_bocaux", "casseroles_suspendues", "hotte_inox", "porte_battante"]),
]

def extraire_chef(keyed, noms, sortie):
    """Détecte les chefs (composantes), prend les 4 premiers dans l'ordre de lecture et les aligne sur le chapeau
    (même toile pour les 4 poses, sinon le chef sauterait d'une pose à l'autre)."""
    arr = np.asarray(keyed); a = arr[..., 3]; h, w = a.shape
    lab, _ = ndimage.label(ndimage.binary_dilation(a > 40, iterations=3))
    objets = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if (lab[sl] == i).sum() >= 4000:
            objets.append(((sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2, i))
    objets.sort(key=lambda o: (round(o[0] / (h / 4)), o[1]))
    if len(objets) < len(noms):
        print("   MANQUE : seulement %d chefs trouvés" % len(objets)); return
    poses = []
    for cy, cx, i in objets[:len(noms)]:
        m = (lab == i) & (a > 8); ys, xs = np.where(m)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        haut = m[y0: y0 + max(8, int(0.10 * (y1 - y0)))]
        poses.append((m, x0, x1, y0, y1, np.where(haut.any(axis=0))[0].mean()))
    demi = int(max(max(p[5] - p[1], p[2] - p[5]) for p in poses)) + 6
    H = max(p[4] - p[3] for p in poses) + 2
    for nom, (m, x0, x1, y0, y1, hx) in zip(noms, poses):
        can = np.zeros((H, 2 * demi, 4), np.uint8)
        sub = arr[y0:y1, x0:x1].copy(); sub[..., 3] = np.where(m[y0:y1, x0:x1], sub[..., 3], 0)
        ox = int(round(demi - (hx - x0))); can[: y1 - y0, ox: ox + (x1 - x0)] = sub
        im = Image.fromarray(can, "RGBA"); im.save(os.path.join(sortie, nom + ".png"))
        print("   %-24s %s  fuite_intérieure=%s" % (nom, im.size, round(interior_leak(im), 4)))

def main():
    if len(sys.argv) < 4:
        print(__doc__); sys.exit(1)
    fichiers = sys.argv[1:4]
    racine = sys.argv[4] if len(sys.argv) > 4 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sortie = os.path.join(racine, "assets", "cuisine")
    os.makedirs(sortie, exist_ok=True)
    for (ident, cols, rows, noms), f in zip(FEUILLES, fichiers):
        if f == "-":
            continue
        keyed = key_blue(Image.open(f))
        keyed.save(os.path.join(sortie, "_planche_" + ident + "_detouree.png"))   # pour vérifier le détourage à l'œil
        if ident == "chef":
            extraire_chef(keyed, noms, sortie); continue
        sprites = grid_sprites(keyed, cols, rows, dilate=8 if ident == "postes" else 18)
        print(ident, "→", sum(1 for s in sprites if s is not None), "sprites sur", len(noms))
        for nom, sp in zip(noms, sprites):
            if sp is None:
                print("   MANQUE", nom); continue
            sp.save(os.path.join(sortie, nom + ".png"))
            print("   %-24s %s  fuite_intérieure=%s" % (nom, sp.size, round(interior_leak(sp), 4)))

if __name__ == "__main__":
    main()
