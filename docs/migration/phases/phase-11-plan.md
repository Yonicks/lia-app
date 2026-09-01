# Phase 11 — Speech practice and speech recognition

**Prompt:** [../prompts/phase-11.md](../prompts/phase-11.md)
**Creates:** six practice features plus the speech game
**Ships:** the clinical core of the product

---

## Goal and rationale

Port the six evidence-based practice modes and the speech game.

These are what makes Talki a speech-therapy tool rather than a vocabulary app.
Each implements a recognised clinical technique — focused stimulation, cloze
with expectant pause, communication temptation, receptive identification,
minimal pairs, two-word combination. The legacy code labels them as such at
index.html 3060-3061.

The consequence is a stricter porting rule than anywhere else in the migration:
timings, thresholds and scoring rules are clinical parameters. A five-second
pause that becomes three seconds is not a tuning change, it is a different
intervention.

## Entry conditions

- `docs/migration/phase-10-report.md` exists with no critical FAIL.
- All eleven games work.
- Phase 4's speech-recognition POC result is available and has been read.

## Design decisions

### Timings are clinical parameters, not UX preferences

The 5000 ms cloze pause (index.html 3110-3114) is the expectant pause. It is
uncomfortable for an adult watching, which is exactly why it works and exactly
why someone will be tempted to shorten it. It does not change.

Likewise: the 8-second temptation listening window, the 8 receptive rounds, the
adaptive level, and the "anything counts" acceptance threshold.

### Everything counts as an attempt

Temptation opens the jar on **any** sound, not on a correct word
(index.html 3885-3917). Cloze scores on the parent's judgement, not on
recognition. The hint text says it plainly: "כל ניסיון נחשב — גם צליל, גם הברה
אחת" — every attempt counts, including a sound, including a single syllable.

For a child with a speech delay, requiring correctness would make the app a
source of failure. This is the single most important behavioural property in
this phase.

### Recognition is optional, and everything works without it

Two modes touch recognition: `speech` (the game) and `temptation`. Legacy
guards the speech game with an explicit unsupported-browser screen
(index.html 2643-2648) and gives temptation a manual "open" button beside the
microphone (index.html 3143).

That manual path is not a fallback bolted on for testing. It is the design: a
parent can always open the jar. So if Phase 4 concluded recognition is not
viable, this phase still ships all six modes, with the speech game behind a
flag.

### Per-mode legacy specifics

**focus** — focused stimulation (index.html 2527-2529, 3065-3083)
```
target   weightedPick(cat.items, cat.id, 1)[0]
state    { it, step, total: CARRIERS.length }
phrase   CARRIERS[step].replace('{w}', display(it.word))
advance  tapping the picture speaks and advances
done     a custom card, not doneCard, reading
         "המילה נשמעה {total} פעמים במשפטים שונים"
```
One word, several short natural carrier phrases. The done card is bespoke.

**cloze** — cloze plus expectant pause (index.html 2530-2531, 3086-3125)
```
pool     shuffle(CLOZE).slice(0, 6)
phases   'say' -> 'wait' -> 'model'
say      speak the phrase
wait     5000 ms of SILENCE
model    speak answer, then phrase, then answer again
scoring  the parent presses "היא אמרה!"
done     doneCard(score, pool.length, 0, 'כל השלמה נחשבת')
```
The 5000 ms is the intervention. `clozeNext` clears the timer and stops TTS
when leaving the view.

**temptation** — communication temptation (index.html 2532-2533, 3128-3146)
```
pool      weightedPick(cat.items, cat.id, 6)
mechanic  a closed jar; the child must vocalise to open it
listening listenForAnything(), 8s timeout, ANY sound opens it
manual    a "לפתוח" button always available
done      doneCard(pool.length, pool.length, 0, 'הכול נפתח')
```
Everything opens eventually. There is no failure state.

**receptive** — receptive identification (index.html 2534-2536, 3149-3166)
```
state    { level: 2, i, score, run, miss, locked }
rounds   8
options  level options: the target plus level-1 distractors
adaptive level rises and falls with run and miss
columns  2 options -> 2 cols, 3 -> 3 cols, 4+ -> 2 cols
done     doneCard(score, 8, 0, `רמה ${level} אפשרויות`)
```
No talking required. This is the mode a non-verbal child can always succeed at.

**pairs** — minimal pairs (index.html 2537-2539, 3169-3186)
```
pool     shuffle(PAIRS).slice(0, 6)
round    target is a random member of the pair; shown is the shuffled pair
prompt   "שתי מילים כמעט זהות — איזו נשמעה?"
done     doneCard(score, pool.length, 0)
```
Perception before production.

**combine** — two-word combinations (index.html 2540-2541, 3189-3201)
```
state    { round, mod, phrase, pics: weightedPick(cat.items, cat.id, 3) }
flow     choose a MODIFIERS word, then a picture, producing a phrase
rounds   6
done     doneCard(round, 6, 0, 'צירופים נבנו')
```

**speech game** (index.html 2515-2517, 2643-2661, 3590-3595, 3841-3876)
```
pool        weightedPick(cat.items, cat.id, min(6, items.length))
recognition he-IL, single word, Levenshtein distance <= 1
skip        always available
unsupported an explicit screen, not a crash
```

### Music profile

`SPEECH_VIEWS` (index.html 2018) is the set of views that switch music to the
listening-focus profile. Every one of these modes is in it, and the
`speechOrListeningTask` music state plus the listening duck must engage while
the microphone is open.

## Files to be created

```
apps/mobile/src/features/practice/
├── focus/       FocusScreen.tsx      focusReducer.ts
├── cloze/       ClozeScreen.tsx      clozeReducer.ts  clozeTimings.ts
├── temptation/  TemptationScreen.tsx temptationReducer.ts
├── receptive/   ReceptiveScreen.tsx  receptiveReducer.ts
├── pairs/       PairsScreen.tsx      pairsReducer.ts
├── combine/     CombineScreen.tsx    combineReducer.ts
└── shared/      PracticeShell.tsx    useListening.ts

apps/mobile/src/features/games/speech/
├── SpeechScreen.tsx
├── speechReducer.ts
└── levenshtein.ts

apps/mobile/src/services/speech/
└── expoSpeechRecognition.ts    the real implementation, or a documented stub

apps/mobile/tests/unit/
├── focus-reducer.test.ts        cloze-reducer.test.ts
├── temptation-reducer.test.ts   receptive-reducer.test.ts
├── pairs-reducer.test.ts        combine-reducer.test.ts
├── levenshtein.test.ts          practice-timings.test.ts

apps/mobile/tests/e2e/practice-*.spec.ts   (six)
apps/mobile/tests/e2e/speech.spec.ts
apps/mobile/.maestro/practice.yaml
```

## testIds introduced

```
practice-root                 practice-title
focus-card                    focus-phrase          focus-dots
focus-next-word
cloze-phrase                  cloze-phase-say       cloze-phase-wait
cloze-phase-model             cloze-said            cloze-next
temptation-jar                temptation-mic        temptation-open
temptation-next
receptive-option-<index>      receptive-replay      receptive-level
pairs-option-<index>          pairs-replay
combine-mod-<index>           combine-pic-<index>   combine-phrase
speech-root                   speech-mic            speech-skip
speech-feedback               speech-unsupported
```

## Behaviour to preserve exactly

- focus: one target, `CARRIERS.length` steps, tap advances, bespoke done card.
- cloze: 6 items; say, then **5000 ms** silence, then model in the order
  answer, phrase, answer.
- cloze: the parent scores; the timer is cleared and TTS stopped on leaving.
- temptation: 6 items, any sound opens, 8-second window, manual open always
  present, no failure state.
- receptive: 8 rounds, adaptive level, option count equals level, column rules
  2 / 3 / 2.
- pairs: 6 pairs, target chosen randomly from the pair, both shown shuffled.
- combine: 6 rounds, a modifier plus a picture builds a phrase.
- speech: up to 6 words, `he-IL`, Levenshtein 1, skip always available, an
  explicit unsupported screen.
- All: the prompt is spoken exactly once on entry.
- All: `speechOrListeningTask` music and the listening duck engage while
  listening.
- All: every mode works with recognition unavailable.

## Test plan

### Tier 1

`practice-timings.test.ts` — the clinical constants, isolated so a change is
visible in review
- cloze wait is exactly 5000 ms
- temptation listening timeout is 8000 ms
- receptive is 8 rounds
- cloze, temptation and pairs pools are 6

`cloze-reducer.test.ts`
- phases progress say, wait, model
- the wait phase does not advance early
- the model sequence is answer, phrase, answer
- scoring is parent-driven, never recognition-driven
- leaving clears the timer and stops TTS
- done after the pool is exhausted

`temptation-reducer.test.ts`
- **any** recognition result opens the jar, including an empty or unrecognised
  one
- the manual open works with no recognition at all
- the 8-second timeout does not fail the round
- no state can produce a failure

`receptive-reducer.test.ts`
- starts at level 2
- option count equals level
- level rises on a run and falls on misses, matching legacy exactly
- 8 rounds
- column rule: 2 options gives 2, 3 gives 3, 4 or more gives 2

`focus-reducer.test.ts`
- steps equal `CARRIERS.length`
- each step substitutes `{w}` correctly
- the done card is the bespoke one, not `doneCard`

`pairs-reducer.test.ts`
- 6 pairs from `PAIRS`
- the target is one of the two
- both are shown, shuffled

`combine-reducer.test.ts`
- 3 pictures, modifiers from `MODIFIERS`
- selecting a modifier then a picture builds the phrase
- 6 rounds

`levenshtein.test.ts`
- distance 0 accepted, 1 accepted, 2 rejected
- Hebrew strings with and without niqqud
- comparison uses the plain form

### Tier 2

One spec per mode plus the speech game, all ten viewports.

Common:
- the screen renders and fits in landscape
- `speechSpy` proves the prompt speaks exactly once on entry
- `degradeNativeApis`: the mode still works with no TTS and no recognition
- audits clean, no listener growth
- `toHaveScreenshot()` per documented state
- `captureMatrix` for every state in the manifest

Mode-specific:
- focus: dots advance, the phrase changes per step, the bespoke done card
  appears
- cloze: all three phases are visually distinct; the wait phase persists for
  the full 5 seconds; the "she said it" button scores
- temptation: the jar opens on a stubbed recognition result of any content; the
  manual open works; no failure state is reachable
- receptive: the option count changes with level; the column layout follows the
  rule
- pairs: two options, replay works
- combine: choosing a modifier then a picture renders the phrase
- speech: with recognition stubbed unsupported, the explicit unsupported screen
  shows and does not crash; skip always works

### Tier 3 — the substance

Recognition and microphone are not testable on web.

Manual attestation, device named:
- `he-IL` recognition returns a result for a single word on Android
- and on iOS, or a recorded statement that it does not
- the temptation jar opens on a real child-like vocalisation such as "ba"
- microphone permission denial leaves every mode usable
- the cloze 5-second pause feels correct in real use
- music ducks while listening and restores afterwards
- all six modes plus the speech game work end to end on a device

## Screenshot manifest

```
docs/migration/screenshots/phase-11/
    <viewport>-focus-step1.png        <viewport>-focus-done.png
    <viewport>-cloze-say.png          <viewport>-cloze-wait.png
    <viewport>-cloze-model.png
    <viewport>-temptation-closed.png  <viewport>-temptation-open.png
    <viewport>-receptive-level2.png   <viewport>-receptive-level4.png
    <viewport>-pairs-board.png
    <viewport>-combine-board.png      <viewport>-combine-phrase.png
    <viewport>-speech-board.png       <viewport>-speech-unsupported.png
    android-device-temptation-listening.png
    android-device-speech-listening.png
```

Fourteen states times ten viewports is 140 files, plus two device captures.

## Risks and open questions

**Recognition may be unviable.** Default: ship all six practice modes and put
the speech game behind a feature flag, defaulting off if Phase 4 said it is not
viable. Temptation keeps its manual open and remains fully usable. Record the
decision.

**The 5-second pause will feel too long.** It is meant to. Default: do not
change it. If a product decision later shortens it, that is a clinical change
that needs its own justification, not a migration side effect.

**Testing "any sound opens the jar".** Default: stub the recognition service to
return an arbitrary result and assert the jar opens regardless of content.
Cover the real-vocalisation case in Tier 3.

**Receptive adaptivity.** Default: read the exact `run` and `miss` thresholds
from the legacy handler rather than inferring them, and test both directions.

**Landscape for text-heavy modes.** Cloze and combine show Hebrew phrases.
Default: allow the text to wrap and scale rather than truncating. A truncated
carrier phrase defeats the intervention.

## Exit criteria

- [ ] All six practice modes work end to end
- [ ] The speech game works, or is flagged off with a recorded reason
- [ ] cloze wait is exactly 5000 ms, asserted
- [ ] cloze models in the order answer, phrase, answer
- [ ] cloze scoring is parent-driven, never recognition-driven
- [ ] temptation opens on **any** sound, asserted with an arbitrary stub result
- [ ] temptation's manual open always works
- [ ] No practice mode has a reachable failure state
- [ ] receptive: 8 rounds, adaptive level, correct column rule
- [ ] focus: `CARRIERS.length` steps and the bespoke done card
- [ ] pairs: 6 pairs, random target, shuffled display
- [ ] combine: 6 rounds, modifier plus picture builds the phrase
- [ ] speech: Levenshtein 1, skip always available, explicit unsupported screen
- [ ] Every mode speaks its prompt exactly once on entry, proven by `speechSpy`
- [ ] Every mode works under `degradeNativeApis`
- [ ] `speechOrListeningTask` music and the listening duck engage while
      listening
- [ ] Microphone permission denial leaves every mode usable
- [ ] Audits clean, no listener growth, no leaked timers
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 140 screenshots plus two device captures committed
- [ ] Recognition attested on a real device, or its absence recorded
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-11-report.md` written

**This phase ends at the feature-parity gate.** Every child-facing feature now
exists. The report must state what remains before parity can be declared.
