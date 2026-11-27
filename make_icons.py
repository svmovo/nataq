# نطق | Nataq - icon generator
# By svmovo
# شغّل: python3 make_icons.py  (بيحتاج PIL: pip install pillow)
# بيعمل icons/icon16.png و icons/icon48.png و icons/icon128.png
from PIL import Image, ImageDraw
import os

def draw_icon(size):
    S = 4
    w = size * S
    img = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(w * 0.22)
    top = (0x24, 0x1A, 0x2B)
    bot = (0x1B, 0x12, 0x20)
    for y in range(w):
        t = y / w
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c + (255,))
    mask = Image.new("L", (w, w), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, w - 1, w - 1], radius=r, fill=255)
    img.putalpha(mask)
    d.rounded_rectangle([int(w*0.03), int(w*0.03), w - int(w*0.03) - 1, w - int(w*0.03) - 1],
                        radius=int(r*0.9), outline=(0x7A, 0x1C, 0x38, 255), width=max(2, int(w*0.045)))
    cx = w / 2
    cap_w = w * 0.24
    cap_top = w * 0.20
    cap_bot = w * 0.56
    white = (0xEF, 0xEA, 0xF2, 255)
    d.rounded_rectangle([cx - cap_w/2, cap_top, cx + cap_w/2, cap_bot], radius=cap_w/2, fill=white)
    arc_col = (0xC9, 0x3A, 0x5E, 255)
    pad = w * 0.075
    bbox = [cx - cap_w/2 - pad, cap_top - pad*0.3, cx + cap_w/2 + pad, cap_bot + pad*1.6]
    d.arc(bbox, start=20, end=160, fill=arc_col, width=max(2, int(w*0.045)))
    stem_top = cap_bot + pad*1.35
    stem_bot = w * 0.80
    d.line([(cx, stem_top), (cx, stem_bot)], fill=white, width=max(2, int(w*0.05)))
    base_w = w * 0.24
    d.line([(cx - base_w/2, stem_bot), (cx + base_w/2, stem_bot)], fill=white, width=max(2, int(w*0.05)))
    return img.resize((size, size), Image.LANCZOS)

os.makedirs("icons", exist_ok=True)
for s in (16, 48, 128):
    draw_icon(s).save(f"icons/icon{s}.png")
    print("saved icons/icon%d.png" % s)
