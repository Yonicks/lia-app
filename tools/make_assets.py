from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = "/home/claude/build/lia-app"
BERRY = (232, 68, 122); GRAPE = (138, 92, 199); CREAM = (255, 246, 228)
SUN = (255, 182, 39); WHITE = (255, 255, 255)

def gradient(size, c1, c2):
    img = Image.new("RGB", (size, size), c1)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(size - 1, 1)
        d.line([(0, y), (size, y)], fill=tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    return img

def star(d, cx, cy, r_out, r_in, points=4, fill=WHITE, rot=-math.pi/2):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / points
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=fill)

def hebrew_font(size):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

def make_icon(size, maskable=False):
    """maskable icons keep all art inside the safe circle (80% of the canvas)"""
    img = gradient(size, BERRY, GRAPE).convert("RGBA")
    if not maskable:
        # rounded corners for the plain icon
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=int(size * 0.22), fill=255)
        img.putalpha(mask)
    d = ImageDraw.Draw(img)
    scale = 0.78 if maskable else 1.0
    c = size / 2
    star(d, c, c, size * 0.34 * scale, size * 0.12 * scale, 4, WHITE)
    star(d, c + size * 0.24 * scale, c - size * 0.22 * scale, size * 0.10 * scale, size * 0.035 * scale, 4, SUN)
    star(d, c - size * 0.25 * scale, c + size * 0.20 * scale, size * 0.075 * scale, size * 0.026 * scale, 4, SUN)
    # no lettering: PIL has no bidi shaping, and a wordless mark reads better at 48px anyway
    star(d, c - size * 0.05 * scale, c + size * 0.30 * scale, size * 0.055 * scale, size * 0.02 * scale, 4, WHITE)
    return img

for s in (192, 512):
    make_icon(s).save(f"{OUT}/icons/icon-{s}.png")
make_icon(512, maskable=True).save(f"{OUT}/icons/icon-512-maskable.png")
make_icon(180).convert("RGB").save(f"{OUT}/icons/apple-touch-icon.png")
make_icon(32).save(f"{OUT}/icons/favicon-32.png")

# iOS splash screens: cream background with the mark centred
SPLASH = [
    (1170, 2532, "iphone-13-14"),
    (1290, 2796, "iphone-15-16-pro-max"),
    (1179, 2556, "iphone-15-16"),
    (1640, 2360, "ipad-air"),
    (1536, 2048, "ipad-9th"),
]
for w, h, name in SPLASH:
    img = Image.new("RGB", (w, h), CREAM)
    mark = make_icon(int(min(w, h) * 0.34))
    img.paste(mark, ((w - mark.width) // 2, (h - mark.height) // 2), mark)
    img.save(f"{OUT}/splash/splash-{w}x{h}.png")

print("icons:", sorted(os.listdir(f"{OUT}/icons")))
print("splash:", sorted(os.listdir(f"{OUT}/splash")))
