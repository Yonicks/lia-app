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

def open_parent(page):
    """The child nav has three destinations and none of them is the parent
    screen, so the only way in is the 900 ms hold on the header brand mark."""
    page.dispatch_event("#parentBtn", "mousedown")
    page.wait_for_timeout(1100)
    page.dispatch_event("#parentBtn", "mouseup")
    page.wait_for_timeout(500)


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
          ".v2-game-card,.v2-cat-card,.v2-practice-card,.match-item,.icon-btn"
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


# --------------------------------------------- 5b. the Back button/gesture
def test_back_button(b):
    print("\n5b. Back steps out of a game instead of closing Talki")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    page.click('#bottomNav [data-nav="games"]', timeout=5000)
    page.wait_for_timeout(300)
    page.locator('[data-game="quiz"]').first.click(timeout=5000)
    page.wait_for_timeout(600)
    if page.evaluate("()=>view") != "quiz":
        fail("back", "could not open the quiz to test Back")
        ctx.close()
        return

    page.go_back(); page.wait_for_timeout(500)
    st = page.evaluate("()=>({view, gameCleared: game===null})")
    if st["view"] != "games":
        fail("back", f"Back from a game landed on '{st['view']}', not the games menu")
    elif not st["gameCleared"]:
        fail("back", "Back left the abandoned round in memory")
    else:
        ok("Back steps out of a game onto the menu it came from")

    page.go_back(); page.wait_for_timeout(500)
    if page.evaluate("()=>view") != "home":
        fail("back", "a second Back did not reach home")
    else:
        ok("a second Back reaches home")

    # a category drill-down walks back the same way
    show(page, "home")
    page.locator('[data-cat="animals"]').first.click(timeout=5000)
    page.wait_for_timeout(400)
    page.locator('[data-cards="animals"]').first.click(timeout=5000)
    page.wait_for_timeout(400)
    page.go_back(); page.wait_for_timeout(400)
    if page.evaluate("()=>[view,activeCat]") != ["category", "animals"]:
        fail("back", "Back from the flashcards did not return to the category")
    else:
        ok("Back from the flashcards returns to the category it opened from")

    # replaying the same game must not pile up history entries
    show(page, "home")
    before = page.evaluate("()=>history.length")
    for _ in range(5):
        page.evaluate("()=>launch('quiz','animals')")
        page.wait_for_timeout(150)
    page.go_back(); page.wait_for_timeout(400)
    if page.evaluate("()=>view") != "home":
        fail("back", "replaying a game stacked extra history entries — Back no longer reaches home")
    else:
        ok("replaying a round adds no extra Back steps")

    if errors:
        fail("back", f"JS errors: {errors[:2]}")
    ctx.close()


# ------------------------------------- 6. every game finishes and restarts
# One "move" per game, expressed as the thing a child would actually do.
def _jclick(page, sel):
    return page.evaluate("(s)=>{const e=document.querySelector(s); if(!e) return false; e.click(); return true;}", sel)

def _move_quiz(pg):
    w = pg.evaluate("()=>game.target && game.target.word")
    return bool(w) and _jclick(pg, f'[data-opt="{w}"]') and (pg.wait_for_timeout(900) or True)
def _move_memory(pg):
    pair = pg.evaluate("""()=>{const c=game.cards.filter(x=>!x.matched); if(!c.length) return null;
      const f=c[0]; const m=c.find(x=>x.pair===f.pair&&x.idx!==f.idx); return m?[f.idx,m.idx]:null;}""")
    if not pair: return False
    for i in pair:
        _jclick(pg, f'[data-mem="{i}"]'); pg.wait_for_timeout(300)
    pg.wait_for_timeout(300); return True
def _move_missing(pg):
    pg.wait_for_timeout(2800)
    w = pg.evaluate("()=>game.missing && game.missing.word")
    if not w or not pg.query_selector(f'[data-guess="{w}"]'): return False
    return _jclick(pg, f'[data-guess="{w}"]') and (pg.wait_for_timeout(1100) or True)
def _move_match(pg):
    w = pg.evaluate("()=>{const r=game.left.find(x=>!game.matched.includes(x.word)); return r&&r.word;}")
    if not w: return False
    _jclick(pg, f'[data-mleft="{w}"]'); pg.wait_for_timeout(200)
    return _jclick(pg, f'[data-mright="{w}"]') and (pg.wait_for_timeout(400) or True)
def _move_sounds(pg):
    w = pg.evaluate("()=>game.target && game.target.word")
    return bool(w) and _jclick(pg, f'[data-sopt="{w}"]') and (pg.wait_for_timeout(1300) or True)
def _move_count(pg):
    n = pg.evaluate("()=>game.n")
    return n is not None and _jclick(pg, f'[data-count="{n}"]') and (pg.wait_for_timeout(1500) or True)
def _move_sort(pg):
    rid = pg.evaluate("()=>game.right && game.right.id")
    return bool(rid) and _jclick(pg, f'[data-box="{rid}"]') and (pg.wait_for_timeout(1300) or True)
def _move_bubbles(pg):
    pg.wait_for_timeout(700)
    return pg.evaluate("()=>{document.querySelectorAll('.bubble').forEach(x=>x.click()); return true;}")
def _move_speech(pg):
    return _jclick(pg, '[data-skip]') and (pg.wait_for_timeout(300) or True)
def _move_focus(pg):
    return _jclick(pg, '#focusCard') and (pg.wait_for_timeout(300) or True)
def _move_cloze(pg):
    pg.wait_for_timeout(500)
    if pg.query_selector('[data-clozenext]'):
        return _jclick(pg, '[data-clozenext]') and (pg.wait_for_timeout(400) or True)
    pg.wait_for_timeout(1500); return True
def _move_tempt(pg):
    for sel in ('[data-temptnext]', '[data-temptopen]'):
        if pg.query_selector(sel):
            return _jclick(pg, sel) and (pg.wait_for_timeout(500) or True)
    return False
def _move_receptive(pg):
    w = pg.evaluate("()=>game.target && game.target.word")
    return bool(w) and _jclick(pg, f'[data-recept="{w}"]') and (pg.wait_for_timeout(1300) or True)
def _move_pairs(pg):
    w = pg.evaluate("()=>game.target && game.target.word")
    return bool(w) and _jclick(pg, f'[data-pair="{w}"]') and (pg.wait_for_timeout(1400) or True)
def _move_combine(pg):
    return _jclick(pg, '[data-combine]') and (pg.wait_for_timeout(3000) or True)
def _move_puzzle(pg):
    r = pg.evaluate("""()=>{
      const p = game.pieces.find(x=>!x.placed);
      if(!p) return 'finishing';            // last piece is in, the board is celebrating
      const el = document.querySelector(`[data-pz-piece='${p.id}']`);
      const slot = document.querySelector(`[data-pz-slot='${p.id}']`);
      if(!el || !slot) return 'stuck';
      el.click(); slot.click(); return 'placed';
    }""")
    if r == 'stuck':
        return False
    pg.wait_for_timeout(1400 if r == 'finishing' else 700)
    return True

PLAYTHROUGH = [
    ("quiz", _move_quiz, 20), ("memory", _move_memory, 20), ("missing", _move_missing, 10),
    ("match", _move_match, 12), ("sounds", _move_sounds, 12), ("count", _move_count, 10),
    ("sort", _move_sort, 12), ("bubbles", _move_bubbles, 40), ("speech", _move_speech, 12),
    ("focus", _move_focus, 14), ("cloze", _move_cloze, 60), ("temptation", _move_tempt, 20),
    ("receptive", _move_receptive, 16), ("pairs", _move_pairs, 12), ("combine", _move_combine, 12),
    ("puzzle", _move_puzzle, 14),
]

def test_every_game_completes(b):
    print("\n6. Every game can be played to its end, replayed, and left")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    for name, move, budget in PLAYTHROUGH:
        if not has_game(page, name):
            fail("complete", f"{name} is not a known game type")
            continue
        play(page, name)
        page.wait_for_timeout(200)
        finished = False
        for _ in range(budget):
            if page.evaluate("()=>!!(game && game.done)"):
                finished = True
                break
            if not move(page):
                break
        if not page.evaluate("()=>!!(game && game.done)"):
            fail("complete", f"{name} could not be finished in {budget} moves")
            show(page, "home")
            continue
        page.wait_for_timeout(700)   # the done card can be one animation frame out

        # the finished board must offer the child a choice, not autoplay on
        again = page.locator('[data-again],[data-nextword],[data-pzagain]').first
        if not again.count():
            fail("complete", f"{name}: the finished board offers no way to play again")
        else:
            again.scroll_into_view_if_needed()
            again.click(timeout=5000)
            page.wait_for_timeout(600)
            if page.evaluate("()=>!!(game && game.done)"):
                fail("complete", f"{name}: 'play again' did not start a fresh round")

        show(page, name if False else "home")
        if page.evaluate("()=>view") != "home":
            fail("complete", f"{name}: could not return home")
    ok(f"all {len(PLAYTHROUGH)} games finish, offer a replay, and let the child leave")
    if errors:
        fail("complete", f"JS errors during playthrough: {errors[:3]}")
    ctx.close()


# ------------------------------------------- 7. the Match & Drop puzzle
def _centre(loc):
    box = loc.bounding_box()
    return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2

def pointer_drag(page, src, dst, steps=14, release=True, offset=(0, 0)):
    """A real pointer drag, moved in small steps like a finger, not a teleport."""
    dst.scroll_into_view_if_needed()
    src.scroll_into_view_if_needed()
    x0, y0 = _centre(src)
    x1, y1 = _centre(dst)
    x1 += offset[0]; y1 += offset[1]
    page.mouse.move(x0, y0)
    page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps)
    if release:
        page.mouse.up()

def open_puzzle(page, level=None):
    if level is None:
        page.evaluate("()=>launch('puzzle','animals')")
    else:
        page.evaluate("(l)=>{settings.puzzleLevel=l;launch('puzzle','animals');}", level)
    page.wait_for_timeout(600)
    return page.evaluate("()=>game.pieces.map(p=>p.id)")

def piece(page, pid):
    return page.locator(f'[data-pz-piece="{pid}"]')
def slot(page, pid):
    return page.locator(f'[data-pz-slot="{pid}"]')


def test_puzzle(b):
    print("\n7. Match & Drop puzzle — 🧩 שימי במקום")
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    page, errors = open_app(ctx)

    # -- opens from the Games screen under a real tap
    show(page, "games")
    card = page.locator('[data-game="puzzle"]').first
    if not card.count():
        fail("puzzle", "no puzzle card on the Games screen")
        ctx.close()
        return
    card.scroll_into_view_if_needed()
    card.click(timeout=5000)
    page.wait_for_timeout(600)
    if page.evaluate("()=>view") != "puzzle":
        fail("puzzle", "tapping the puzzle card did not open the puzzle")
    else:
        ok("opens from the Games screen under a real tap")

    # -- starts easy
    ids = open_puzzle(page, level=1)
    if len(ids) != 2:
        fail("puzzle", f"the first level should be 2 pieces, got {len(ids)}")
    else:
        ok("level 1 is a 2-piece board")

    # -- a wrong drop is safe, and help escalates instead of punishing
    ids = open_puzzle(page, level=3)
    pointer_drag(page, piece(page, ids[0]), slot(page, ids[1]))
    page.wait_for_timeout(500)
    st = page.evaluate("()=>({placed:game.placed,misses:game.misses,hint:game.hint,tol:game.tolerance})")
    if st["placed"] != 0 or st["misses"] != 1:
        fail("puzzle", f"a wrong drop did not return the piece safely: {st}")
    elif st["hint"]:
        fail("puzzle", "the first miss already gave away the answer — it should just float back")
    else:
        ok("a wrong drop floats the piece back, no hint yet")

    pointer_drag(page, piece(page, ids[0]), slot(page, ids[1]))
    page.wait_for_timeout(600)
    if page.evaluate("()=>game.hint") != ids[0] or not page.locator(".pz-slot.hint").count():
        fail("puzzle", "the second miss did not light up the correct place")
    else:
        ok("the second miss quietly shows where the piece belongs")

    tol_before = page.evaluate("()=>game.tolerance")
    pointer_drag(page, piece(page, ids[0]), slot(page, ids[1]))
    page.wait_for_timeout(500)
    if page.evaluate("()=>game.tolerance") <= tol_before:
        fail("puzzle", "the magnet did not get stronger after a third miss")
    else:
        ok("a third miss widens the snap so the child can still succeed")

    # -- a correct drag locks the piece and reveals the word
    ids = open_puzzle(page, level=3)
    pointer_drag(page, piece(page, ids[0]), slot(page, ids[0]))
    page.wait_for_timeout(700)
    if page.evaluate("()=>game.placed") != 1:
        fail("puzzle", "a correct drag did not place the piece")
    elif not page.locator(f'[data-pz-slot="{ids[0]}"].filled').count():
        fail("puzzle", "the filled slot does not show as completed")
    else:
        ok("a correct drag snaps in, locks, and completes its slot")

    # -- forgiving: a drop well off-centre still counts
    ids = open_puzzle(page, level=3)
    target = slot(page, ids[0])
    box = target.bounding_box()
    off = (box["width"] * 0.45, box["height"] * 0.45)
    pointer_drag(page, piece(page, ids[0]), target, offset=off)
    page.wait_for_timeout(600)
    if page.evaluate("()=>game.placed") != 1:
        fail("puzzle", "a drop landing near — not on — the shadow was rejected")
    else:
        ok("a sloppy drop near the shadow still counts")

    # -- pointercancel leaves a safe board
    ids = open_puzzle(page, level=3)
    pointer_drag(page, piece(page, ids[0]), slot(page, ids[0]), release=False)
    page.evaluate("""(id)=>{
      const el = document.querySelector(`[data-pz-piece='${id}']`);
      el.dispatchEvent(new PointerEvent('pointercancel', {pointerId:1, bubbles:true}));
    }""", ids[0])
    page.wait_for_timeout(400)
    page.mouse.up()
    page.wait_for_timeout(300)
    st = page.evaluate("""(id)=>{
      const el = document.querySelector(`[data-pz-piece='${id}']`);
      return {placed:game.placed, dragging:el.classList.contains('pz-dragging'), tf:el.style.transform};
    }""", ids[0])
    if st["dragging"] or st["tf"]:
        fail("puzzle", f"pointercancel left the piece stranded mid-drag: {st}")
    else:
        ok("pointercancel puts the piece back and clears the drag")

    # -- rapid input cannot place a piece twice
    ids = open_puzzle(page, level=3)
    page.evaluate("""(id)=>{
      const el=document.querySelector(`[data-pz-piece='${id}']`);
      const sl=document.querySelector(`[data-pz-slot='${id}']`);
      el.click(); for(let i=0;i<5;i++) sl.click();
    }""", ids[0])
    page.wait_for_timeout(500)
    if page.evaluate("()=>game.placed") != 1:
        fail("puzzle", f"5 rapid taps placed {page.evaluate('()=>game.placed')} pieces from one piece")
    else:
        ok("rapid taps place one piece once")

    # -- tap -> tap finishes the whole board without any dragging
    ids = open_puzzle(page, level=3)
    for pid in ids:
        piece(page, pid).click(timeout=5000)
        page.wait_for_timeout(150)
        slot(page, pid).click(timeout=5000)
        page.wait_for_timeout(500)
    page.wait_for_timeout(1400)
    if not page.evaluate("()=>game.done"):
        fail("puzzle", "tap-then-tap could not finish the board")
    else:
        ok("the whole board can be finished by tapping, no drag needed")

    # -- keyboard reaches the same path (buttons + Enter)
    ids = open_puzzle(page, level=3)
    page.focus(f'[data-pz-piece="{ids[0]}"]')
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    page.focus(f'[data-pz-slot="{ids[0]}"]')
    page.keyboard.press("Enter")
    page.wait_for_timeout(500)
    if page.evaluate("()=>game.placed") != 1:
        fail("puzzle", "a piece cannot be placed with the keyboard")
    else:
        ok("keyboard Enter drives the same tap-then-tap path")

    # -- finishing offers a choice and does not autoplay another round
    if page.evaluate("()=>game.done"):
        fail("puzzle", "board reported done too early")
    ids = open_puzzle(page, level=1)
    for pid in ids:
        piece(page, pid).click(); page.wait_for_timeout(120)
        slot(page, pid).click(); page.wait_for_timeout(450)
    page.wait_for_timeout(1500)
    again = page.locator('[data-again]')
    home = page.locator('.done-card [data-nav="home"]')
    if not (again.count() and home.count()):
        fail("puzzle", "the finished board does not offer both 'עוד פעם' and 'הביתה'")
    else:
        ok("the finished board offers a replay and a way home, and stops there")
    again.first.click(timeout=5000)
    page.wait_for_timeout(700)
    if page.evaluate("()=>game.done") or page.evaluate("()=>game.placed") != 0:
        fail("puzzle", "'עוד פעם' did not deal a fresh board")
    else:
        ok("'עוד פעם' deals a fresh board")

    # -- a seed makes the board reproducible for tests, and only then
    words_a = page.evaluate("()=>{seedRandom(42);launch('puzzle','animals');return game.pieces.map(p=>p.it.word);}")
    words_b = page.evaluate("()=>{seedRandom(42);launch('puzzle','animals');return game.pieces.map(p=>p.it.word);}")
    if words_a != words_b:
        fail("puzzle", f"seeded rounds are not reproducible: {words_a} vs {words_b}")
    else:
        ok("a seeded board is reproducible, so tests never flake on word choice")

    # -- a board dealt on a big screen must survive a rotation onto a small one
    fits = """()=>{
      const nav = document.querySelector('.bn-inner').getBoundingClientRect();
      const low = [...document.querySelectorAll('.pz-piece,.pz-slot')]
        .map(e=>e.getBoundingClientRect().bottom);
      return {navTop: Math.round(nav.top), lowest: Math.round(Math.max(...low))};
    }"""
    for w, h, label in [(320, 568, "small portrait"), (844, 390, "landscape")]:
        for level in (3, 5):
            ids = open_puzzle(page, level=level)
            page.set_viewport_size({"width": w, "height": h})
            page.wait_for_timeout(400)
            bad = page.evaluate(REACHABILITY)
            box = page.evaluate(fits)
            if bad:
                fail("puzzle", f"{label}: unreachable board parts after resize {bad[:2]}")
            elif box["lowest"] > box["navTop"]:
                fail("puzzle", f"{label} level {level}: the board runs under the nav "
                               f"after a resize ({box['lowest']} > {box['navTop']})")
            else:
                pointer_drag(page, piece(page, ids[0]), slot(page, ids[0]))
                page.wait_for_timeout(600)
                if page.evaluate("()=>game.placed") < 1:
                    fail("puzzle", f"{label} level {level}: board stopped accepting pieces after a resize")
            page.set_viewport_size({"width": 390, "height": 844})
            page.wait_for_timeout(200)
    ok("a board survives being resized onto a small phone or into landscape")

    # -- leaving mid-drag does not wedge the app
    ids = open_puzzle(page, level=3)
    pointer_drag(page, piece(page, ids[0]), slot(page, ids[1]), release=False)
    page.evaluate("()=>{view='home';game=null;render();}")
    page.wait_for_timeout(200)
    page.mouse.up()
    page.wait_for_timeout(300)
    if page.evaluate("()=>view") != "home":
        fail("puzzle", "leaving the puzzle mid-drag did not land on home")
    else:
        ok("navigating away mid-drag lands safely on home")

    if errors:
        fail("puzzle", f"JS errors: {errors[:3]}")
    ctx.close()


def test_puzzle_on_every_screen(b):
    print("\n8. The puzzle board fits every supported screen")
    for w, h, name in DEVICES:
        ctx = b.new_context(viewport={"width": w, "height": h},
                            has_touch=w < 900, is_mobile=w < 900)
        page, errors = open_app(ctx)
        for level in (1, 3, 5):
            ids = open_puzzle(page, level=level)
            n = len(ids)
            if n < 2:
                fail(name, f"level {level} dealt only {n} piece(s)")
                continue
            bad = page.evaluate(REACHABILITY)
            if bad:
                fail(name, f"level {level}: unreachable board parts {bad[:2]}")
                continue
            small = [x for x in page.evaluate(TOUCH_SIZES, ".pz-piece,.pz-slot")
                     if min(x["w"], x["h"]) < MIN_TOUCH]
            if small:
                fail(name, f"level {level}: pieces/slots under {MIN_TOUCH}px: {small[:2]}")
                continue
            # the whole board belongs on one screen — a toddler will not scroll
            # to find the tray
            box = page.evaluate("""()=>{
              const nav = document.querySelector('.bn-inner').getBoundingClientRect();
              const low = [...document.querySelectorAll('.pz-piece,.pz-slot')]
                .map(e=>e.getBoundingClientRect().bottom);
              return {navTop: Math.round(nav.top), lowest: Math.round(Math.max(...low))};
            }""")
            if box["lowest"] > box["navTop"]:
                fail(name, f"level {level}: the board runs under the nav "
                           f"({box['lowest']} > {box['navTop']}) — the tray needs scrolling")
                continue
            # and it can actually be finished here
            for pid in ids:
                piece(page, pid).scroll_into_view_if_needed()
                piece(page, pid).click(timeout=5000)
                page.wait_for_timeout(100)
                slot(page, pid).scroll_into_view_if_needed()
                slot(page, pid).click(timeout=5000)
                page.wait_for_timeout(350)
            page.wait_for_timeout(1400)
            if not page.evaluate("()=>game.done"):
                fail(name, f"level {level} board could not be finished")
        if errors:
            fail(name, f"JS errors on the puzzle: {errors[:2]}")
        else:
            ok(f"{name} ({w}x{h}): puzzle usable and completable at every level")
        ctx.close()


# ------------------------- 10. no game depends on an audio/speech API
# Everything Talki reaches for that a real device can refuse: speech
# recognition, speech synthesis, recording, the microphone, and even the
# AudioContext the start gate warms up.
STRIP_AUDIO = """()=>{
  delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
  const gone = n => { try{ Object.defineProperty(window, n, {get(){ return undefined; }}); }catch(e){} };
  gone('speechSynthesis'); gone('AudioContext'); gone('webkitAudioContext');
  try{ delete window.MediaRecorder; }catch(e){ window.MediaRecorder = undefined; }
  try{ Object.defineProperty(navigator,'mediaDevices',{get(){ return undefined; }}); }catch(e){}
}"""

def test_degraded_audio_apis(b):
    print("\n10. Every game survives without speech, recording or an AudioContext")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    ctx.add_init_script(STRIP_AUDIO)
    page, errors = open_app(ctx)

    if page.evaluate("()=>view") != "home":
        fail("degraded", "the app did not start with the audio APIs missing")
        ctx.close()
        return

    dead = []
    for name, move, budget in PLAYTHROUGH:
        play(page, name)
        page.wait_for_timeout(250)
        if page.eval_on_selector_all("#app button", "e=>e.length") == 0:
            dead.append(f"{name}: no controls at all")
            continue
        for _ in range(budget):
            if page.evaluate("()=>!!(game && game.done)"):
                break
            if not move(page):
                break
        if not page.evaluate("()=>!!(game && game.done)"):
            dead.append(f"{name}: could not be finished")
        show(page, "home")
    if dead:
        fail("degraded", f"games unplayable without audio APIs: {dead}")
    else:
        ok(f"all {len(PLAYTHROUGH)} games still open and finish with every audio API removed")

    # the parent recording screen must explain itself, not throw
    page.evaluate("()=>{unlocked=true;view='parent';parentTab='record';render();}")
    page.wait_for_timeout(500)
    rec = page.locator("[data-recstart]").first
    if rec.count():
        rec.scroll_into_view_if_needed()
        rec.click(timeout=5000)
        page.wait_for_timeout(400)
    ok("the parent recording screen refuses safely instead of throwing")

    if errors:
        fail("degraded", f"JS errors with the audio APIs missing: {errors[:3]}")
    ctx.close()


# ------------------ 12. a child who cannot read is told what to do
# Installed before the app loads so nothing is missed, and installed once so
# one utterance is counted once.
SPEECH_SPY = """(()=>{
  window.__spoken = [];
  const install = () => {
    const s = window.speechSynthesis;
    if(!s || s.__talkiSpy) return;
    s.__talkiSpy = true;
    const orig = s.speak.bind(s);
    s.speak = u => { window.__spoken.push(u.text); return orig(u); };
  };
  install();
  document.addEventListener('DOMContentLoaded', install);
})()"""

# Games whose opening screen means nothing without a spoken prompt: the child
# is being asked a question, not just shown a board.
SPOKEN_ON_ENTRY = [
    ("quiz", 1500), ("missing", 3500), ("count", 1500), ("sort", 1500),
    ("receptive", 1500), ("pairs", 1500), ("sounds", 1500), ("focus", 1500),
    ("puzzle", 1500),
]

def test_spoken_prompt_on_entry(b):
    print("\n12. Games that ask a question say it out loud, once")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    ctx.add_init_script(SPEECH_SPY)
    page, errors = open_app(ctx)

    for name, wait in SPOKEN_ON_ENTRY:
        page.evaluate("()=>{window.__spoken.length=0;}")
        play(page, name)
        page.wait_for_timeout(wait)
        spoken = page.evaluate("()=>window.__spoken.slice()")
        if not spoken:
            fail("prompt", f"{name} opens in silence — a child who cannot read has nothing to go on")
        elif len(spoken) > 1:
            fail("prompt", f"{name} queued {len(spoken)} utterances on entry: {spoken}")
        show(page, "home")
    ok(f"all {len(SPOKEN_ON_ENTRY)} question games speak exactly one prompt on entry")

    # and the quiz keeps speaking a fresh word every round, never twice
    page.evaluate("()=>{window.__spoken.length=0;}")
    play(page, "quiz")
    page.wait_for_timeout(1200)
    for _ in range(3):
        w = page.evaluate("()=>game.target.word")
        page.evaluate("(w)=>document.querySelector(`[data-opt='${w}']`).click()", w)
        page.wait_for_timeout(1200)
    spoken = page.evaluate("()=>window.__spoken.slice()")
    if len(spoken) != 4:
        fail("prompt", f"4 quiz rounds spoke {len(spoken)} times: {spoken}")
    else:
        ok("each quiz round speaks its word exactly once")

    if errors:
        fail("prompt", f"JS errors: {errors[:2]}")
    ctx.close()


# -------------------- 12b. no adult controls inside a child's game
def test_no_adult_controls_in_games(b):
    print("\n12b. Category choice lives on the menus, not inside a round")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    # A native <select> opens an OS dropdown a toddler cannot dismiss, and the
    # old one silently restarted whatever round they were in.
    offenders = []
    for name, _, _ in PLAYTHROUGH:
        play(page, name)
        page.wait_for_timeout(250)
        if page.eval_on_selector_all("#app select", "e=>e.length"):
            offenders.append(name)
    if offenders:
        fail("adult-controls", f"game screens still carry a native dropdown: {offenders}")
    else:
        ok(f"none of the {len(PLAYTHROUGH)} game screens contains a dropdown")

    # and the chooser that replaced it works, on both menus, by real tap
    for screen in ("games", "practice"):
        show(page, screen)
        chips = page.locator("[data-gamecat]")
        if chips.count() < 2:
            fail("adult-controls", f"the {screen} screen has no category chooser")
            continue
        target = page.locator('[data-gamecat="food"]').first
        target.scroll_into_view_if_needed()
        target.click(timeout=5000)
        page.wait_for_timeout(300)
        if page.evaluate("()=>activeCat") != "food":
            fail("adult-controls", f"{screen}: tapping a category chip did not select it")
        elif page.eval_on_selector_all(".v2-chip.on[data-gamecat]",
                                       "e=>e.map(x=>x.dataset.gamecat)") != ["food"]:
            fail("adult-controls", f"{screen}: the chosen category is not shown as chosen")
    ok("both menus offer a working category chooser")

    # the choice has to actually reach the game that opens next
    show(page, "games")
    page.locator('[data-gamecat="food"]').first.click(timeout=5000)
    page.wait_for_timeout(250)
    page.locator('[data-game="quiz"]').first.click(timeout=5000)
    page.wait_for_timeout(600)
    if page.evaluate("()=>game.catId") != "food":
        fail("adult-controls", f"the chosen category did not reach the game "
                               f"(got {page.evaluate('()=>game.catId')})")
    else:
        ok("the category chosen on the menu is the one the game is built from")

    # the chips are child-sized like every other control
    show(page, "games")
    small = [x for x in page.evaluate(TOUCH_SIZES, "[data-gamecat]")
             if min(x["w"], x["h"]) < MIN_TOUCH]
    if small:
        fail("adult-controls", f"category chips under {MIN_TOUCH}px: {small[:3]}")
    else:
        ok(f"every category chip is at least {MIN_TOUCH}px")

    if errors:
        fail("adult-controls", f"JS errors: {errors[:2]}")
    ctx.close()


# ------------------------------------------ 13. the parent gate holds
def test_parent_gate(b):
    print("\n13. Parent settings stay behind the gate")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    open_parent(page)
    if not page.locator(".lock-wrap").count():
        fail("gate", "the long-press on the brand mark opened parent settings ungated")
    elif page.locator("#exportBtn, [data-reset], #importReplace").count():
        fail("gate", "the lock screen exposes settings controls behind it")
    else:
        ok("the long-press into the parent screen lands on the gate, not on settings")

    # a wrong answer must not open it
    page.evaluate("()=>{lockInput='1';render();}")
    page.locator('[data-key="ok"]').first.click(timeout=5000)
    page.wait_for_timeout(400)
    if page.evaluate("()=>unlocked"):
        fail("gate", "a wrong answer unlocked the parent screen")
    else:
        ok("a wrong answer keeps it locked")

    # the right answer opens it
    page.evaluate("()=>{lockInput=String(lockAnswer.sum);render();}")
    page.locator('[data-key="ok"]').first.click(timeout=5000)
    page.wait_for_timeout(500)
    if not page.locator("#exportBtn").count():
        fail("gate", "the correct answer did not open parent settings")
    else:
        ok("the correct answer opens parent settings")

    # and it closes behind them
    page.click('#bottomNav [data-nav="home"]', timeout=5000)
    page.wait_for_timeout(400)
    open_parent(page)
    if not page.locator(".lock-wrap").count() or page.locator("#exportBtn").count():
        fail("gate", "the parent screen stayed unlocked after leaving it — "
                     "the next long-press would land straight in settings")
    else:
        ok("leaving the parent screen re-locks it")

    # moving between parent tabs must not re-lock in the parent's face
    page.evaluate("()=>{lockInput=String(lockAnswer.sum);render();}")
    page.locator('[data-key="ok"]').first.click(timeout=5000)
    page.wait_for_timeout(400)
    page.locator('[data-ptab="report"]').first.click(timeout=5000)
    page.wait_for_timeout(400)
    if not page.evaluate("()=>unlocked"):
        fail("gate", "switching parent tabs threw the parent back out to the gate")
    else:
        ok("switching parent tabs keeps the screen open")

    # destructive actions still ask before doing anything
    page.evaluate("()=>{parentTab='settings';render();}")
    page.wait_for_timeout(400)
    asked = []
    page.on("dialog", lambda d: (asked.append(d.message), d.dismiss()))
    learned_before = page.evaluate("()=>learned.size")
    page.locator("[data-reset]").first.click(timeout=5000)
    page.wait_for_timeout(500)
    if not asked:
        fail("gate", "'reset progress' wiped data without confirming")
    elif page.evaluate("()=>learned.size") != learned_before:
        fail("gate", "'reset progress' wiped data even though the confirm was dismissed")
    else:
        ok("resetting progress confirms first and respects a cancel")

    if errors:
        fail("gate", f"JS errors: {errors[:2]}")
    ctx.close()


def test_offline(b):
    print("\n11. Talki still runs after the network goes away")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx, wait=1400)
    page.evaluate("()=>launch('quiz','animals')")
    page.wait_for_timeout(600)

    ctx.set_offline(True)
    page.reload()
    page.wait_for_timeout(1600)
    if page.query_selector("#gateBtn"):
        page.click("#gateBtn")
        page.wait_for_timeout(400)
    if page.evaluate("()=>typeof view === 'undefined' ? null : view") != "home":
        fail("offline", "the app does not boot from cache with the network gone")
        ctx.close()
        return
    ok("boots from cache with the network gone")

    for g in ("quiz", "memory", "puzzle"):
        play(page, g)
        if page.evaluate("()=>view") != g or page.eval_on_selector_all("#app button", "e=>e.length") == 0:
            fail("offline", f"{g} does not open offline")
    ok("games still open and render offline")

    # a failed ad or font request must never take gameplay with it
    hard = [e for e in errors if "console.error" not in e]
    if hard:
        fail("offline", f"uncaught errors while offline: {hard[:3]}")
    ctx.close()


def test_puzzle_reduced_motion(b):
    print("\n9. The puzzle is fully playable with reduced motion")
    ctx = b.new_context(viewport={"width": 390, "height": 844},
                        reduced_motion="reduce")
    page, errors = open_app(ctx)
    ids = open_puzzle(page, level=3)
    pointer_drag(page, piece(page, ids[0]), slot(page, ids[0]))
    page.wait_for_timeout(600)
    if page.evaluate("()=>game.placed") != 1:
        fail("reduced-motion", "a piece cannot be dragged into place with reduced motion")
    for pid in ids[1:]:
        piece(page, pid).click(); page.wait_for_timeout(120)
        slot(page, pid).click(); page.wait_for_timeout(400)
    page.wait_for_timeout(1500)
    if not page.evaluate("()=>game.done"):
        fail("reduced-motion", "the board cannot be finished with reduced motion")
    else:
        ok("reduced motion: the board still drags, taps and completes")
    if errors:
        fail("reduced-motion", f"JS errors: {errors[:2]}")
    ctx.close()


def main():
    print(f"Real-interaction suite against {URL}")
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": CHROMIUM_PATH} if CHROMIUM_PATH else {}))
        tests = [test_reachable_everywhere, test_touch_target_sizes,
                 test_real_tap_navigation, test_no_listener_growth, test_rapid_taps,
                 test_back_button,
                 test_every_game_completes, test_puzzle, test_puzzle_on_every_screen,
                 test_puzzle_reduced_motion, test_spoken_prompt_on_entry,
                 test_no_adult_controls_in_games, test_parent_gate,
                 test_degraded_audio_apis, test_offline]
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
