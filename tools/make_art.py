"""
Builds the art layer for the app:
  1. כּוֹכִי the star mascot — one SVG with swappable expressions
  2. per-category decorative patterns, emitted as CSS background data-URIs

Everything is vector and inline, so it stays offline-safe and weighs almost nothing.
"""
import math, json, urllib.parse, pathlib

OUT = pathlib.Path("/home/claude/build/art.js")

# ---------------------------------------------------------------- mascot
def rounded_star(cx, cy, r_out, r_in, points=5, rot=-math.pi/2, smooth=0.42):
    """star path with quadratic corners, so it reads friendly instead of spiky"""
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / points
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d = ""
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        if i == 0:
            d += f"M{mx:.1f},{my:.1f}"
        else:
            d += f"Q{x0:.1f},{y0:.1f} {mx:.1f},{my:.1f}"
    x0, y0 = pts[0]
    mx, my = (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2
    d += f"Q{x0:.1f},{y0:.1f} {mx:.1f},{my:.1f}Z"
    return d

BODY = rounded_star(60, 58, 52, 26, 5)

FACES = {
    # idle: soft smile, calm eyes
    "idle": """
      <ellipse cx="46" cy="54" rx="5" ry="6.5" fill="#33263D"/>
      <ellipse cx="74" cy="54" rx="5" ry="6.5" fill="#33263D"/>
      <circle cx="47.6" cy="51.6" r="1.8" fill="#fff"/><circle cx="75.6" cy="51.6" r="1.8" fill="#fff"/>
      <path d="M52,68 Q60,75 68,68" stroke="#33263D" stroke-width="3.4" fill="none" stroke-linecap="round"/>""",
    # cheer: eyes squeezed shut, open mouth
    "cheer": """
      <path d="M40,54 Q46,47 52,54" stroke="#33263D" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M68,54 Q74,47 80,54" stroke="#33263D" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M51,66 Q60,80 69,66 Z" fill="#33263D"/>
      <path d="M55,72 Q60,77 65,72 Z" fill="#E8447A"/>""",
    # listening: wide eyes, small round mouth — the expectant pause face
    "listen": """
      <ellipse cx="46" cy="53" rx="6.2" ry="7.6" fill="#33263D"/>
      <ellipse cx="74" cy="53" rx="6.2" ry="7.6" fill="#33263D"/>
      <circle cx="48" cy="50" r="2.2" fill="#fff"/><circle cx="76" cy="50" r="2.2" fill="#fff"/>
      <ellipse cx="60" cy="70" rx="5" ry="6" fill="#33263D"/>""",
    # thinking: one raised brow, flat mouth
    "think": """
      <ellipse cx="46" cy="55" rx="5" ry="6" fill="#33263D"/>
      <ellipse cx="74" cy="54" rx="5" ry="6.5" fill="#33263D"/>
      <path d="M68,43 Q74,39 80,43" stroke="#33263D" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M53,69 Q60,72 67,69" stroke="#33263D" stroke-width="3.2" fill="none" stroke-linecap="round"/>""",
    # sleep: closed eyes
    "sleep": """
      <path d="M40,55 Q46,60 52,55" stroke="#33263D" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M68,55 Q74,60 80,55" stroke="#33263D" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="60" cy="70" rx="4" ry="5" fill="#33263D" opacity=".8"/>""",
}

CHEEKS = """
  <ellipse cx="38" cy="64" rx="6" ry="4" fill="#F4A0BC" opacity=".75"/>
  <ellipse cx="82" cy="64" rx="6" ry="4" fill="#F4A0BC" opacity=".75"/>"""

def mascot_svg(mood):
    return f"""<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="mascot mascot-{mood}" aria-hidden="true">
  <defs>
    <linearGradient id="mg-{mood}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFD35C"/><stop offset="1" stop-color="#FFB627"/>
    </linearGradient>
  </defs>
  <path d="{BODY}" fill="url(#mg-{mood})" stroke="#E89A00" stroke-width="3" stroke-linejoin="round"/>
  {CHEEKS}{FACES[mood]}
</svg>"""

# ------------------------------------------------- category patterns
# soft repeating shapes tinted per category; used as card + screen backgrounds
def pattern(shape, color):
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">{shape}</svg>"""
    svg = svg.replace("CURRENT", color)
    return "url('data:image/svg+xml," + urllib.parse.quote(svg) + "')"

SHAPES = {
    "paw":    '<circle cx="18" cy="22" r="4" fill="CURRENT"/><circle cx="28" cy="16" r="4" fill="CURRENT"/><circle cx="38" cy="22" r="4" fill="CURRENT"/><ellipse cx="28" cy="34" rx="9" ry="7" fill="CURRENT"/>',
    "dots":   '<circle cx="15" cy="15" r="5" fill="CURRENT"/><circle cx="45" cy="35" r="7" fill="CURRENT"/><circle cx="28" cy="46" r="3.5" fill="CURRENT"/>',
    "shapes": '<rect x="10" y="10" width="14" height="14" rx="3" fill="CURRENT"/><circle cx="42" cy="20" r="7" fill="CURRENT"/><path d="M20,50 L30,34 L40,50 Z" fill="CURRENT"/>',
    "house":  '<path d="M14,34 L26,22 L38,34 V46 H14 Z" fill="CURRENT"/><rect x="42" y="30" width="12" height="16" rx="2" fill="CURRENT"/>',
    "heart":  '<path d="M28,44 C10,30 14,16 24,16 C28,16 28,20 28,20 C28,20 28,16 32,16 C42,16 46,30 28,44 Z" fill="CURRENT"/>',
    "wave":   '<path d="M0,30 Q15,18 30,30 T60,30" stroke="CURRENT" stroke-width="5" fill="none" stroke-linecap="round"/>',
    "star":   '<path d="M30,12 L34,26 L48,30 L34,34 L30,48 L26,34 L12,30 L26,26 Z" fill="CURRENT"/>',
    "leaf":   '<path d="M14,46 C14,26 30,14 46,14 C46,34 30,46 14,46 Z" fill="CURRENT"/>',
    "digits": '<rect x="12" y="14" width="6" height="20" rx="3" fill="CURRENT"/><circle cx="40" cy="24" r="10" fill="none" stroke="CURRENT" stroke-width="5"/>',
    "smile":  '<circle cx="30" cy="30" r="14" fill="none" stroke="CURRENT" stroke-width="4"/><circle cx="25" cy="26" r="2.5" fill="CURRENT"/><circle cx="35" cy="26" r="2.5" fill="CURRENT"/><path d="M24,35 Q30,40 36,35" stroke="CURRENT" stroke-width="3" fill="none" stroke-linecap="round"/>',
}

CATEGORY_ART = {
    "animals":  ("paw",    "rgba(255,255,255,0.30)"),
    "food":     ("dots",   "rgba(255,255,255,0.28)"),
    "colors":   ("shapes", "rgba(255,255,255,0.27)"),
    "home":     ("house",  "rgba(255,255,255,0.27)"),
    "family":   ("heart",  "rgba(255,255,255,0.27)"),
    "body":     ("smile",  "rgba(255,255,255,0.27)"),
    "actions":  ("wave",   "rgba(255,255,255,0.32)"),
    "numbers":  ("digits", "rgba(255,255,255,0.28)"),
    "outside":  ("leaf",   "rgba(255,255,255,0.27)"),
    "emotions": ("star",   "rgba(255,255,255,0.27)"),
    "mine":     ("heart",  "rgba(255,255,255,0.27)"),
}

moods = {m: mascot_svg(m) for m in FACES}
patterns = {cid: pattern(SHAPES[shape], color) for cid, (shape, color) in CATEGORY_ART.items()}

js = f"""/* ---- generated art: mascot + category patterns (see make_art.py) ---- */
const MASCOT = {json.dumps(moods, ensure_ascii=False)};
const CAT_ART = {json.dumps(patterns, ensure_ascii=False)};
function mascot(mood, size){{
  const svg = MASCOT[mood] || MASCOT.idle;
  return `<span class="mascot-wrap" style="width:${{size||96}}px;height:${{size||96}}px">${{svg}}</span>`;
}}
"""
OUT.write_text(js, encoding="utf-8")
print("wrote", OUT, len(js), "bytes")
print("moods:", list(moods))
