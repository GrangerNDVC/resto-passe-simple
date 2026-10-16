"""Extrait les sprites de la cuisine depuis les planches générées (fond bleu) vers assets/cuisine/.

Usage : python3 -I extract_cuisine.py <postes.png> <chef.png> <cuisine_deco.png> [dossier_du_jeu]
  (chaque planche est facultative : mets "-" pour en sauter une)

Planches attendues (voir docs/assets_manifest.json) :
  postes.png        3 colonnes x 2 lignes : marmite_repos, plan_travail_repos, plaque_repos / marmite_actif, plan_travail_actif, plaque_actif
  chef.png          2 colonnes x 2 lignes : chef_neutre, chef_explique / chef_bravo, chef_fache
  cuisine_deco.png  2 colonnes x 2 lignes : etagere_bocaux, casseroles_suspendues / hotte_inox, porte_battante
Le jeu lit assets/cuisine/<nom>.png ; tant qu'un fichier manque, il dessine une version provisoire en code.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from chroma import key_blue, grid_sprites, interior_leak

FEUILLES = [
    ("postes", 3, 2, ["marmite_repos", "plan_travail_repos", "plaque_repos", "marmite_actif", "plan_travail_actif", "plaque_actif"]),
    ("chef", 2, 2, ["chef_neutre", "chef_explique", "chef_bravo", "chef_fache"]),
    ("cuisine_deco", 2, 2, ["etagere_bocaux", "casseroles_suspendues", "hotte_inox", "porte_battante"]),
]

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
        sprites = grid_sprites(keyed, cols, rows)
        print(ident, "→", sum(1 for s in sprites if s is not None), "sprites sur", len(noms))
        for nom, sp in zip(noms, sprites):
            if sp is None:
                print("   MANQUE", nom); continue
            sp.save(os.path.join(sortie, nom + ".png"))
            print("   %-24s %s  fuite_intérieure=%s" % (nom, sp.size, round(interior_leak(sp), 4)))

if __name__ == "__main__":
    main()
