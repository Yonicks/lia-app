# Phase 14 — Full parity, device QA and performance

**Prompt:** [../prompts/phase-14.md](../prompts/phase-14.md)
**Creates:** the graded parity checklist, a device QA report, performance
measurements
**Ships:** nothing new. This phase finds problems.

---

## Goal and rationale

Grade every row of the feature-parity checklist, test on real devices across a
real range, measure performance, and decide honestly whether the native app is
ready to replace the Capacitor one.

The framing matters. Thirteen phases have been building; this one is looking for
reasons not to ship. An agent that reports everything PASS has probably not done
the work. A phase that finds fifteen real defects has succeeded.

This phase does not build features. If a gap is found, it is recorded, and only
genuine blockers are fixed here.

## Entry conditions

- `docs/migration/phase-13-report.md` exists with no critical FAIL.
- Every feature exists.
- All thirteen previous reports are available to read.

## Design decisions

### Every checklist row is graded, none is skipped

`docs/migration/feature-parity-checklist.md` has roughly 200 rows across 15
sections. Each gets PASS, FAIL or N/A with a reason. No row may remain TODO.

"Probably works" is FAIL. "Did not test" is FAIL. This is deliberate: an
untested row and a broken row carry the same risk at release, and conflating
"unverified" with "fine" is how migrations ship regressions.

### Side-by-side comparison against the legacy app

Both apps are installed on the same device — which is why the two app
identifiers were established in Phase 1 — and every screen is compared against
its `legacy-baseline` screenshot.

Every difference is classified:

```
INTENDED    a recorded deliberate deviation (landscape, home redesign, intro)
IMPROVED    better in native, no behaviour lost
DEFECT      worse, or behaviour lost
```

An unclassified difference is a FAIL. The comparison must cite the deviation
record for anything marked INTENDED.

### The device matrix is real hardware, named

Minimum coverage:

| Class | Requirement |
|---|---|
| Low-end Android | 2-3 GB RAM, the performance floor |
| Mid Android | the common case |
| Recent Android | current OS behaviour |
| Android tablet | landscape games |
| iPhone | small and recent |
| iPad | multitasking and orientation |

Every entry names make, model and OS version. "Tested on Android" is not
acceptable.

### Performance targets, measured not estimated

```
cold start to interactive     under 3 s on a mid device
game screen transition        under 300 ms
animation frame rate          60 fps, or a recorded explanation
memory during a session       stable, no growth across 30 minutes
bundle size                   measured and reported
battery over 30 minutes       measured and reported
```

The memory target matters most. The Hermes v1 memory regression that motivated
the `expo>=57.0.17` pin affects apps importing Reanimated, and Talki uses
Reanimated throughout. A thirty-minute soak with periodic sampling is the check.

### The child test is not optional

An actual toddler, or an adult deliberately behaving like one: mashing the
screen, rotating mid-game, pressing back repeatedly, backgrounding, tapping ads.

Every real bug in a toddler app is found this way and none of it is found by
Playwright. Legacy already encodes some of these as automated tests — the
rapid-tap and listener-growth checks — which is precisely because they were
learned from real use.

### Accessibility is graded, not assumed

- Every child-facing control at least 48 x 48, already automated
- Hebrew RTL throughout
- Screen reader labels on every interactive element
- Reduce-motion honoured
- Colour contrast on text
- No control reachable only by a gesture a child cannot perform

## Files to be created

```
docs/migration/feature-parity-checklist.md    graded in place, no TODO left
docs/migration/phase-14-device-qa.md          the device matrix and results
docs/migration/phase-14-performance.md        measurements
docs/migration/phase-14-comparison.md         screen-by-screen vs legacy
docs/migration/phase-14-defects.md            everything found, prioritised
docs/migration/phase-14-report.md

apps/mobile/tests/e2e/full-sweep.spec.ts      every screen, all ten viewports
apps/mobile/.maestro/full-regression.yaml
```

## Test plan

### Tier 1

Every existing unit test runs. Coverage is reported per domain area, with gaps
named rather than summarised as a percentage.

### Tier 2

`full-sweep.spec.ts` visits every screen at all ten viewports and asserts, for
each:

- renders without a console error
- `auditTouchTargets` clean
- `auditReachability` clean
- no horizontal overflow
- Hebrew renders right to left
- `toHaveScreenshot()` against the established baseline

This is the regression net for Phase 15 and for everything after.

### Tier 3

`.maestro/full-regression.yaml` covers every game and practice mode end to end.

Plus the full manual matrix per device: every screen, every game, every practice
mode, audio, recording, recognition, backup, ads, offline, background and
resume, force-stop persistence, rotation, and permission denial.

### Comparison

Every screen, native beside legacy, at the reference viewport plus at least two
others, with each difference classified.

### Performance

Measured on at least a low-end and a mid device.

### Defect triage

`phase-14-defects.md` classifies everything found:

```
BLOCKER   must fix before cutover
MAJOR     should fix before cutover
MINOR     can ship, fix after
DEFERRED  a deliberate deviation, with its record
```

Only BLOCKERs are fixed in this phase.

## Screenshot manifest

```
docs/migration/screenshots/phase-14/
    <viewport>-<screen>.png                every screen, all ten viewports
    device-<model>-<screen>.png            per device in the matrix
    comparison/<screen>-native-vs-legacy.png
```

This is the largest screenshot set of the migration and it is the release
evidence.

## Risks and open questions

**The device matrix may not be fully available.** Default: test what exists,
name precisely what was not tested, and mark the corresponding parity rows FAIL
rather than assuming. An untested platform is a risk, not a pass.

**Real speech recognition depends on the device.** Default: record per device
whether `he-IL` recognition worked. This may legitimately end as "works on some
Android devices, not on iOS", and that is a product decision to record, not a
migration failure to hide.

**Performance on a genuinely low-end device.** Default: measure and report. If
a target is missed, record it as a defect at the appropriate severity rather
than adjusting the target.

**The temptation to fix everything.** Default: fix only BLOCKERs. A phase whose
job is finding problems must not become a phase that quietly resolves them
without review.

## Exit criteria

- [ ] Every checklist row graded PASS, FAIL or N/A with a reason; no TODO left
- [ ] Device matrix tested with make, model and OS version named for each
- [ ] Every screen compared side by side against the legacy baseline
- [ ] Every difference classified INTENDED, IMPROVED or DEFECT
- [ ] `full-sweep.spec.ts` green at all ten viewports
- [ ] Maestro full regression passes
- [ ] Performance measured against every target on at least two device classes
- [ ] Memory stable across a 30-minute soak
- [ ] Accessibility graded across all six criteria
- [ ] Real-child or child-simulation testing performed and recorded
- [ ] Every defect logged with severity
- [ ] Every BLOCKER fixed and re-verified
- [ ] `phase-14-device-qa.md`, `phase-14-performance.md`,
      `phase-14-comparison.md` and `phase-14-defects.md` all written
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-14-report.md` written

**This phase ends at the release go/no-go gate.** The report must make a clear
recommendation, and "not yet, because of X" is a valid and valuable one.
