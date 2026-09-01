# Phase 15 prompt — Native cutover and Capacitor retirement

Plan: [../phases/phase-15-plan.md](../phases/phase-15-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 15 of the Talki migration to Expo React Native.

Phase 15 makes the React Native app the primary Talki and retires the Capacitor
build SAFELY.

The word doing the work is SAFELY. The failure mode is deleting the working
implementation the day the new one goes live, discovering a blocking defect a
week later, and having nothing to roll back to. Every decision in this phase
serves the ability to reverse it.

Execute ONLY Phase 15. It is STAGED, and the stages are separated by real
elapsed time and real user feedback. Do not perform a later stage's work because
the earlier one looks fine.

=== TALKI MIGRATION — STANDING RULES ===

SOURCE OF TRUTH
- index.html at the repository root is still the source of truth for the PWA.
- Never infer a count, a colour, a key name or an algorithm. Read it.

FORBIDDEN
- No removing Capacitor before Stage 4.
- No removing the PWA as a side effect of retiring the native wrapper. They are
  different products with different users.
- No cutover step without a documented rollback.
- No user losing progress or recordings in the transition.
- No weakening, skipping or deleting an assertion to make a run green.

REPORTING
- Write docs/migration/phase-15-report.md before you stop.
- Paste real command output, not summaries.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-15-plan.md    — your plan, read it fully
2. docs/migration/phase-14-report.md         — CONFIRM the release go/no-go said
                                               proceed. If it did not, STOP and
                                               say so.
3. docs/migration/phase-13-compliance.md
4. docs/migration/feature-parity-checklist.md — confirm no unexplained FAIL
5. README.md, AGENTS.md, package.json, capacitor.config.ts
6. .github/workflows/test-and-deploy.yml

THE STAGES. Each is reversible except the last, which is why it comes last.

    Stage 1   internal testing track, both apps installed side by side
    Stage 2   closed testing with real families
    Stage 3   staged production rollout: 10%, then 50%, then 100%
    Stage 4   Capacitor retired, ONLY after 100% has been stable

THE HARDEST REQUIREMENT: USER DATA MUST SURVIVE.

A user updating from the Capacitor app to the React Native app must not lose
their child's progress or their parent voice recordings.

The two apps store data in completely different places — IndexedDB inside a
WebView versus SQLite plus files on disk. THERE IS NO AUTOMATIC PATH BETWEEN
THEM.

Options, in order of preference:
  1. BACKUP AND RESTORE. The Capacitor app can already export a V1 backup
     (index.html 1754-1775) and the native app can already import one,
     including under the legacy 'lia-words' app name (index.html 1781). This
     works today and needs only a prompt in the old app and a prominent import
     path in the new one.
  2. A one-time in-app migration reading the WebView's IndexedDB. Possible on
     Android, unreliable on iOS, and it means shipping WebView code into the
     native app.
  3. Accept the loss. NOT ACCEPTABLE for recordings, which represent real
     parent effort that cannot be regenerated.

DEFAULT: option 1. Ship a final Capacitor release with a clear in-app prompt
telling parents to export before updating, and make import prominent on the
native app's first run. VERIFY THE WHOLE LOOP ON A REAL DEVICE BEFORE STAGE 3.

THE PWA IS A SEPARATE DECISION. You are retiring the Capacitor NATIVE WRAPPER.
The PWA (index.html + sw.js + manifest.json) is a different product with
different users. DEFAULT: KEEP IT. It costs nothing to leave running, it serves
users who cannot install from a store, and test-and-deploy.yml already deploys
it. If it is kept, its test suites keep running and the legacy code keeps
working — so the "do not touch the legacy app" rule survives this phase for the
PWA even as the native wrapper goes away.

WORK ITEMS

1. Confirm entry conditions. If phase-14-report.md does not recommend proceed,
   or any BLOCKER is outstanding, or the parity checklist has an unexplained
   FAIL — STOP and report that instead.

2. Write docs/migration/phase-15-cutover-plan.md: the four stages, the entry
   and exit criteria for each, and the EXPLICIT ROLLBACK for each.

3. Write docs/migration/phase-15-data-migration.md: exactly how a user's
   progress and recordings survive, the prompt wording, the import path, and
   the verification procedure.

4. Add .github/workflows/mobile-release.yml with EAS build and submit. Do NOT
   modify test-and-deploy.yml; it continues to guard and deploy the PWA.

5. Execute Stage 1: release builds for both platforms, internal testing track,
   both apps installed side by side and compared.

6. Execute Stage 2: closed testing with real families. Triage all feedback.
   VERIFY THE DATA MIGRATION END TO END WITH A REAL USER: export from the
   Capacitor app, install the native app, import, and confirm that BOTH
   progress and recordings survive.

7. Execute Stage 3: staged rollout 10%, then 50%, then 100%. Confirm a
   crash-free rate above 99% at each step. Test the rollback at least once —
   a rollback plan that has never been executed is a hypothesis.

8. Execute Stage 4 ONLY after 100% has been stable for at least TWO WEEKS with
   no BLOCKER or MAJOR outstanding.

   First: TAG THE LAST WORKING CAPACITOR BUILD IN GIT and record the tag in
   your report. Do not rely on being able to reconstruct it from history.

   Then remove:
     capacitor.config.ts
     android/                  the Capacitor Android project
     ios/                      the Capacitor iOS project
     www/
     tools/prepare_www.js
     Capacitor dependencies and npm scripts

   KEEP, unless a separate product decision says otherwise:
     index.html   sw.js   manifest.json   icons/
     tests/test_suite.py   tests/interaction_suite.py
     .github/workflows/test-and-deploy.yml

9. Update README.md and AGENTS.md to describe the new structure and build
   commands. PRESERVE docs/migration/ as the record of how this happened — it
   is the answer to "why is this done this way?" for years afterwards.

10. Verify after Stage 4:
      - everything still builds
      - the mobile CI job is green
      - the PWA still deploys and its suites still pass, if kept
      - README.md matches reality

DO NOT
- Do not remove Capacitor before Stage 4.
- Do not remove the PWA as a side effect.
- Do not skip a stage because the previous one looked fine.
- Do not delete the Capacitor project without tagging it first.
- Do not fix tools/prepare_www.js. It never copies audio-manager.js into www/,
  so the Capacitor build has been shipping without its audio runtime. It is
  being deleted, so leave it — but RECORD it in your report, because it may
  explain historical audio bug reports from native users.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report

Stage 1
- [ ] Release builds succeed on both platforms
- [ ] Internal testing track live
- [ ] Both apps installed side by side and compared

Stage 2
- [ ] Closed testing with real families completed
- [ ] All feedback triaged, no BLOCKER outstanding
- [ ] Data migration verified end to end by a real user, progress AND
      recordings both confirmed intact

Stage 3
- [ ] Staged rollout 10%, then 50%, then 100%
- [ ] Crash-free rate above 99% at each step
- [ ] Rollback plan documented AND executed at least once

Stage 4
- [ ] 100% stable for at least two weeks
- [ ] Last working Capacitor build tagged in git, tag recorded in the report
- [ ] Capacitor removed: config, android/, ios/, www/, prepare_www.js,
      dependencies and scripts
- [ ] PWA kept and still working, or its removal separately decided and recorded
- [ ] README.md and AGENTS.md updated
- [ ] CI green
- [ ] docs/migration/ preserved
- [ ] The prepare_www.js audio-manager.js omission recorded for the record

REPORT
Write docs/migration/phase-15-report.md using the headings in
docs/migration/validation.md section 7, plus a section per stage with its dates,
its metrics and its rollback status.

The migration is complete when Stage 4 exits.
````
