"""Lot 5 (8C) : plantes, tapis (dont tapis à bordure), porte-manteau, rideaux, vitrine, présentoir, tête de cerf -> <sortie>/<nom>.png (fond bleu retiré, recadré).
Usage : python3 -I detourer_8c_lot5.py <dossier_sortie>
Noms = catalogue OBJETS de js/game.js. (Les 2 pianos reçus en double ne sont pas retraités : ils existent déjà.)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import detourer_8c_lot4 as L
from chroma import key_blue, trim

IMAGES = [
    ("6c2ae437", "deco_plante_ficus"), ("9a732443", "deco_plante_monstera"), ("1051cadb", "deco_plante_sansevieria"),
    ("c17f0717", "deco_plante_dracaena"), ("be2a1f27", "deco_plante_palmier"),
    ("a4491b64", "deco_portemanteau"), ("e0c4d689", "deco_rideaux"),
    ("95648290", "deco_tapis_losanges"), ("ac797dd8", "deco_tapis_persan"), ("b6b7bbe8", "deco_tapis_rayures_creme"),
    ("362df1b3", "deco_tapis_rayures_fines"), ("1d16bef5", "deco_tapis_zigzag"), ("41dad2e1", "deco_tapis_ornement"), ("95856412", "deco_tapis_baroque"),
    ("3afaeb48", "deco_vitrine"), ("3f27bc73", "deco_comptoir_gateaux"), ("e595cb0f", "deco_tete_cerf"), ("7d8ed5da", "deco_tapis_bordure"),
]
if __name__ == "__main__":
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for p, nom in IMAGES:
        r = trim(L.dur(key_blue(Image.open(L.fichier(p)))), pad=2); r.save(os.path.join(out, nom + ".png"), optimize=True); L.rapport(nom, r)
