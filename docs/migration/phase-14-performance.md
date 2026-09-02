# Phase 14 performance

Targets from the prompt (do not adjust):

| Target | Requirement | This run |
|---|---|---|
| Cold start to interactive | < 3 s on a mid device | FAIL — no mid device. Web `openApp` → `home-root` timing is recorded below as a **web** number only |
| Game screen transition | < 300 ms | FAIL — no device. Web click → quiz visible is recorded below |
| Animation frame rate | 60 fps or a recorded explanation | FAIL — not measured. Reanimated is in use; no GPU counter was sampled |
| Memory during a 30-minute session | stable, no growth | FAIL — 30-minute soak not run. Hermes v1 / Reanimated risk is unmeasured |
| Bundle size | measured and reported | PASS as a measurement (see below). No pass/fail target was given |
| Battery over 30 minutes | measured and reported | FAIL — not measured |

Low-end **and** mid device were both required. Both are missing.

## Web timings (Playwright, Chromium, not a device)

Filled from the `web timings: cold start and game transition` test in
`full-sweep.spec.ts` after the gate run. These numbers must not be used
to claim the device targets.

```
# Chromium, ten viewports, expo serve static bundle (not a device)
PHASE14_COLD_START_MS=748..836   (median ~780)
PHASE14_GAME_TRANSITION_MS=51..76 (median ~60)
PHASE14_CHILD_SIM_EXTRA_BACK=left-app   # every viewport
```

`openApp` includes `networkidle` after a static `expo serve` load, so
cold-start here is "page load + fonts + Home paint", not a native process
spawn.

## Bundle size

Measured from `apps/mobile/dist` after `npx expo export --platform web`:

```
$ du -sh apps/mobile/dist
48M	dist

$ du -sh apps/mobile/dist/_expo/static/js/web/*
2.6M	dist/_expo/static/js/web/entry-83f6fc26257a04c006ef9a95ea216541.js
# 2,681,708 bytes raw JS. Assets (audio + word art + UI) make up the rest of 48M.
```

This is the **web** bundle. A native Android/iOS binary size was not
produced (no EAS / SDK).

## Memory / battery / fps

Not measured. The Hermes memory regression that motivated `expo>=57.0.17`
is therefore an open risk: Talki imports Reanimated throughout, and no
30-minute sample series exists.

## Defects

- **P14-PERF-1** (MAJOR) — no device cold-start / transition / fps numbers.
- **P14-PERF-2** (BLOCKER for cutover) — no 30-minute memory soak on a
  low-end or mid device. The prompt names this the target that matters
  most.
