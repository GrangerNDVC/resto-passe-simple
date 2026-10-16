"""Extrait les sprites des planches d'objets générées (fond bleu) vers assets/<dossier>/.

Usage : python3 -I extract_planches.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from chroma import key_blue, grid_sprites, interior_leak

U = "/root/.claude/uploads/5f3e290e-439c-5560-b249-799c2e6d865a/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manifest = json.load(open(os.path.join(ROOT, "assets_manifest.json"), encoding="utf-8"))
items = {s["id"]: s for s in manifest["sheets"]}

JOBS = [
    ("plats", "4fc3d9ae-image.jpg", "plats"),
    ("briques", "99c982e1-image.jpg", "briques"),
    ("ui", "db14a92d-image.jpg", "ui"),
    ("smileys", "72e394f8-image.jpg", "smileys"),
    ("fx", "c56c7478-image.jpg", "fx"),
]

report = {}
for sheet_id, fname, folder in JOBS:
    s = items[sheet_id]
    keyed = key_blue(Image.open(U + fname))
    keyed.save(os.path.join(ROOT, "assets", f"_planche_{sheet_id}_detouree.png"))
    sprites = grid_sprites(keyed, s["cols"], s["rows"])
    out_dir = os.path.join(ROOT, "assets", folder)
    os.makedirs(out_dir, exist_ok=True)
    names = s["items"]
    got = []
    for i, sp in enumerate(sprites):
        if sp is None:
            continue
        if i >= len(names):
            print(f"  ! {sheet_id}: élément en trop (case {i + 1}), ignoré")
            continue
        sp.save(os.path.join(out_dir, names[i] + ".png"))
        got.append((names[i], sp.size, round(interior_leak(sp), 4)))
    report[sheet_id] = got
    missing = [n for n, sp in zip(names, sprites) if sp is None]
    print(sheet_id, "→", len(got), "sprites", ("MANQUE " + str(missing)) if missing else "")
    for n, size, leak in got:
        print(f"   {n:22s} {size}  fuite_intérieure={leak}")
