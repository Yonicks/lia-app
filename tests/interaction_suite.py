"""
Real-user-interaction suite for Talki.

tests/test_suite.py drives most of the app with programmatic `element.click()`,
which is great for verifying state transitions but proves nothing about whether
a child can actually reach a control: a button that is covered by the bottom
nav, sized 30px, or parked outside the viewport passes a JS click happily.

This suite is the other half. It uses real Playwright actions — `click()` with
its actionability + hit-test checks, `touchscreen.tap()`, pointer drags — and a
DOM-level reachability/size audit run across the real device matrix. It fails
when a control is unusable by a toddler even though the state machine behind it
is fine.

Run locally:
    python3 -m http.server 8000 &
    BASE_URL=http://localhost:8000 python3 tests/interaction_suite.py

Exits non-zero if anything fails, so CI catches it.
"""
import os, sys, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
URL = BASE + "/index.html"
SHOTS = os.environ.get("SHOT_DIR", tempfile.mkdtemp(prefix="talki-shots-"))
# Sandboxes that ship a prebuilt Chromium (no `playwright install`) can point
# the suite at it instead of the managed download.
CHROMIUM_PATH = os.environ.get("CHROMIUM_PATH") or None

# Talki's users are two- and three-year-olds pressing with the flat of a
# finger. Platform guidance says ~48dp is the floor; that is what we enforce
# for everything a child is expected to hit.
MIN_TOUCH = 48

# Every viewport Talki claims to support.
DEVICES = [
    (320, 568, "iphone-se1"),
    (360, 800, "android-compact"),
    (390, 844, "iphone-13"),
    (430, 932, "iphone-pro-max"),
    (768, 1024, "ipad-mini"),
    (834, 1112, "ipad-air"),
    (844, 390, "landscape-844"),
    (932, 430, "landscape-932"),
]

CHILD_VIEWS = ["home", "games", "practice", "stickers", "category", "cards"]
GAMES = ["quiz", "memory", "missing", "match", "sounds", "count", "sort", "bubbles",
         "speech", "focus", "cloze", "temptation", "receptive", "pairs", "combine",
         "puzzle"]

failures = []
def fail(section, msg):
    failures.append(f"[{section}] {msg}")
    print(f"  ✗ {msg}")
def ok(msg):
    print(f"  ✓ {msg}")


def open_app(ctx, wait=900):
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(f"{e} || {(e.stack or '')[:200]}"))
    def on_console(m):
        if m.type != "error":
            return
        src = (m.location or {}).get("url", "") + " " + m.text
        if "fonts.googleapis" in src or "fonts.gstatic" in src:
            return
        errors.append("console.error: " + m.text)
    page.on("console", on_console)
    page.goto(URL)
    page.wait_for_timeout(wait)
    if page.query_selector("#gateBtn"):
        page.click("#gateBtn")
        page.wait_for_timeout(400)
    return page, errors


def show(page, view):
    page.evaluate("(v)=>{activeCat='animals';view=v;game=null;render();}", view)
    page.wait_for_timeout(150)

def play(page, gtype):
    page.evaluate("(g)=>launch(g,'animals')", gtype)
    page.wait_for_timeout(450)

def has_game(page, gtype):
    return page.evaluate("(g)=>typeof MIN_ITEMS==='object' && g in MIN_ITEMS", gtype)


# ------------------------------------------------------------------ helpers
# Scroll each control to the middle of the screen, then hit-test it. Anything
# still covered there is unreachable no matter what the child does.
REACHABILITY = """()=>{
  const sels = ['button','select','[data-cat]','[data-game]','.tile','.opt',
                '.match-item','.box','.mod','.mem','.pz-piece','.pz-slot'];
  const seen = new Set(), els = [], out = [];
  document.querySelectorAll(sels.join(',')).forEach(el=>{
    if(seen.has(el)) return; seen.add(el);
    const cs = getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||cs.pointerEvents==='none') return;
    const r = el.getBoundingClientRect();
    if(r.width<2||r.height<2) return;
    els.push(el);
  });
  for(const el of els){
    el.scrollIntoView({block:'center', behavior:'instant'});
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
    if(!(top && (el===top || el.contains(top) || top.contains(el)))){
      out.push({cls:String(el.className||''), txt:(el.textContent||'').trim().slice(0,14),
                by: top ? top.tagName+'.'+String(top.className||'') : 'nothing'});
    }
  }
  window.scrollTo(0,0);
  return out;
}"""

# Measured hit box, including any invisible ::before pad a control grows for
# small fingers.
TOUCH_SIZES = """(sel)=>{
  const out = [];
  document.querySelectorAll(sel).forEach(el=>{
    const cs = getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||cs.pointerEvents==='none') return;
    let r = el.getBoundingClientRect();
    if(r.width<2||r.height<2) return;
    let w = r.width, h = r.height;
    for(const pseudo of ['::before','::after']){
      const ps = getComputedStyle(el, pseudo);
      if(ps.content && ps.content!=='none' && ps.position==='absolute'){
        w = Math.max(w, parseFloat(ps.width)||0);
        h = Math.max(h, parseFloat(ps.height)||0);
      }
    }
    out.push({cls:String(el.className||''), id:el.id||'',
              txt:(el.textContent||'').trim().slice(0,16).replace(/\\s+/g,' '),
              w:Math.round(w), h:Math.round(h)});
  });
  return out;
}"""


# ------------------------------------------------- 1. controls are reachable
def test_reachable_everywhere(b):
    print("\n1. Every control is reachable by a real finger, at every viewport")
    for w, h, name in DEVICES:
        ctx = b.new_context(viewport={"width": w, "height": h},
                            has_touch=w < 900, is_mobile=w < 900)
        page, errors = open_app(ctx)
        bad = []
        for v in CHILD_VIEWS:
            show(page, v)
            bad += [(v, x) for x in page.evaluate(REACHABILITY)]
        for g in GAMES:
            if not has_game(page, g):
                continue
            play(page, g)
            bad += [(g, x) for x in page.evaluate(REACHABILITY)]
        if bad:
            fail(name, f"{len(bad)} control(s) covered even after scrolling: {bad[:3]}")
        elif errors:
            fail(name, f"JS errors while walking the app: {errors[:2]}")
        else:
            ok(f"{name} ({w}x{h}): every control hit-testable")
        ctx.close()


# ------------------------------------------------------- 2. toddler hit sizes
def test_touch_target_sizes(b):
    print(f"\n2. Controls a child taps are at least {MIN_TOUCH}px")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, _ = open_app(ctx)
    # The child-facing surface. Parent-only screens are adult UI and are held
    # to normal web sizing.
    sel = ".pill-btn,.big-btn,.bn-item,.v2-chip,.v2h-back,.opt,.tile,.mem,.box,.mod," \
          ".v2-game-card,.v2-cat-card,.v2-practice-card,.match-item,#gameCat,.icon-btn"
    small = []
    for v in CHILD_VIEWS:
        show(page, v)
        small += [(v, x) for x in page.evaluate(TOUCH_SIZES, sel)
                  if min(x["w"], x["h"]) < MIN_TOUCH]
    for g in GAMES:
        if not has_game(page, g):
            continue
        play(page, g)
        small += [(g, x) for x in page.evaluate(TOUCH_SIZES, sel)
                  if min(x["w"], x["h"]) < MIN_TOUCH]
    if small:
        fail("touch-size", f"{len(small)} control(s) under {MIN_TOUCH}px: {small[:4]}")
    else:
        ok(f"every child-facing control is at least {MIN_TOUCH}px on both axes")
    ctx.close()


# --------------------------------------------- 3. real taps drive the app
def test_real_tap_navigation(b):
    print("\n3. Real taps: bottom nav, games menu, and back out of every game")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    for dest in ["games", "stickers", "home"]:
        page.click(f'#bottomNav [data-nav="{dest}"]', timeout=5000)
        page.wait_for_timeout(250)
        if page.evaluate("()=>view") != dest:
            fail("nav", f"tapping the {dest} nav item did not open it")
    ok("bottom nav responds to real taps")

    # Every game card on the Games and Practice screens must open its game
    # from a real tap, not just from a scripted click.
    for screen in ["games", "practice"]:
        show(page, screen)
        targets = page.eval_on_selector_all("[data-game]", "e=>e.map(x=>x.dataset.game)")
        for g in targets:
            show(page, screen)
            card = page.locator(f'[data-game="{g}"]').first
            card.scroll_into_view_if_needed()
            try:
                card.click(timeout=5000)
            except Exception as e:
                fail("tap-open", f"{screen}: card '{g}' cannot be tapped: {str(e)[:90]}")
                continue
            page.wait_for_timeout(500)
            now = page.evaluate("()=>view")
            if now == screen:
                fail("tap-open", f"{screen}: tapping '{g}' did not leave the menu")
            # and the child must be able to get back out with one real tap
            back = page.locator('[data-nav="home"]').first
            try:
                back.scroll_into_view_if_needed()
                back.click(timeout=5000)
            except Exception as e:
                fail("tap-exit", f"{g}: no tappable way home: {str(e)[:90]}")
                continue
            page.wait_for_timeout(300)
            if page.evaluate("()=>view") != "home":
                fail("tap-exit", f"{g}: tapping home did not return to the home screen")
    ok("every game card opens and exits under a real tap")

    if errors:
        fail("nav", f"JS errors: {errors[:2]}")
    ctx.close()


# ------------------------------------- 4. the app does not degrade over time
def test_no_listener_growth(b):
    print("\n4. Navigating does not stack duplicate handlers on the chrome")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)
    page.evaluate("""()=>{
      window.__added = 0;
      const btn = document.querySelector('#bottomNav [data-nav="home"]');
      const orig = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(t, f, o){
        if(this === btn && t === 'click') window.__added++;
        return orig.call(this, t, f, o);
      };
    }""")
    for _ in range(15):
        page.evaluate("()=>{view = (view==='home'?'games':'home'); render();}")
    added = page.evaluate("()=>window.__added")
    if added:
        fail("leak", f"15 renders attached {added} extra click handlers to the bottom nav")
    else:
        ok("the persistent bottom nav is bound once, not once per render")

    # and the UI still answers a real tap promptly after heavy navigation
    for _ in range(12):
        page.click('#bottomNav [data-nav="games"]', timeout=5000)
        page.click('#bottomNav [data-nav="home"]', timeout=5000)
    ok("24 real nav taps in a row stay responsive")
    if errors:
        fail("leak", f"JS errors: {errors[:2]}")
    ctx.close()


# ---------------------------------------------------- 5. rapid-tap stability
def test_rapid_taps(b):
    print("\n5. Patting a picture repeatedly scores once, not once per pat")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    def burst(sel, n=4):
        page.evaluate("([s,n])=>{const e=document.querySelector(s); for(let i=0;i<n;i++) e && e.click();}",
                      [sel, n])

    play(page, "missing")
    page.wait_for_timeout(2700)
    w = page.evaluate("()=>game.missing.word")
    burst(f'[data-guess="{w}"]')
    page.wait_for_timeout(1300)
    st = page.evaluate("()=>({r:game.round,s:game.score})")
    if st["s"] != 1 or st["r"] != 1:
        fail("rapid", f"'what's missing?': 4 taps gave score {st['s']} and advanced {st['r']} rounds")
    else:
        ok("what's missing?: 4 taps = 1 point, 1 round")

    play(page, "cloze")
    page.wait_for_timeout(7000)
    burst('[data-clozeyes]')
    page.wait_for_timeout(600)
    st = page.evaluate("()=>({i:game.i,s:game.score})")
    if st["s"] != 1 or st["i"] != 1:
        fail("rapid", f"cloze: 4 taps gave score {st['s']} and skipped to sentence {st['i']}")
    else:
        ok("cloze: 4 taps = 1 sentence")

    page.evaluate("()=>{launch('temptation','animals');game.opened=true;render();}")
    page.wait_for_timeout(500)
    burst('[data-temptnext]')
    page.wait_for_timeout(400)
    if page.evaluate("()=>game.i") != 1:
        fail("rapid", f"jar: 4 taps skipped to word {page.evaluate('()=>game.i')}")
    else:
        ok("jar: 4 taps = 1 word")

    play(page, "combine")
    burst('[data-combine]')
    page.wait_for_timeout(400)
    if page.evaluate("()=>game.round") != 1:
        fail("rapid", f"two-word: 4 taps advanced {page.evaluate('()=>game.round')} rounds")
    else:
        ok("two-word: 4 taps = 1 phrase")

    play(page, "focus")
    burst('#focusCard', 5)
    page.wait_for_timeout(400)
    if page.evaluate("()=>game.step") != 1:
        fail("rapid", f"focused stimulation: 5 taps jumped to step {page.evaluate('()=>game.step')}")
    else:
        ok("focused stimulation: 5 taps = 1 phrase")

    play(page, "speech")
    burst('[data-skip]', 4)
    page.wait_for_timeout(400)
    if page.evaluate("()=>game.i") != 1:
        fail("rapid", f"speech: 4 skip taps jumped to word {page.evaluate('()=>game.i')}")
    else:
        ok("speech: 4 skip taps = 1 word")

    play(page, "match")
    w = page.evaluate("()=>game.left[0].word")
    page.evaluate("(w)=>document.querySelector(`[data-mleft='${w}']`).click()", w)
    page.wait_for_timeout(200)
    burst(f'[data-mright="{w}"]', 4)
    page.wait_for_timeout(400)
    if page.evaluate("()=>game.matched.length") != 1:
        fail("rapid", f"match: one pair counted {page.evaluate('()=>game.matched.length')} times")
    else:
        ok("match: 4 taps on one pair = 1 match")

    play(page, "quiz")
    w = page.evaluate("()=>game.target.word")
    burst(f'[data-opt="{w}"]', 4)
    page.wait_for_timeout(1000)
    if page.evaluate("()=>game.score") != 1:
        fail("rapid", f"quiz: 4 taps scored {page.evaluate('()=>game.score')}")
    else:
        ok("quiz: 4 taps = 1 point")

    if errors:
        fail("rapid", f"JS errors: {errors[:2]}")
    ctx.close()


def main():
    print(f"Real-interaction suite against {URL}")
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": CHROMIUM_PATH} if CHROMIUM_PATH else {}))
        tests = [test_reachable_everywhere, test_touch_target_sizes,
                 test_real_tap_navigation, test_no_listener_growth, test_rapid_taps]
        for t in tests:
            try:
                t(b)
            except Exception as e:
                fail(t.__name__, f"crashed: {e}")
        b.close()

    print("\n" + "=" * 60)
    if failures:
        print(f"FAILED — {len(failures)} problem(s):")
        for f in failures:
            print("  •", f)
        sys.exit(1)
    print("ALL INTERACTION CHECKS PASSED")
    sys.exit(0)


if __name__ == "__main__":
    main()
