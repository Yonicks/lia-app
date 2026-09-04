# Talki — Claude Instructions

Before making changes, read and obey:

1. `AGENTS.md`
2. `docs/design/landscape/README.md`
3. `docs/migration/landscape-roadmap.md`
4. the active phase plan under `docs/migration/phases/`
5. the previous landscape phase report

`AGENTS.md` is the canonical repository-wide contract. Do not duplicate or override it here.

## Claude phase workflow

When asked to implement a landscape phase:

1. Inspect current code before proposing edits.
2. Inspect the relevant reference images.
3. Produce a short pre-flight inventory:
   - current files/components involved;
   - reusable architecture seams;
   - expected files to change;
   - missing assets/dependencies;
   - risks;
   - validation plan.
4. Implement **only** the requested phase.
5. Run the phase validation.
6. Write `docs/migration/phase-XX-report.md`.
7. Stop.

Do not automatically begin the next phase.

## Important

- The child UI is landscape-only on phones and tablets.
- The old Phase 15 cutover attempt stopped and is historical.
- Never retire Capacitor during a landscape implementation phase.
- Never remove existing functionality simply because a mock omits it.
- Current source code is behavioral truth.
- Committed landscape references are visual truth.
