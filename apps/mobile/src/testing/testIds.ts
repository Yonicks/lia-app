/**
 * The single registry of test identifiers used across the native app.
 * Specs import from here rather than hardcoding strings, so a rename is a
 * one-file change instead of a grep-and-pray across every spec.
 */
export const testIds = {
  /** app/_layout.tsx + src/features/intro/ — the native opening sequence
   *  (phase-06-plan.md). `layer(id)` matches every `IntroLayerId` so a spec
   *  can assert on the exact same identifiers `layers.ts` exports. */
  intro: {
    root: 'intro-root',
    skipLayer: 'intro-skip-layer',
    layer: (id: string) => `intro-layer-${id}`,
  },
  /** app/index.tsx + src/features/home/ (phase-07-plan.md). Section
   *  order is hero, categories, practice, games; every dynamic id is a
   *  factory keyed by the same domain id (`CategoryId`/`GameId`/
   *  `PracticeModeId`) the data layer already uses. */
  home: {
    root: 'home-root',
    hero: 'home-hero',
    heroContinue: 'home-hero-continue',
    /** Reuses top-bar points — Home does not render a second,
     *  duplicate points node next to the shared top chrome. */
    points: 'topbar-points',
    sectionCategories: 'home-section-categories',
    category: (id: string) => `home-category-${id}`,
    sectionPractice: 'home-section-practice',
    practice: (id: string) => `home-practice-${id}`,
    allPractice: 'home-all-practice',
    sectionGames: 'home-section-games',
    game: (id: string) => `home-game-${id}`,
    allGames: 'home-all-games',
  },
  /** Phase 19 landscape side/top navigation (replaces BottomNavigation). */
  nav: {
    sideStart: 'landscape-side-start',
    sideEnd: 'landscape-side-end',
    rewards: 'landscape-rewards-entry',
  },
  /** app/category/[id].tsx + src/features/categories/. */
  category: {
    root: 'category-root',
    title: 'category-title',
    progress: 'category-progress',
    back: 'category-back',
    play: 'category-play',
    cards: 'category-cards',
    practice: 'category-practice',
    word: (index: number) => `category-word-${index}`,
  },
  /** app/games.tsx. */
  gamesMenu: {
    root: 'games-menu-root',
    card: (id: string) => `games-menu-card-${id}`,
    chip: (id: string) => `games-menu-chip-${id}`,
  },
  /** app/practice/index.tsx. */
  practiceMenu: {
    root: 'practice-menu-root',
    card: (id: string) => `practice-menu-card-${id}`,
  },
  /** app/game/[id].tsx + src/features/games/shell/ (phase-08-plan.md). */
  game: {
    shellRoot: 'game-shell-root',
    headerBack: 'game-header-back',
    headerTitle: 'game-header-title',
    chip: (index: number) => `game-chip-${index}`,
    doneCard: 'game-done-card',
    doneStars: 'game-done-stars',
    doneReplay: 'game-done-replay',
    doneHome: 'game-done-home',
  },
  quiz: {
    root: 'quiz-root',
    prompt: 'quiz-prompt',
    replay: 'quiz-replay',
    option: (index: number) => `quiz-option-${index}`,
    optionCorrect: 'quiz-option-correct',
    optionWrong: 'quiz-option-wrong',
  },
  memory: {
    root: 'memory-root',
    card: (index: number) => `memory-card-${index}`,
    chipPairs: 'memory-chip-pairs',
  },
  missing: {
    root: 'missing-root',
    item: (index: number) => `missing-item-${index}`,
    guess: (index: number) => `missing-guess-${index}`,
    phaseShow: 'missing-phase-show',
    phaseAsk: 'missing-phase-ask',
  },
  match: {
    root: 'match-root',
    word: (index: number) => `match-left-${index}`,
    picture: (index: number) => `match-right-${index}`,
    wordSelected: 'match-word-selected',
  },
  cards: {
    root: 'cards-root',
    word: 'cards-word',
    prev: 'cards-prev',
    next: 'cards-next',
    say: 'cards-say',
    counter: 'cards-counter',
  },
  sounds: {
    root: 'sounds-root',
    play: 'sounds-play',
    option: (index: number) => `sounds-option-${index}`,
  },
  count: {
    root: 'count-root',
    stage: 'count-stage',
    option: (index: number) => `count-option-${index}`,
  },
  sort: {
    root: 'sort-root',
    item: 'sort-item',
    box: (categoryId: string) => `sort-box-${categoryId}`,
  },
  bubbles: {
    root: 'bubbles-root',
    stage: 'bubbles-stage',
    bubble: (index: number) => `bubbles-bubble-${index}`,
  },
  puzzle: {
    root: 'puzzle-root',
    slot: (id: string) => `puzzle-slot-${id}`,
    piece: (id: string) => `puzzle-piece-${id}`,
    guide: 'puzzle-guide',
    done: 'puzzle-done',
    together: 'puzzle-together-prompt',
  },
  practice: {
    root: 'practice-root',
    title: 'practice-title',
  },
  focus: {
    root: 'focus-root',
    card: 'focus-card',
    word: 'focus-word',
    phrase: 'focus-phrase',
    dots: 'focus-dots',
    nextWord: 'focus-next-word',
    done: 'focus-done',
  },
  cloze: {
    root: 'cloze-root',
    phrase: 'cloze-phrase',
    phaseSay: 'cloze-phase-say',
    phaseWait: 'cloze-phase-wait',
    phaseModel: 'cloze-phase-model',
    said: 'cloze-said',
    next: 'cloze-next',
  },
  temptation: {
    root: 'temptation-root',
    jar: 'temptation-jar',
    mic: 'temptation-mic',
    open: 'temptation-open',
    next: 'temptation-next',
  },
  receptive: {
    root: 'receptive-root',
    replay: 'receptive-replay',
    level: 'receptive-level',
    option: (index: number) => `receptive-option-${index}`,
  },
  pairs: {
    root: 'pairs-root',
    replay: 'pairs-replay',
    option: (index: number) => `pairs-option-${index}`,
  },
  combine: {
    root: 'combine-root',
    modifier: (index: number) => `combine-mod-${index}`,
    picture: (index: number) => `combine-pic-${index}`,
    phrase: 'combine-phrase',
  },
  speech: {
    root: 'speech-root',
    unsupported: 'speech-unsupported',
    mic: 'speech-mic',
    skip: 'speech-skip',
    say: 'speech-say',
    feedback: 'speech-feedback',
  },
  parent: {
    button: 'parent-button',
    gateQuestion: 'parent-gate-question',
    gateKey: (n: string | number) => `parent-gate-key-${n}`,
    gateClear: 'parent-gate-clear',
    gateOk: 'parent-gate-ok',
    gateBack: 'parent-gate-back',
    tab: (id: string) => `parent-tab-${id}`,
    settingsRate: (value: string | number) => `parent-settings-rate-${value}`,
    settingsNiqqud: 'parent-settings-niqqud',
    settingsSounds: 'parent-settings-sounds',
    settingsEffects: 'parent-settings-effects',
    settingsMusic: 'parent-settings-music',
    settingsMusicVol: (value: string | number) => `parent-settings-musicvol-${value}`,
    settingsVoice: 'parent-settings-voice',
    settingsReset: 'parent-settings-reset',
    settingsResetConfirm: 'parent-settings-reset-confirm',
    settingsExport: 'parent-settings-export',
    settingsImport: 'parent-settings-import',
    settingsImportMerge: 'parent-settings-import-merge',
    settingsImportReplace: 'parent-settings-import-replace',
    settingsLastBackup: 'parent-settings-lastbackup',
    settingsStorage: 'parent-settings-storage',
    recordCategory: 'parent-record-category',
    recordWord: (index: number) => `parent-record-word-${index}`,
    recordStart: 'parent-record-start',
    recordStop: 'parent-record-stop',
    recordPlay: 'parent-record-play',
    recordDelete: 'parent-record-delete',
    wordsAdd: 'parent-words-add',
    wordsInput: 'parent-words-input',
    wordsPhoto: 'parent-words-photo',
    wordsSave: 'parent-words-save',
    wordsItem: (id: string) => `parent-words-item-${id}`,
    wordsDelete: (id: string) => `parent-words-delete-${id}`,
    reportCategory: (id: string) => `parent-report-category-${id}`,
    reportHard: (index: number) => `parent-report-hard-${index}`,
    root: 'parent-root',
    toast: 'parent-toast',
  },
  ads: {
    reserved: 'ad-reserved',
    banner: 'ad-banner',
  },
  stickers: {
    root: 'stickers-root',
    filter: (key: string) => `stickers-filter-${key}`,
    item: (index: number) => `stickers-item-${index}`,
    counter: 'stickers-counter',
  },
  /** Dev-only, native-only (never rendered on web — see
   *  app/index.tsx and phase-03-plan.md Tier 3 test plan). Lets
   *  .maestro/persistence.yaml write a known value through TalkiStorage
   *  and assert it survives a real process kill (`stopApp` + relaunch),
   *  which a web page reload cannot prove. */
  devStorageProbe: {
    writeButton: 'dev-storage-probe-write',
    valueLabel: 'dev-storage-probe-value',
  },
  /** app/dev/audio-lab.tsx — a developer-only diagnostic screen, unlinked
   *  from any child-facing navigation (see phase-04-plan.md, "A diagnostic
   *  screen, deliberately unreachable"). Unlike devStorageProbe, this
   *  screen is NOT gated behind __DEV__/Platform.OS: Tier 2
   *  (audio-lab.spec.ts) exercises it through the real exported web bundle
   *  at all eight landscape viewports (tests/e2e/viewports.ts), so it has
   *  to actually render there. Its
   *  "developer-only" property comes entirely from no navigation ever
   *  linking to it, not from being absent from the bundle. */
  audioLab: {
    root: 'audio-lab-root',
    debugState: 'audio-lab-debug-state',
    unlockButton: 'audio-lab-unlock',
    musicButton: (key: string) => `audio-lab-music-${key}`,
    stopMusicButton: 'audio-lab-stop-music',
    stopAllButton: 'audio-lab-stop-all',
    toggleMusicEnabled: 'audio-lab-toggle-music-enabled',
    toggleSfxEnabled: 'audio-lab-toggle-sfx-enabled',
    setListeningToggle: 'audio-lab-set-listening',
    setSpeakingToggle: 'audio-lab-set-speaking',
    setVoicePromptToggle: 'audio-lab-set-voice-prompt',
    sfxButton: (event: string) => `audio-lab-sfx-${event.replace(/\./g, '-')}`,
    voiceButton: (label: string) => `audio-lab-voice-${label}`,
    voiceResultLabel: 'audio-lab-voice-result',
    recordStartButton: 'audio-lab-record-start',
    recordStopButton: 'audio-lab-record-stop',
    recordPlaybackButton: 'audio-lab-record-playback',
    recordStatusLabel: 'audio-lab-record-status',
    orientationLockButton: 'audio-lab-orientation-lock',
    orientationUnlockButton: 'audio-lab-orientation-unlock',
    orientationCurrentLabel: 'audio-lab-orientation-current',
    recognitionRunButton: 'audio-lab-recognition-run',
    recognitionResultLabel: 'audio-lab-recognition-result',
  },
  /** app/dev/gallery.tsx — a developer-only component gallery, unreachable
   *  from child navigation (see phase-05-plan.md "The gallery is a test
   *  surface, not documentation"). Renders every design-system primitive and
   *  shell component in every documented state, grouped into six sections
   *  that double as the Tier 2 screenshot-baseline and audit unit. */
  gallery: {
    root: 'gallery-root',
    group: (name: string) => `gallery-group-${name}`,
    typography: {
      rtlSample: 'gallery-typography-rtl-sample',
      rtlFirstChar: 'gallery-typography-rtl-first-char',
      rtlRest: 'gallery-typography-rtl-rest',
      fontProbeBody: 'gallery-typography-font-probe-body',
      fontProbeHeading: 'gallery-typography-font-probe-heading',
    },
    buttons: {
      primary: 'gallery-button-primary',
      secondary: 'gallery-button-secondary',
      ghost: 'gallery-button-ghost',
      disabled: 'gallery-button-disabled',
      icon: 'gallery-button-icon',
    },
    cards: {
      plain: 'gallery-card-plain',
      pressable: 'gallery-card-pressable',
      image: (categoryId: string) => `gallery-image-card-${categoryId}`,
    },
    progress: {
      bar: (pct: number) => `gallery-progress-${pct}`,
      pill: 'gallery-pill',
    },
    shell: {
      topBar: 'gallery-shell-topbar',
      sideNav: 'gallery-shell-side-nav',
      gameHeader: 'gallery-shell-game-header',
      parentGateOpenButton: 'gallery-shell-parent-gate-open',
      parentGate: 'gallery-shell-parent-gate',
      toastShowButton: 'gallery-shell-toast-show',
      toastHost: 'gallery-shell-toast-host',
      rewardOpenButton: 'gallery-shell-reward-open',
      rewardOverlay: 'gallery-shell-reward-overlay',
    },
    colors: {
      swatch: (name: string) => `gallery-color-swatch-${name}`,
    },
  },
  /**
   * app/dev/landscape-shell.tsx — Phase 18 non-production fixtures proving
   * the shared shell can compose Home / Games / Practice frames. Unreachable
   * from child navigation; exercised only by landscape-shell.spec.ts.
   */
  landscapeShell: {
    root: 'landscape-shell-root',
    frame: (name: 'home' | 'games' | 'practice') => `landscape-shell-frame-${name}`,
    topBar: (name: string) => `landscape-shell-topbar-${name}`,
    sideStart: (name: string) => `landscape-shell-side-start-${name}`,
    sideEnd: (name: string) => `landscape-shell-side-end-${name}`,
    grid: (name: string) => `landscape-shell-grid-${name}`,
    strip: 'landscape-shell-category-strip',
    hero: 'landscape-shell-hero',
    title: (name: string) => `landscape-shell-title-${name}`,
    pageIndicator: 'landscape-shell-page-indicator',
    switcher: (name: 'home' | 'games' | 'practice') => `landscape-shell-switch-${name}`,
  },
} as const;
