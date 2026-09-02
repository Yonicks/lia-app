# Phase 15 report — Native cutover and Capacitor retirement

## Summary

Phase 15 did **not** cut over. Work item 1 of the prompt is: if
`phase-14-report.md` does not recommend proceed, or any BLOCKER is
outstanding, or the parity checklist has an unexplained FAIL — **STOP
and report that instead**.

Phase 14’s release section is **NO-GO**. BLOCKERs P14-B1–B8 are open.
Capacitor, the PWA, `android/`, `ios/`, `www/`, and
`tools/prepare_www.js` are untouched. The two planning documents below
exist so a later session can execute the stages when the gate is
actually green.

## Why we stopped

From `docs/migration/phase-14-report.md`, RELEASE GO / NO-GO:

> **NO-GO.** Not yet, because: (1) zero devices in the required matrix;
> (2) no 30-minute memory soak on Hermes + Reanimated; (3) speech
> recognition, parent recordings, AdMob, offline, and native performance
> targets are untested; (4) Maestro full regression never ran; (5)
> sticker art, photo pick, and several MAJOR product gaps remain.

Entry conditions from `phase-15-plan.md` that failed:

- Phase 14 does not say proceed.
- BLOCKERs are not fixed (they need hardware / store / art).
- The checklist has many explained FAILs (device-untested and product
  gaps). None are unexplained; they are still FAILs.

## Acceptance criteria

Stage 1
- [FAIL] Release builds succeed on both platforms — not attempted
- [FAIL] Internal testing track live — not attempted
- [FAIL] Both apps installed side by side and compared — not attempted

Stage 2
- [FAIL] Closed testing with real families completed — not attempted
- [FAIL] All feedback triaged, no BLOCKER outstanding — Phase 14 BLOCKERs remain
- [FAIL] Data migration verified end to end by a real user — not attempted

Stage 3
- [FAIL] Staged rollout 10%, then 50%, then 100% — not attempted
- [FAIL] Crash-free rate above 99% at each step — not attempted
- [FAIL] Rollback plan documented AND executed at least once — documented only

Stage 4
- [FAIL] 100% stable for at least two weeks — not reached
- [FAIL] Last working Capacitor build tagged in git — not tagged; retiring now would be unsafe
- [FAIL] Capacitor removed — **deliberately not removed**
- [PASS] PWA kept and still working — unchanged; suites still green at Phase 14
- [FAIL] README.md and AGENTS.md updated — not rewritten; they still describe the live Capacitor/PWA world, which is still the truth
- [FAIL] CI green for a native release job — `mobile-release.yml` was not added
- [PASS] docs/migration/ preserved
- [PASS] The prepare_www.js audio-manager.js omission recorded — D1 / below

## Gate results

1. Static checks: N/A — no app code changed in this phase
2. Tier 1 vitest: N/A — not re-run; last green at Phase 14 (5484)
3. Web export: N/A
4. Tier 2 playwright: N/A
5. Screenshots: N/A — no Stage 1 device captures
6. Legacy regression: not re-run here; last green at Phase 14
   (`ALL CHECKS PASSED`, `ALL INTERACTION CHECKS PASSED`, 18 audio tests)
7. This report: PASS

## Native coverage

Device: not applicable. This phase stopped before Stage 1.

Checks performed: read Phase 14 report, checklist, and Phase 15 prompt;
confirmed Capacitor paths still present.

Checks NOT possible: every Stage 1–4 store and device action.

## Files created

- `docs/migration/phase-15-cutover-plan.md` — four stages + rollback
- `docs/migration/phase-15-data-migration.md` — backup/restore loop
- `docs/migration/phase-15-report.md`

## Dependencies added

none

## Deviations from the phase plan

- Did not add `.github/workflows/mobile-release.yml` (would imply a
  release job that cannot run here).
- Did not edit `README.md` / `AGENTS.md` to pretend Expo is primary.
- Did not execute Stages 1–4. The prompt forbids skipping a stage
  because an earlier one “looked fine”; here the earlier phase did not
  even look fine.

## Findings and drift

**`tools/prepare_www.js` never copies `audio-manager.js` into `www/`**
(legacy D1). Capacitor native has been shipping without its audio
runtime. Do not fix it as part of a retirement that has not started.
When Stage 4 eventually deletes the file, keep this sentence in the
final report so historical “no sound on the Play build” reports have an
explanation.

The PWA remains a separate product. Default remains: keep it.

## Risks carried forward

- Opening Stage 1 while Phase 14 is NO-GO would put families on an
  unattested build.
- Deleting Capacitor now would remove the only store-shipped native
  app.
- Data migration is designed (option 1) but unverified on a device.

## What to do next

Re-run Phase 14 on named hardware. When that report says GO and
P14-B1–B8 are closed, execute this phase from Stage 1 using
`phase-15-cutover-plan.md` and `phase-15-data-migration.md`. Until then,
Capacitor stays.

## Commands to reproduce

```bash
# Confirm we stopped, and Capacitor is still here:
test -f capacitor.config.ts && echo 'capacitor.config.ts still present'
test -d android && echo 'android/ still present'
test -d ios && echo 'ios/ still present'
test -f tools/prepare_www.js && echo 'prepare_www.js still present'
grep -n 'NO-GO' docs/migration/phase-14-report.md
```

## RELEASE / CUTOVER STATUS

**STOPPED. Capacitor is not retired. The migration is not complete.**

Stage 4 is the definition of “done”. It was not reached.
