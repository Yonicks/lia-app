# Shared Landscape Phase Instructions

This file is shared context for every Talki landscape redesign phase.

Do not treat it as a substitute for the repository contract.

## Required reading

Before implementation, read:

1. `/AGENTS.md`
2. `/CLAUDE.md` when using Claude
3. `/docs/design/landscape/README.md`
4. `/docs/design/landscape/screen-map.md`
5. `/docs/design/landscape/interaction-map.md`
6. `/docs/design/landscape/asset-manifest.md`
7. `/docs/migration/landscape-roadmap.md`
8. the active phase plan
9. the previous landscape phase report
10. all current implementation files touched by the phase

## Sources of truth

- Current source code = behavioral truth.
- Active phase plan = scope/acceptance truth.
- Committed landscape references = visual truth.
- Previous phase reports = evidence.
- Old migration documents = historical context.

## Pre-flight

Before editing code, write a concise pre-flight section containing:

- current files/components involved;
- reusable seams already present;
- expected files to modify;
- missing design assets/dependencies;
- behavior that must not regress;
- test/screenshot plan.

## Execution

- Implement only the active phase.
- Do not start future phase work “while you are here”.
- Preserve existing feature behavior unless explicitly changed by the phase.
- Never remove content because it does not appear in a mock.
- Never weaken tests to get green.
- Record blockers rather than faking completion.

## Report

Write:

`docs/migration/phase-XX-report.md`

Include:

- Summary
- Acceptance criteria: PASS / FAIL / BLOCKED
- Files changed
- Tests and exact results
- Screenshot index
- Compact phone result
- Modern/large phone result
- Tablet result
- Native coverage
- Assets still missing
- Deviations
- Risks carried forward
- Explicit phase status

After the report is complete, STOP.
