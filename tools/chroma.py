"""Utilitaires de détourage du fond bleu (chroma key) et de découpe de planches.

Le fond bleu généré n'est jamais uniforme (parfois plusieurs bleus dans une même image).
On travaille donc avec un bleu LOCAL : pour chaque pixel, le bleu de fond est celui du pixel de fond
le plus proche. La « bleuité » (bleu moins le max des deux autres canaux) distingue le fond des objets.
"""
import numpy as np
from PIL import Image
from scipy import ndimage

LO = 70.0        # bleuité en dessous de laquelle un pixel est totalement opaque (objet)
HI_RATIO = 0.88  # part de la bleuité du fond au-dessus de laquelle un pixel est totalement transparent


def _blueness(rgb):
    return rgb[..., 2] - np.maximum(rgb[..., 0], rgb[..., 1])


def key_blue(img, lo=LO, hi_ratio=HI_RATIO):
    """Retourne une image RGBA : fond bleu retiré et halo bleu corrigé bord par bord."""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    bl = _blueness(rgb)
    bg_mask = bl > 0.88 * np.percentile(bl, 97)
    bg_mask = ndimage.binary_opening(bg_mask, iterations=1)
    # bleu de fond local : couleur du pixel de fond le plus proche
    idx = ndimage.distance_transform_edt(~bg_mask, return_distances=False, return_indices=True)
    bg = rgb[idx[0], idx[1]]
    bb = _blueness(bg)
    hi = hi_ratio * bb
    a = np.clip((hi - bl) / np.maximum(hi - lo, 1.0), 0.0, 1.0)
    a3 = np.maximum(a, 1e-3)[..., None]
    col = np.clip((rgb - (1.0 - a3) * bg) / a3, 0, 255)
    # anti-halo : un pixel de bord ne doit pas rester plus bleu que ses autres canaux
    edge = (a < 0.98)[..., None]
    limit = np.maximum(col[..., 0:1], col[..., 1:2]) + 8
    col[..., 2:3] = np.where(edge, np.minimum(col[..., 2:3], limit), col[..., 2:3])
    out = np.dstack([col, a * 255.0]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def components(rgba, min_area=2500, dilate=6):
    """Boîtes englobantes des objets séparés, triées gauche→droite par rangée."""
    alpha = np.asarray(rgba)[..., 3] > 40
    mask = ndimage.binary_dilation(alpha, iterations=dilate)
    lab, n = ndimage.label(mask)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        area = int((lab[sl] == i).sum())
        if area < min_area:
            continue
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        boxes.append((x0, y0, x1, y1))
    if not boxes:
        return boxes
    hs = np.median([b[3] - b[1] for b in boxes])
    boxes.sort(key=lambda b: (round(((b[1] + b[3]) / 2) / hs), b[0]))
    return boxes


def grid_sprites(rgba, cols, rows, dilate=18, min_area=400, speck=250):
    """Découpe une planche en grille. Chaque sprite regroupe tous les morceaux (fumée, étincelles...)
    dont le centre tombe dans sa case. Retourne la liste des sprites, gauche→droite puis haut→bas
    (None pour une case vide)."""
    arr = np.array(rgba)                               # copie modifiable
    raw, _ = ndimage.label(arr[..., 3] > 40)
    taille = np.bincount(raw.ravel())
    petit = taille < speck                             # poussières JPEG du fond : on les efface avant de regrouper
    petit[0] = False
    arr[..., 3] = np.where(petit[raw], 0, arr[..., 3])
    a = arr[..., 3]
    h, w = a.shape
    mask = ndimage.binary_dilation(a > 40, iterations=dilate)
    lab, n = ndimage.label(mask)
    cells = {}
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        region = lab[sl] == i
        if region.sum() < min_area:
            continue
        cy = (sl[0].start + sl[0].stop) / 2
        cx = (sl[1].start + sl[1].stop) / 2
        key = (min(int(cy / (h / rows)), rows - 1), min(int(cx / (w / cols)), cols - 1))
        cells.setdefault(key, []).append(i)
    out = []
    for r in range(rows):
        for c in range(cols):
            ids = cells.get((r, c))
            if not ids:
                out.append(None)
                continue
            keep = np.isin(lab, ids)
            piece = arr.copy()
            piece[..., 3] = np.where(keep, piece[..., 3], 0)
            out.append(trim(Image.fromarray(piece, "RGBA")))
    return out


def trim(rgba, pad=2):
    a = np.asarray(rgba)[..., 3]
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        return rgba
    return rgba.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0),
                      min(xs.max() + 1 + pad, rgba.width), min(ys.max() + 1 + pad, rgba.height)))


def interior_leak(rgba, erode=8):
    """Part des pixels bien à l'intérieur d'un objet qui ne sont pas totalement opaques (doit être ~0)."""
    a = np.asarray(rgba)[..., 3]
    inside = ndimage.binary_erosion(ndimage.binary_fill_holes(a > 128), iterations=erode)
    if inside.sum() == 0:
        return 0.0
    return float((a[inside] < 250).mean())
