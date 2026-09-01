# Shared rules block

This block is inlined verbatim near the top of every phase prompt. It is kept
here as the single source so that a change propagates to all sixteen prompts.

If you edit this file, re-apply the change to `prompts/phase-00.md` through
`prompts/phase-15.md`.

---

```text
=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary. docs/talki-home-redesign-audit.md and the
  redesign plans are known to contain claims that the live code has moved past.
  Where a document and the code disagree, the code wins and you record the drift.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename, restructure or refactor index.html, audio-manager.js,
  assets/, tools/, tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not remove Capacitor. Do not modify the existing npm scripts.
- Do not edit legacy source to make a new test pass. If legacy behaviour looks
  wrong, record it as a finding and preserve it anyway.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- apps/mobile enables the Expo web target so Playwright can drive the app.
- It is never shipped to users and never replaces the PWA.
- Do not make a single design, layout or architecture decision for the benefit
  of the browser. If something can only work on web, it is wrong.
- Do not use react-native-web-specific APIs in application code.

FORBIDDEN
- No WebView wrapping of the legacy app.
- No line-by-line translation of HTML into JSX.
- No line-by-line translation of CSS into StyleSheet objects.
- No NativeWind.
- No hardcoded values copied out of a screenshot.
- No emoji placeholders where a real Talki asset exists.
- No global store for transient per-game state.
- No direct calls to expo-audio, expo-speech, expo-sqlite, expo-screen-orientation
  or any speech-recognition library from a screen or game component. Everything
  goes through a service in src/services/.
- No weakening, skipping or deleting an assertion to make a run green. If a test
  fails, either the implementation is wrong or the test encodes a wrong
  expectation — say which, and why, in your report.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not add features that do not exist in the legacy app.
- Do not redesign game rules or clinical practice mechanics.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- Do not silently pick a direction on a decision the plan did not make.
- The phase plan lists open questions with a suggested default. Use the default,
  and record in your report that you did and why.
- If you hit something the plan did not anticipate, implement the smallest
  reversible thing that unblocks you and flag it prominently in the report.

REPORTING
- Write docs/migration/phase-NN-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL. Never "mostly" or "should
  work". If you did not verify it, the answer is FAIL with a reason.
- Paste real command output, not a summary of it.
- State plainly which findings are web-only and therefore not proof of native
  behaviour.
=== END STANDING RULES ===
```
