"""
Store graphics, generated from the real app rather than mocked up:
  · Play Store phone screenshots  1080x1920  (+ Hebrew caption bar)
  · App Store 6.7" screenshots    1290x2796
  · Play Store feature graphic    1024x500
Run with the app served locally; pass BASE_URL if not on :8000.
"""
import os, subprocess, time, signal, pathlib, math
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path("/home/claude/build/lia-app")
OUT = ROOT / "store"
(OUT / "play").mkdir(parents=True, exist_ok=True)
(OUT / "appstore").mkdir(parents=True, exist_ok=True)
PORT = 8177
BASE = f"http://127.0.0.1:{PORT}/index.html"

CREAM = (255, 246, 228); BERRY = (232, 68, 122); GRAPE = (138, 92, 199)
INK = (51, 38, 61); WHITE = (255, 255, 255); SUN = (255, 182, 39)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
def font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

# Pillow is built with libraqm here, so it handles bidi itself — no reversal.
def heb(t):
    return t

# caption, then the steps to reach that screen inside the app
SHOTS = [
    ("home",    "182 מילים בעברית",      lambda p: None),
    ("category","לוחצים, שומעים, לומדים", lambda p: (p.click('[data-cat="animals"]'), p.wait_for_timeout(600))),
    ("quiz",    "משחקים שמלמדים לדבר",   lambda p: (p.evaluate("()=>launch('quiz','animals')"), p.wait_for_timeout(900))),
    ("focus",   "מבוסס שיטות קלינאיות",  lambda p: (p.evaluate("()=>launch('focus','animals')"), p.wait_for_timeout(800))),
    ("parent",  "מסך הורים והקלטות",     lambda p: (p.evaluate("()=>{unlocked=true;view='parent';parentTab='record';render();}"), p.wait_for_timeout(700))),
]

def capture(width, height, folder, cap_h):
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        # device pixel ratio 1 at full store resolution, minus the caption band
        ctx = b.new_context(viewport={"width": width // 3, "height": (height - cap_h) // 3},
                            device_scale_factor=3, has_touch=True, is_mobile=True)
        page = ctx.new_page()
        for name, caption, steps in SHOTS:
            page.goto(BASE); page.wait_for_timeout(900)
            if page.query_selector("#gateBtn"):
                page.click("#gateBtn"); page.wait_for_timeout(500)
            # a little progress makes the screenshots look lived-in
            page.evaluate("""()=>{
              ['כֶּלֶב','חָתוּל','פָּרָה','אַרְיֵה','פִּיל','סוּס','קוֹף','דָּג'].forEach(w=>learned.add('animals:'+w));
              ['תַּפּוּחַ','בָּנָנָה','מַיִם','לֶחֶם'].forEach(w=>learned.add('food:'+w));
              render();}""")
            page.wait_for_timeout(300)
            steps(page)
            raw = OUT / folder / f"_raw-{name}.png"
            page.screenshot(path=str(raw))
            frame(raw, OUT / folder / f"{name}.png", width, height, cap_h, caption)
            raw.unlink()
            print("  ·", folder, name)
        b.close()

def frame(raw_path, out_path, width, height, cap_h, caption):
    shot = Image.open(raw_path).convert("RGB").resize((width, height - cap_h), Image.LANCZOS)
    canvas = Image.new("RGB", (width, height), CREAM)
    d = ImageDraw.Draw(canvas)
    # caption band with a soft gradient
    for y in range(cap_h):
        t = y / cap_h
        d.line([(0, y), (width, y)],
               fill=tuple(int(BERRY[i] + (GRAPE[i] - BERRY[i]) * t) for i in range(3)))
    f = font(int(cap_h * 0.34))
    txt = heb(caption)
    bbox = d.textbbox((0, 0), txt, font=f)
    d.text(((width - (bbox[2] - bbox[0])) / 2, (cap_h - (bbox[3] - bbox[1])) / 2 - bbox[1]),
           txt, font=f, fill=WHITE)
    canvas.paste(shot, (0, cap_h))
    canvas.save(out_path)

def star(d, cx, cy, r_out, r_in, fill, points=5, rot=-math.pi/2):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / points
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=fill)

def feature_graphic():
    """1024x500 — the banner at the top of a Play Store listing"""
    W, H = 1024, 500
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for x in range(W):
        t = x / W
        d.line([(x, 0), (x, H)], fill=tuple(int(BERRY[i] + (GRAPE[i] - BERRY[i]) * t) for i in range(3)))
    # scattered soft stars
    for (cx, cy, r, a) in [(90, 90, 26, 60), (940, 120, 20, 50), (150, 410, 18, 45),
                           (860, 400, 26, 55), (520, 60, 14, 40), (610, 450, 16, 40)]:
        star(d, cx, cy, r, r * 0.38, (255, 255, 255, a) if False else (255, 255, 255), 4)
    # mascot
    mx, my = 175, H // 2
    star(d, mx, my, 112, 54, SUN)
    d.ellipse([mx - 40, my - 20, mx - 19, my + 6], fill=INK)
    d.ellipse([mx + 19, my - 20, mx + 40, my + 6], fill=INK)
    d.ellipse([mx - 35, my - 16, mx - 28, my - 9], fill=WHITE)
    d.ellipse([mx + 24, my - 16, mx + 31, my - 9], fill=WHITE)
    d.arc([mx - 30, my + 4, mx + 30, my + 46], start=15, end=165, fill=INK, width=9)
    d.ellipse([mx - 74, my + 10, mx - 47, my + 29], fill=(244, 160, 188))
    d.ellipse([mx + 47, my + 10, mx + 74, my + 29], fill=(244, 160, 188))
    # wordmark
    f1, f2 = font(64), font(31)
    t1 = heb("Talki")
    b1 = d.textbbox((0, 0), t1, font=f1)
    d.text((W - 60 - (b1[2] - b1[0]), 168), t1, font=f1, fill=WHITE)
    t2 = heb("לוחצים, שומעים ולומדים לדבר")
    b2 = d.textbbox((0, 0), t2, font=f2)
    d.text((W - 60 - (b2[2] - b2[0]), 252), t2, font=f2, fill=(255, 235, 245))
    t3 = heb("182 מילים · 16 משחקים · עובד גם בלי אינטרנט")
    f3 = font(25)
    b3 = d.textbbox((0, 0), t3, font=f3)
    d.text((W - 60 - (b3[2] - b3[0]), 306), t3, font=f3, fill=(255, 255, 255))
    img.save(OUT / "feature-graphic-1024x500.png")
    print("  · feature graphic")

srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                       cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.5)
try:
    print("Play Store screenshots (1080x1920):")
    capture(1080, 1920, "play", 180)
    print("App Store screenshots (1290x2796):")
    capture(1290, 2796, "appstore", 240)
    print("Feature graphic:")
    feature_graphic()
finally:
    srv.send_signal(signal.SIGTERM)
print("\nsaved to", OUT)
