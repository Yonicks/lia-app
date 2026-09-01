/**
 * The single registry of test identifiers used across the native app.
 * Specs import from here rather than hardcoding strings, so a rename is a
 * one-file change instead of a grep-and-pray across every spec.
 */
export const testIds = {
  bootstrap: {
    root: 'bootstrap-root',
    title: 'bootstrap-title',
  },
  /** app/index.tsx + src/features/intro/ — the native opening sequence
   *  (phase-06-plan.md). `layer(id)` matches every `IntroLayerId` so a spec
   *  can assert on the exact same identifiers `layers.ts` exports. */
  intro: {
    root: 'intro-root',
    skipLayer: 'intro-skip-layer',
    layer: (id: string) => `intro-layer-${id}`,
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
   *  at all ten viewports, so it has to actually render there. Its
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
    orientationButton: (route: string) => `audio-lab-orientation-${route}`,
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
      bottomNav: 'gallery-shell-bottom-nav',
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
} as const;
