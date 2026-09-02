# Phase 15 cutover plan

This is the plan for when Phase 14 is reopened and says **GO**. It is
**not** executing. Phase 14 on 2026-09-02 recommended **NO-GO**
(`docs/migration/phase-14-report.md`). Capacitor stays.

Each stage is reversible except Stage 4, which is why it is last.

## Preconditions (not met)

- Phase 14 release recommendation is GO.
- Every BLOCKER in `phase-14-defects.md` is fixed and re-verified.
- Every FAIL in `feature-parity-checklist.md` is either PASS or an
  explained N/A with a recorded decision.
- Named devices exist for the Phase 14 matrix.
- A 30-minute Hermes + Reanimated memory soak exists for low-end and mid
  Android.
- Speech recognition, parent recordings, and AdMob are attested on
  hardware.
- Maestro `full-regression.yaml` has been run on a device.

## Stage 1 — internal testing track

**Entry:** preconditions above.

**Do:**

- EAS release builds for `com.yonicks.talki.dev` (internal) and a store
  listing draft for `com.yonicks.talki`.
- Install Capacitor Talki and Expo Talki on the same phones (this is why
  the two app ids exist).
- Walk every screen against `legacy-baseline` and `phase-14` captures.
- Do not remove Capacitor.

**Exit:** both platforms built; internal track live; side-by-side notes
filed.

**Rollback:** unpublish the internal track; testers keep using Capacitor
(`com.yonicks.talki` from the current store listing).

## Stage 2 — closed testing with real families

**Entry:** Stage 1 exit, no new BLOCKER.

**Do:**

- Closed testing with families who already use Capacitor Talki.
- Triage every report into BLOCKER / MAJOR / MINOR.
- Verify data migration with a real user (see
  `phase-15-data-migration.md`): export on Capacitor, install Expo,
  import, confirm progress **and** recordings.

**Exit:** feedback triaged; no BLOCKER; migration loop signed off by a
real parent on a named device.

**Rollback:** close the testing track; families stay on Capacitor.

## Stage 3 — staged production

**Entry:** Stage 2 exit; store review accepted.

**Do:**

- Roll out 10%, then 50%, then 100%.
- Require crash-free > 99% at each step before raising the percentage.
- Execute the rollback once on purpose (drop back from 10% to 0%) so the
  plan is not a hypothesis.

**Exit:** 100% of store users on Expo Talki; crash-free held; rollback
proven.

**Rollback:** Play / App Store halt and revert to the last Capacitor
build. The Capacitor project is still in the tree.

## Stage 4 — retire Capacitor

**Entry:** Stage 3 at 100% for **at least two weeks**; no BLOCKER or
MAJOR outstanding.

**Do, in this order:**

1. Tag the last working Capacitor commit (`git tag capacitor-last-ship`).
   Record the tag in `phase-15-report.md`. Do not rely on “we can find it
   in history”.
2. Only then remove: `capacitor.config.ts`, `android/`, `ios/`, `www/`,
   `tools/prepare_www.js`, Capacitor dependencies and npm scripts.
3. Keep the PWA unless a separate product decision says otherwise:
   `index.html`, `sw.js`, `manifest.json`, `icons/`,
   `tests/test_suite.py`, `tests/interaction_suite.py`,
   `.github/workflows/test-and-deploy.yml`.
4. Update `README.md` and `AGENTS.md`. Leave `docs/migration/` in place.

**Do not fix `tools/prepare_www.js`.** It never copies `audio-manager.js`
into `www/`, so Capacitor native has been shipping without its audio
runtime (legacy D1). Record that when the files go away.

**Rollback after Stage 4:** restore the tagged tree and resubmit that
build. This is slower and riskier than Stage 3 rollback — another reason
Stage 4 waits.

## PWA

Retiring Capacitor is not retiring the PWA. Default: keep it. That
decision is product, not migration.
