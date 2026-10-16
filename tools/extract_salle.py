"""Extrait les sprites de la salle à partir des images générées (fond bleu).

Usage : python3 -I extract_salle.py <planche_tables_chaises.jpg> <planche_objets.jpg> <dossier_sortie>
"""
import sys, os, colorsys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chroma import key_blue, components, trim

tables_img, objets_img, out_dir = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)

# --- tables et chaises ------------------------------------------------------
k = key_blue(Image.open(tables_img))
boxes = components(k, dilate=1, min_area=1500)
tables, chaises = boxes[:6], boxes[6:]
names = ["rouge", "bleu", "vert", "jaune", "violet", "orange"]
done = {}
for n, b in zip(names, tables):
    if n == "bleu":          # nappe bleue = confondue avec le fond bleu : exclue
        continue
    sp = trim(k.crop(b))
    sp.save(os.path.join(out_dir, f"table_{n}.png"))
    done[n] = sp

# variante rose obtenue par rotation de teinte de la nappe rouge
red = np.asarray(done["rouge"]).astype(np.float32) / 255.0
rgb, a = red[..., :3], red[..., 3]
mx, mn = rgb.max(-1), rgb.min(-1)
delta = mx - mn + 1e-6
r, g, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
h = np.where(mx == r, ((g - b_) / delta) % 6, np.where(mx == g, (b_ - r) / delta + 2, (r - g) / delta + 4)) / 6.0
s = delta / (mx + 1e-6)
is_cloth_red = ((h < 0.035) | (h > 0.95)) & (s > 0.18) & (a > 0.5)   # rouge pur, pas le bois brun (teinte ~0.07)
out = rgb.copy()
idx = np.where(is_cloth_red)
for y, x in zip(*idx):
    hh = (h[y, x] - 0.075) % 1.0           # rouge -> rose (≈ 340°)
    out[y, x] = colorsys.hsv_to_rgb(hh, s[y, x] * 0.85, min(1.0, mx[y, x] * 1.08))
rose = Image.fromarray(np.dstack([out, a[..., None]]).__mul__(255).astype(np.uint8), "RGBA")
rose.save(os.path.join(out_dir, "table_rose.png"))

# chaise complète (la première)
trim(k.crop(chaises[0])).save(os.path.join(out_dir, "chaise.png"))

# --- planche d'objets : passe-plats et plaque --------------------------------
k2 = key_blue(Image.open(objets_img))
b2 = components(k2, dilate=1, min_area=1500)
# ordre : table, dossier, passe-plats, plaque
hatch = k2.crop(b2[2])
hatch.save(os.path.join(out_dir, "_passe_plats_brut.png"))
trim(k2.crop(b2[3])).save(os.path.join(out_dir, "_plaque_brut.png"))
print("ok", sorted(os.listdir(out_dir)))
