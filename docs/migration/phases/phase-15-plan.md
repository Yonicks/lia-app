# Phase 15 — Native cutover and Capacitor retirement

**Prompt:** [../prompts/phase-15.md](../prompts/phase-15.md)
**Creates:** the release process, CI for native builds, a rollback plan
**Removes:** the Capacitor runtime, and only after the native app has shipped

---

## Goal and rationale

Make the React Native app the primary Talki, and retire the Capacitor build
safely.

The word doing the work is *safely*. The failure mode is deleting the working
implementation the day the new one goes live, discovering a blocking defect a
week later, and having nothing to roll back to. Every decision in this phase
serves the ability to reverse it.

## Entry conditions

- `docs/migration/phase-14-report.md` exists and its release go/no-go says
  proceed.
- Every BLOCKER fixed.
- The parity checklist has no unexplained FAIL.

## Design decisions

### Cutover is staged, and each stage is reversible

```
Stage 1   internal testing track, both apps installed side by side
Stage 2   closed testing with real families
Stage 3   staged production rollout, 10% then 50% then 100%
Stage 4   Capacitor retired, only after 100% has been stable
```

Each stage has an explicit rollback: revert the track, halt the rollout, or
restore the previous build. Stage 4 is the only irreversible step and it comes
last on purpose.

### The legacy app stays until the native one has actually shipped

Capacitor, `www/`, `android/`, `ios/`, `tools/prepare_www.js` and the Capacitor
npm scripts are removed at Stage 4, not before.

The migration branch exists for weeks; the legacy app is the fallback for all
of them. Removing it early converts a recoverable problem into an outage.

### The PWA is a separate decision

The Capacitor **native wrapper** is being retired. The **PWA** at
`index.html` plus `sw.js` plus `manifest.json` is a different product with
different users, and whether it continues is a product decision, not a
migration one.

Default: keep the PWA. It costs nothing to leave running, it serves users who
cannot install from a store, and `.github/workflows/test-and-deploy.yml`
already deploys it.

If it is kept, its test suites keep running and the legacy code keeps working.
That means the "do not touch the legacy app" rule survives this phase for the
PWA even as the native wrapper goes away.

### User data must survive the transition

This is the phase's hardest requirement and it deserves to be stated plainly: a
user updating from the Capacitor app to the React Native app must not lose
their child's progress or their voice recordings.

The two apps store data in completely different places — IndexedDB inside a
WebView versus SQLite plus files. There is no automatic path between them.

Options, in order of preference:

1. **Backup and restore.** The Capacitor app can already export a V1 backup and
   the native app can already import one, including under the `lia-words` name.
   This works today and needs only a prompt in the old app and an import path
   in the new one.
2. **A one-time in-app migration** reading the WebView's IndexedDB. Technically
   possible on Android, unreliable on iOS, and it requires shipping WebView code
   into the native app.
3. **Accept the loss.** Not acceptable for recordings, which represent real
   parent effort that cannot be regenerated.

Default: option 1, with a clear in-app prompt in the final Capacitor release
telling parents to export before updating, and a prominent import entry point in
the native app's first run.

### CI grows a release job

`.github/workflows/mobile.yml` gains EAS build and submit. The existing
`test-and-deploy.yml` continues to guard and deploy the PWA.

### Documentation reflects reality

`README.md` and `AGENTS.md` describe the two-app world during transition and the
native-only world after. `docs/migration/` is preserved as the record of how it
happened — it is the answer to "why is this done this way?" for years afterwards.

## Files affected

Created:
```
docs/migration/phase-15-cutover-plan.md      staged rollout and rollback
docs/migration/phase-15-data-migration.md    how user data survives
docs/migration/phase-15-report.md
.github/workflows/mobile-release.yml
```

Modified:
```
README.md          the new structure and build commands
AGENTS.md          the new architecture
package.json       scripts, at Stage 4
```

Removed at Stage 4 only:
```
capacitor.config.ts
android/                    the Capacitor Android project
ios/                        the Capacitor iOS project
www/
tools/prepare_www.js
Capacitor dependencies and scripts
```

Kept unless a separate product decision says otherwise:
```
index.html      sw.js      manifest.json      icons/
tests/test_suite.py        tests/interaction_suite.py
.github/workflows/test-and-deploy.yml
```

## Test plan

### Before Stage 1

- The full Phase 14 sweep is green.
- Release builds succeed for both platforms.
- Store listings and compliance declarations are ready.

### Before Stage 3

- Closed testing feedback triaged with no BLOCKER outstanding.
- Crash-free rate above 99% in testing.
- The data migration path verified end to end by a real user: export from the
  Capacitor app, install the native app, import, and confirm progress and
  recordings both survive.

### Before Stage 4

- 100% rollout stable for at least two weeks.
- No BLOCKER or MAJOR defect outstanding.
- Store reviews show no systemic complaint.
- A tagged git commit of the last working Capacitor build, so the retirement is
  reversible in principle even after the files are gone.

### After Stage 4

- Everything still builds.
- The mobile CI job is green.
- The PWA still deploys and its suites still pass, if it was kept.
- `README.md` matches reality.

## Risks and open questions

**Losing user data at the transition.** Default: backup and restore, with an
in-app prompt in the final Capacitor release and a prominent import path on
first run of the native app. Verify the whole loop with a real device before
Stage 3.

**Store review may reject.** Default: submit early to internal testing to
surface review problems before they are on the critical path. Ads plus a
children's app is the most likely area of friction, which is why the Phase 13
compliance document exists.

**A regression discovered after retirement.** Default: tag the last working
Capacitor commit and record the tag in the report. Do not rely on being able to
reconstruct it from history.

**PWA users left behind.** Default: keep the PWA. Revisit as a product decision
with its own analysis.

**`tools/prepare_www.js` bug.** It never copies `audio-manager.js` into `www/`,
so the Capacitor build has been shipping without its audio runtime. Default: do
not fix it now — it is being deleted. Record it in the final report as
something that was true of the legacy build, because it may explain historical
audio bug reports.

## Exit criteria

### Stage 1
- [ ] Release builds succeed on both platforms
- [ ] Internal testing track live
- [ ] Both apps installed side by side and compared

### Stage 2
- [ ] Closed testing with real families
- [ ] Feedback triaged, no BLOCKER outstanding
- [ ] Data migration verified end to end by a real user

### Stage 3
- [ ] Staged rollout 10%, then 50%, then 100%
- [ ] Crash-free rate above 99% at each step
- [ ] Rollback plan documented and tested at least once

### Stage 4
- [ ] 100% stable for at least two weeks
- [ ] Last working Capacitor build tagged in git, tag recorded
- [ ] Capacitor removed: config, `android/`, `ios/`, `www/`,
      `tools/prepare_www.js`, dependencies and scripts
- [ ] PWA kept and still working, or its removal separately decided and recorded
- [ ] `README.md` and `AGENTS.md` updated
- [ ] CI green
- [ ] `docs/migration/` preserved as the record
- [ ] `docs/migration/phase-15-report.md` written

**The migration is complete when Stage 4 exits.**
