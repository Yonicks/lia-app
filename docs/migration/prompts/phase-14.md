# Phase 14 prompt — Full parity, device QA and performance

Plan: [../phases/phase-14-plan.md](../phases/phase-14-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 14 of the Talki migration to Expo React Native.

Phase 14 grades every row of the feature-parity checklist, tests on real
devices, measures performance, and decides honestly whether the native app is
ready to replace the Capacitor one.

Execute ONLY Phase 14.

READ THIS FRAMING CAREFULLY. Thirteen phases have been building. THIS ONE IS
LOOKING FOR REASONS NOT TO SHIP. An agent that reports everything PASS has
probably not done the work. A phase that finds fifteen real defects has
SUCCEEDED. Your job is to find problems, not to demonstrate that there are none.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not remove Capacitor. Phase 15 owns that.
- The legacy test suites must still pass at the end of your phase.

FORBIDDEN
- No grading a row PASS that you did not actually verify.
- No "probably works", "should work" or "appears to work". Those are FAIL.
- No unclassified difference from the legacy baseline.
- No adjusting a performance target to make a measurement pass.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start Phase 15.
- Do NOT build new features.
- Fix ONLY defects you classify as BLOCKER. A phase whose job is finding
  problems must not quietly resolve them without review.

REPORTING
- Write docs/migration/phase-14-report.md before you stop.
- Paste real command output and real measurements, not summaries.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-14-plan.md            — your plan, read it fully
2. docs/migration/feature-parity-checklist.md        — every row you must grade
3. docs/migration/validation.md
4. docs/migration/phase-00-report.md through phase-13-report.md — ALL of them
5. docs/migration/00-current-state.md                — the behavioural reference
6. docs/migration/screenshots/legacy-baseline/       — the comparison set

WORK ITEMS

1. GRADE EVERY CHECKLIST ROW.
   feature-parity-checklist.md has roughly 200 rows across 15 sections. Each
   gets PASS, FAIL or N/A WITH A REASON. No row may remain TODO.

   "Probably works" is FAIL. "Did not test" is FAIL.
   This is deliberate: an untested row and a broken row carry the SAME RISK at
   release, and conflating "unverified" with "fine" is how migrations ship
   regressions.

2. SIDE-BY-SIDE COMPARISON against the legacy app.
   Install BOTH apps on the same device — this is why two app identifiers were
   established in Phase 1 — and compare every screen against its
   legacy-baseline screenshot.

   Classify EVERY difference:
     INTENDED   a recorded deliberate deviation (landscape, home redesign,
                intro sequence, recordings-as-files). CITE the deviation record.
     IMPROVED   better in native, with no behaviour lost
     DEFECT     worse, or behaviour lost

   An unclassified difference is a FAIL.
   Write docs/migration/phase-14-comparison.md.

3. DEVICE MATRIX. Every entry names MAKE, MODEL and OS VERSION.
   "Tested on Android" is not acceptable.

     Low-end Android    2-3 GB RAM, the performance floor
     Mid Android        the common case
     Recent Android     current OS behaviour
     Android tablet     landscape games
     iPhone             small and recent
     iPad               multitasking and orientation

   Per device: every screen, every game, every practice mode, audio, recording,
   recognition, backup, ads, offline, background and resume, force-stop
   persistence, rotation, and permission denial.

   Write docs/migration/phase-14-device-qa.md.

   If a device class is unavailable, name precisely what was not tested and mark
   the corresponding parity rows FAIL. An untested platform is a risk, not a pass.

4. PERFORMANCE — measured, never estimated:
     cold start to interactive     under 3 s on a mid device
     game screen transition        under 300 ms
     animation frame rate          60 fps, or a recorded explanation
     memory during a session       stable, no growth across 30 minutes
     bundle size                   measured and reported
     battery over 30 minutes       measured and reported

   The MEMORY target matters most. The Hermes v1 memory regression that
   motivated the expo>=57.0.17 pin affects apps importing Reanimated, and Talki
   uses Reanimated throughout. Run a 30-minute soak with periodic sampling.

   Measure on at least a low-end AND a mid device.
   Write docs/migration/phase-14-performance.md.
   If a target is missed, log it as a defect at the appropriate severity. Do NOT
   adjust the target.

5. Write apps/mobile/tests/e2e/full-sweep.spec.ts visiting EVERY screen at all
   ten viewports, asserting for each:
     - renders with no console error
     - auditTouchTargets clean
     - auditReachability clean
     - no horizontal overflow
     - Hebrew renders right to left
     - toHaveScreenshot() against the established baseline
   This is the regression net for Phase 15 and everything after.

6. Write apps/mobile/.maestro/full-regression.yaml covering every game and
   practice mode end to end.

7. ACCESSIBILITY — grade all six, do not assume any:
     - every child-facing control at least 48x48 (already automated)
     - Hebrew RTL throughout
     - screen reader labels on every interactive element
     - reduce-motion honoured
     - colour contrast on text
     - no control reachable only by a gesture a child cannot perform

8. THE CHILD TEST IS NOT OPTIONAL.
   An actual toddler, or an adult deliberately behaving like one: mashing the
   screen, rotating mid-game, pressing back repeatedly, backgrounding, tapping
   ads.

   Every real bug in a toddler app is found this way and NONE of it is found by
   Playwright. Legacy already encodes some of these as automated tests — the
   rapid-tap and listener-growth checks — precisely because they were learned
   from real use.

   Record what was tried and what happened.

9. Write docs/migration/phase-14-defects.md classifying everything found:
     BLOCKER   must fix before cutover
     MAJOR     should fix before cutover
     MINOR     can ship, fix after
     DEFERRED  a deliberate deviation, with its record
   Fix ONLY the BLOCKERs, and re-verify each.

10. Run the full gate plus the legacy suites, and paste every result.

DO NOT
- Do not build new features.
- Do not fix MAJOR, MINOR or DEFERRED defects. Log them.
- Do not mark a row PASS without verifying it.
- Do not leave a difference from the legacy baseline unclassified.
- Do not adjust a performance target.
- Do not remove Capacitor.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] Every checklist row graded PASS, FAIL or N/A with a reason; zero TODO left
- [ ] Device matrix tested, with make, model and OS version named for each
- [ ] Untested device classes named explicitly, with affected rows marked FAIL
- [ ] Every screen compared side by side against the legacy baseline
- [ ] Every difference classified INTENDED, IMPROVED or DEFECT
- [ ] Every INTENDED difference cites its deviation record
- [ ] full-sweep.spec.ts green at all ten viewports
- [ ] Maestro full regression passes
- [ ] All six performance targets measured on at least two device classes
- [ ] Memory stable across a 30-minute soak, with sample data included
- [ ] Accessibility graded across all six criteria
- [ ] Real-child or child-simulation testing performed and recorded
- [ ] Every defect logged with a severity
- [ ] Every BLOCKER fixed and re-verified
- [ ] phase-14-device-qa.md written
- [ ] phase-14-performance.md written
- [ ] phase-14-comparison.md written
- [ ] phase-14-defects.md written
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-14-report.md using the headings in
docs/migration/validation.md section 7.

Add a final section titled "RELEASE GO / NO-GO" with a clear recommendation.
"Not yet, because of X" is a valid and valuable answer. So is "go, with these
three MAJOR defects accepted and tracked". What is not acceptable is a
recommendation that does not follow from the evidence above it.

Then stop. Do not begin Phase 15.
````
