"""
Playwright suite for Talki.

Run locally:
    cd talki
    python3 -m http.server 8000 &
    BASE_URL=http://localhost:8000 python3 tests/test_suite.py

Exits non-zero if anything fails, so CI catches it.
"""
import os, re, sys, json, glob, time, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
URL = BASE + "/index.html"
# Sandboxes that ship a prebuilt Chromium (no `playwright install`) can point
# the suite at it instead of the managed download.
CHROMIUM_PATH = os.environ.get("CHROMIUM_PATH") or None
DL = tempfile.mkdtemp(prefix="lia-dl-")
SHOTS = os.environ.get("SHOT_DIR", tempfile.mkdtemp(prefix="lia-shots-"))

failures = []
def fail(section, msg):
    failures.append(f"[{section}] {msg}")
    print(f"  ✗ {msg}")
def ok(msg):
    print(f"  ✓ {msg}")

def jc(page, sel, i=0):
    """click via JS — survives animated/covered elements that Playwright refuses"""
    return page.evaluate("([s,i])=>{const e=[...document.querySelectorAll(s)];if(!e[i])return false;e[i].click();return true;}", [sel, i])

def open_app(ctx, wait=900):
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(f"{e} || {(e.stack or '')[:300]}"))
    def on_console(m):
        if m.type != "error":
            return
        # Google Fonts is loaded from a CDN and may be blocked (offline runner,
        # firewalled CI). The app has local font fallbacks, so ignore those.
        src = (m.location or {}).get("url", "") + " " + m.text
        if "fonts.googleapis" in src or "fonts.gstatic" in src:
            return
        errors.append("console.error: " + m.text + " @ " + (m.location or {}).get("url", "?"))
    page.on("console", on_console)
    page.goto(URL + "?intro=0")   # the opening bumper has its own test; it would cover #app here
    page.wait_for_timeout(wait)
    if page.query_selector("#gateBtn"):
        page.click("#gateBtn")
        page.wait_for_timeout(400)
    return page, errors

def home(page):
    page.evaluate("()=>{view='home';game=null;render();}")
    page.wait_for_timeout(200)

def goto_view(page, v):
    page.evaluate(f"()=>{{view='{v}';game=null;render();}}")
    page.wait_for_timeout(200)


# ---------------------------------------------------------------- 1. layout
def test_layout(b):
    print("\n1. Layout across devices")
    for w, h, name in [(390, 844, "phone"), (834, 1112, "ipad"),
                       (1440, 900, "desktop"), (844, 390, "phone-landscape")]:
        ctx = b.new_context(viewport={"width": w, "height": h},
                            has_touch=w < 900, is_mobile=w < 900)
        page, errors = open_app(ctx)
        overflow = page.evaluate("""()=>{
          const vw=document.documentElement.clientWidth, bad=[];
          document.querySelectorAll('main *').forEach(el=>{
            const r=el.getBoundingClientRect();
            if(r.width>0 && (r.right>vw+2 || r.left<-2)) bad.push(el.className);
          });
          return bad.slice(0,3);}""")
        if overflow:
            fail(name, f"elements overflow the viewport: {overflow}")
        cats = page.eval_on_selector_all("[data-cat]", "e=>e.length")
        if cats < 10:
            fail(name, f"only {cats} categories rendered")
        page.screenshot(path=os.path.join(SHOTS, f"home-{name}.png"))
        if errors:
            fail(name, f"JS errors: {errors[:2]}")
        else:
            ok(f"{name}: {cats} categories, no overflow, no errors")
        ctx.close()


# ------------------------------------------------------------ 2. RTL semantics
def test_rtl(b):
    print("\n2. Hebrew RTL semantics")
    ctx = b.new_context(viewport={"width": 390, "height": 844},
                        has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    doc = page.evaluate("""()=>({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      computed: getComputedStyle(document.body).direction
    })""")
    if doc != {"lang": "he", "dir": "rtl", "computed": "rtl"}:
        fail("rtl-document", f"unexpected document language/direction: {doc}")
    else:
        ok("document declares and computes Hebrew RTL")

    positions = page.evaluate("""()=>{
      const center = selector => {
        const el = document.querySelector(selector);
        if(!el) return null;
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      };
      return {
        brand: center('.tb-brand'),
        actions: center('.tb-utils'),
        score: center('.tb-points'),
        logo: center('.tb-logo'),
        viewportCentre: window.innerWidth / 2,
        homeTab: center('[data-nav="home"].bn-item'),
        rewardsTab: center('[data-nav="stickers"].bn-item'),
        category1: center('.home-cat-card:nth-child(1)'),
        category2: center('.home-cat-card:nth-child(2)'),
        ctaSparkles: center('.home-hero-cta-sparkles'),
        ctaArrow: center('.home-hero-cta-arrow'),
        practiceIcon: center('.home-practice-card .home-practice-icon'),
        practiceChevron: center('.home-practice-card .home-practice-nav')
      };
    }""")
    missing = [k for k, v in positions.items() if v is None]
    if missing:
        fail("rtl-order", f"missing home layout anchors: {missing}")
        ctx.close()
        return
    pairs = [
        # compact header, right to left: score, centred brand mark, music
        ("header score", positions["score"], positions["brand"]),
        ("header music", positions["brand"], positions["actions"]),
        # three destinations, right to left: בית, משחקים, פרסים
        ("bottom navigation", positions["homeTab"], positions["rewardsTab"]),
        ("category grid", positions["category1"], positions["category2"]),
        # the continue card folded into the hero; the icon/chevron pair it used
        # to contribute is now the CTA's sparkles (start) and forward arrow (end)
        ("hero call to action", positions["ctaSparkles"], positions["ctaArrow"]),
        ("practice card", positions["practiceIcon"], positions["practiceChevron"]),
    ]
    for name, start, end in pairs:
        if start <= end:
            fail("rtl-order", f"{name} is not ordered from right to left: {start} <= {end}")
        else:
            ok(f"{name} follows RTL visual order")

    # The brand mark is centred on the viewport, not between the two side
    # controls, so a wider score pill can never nudge it off centre.
    drift = abs(positions["logo"] - positions["viewportCentre"])
    if drift > 1.5:
        fail("header-centre", f"brand mark is {drift:.1f}px off the viewport centre")
    else:
        ok("brand mark is centred in the header")

    labels = page.evaluate("""()=>({
      cta: document.querySelector('.home-hero-cta-label')?.textContent.trim(),
      ctaArrow: !!document.querySelector('.home-hero-cta-arrow-icon'),
      heroState: document.querySelector('.home-hero')?.dataset.state,
      heroProgress: !!document.querySelector('.home-hero-progress'),
      practiceChevron: !!document.querySelector('.home-practice-card .home-practice-nav-chev')
    })""")
    if labels["cta"] != "מתחילים ללמוד" or not labels["ctaArrow"]:
        fail("rtl-chevron", f"hero CTA label/arrow wrong: {labels!r}")
    elif labels["heroState"] != "fresh" or labels["heroProgress"]:
        fail("home-hero", f"an empty profile must render the new-user hero with no progress: {labels!r}")
    elif not labels["practiceChevron"]:
        fail("rtl-chevron", f"inconsistent forward chevrons: {labels}")
    else:
        ok("forward actions consistently use left-pointing RTL chevrons")

    # The progress half of the old continue card lives inside the hero now, so
    # exercise it the same way: seed a few learned words, re-render, and check
    # the returning layout reads right to left and reports real numbers.
    prog = page.evaluate("""()=>{
      const cat = allCats().find(c => c.items.length >= 3);
      cat.items.slice(0, 3).forEach(i => learned.add(key(cat.id, i.word)));
      view = 'home'; game = null; render();
      const centre = s => { const el = document.querySelector(s); if(!el) return null;
        const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
      const cur = currentCategory();
      return {
        state: document.querySelector('.home-hero')?.dataset.state,
        cta:   document.querySelector('.home-hero-cta-label')?.textContent.trim(),
        tile:  centre('.home-hero-tile'),
        name:  centre('.home-hero-cat-name'),
        art:   document.querySelector('.home-hero-tile img')?.getAttribute('src'),
        count: document.querySelector('.home-hero-count')?.textContent.trim(),
        want:  catLearned(cur) + '/' + cur.items.length,
        duplicateGone: !document.querySelector('.home-continue')
      };
    }""")
    if prog["state"] != "returning" or prog["tile"] is None or prog["name"] is None:
        fail("home-hero", f"returning-user hero did not render: {prog!r}")
    elif prog["cta"] != "המשך ללמוד":
        fail("home-hero", f"returning hero CTA should read המשך ללמוד: {prog!r}")
    elif prog["tile"] <= prog["name"]:
        fail("rtl-order", f"hero category tile is not right of its name: {prog!r}")
    elif prog["count"] != prog["want"]:
        fail("home-hero", f"hero numerals do not match the category progress: {prog!r}")
    elif "talki-cat-art-" not in (prog["art"] or ""):
        fail("home-hero", f"hero tile is not using the banner art set: {prog!r}")
    elif not prog["duplicateGone"]:
        fail("home-hero", "the duplicate .home-continue card is still rendered")
    else:
        ok("returning-user hero shows an RTL category tile and real category progress")

    # The hero must name the category the child actually went into, not
    # whichever one happens to be furthest along. Seed a clear conflict: make
    # one category nearly finished, then open a different, barely-started one.
    resumed = page.evaluate("""()=>{
      const far = allCats().find(c => c.items.length >= 12);
      const near = allCats().find(c => c.items.length >= 12 && c.id !== far.id);
      far.items.slice(0, far.items.length - 1).forEach(i => learned.add(key(far.id, i.word)));
      near.items.slice(0, 1).forEach(i => learned.add(key(near.id, i.word)));
      saveProgress(); view = 'home'; render();
      const named = () => document.querySelector('.home-hero-cat-name')?.textContent.trim();
      const before = named();
      enterCat(near.id); view = 'home'; render();
      return { before, after: named(), wantAfter: plain(near.title), far: plain(far.title) };
    }""")
    if resumed["after"] != resumed["wantAfter"]:
        fail("home-hero", f"hero did not resume the category last opened: {resumed!r}")
    elif resumed["after"] == resumed["far"]:
        fail("home-hero", f"hero fell back to the furthest-along category: {resumed!r}")
    else:
        ok("hero resumes the category the child last opened, not the furthest along")

    if errors:
        fail("rtl", f"JS errors: {errors[:2]}")
    ctx.close()


# ------------------------------------------------------- 3. every screen opens
def test_all_screens(b):
    print("\n3. Every category and game opens without errors")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    for c in page.eval_on_selector_all("[data-cat]", "e=>e.map(x=>x.dataset.cat)"):
        page.click(f'[data-cat="{c}"]'); page.wait_for_timeout(200)
        tiles = page.eval_on_selector_all(".tile", "e=>e.length")
        if tiles == 0 and c != "mine":
            fail("categories", f"{c} rendered no tiles")
        home(page)
    ok("all categories render tiles")

    # games/practice entries are spread across Home, the dedicated Games screen
    # (bottom nav) and the dedicated Practice screen — collect the union of all
    # data-game targets exposed anywhere in the V2 navigation.
    all_games = set(page.eval_on_selector_all("[data-game]", "e=>e.map(x=>x.dataset.game)"))
    goto_view(page, "games")
    all_games |= set(page.eval_on_selector_all("[data-game]", "e=>e.map(x=>x.dataset.game)"))
    goto_view(page, "practice")
    all_games |= set(page.eval_on_selector_all("[data-game]", "e=>e.map(x=>x.dataset.game)"))
    home(page)

    for g in all_games:
        clicked = jc(page, f'[data-game="{g}"]')
        if not clicked:
            goto_view(page, "games")
            clicked = jc(page, f'[data-game="{g}"]')
        if not clicked:
            goto_view(page, "practice")
            clicked = jc(page, f'[data-game="{g}"]')
        if not clicked:
            fail("games", f"{g} has no clickable entry point in the UI")
            home(page)
            continue
        page.wait_for_timeout(900)
        html = page.inner_html("#app")
        if len(html.strip()) < 120:
            fail("games", f"{g} rendered an empty screen")
        if page.evaluate("()=>view") == "home":
            fail("games", f"{g} bounced back to home")
        home(page)
    ok(f"all {len(all_games)} games open and stay open")

    if errors:
        fail("screens", f"JS errors: {errors[:3]}")
    ctx.close()


# ------------------------------------------------------- 4. games play through
def test_gameplay(b):
    print("\n4. Games can actually be completed")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx)

    # quiz: answer correctly until the done card
    jc(page, '[data-game="quiz"]'); page.wait_for_timeout(800)
    for _ in range(40):
        if page.evaluate("()=>game && game.done"): break
        w = page.evaluate("()=>game && game.target && game.target.word")
        if not w: break
        page.evaluate("(w)=>{const e=[...document.querySelectorAll('[data-opt]')].find(x=>x.dataset.opt===w); e&&e.click();}", w)
        page.wait_for_timeout(900)
    ok("quiz completed") if page.evaluate("()=>game && game.done") else fail("quiz", "never finished")
    home(page)

    # memory: match every pair
    jc(page, '[data-game="memory"]'); page.wait_for_timeout(700)
    for _ in range(40):
        if page.evaluate("()=>game && game.done"): break
        pair = page.evaluate("""()=>{const c=game.cards.filter(x=>!x.matched); if(!c.length) return null;
          const f=c[0]; const m=c.find(x=>x.pair===f.pair && x.idx!==f.idx); return [f.idx,m.idx];}""")
        if not pair: break
        for i in pair:
            page.evaluate("(i)=>document.querySelector(`[data-mem='${i}']`).click()", i)
            page.wait_for_timeout(300)
        page.wait_for_timeout(300)
    ok("memory completed") if page.evaluate("()=>game && game.done") else fail("memory", "never finished")
    home(page)

    # focused stimulation: 8 taps models the word 8 times
    jc(page, '[data-game="focus"]'); page.wait_for_timeout(600)
    for _ in range(9):
        if page.evaluate("()=>game && game.done"): break
        jc(page, "#focusCard"); page.wait_for_timeout(250)
    ok("focus completed") if page.evaluate("()=>game && game.done") else fail("focus", "8 taps did not finish")
    home(page)

    # cloze: must not hang waiting for speech that never ends
    jc(page, '[data-game="cloze"]'); page.wait_for_timeout(8000)
    if page.evaluate("()=>game && game.phase") == "say":
        fail("cloze", "stuck in 'say' — speech onend never fired")
    else:
        ok("cloze advanced past the spoken phrase")
    home(page)

    # bubbles: clickable while animating (lives on the dedicated Games screen)
    goto_view(page, "games")
    jc(page, '[data-game="bubbles"]'); page.wait_for_timeout(2500)
    jc(page, ".bubble"); page.wait_for_timeout(500)
    ok("bubble popped") if page.evaluate("()=>game && game.popped") else fail("bubbles", "pop did not register")

    if errors:
        fail("gameplay", f"JS errors: {errors[:3]}")
    ctx.close()


# ------------------------------------------------------------- 5. persistence
def test_storage(b):
    print("\n5. Storage, persistence and backup")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, accept_downloads=True)
    page, errors = open_app(ctx)

    engine = page.evaluate("()=>Store.name()")
    if engine != "indexeddb":
        fail("storage", f"engine is '{engine}', expected indexeddb")
    else:
        ok("IndexedDB is the active backend")

    page.click('[data-cat="animals"]'); page.wait_for_timeout(300)
    for i in range(4):
        jc(page, ".tile", i); page.wait_for_timeout(500)
    learned = page.evaluate("()=>learned.size")

    page.evaluate("()=>{unlocked=true;view='parent';parentTab='words';render();}")
    page.wait_for_timeout(400)
    page.fill("#cwWord", "סַבְתָּא רוּתִי"); page.fill("#cwEmoji", "👵")
    page.click("#cwAdd"); page.wait_for_timeout(600)
    page.evaluate("""async ()=>{ await sSet(K.rec('animals:כֶּלֶב'), 'data:audio/webm;base64,AAAA');
                                 recordings['animals:כֶּלֶב']='data:audio/webm;base64,AAAA'; }""")
    page.wait_for_timeout(400)

    page.reload(); page.wait_for_timeout(1100)
    if page.query_selector("#gateBtn"): page.click("#gateBtn"); page.wait_for_timeout(300)
    after = page.evaluate("()=>({l:learned.size,c:custom.length})")
    if after["l"] != learned: fail("storage", f"progress lost on reload ({learned} -> {after['l']})")
    elif after["c"] != 1:     fail("storage", "custom word lost on reload")
    else:                     ok("progress, custom words and recordings survive reload")

    page.evaluate("()=>{unlocked=true;view='parent';parentTab='settings';render();}")
    page.wait_for_timeout(500)
    with page.expect_download() as dl:
        page.click("#exportBtn")
    path = os.path.join(DL, dl.value.suggested_filename)
    dl.value.save_as(path)
    payload = json.load(open(path, encoding="utf-8"))
    if payload.get("app") != "talki":
        fail("backup", "export missing the app marker")
    elif not any(k.startswith("lia:rec:") for k in payload["data"]):
        fail("backup", "export missing recordings")
    else:
        ok("export contains progress, custom words and recordings")

    page.evaluate("async ()=>{ for(const k of await Store.keys()) await Store.del(k); }")
    page.reload(); page.wait_for_timeout(1100)
    if page.query_selector("#gateBtn"): page.click("#gateBtn"); page.wait_for_timeout(300)
    page.evaluate("()=>{unlocked=true;view='parent';parentTab='settings';render();}")
    page.wait_for_timeout(400)
    page.set_input_files("#importMerge", path); page.wait_for_timeout(1600)
    restored = page.evaluate("()=>({l:learned.size,c:custom.length})")
    if restored["l"] != learned or restored["c"] != 1:
        fail("backup", f"restore incomplete: {restored}")
    else:
        ok("full wipe then restore recovers everything")

    bad = os.path.join(DL, "bad.json"); open(bad, "w").write('{"hello":"world"}')
    page.set_input_files("#importMerge", bad); page.wait_for_timeout(800)
    if page.evaluate("()=>learned.size") != learned:
        fail("backup", "a junk file corrupted the store")
    else:
        ok("junk import is rejected safely")

    if errors: fail("storage", f"JS errors: {errors[:2]}")
    ctx.close()


# --------------------------------------------------------------------- 6. PWA
def test_pwa(b):
    print("\n6. PWA: manifest, icons, service worker, offline")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page, errors = open_app(ctx, wait=1200)

    mf = page.evaluate("""async ()=>{
      const l=document.querySelector('link[rel=manifest]'); if(!l) return {error:'no link'};
      const r=await fetch(l.href); if(!r.ok) return {error:'status '+r.status};
      return await r.json();}""")
    if mf.get("error"):
        fail("manifest", mf["error"])
    else:
        for k in ("name", "short_name", "start_url", "display", "icons"):
            if not mf.get(k): fail("manifest", f"missing {k}")
        sizes = {i["sizes"] for i in mf.get("icons", [])}
        if not {"192x192", "512x512"} <= sizes: fail("manifest", f"icons incomplete: {sizes}")
        if not any(i.get("purpose") == "maskable" for i in mf["icons"]): fail("manifest", "no maskable icon")
        ok("manifest valid with 192/512/maskable icons")

    broken = page.evaluate("""async ()=>{
      const urls=[...document.querySelectorAll('link[rel*=icon],link[rel*=startup-image]')].map(l=>l.href);
      const out=[]; for(const u of urls){const r=await fetch(u); if(!r.ok) out.push(u+' '+r.status);} return out;}""")
    if broken: fail("assets", f"broken links: {broken}")
    else: ok("all icon and splash files resolve")

    state = page.evaluate("async ()=>{const r=await navigator.serviceWorker.ready; return !!r.active;}")
    if not state: fail("sw", "service worker never activated")
    else: ok("service worker active")

    cached = page.evaluate("""async ()=>{const k=await caches.keys(); if(!k.length) return null;
      const c=await caches.open(k[0]); return (await c.keys()).map(r=>new URL(r.url).pathname);}""")
    if not cached: fail("sw", "nothing precached")
    else:
        for must in ("/index.html", "/manifest.json"):
            if not any(p.endswith(must) for p in cached): fail("sw", f"precache missing {must}")
        ok(f"precached {len(cached)} files")

    if page.query_selector("#gate"): fail("gate", "start gate should be gone after the tap")
    if page.evaluate("()=>typeof ac === 'undefined' || ac === null"):
        fail("gate", "AudioContext not created by the start gate")
    else:
        ok("start gate unlocks audio")

    ctx.close()


def main():
    print(f"Testing {URL}")
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": CHROMIUM_PATH} if CHROMIUM_PATH else {}))
        for t in (test_layout, test_rtl, test_all_screens, test_gameplay, test_storage, test_pwa):
            try:
                t(b)
            except Exception as e:
                fail(t.__name__, f"crashed: {e}")
        b.close()

    print("\n" + "=" * 60)
    if failures:
        print(f"FAILED — {len(failures)} problem(s):")
        for f in failures: print("  •", f)
        print(f"\nScreenshots: {SHOTS}")
        sys.exit(1)
    print("ALL CHECKS PASSED")
    sys.exit(0)

if __name__ == "__main__":
    main()
