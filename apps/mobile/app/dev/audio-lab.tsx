import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { MUSIC_FILES, SFX_FILES, type MusicStateKey, type SfxEvent } from '@/domain/audio/audioPolicy';
import { CATEGORIES } from '@/domain/vocabulary/categories';
import { audioEngine, type AudioDebugState } from '@/services/audio';
import { orientationService } from '@/services/orientation';
import { recordingService } from '@/services/recording';
import { wordVoiceService, type VoiceSource } from '@/services/voice';
import { testIds } from '@/testing/testIds';

/**
 * Developer-only diagnostic screen — deliberately unreachable from any
 * child-facing navigation (phase-04-plan.md, "A diagnostic screen,
 * deliberately unreachable"). Exercises all five Phase 4 services: every
 * music state, every one of the 22 SFX events, each voice resolution step,
 * record-and-playback, the orientation policy, and the isolated speech
 * recognition POC's underlying capability.
 *
 * "does ducking work?" cannot be answered by a unit test and should not
 * require building a game first — this screen exists purely to make that
 * answerable, on both Tier 2 (this exact screen, through the real web
 * bundle, at all landscape viewports) and Tier 3 (a real device — see
 * docs/migration/phase-04-native-report.md).
 *
 * The orientation section exercises `OrientationService` directly
 * (lock/unlock/current) rather than a per-route policy — Phase 17 removed
 * the route-to-policy table since the whole app is landscape-only now
 * (docs/migration/phase-17-report.md).
 */

const MUSIC_KEYS = Object.keys(MUSIC_FILES) as MusicStateKey[];
const SFX_EVENTS = Object.keys(SFX_FILES) as SfxEvent[];

const DEMO_CAT = 'animals' as const;
const DEMO_WORD = CATEGORIES.animals.items[0].word;

function formatDebugState(state: AudioDebugState): string {
  return JSON.stringify(state, null, 2);
}

export default function AudioLab() {
  const [debugState, setDebugState] = useState<AudioDebugState>(() => audioEngine.debugState());
  const [voiceResult, setVoiceResult] = useState<string>('(not yet resolved)');
  const [recordStatus, setRecordStatus] = useState<string>('idle');
  const [orientationCurrent, setOrientationCurrent] = useState<string>('(unknown)');
  const [recognitionResult, setRecognitionResult] = useState<string>('(not yet run)');
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);

  const refreshDebugState = useCallback(() => {
    setDebugState(audioEngine.debugState());
  }, []);

  // Duck ramps and SFX pool occupancy change on their own timers inside
  // AudioEngineCore, independent of any button press — a diagnostic screen
  // that only ever shows a stale, click-time snapshot would defeat its own
  // purpose ("does ducking work?" needs to be watchable as it happens, not
  // just checkable a moment after). This is also what makes
  // debugState() readable from a Playwright spec a few hundred ms after a
  // toggle, rather than only in the same tick as the click.
  useEffect(() => {
    const id = setInterval(refreshDebugState, 100);
    return () => clearInterval(id);
  }, [refreshDebugState]);

  const handleUnlock = useCallback(async () => {
    await audioEngine.unlock();
    refreshDebugState();
  }, [refreshDebugState]);

  const handleMusic = useCallback(
    async (keyName: MusicStateKey | 'rewardScreen') => {
      await audioEngine.setMusicState(keyName);
      refreshDebugState();
    },
    [refreshDebugState]
  );

  const handleStopMusic = useCallback(async () => {
    await audioEngine.stopMusic();
    refreshDebugState();
  }, [refreshDebugState]);

  const handleStopAll = useCallback(async () => {
    await audioEngine.stopAll();
    refreshDebugState();
  }, [refreshDebugState]);

  const handleSfx = useCallback(
    (event: SfxEvent) => {
      audioEngine.playSfx(event);
      refreshDebugState();
    },
    [refreshDebugState]
  );

  const handleToggleMusicEnabled = useCallback(() => {
    audioEngine.setMusicEnabled(!debugState.enabled.music);
    refreshDebugState();
  }, [debugState.enabled.music, refreshDebugState]);

  const handleToggleSfxEnabled = useCallback(() => {
    audioEngine.setSfxEnabled(!debugState.enabled.sfx);
    refreshDebugState();
  }, [debugState.enabled.sfx, refreshDebugState]);

  const handleToggleListening = useCallback(() => {
    audioEngine.setListening(!debugState.duckFlags.listening);
    refreshDebugState();
  }, [debugState.duckFlags.listening, refreshDebugState]);

  const handleToggleSpeaking = useCallback(() => {
    audioEngine.setChildSpeaking(!debugState.duckFlags.speaking);
    refreshDebugState();
  }, [debugState.duckFlags.speaking, refreshDebugState]);

  const handleToggleVoicePrompt = useCallback(() => {
    audioEngine.setVoicePromptPlaying(!debugState.duckFlags.voicePrompt);
    refreshDebugState();
  }, [debugState.duckFlags.voicePrompt, refreshDebugState]);

  const handleResolveAndSpeak = useCallback(async () => {
    const source: VoiceSource = await wordVoiceService.resolve(DEMO_CAT, DEMO_WORD);
    setVoiceResult(JSON.stringify(source));
    await wordVoiceService.say(DEMO_CAT, DEMO_WORD, { core: true });
    refreshDebugState();
  }, [refreshDebugState]);

  const handleRecordStart = useCallback(async () => {
    try {
      setRecordStatus('recording…');
      await recordingService.start(DEMO_CAT, DEMO_WORD);
    } catch (e) {
      setRecordStatus(`start failed: ${(e as Error).message}`);
    }
  }, []);

  const handleRecordStop = useCallback(async () => {
    try {
      const { uri, durationMs } = await recordingService.stop();
      setLastRecordingUri(uri);
      setRecordStatus(`saved, ${durationMs}ms`);
    } catch (e) {
      setRecordStatus(`stop failed: ${(e as Error).message}`);
    }
  }, []);

  const handlePlayback = useCallback(async () => {
    if (!lastRecordingUri) {
      setRecordStatus('nothing recorded yet');
      return;
    }
    await wordVoiceService.say(DEMO_CAT, DEMO_WORD, { core: true });
  }, [lastRecordingUri]);

  const handleOrientationLock = useCallback(async () => {
    await orientationService.lockLandscape();
    const current = await orientationService.current();
    setOrientationCurrent(`lockLandscape() -> device reports: ${current}`);
  }, []);

  const handleOrientationUnlock = useCallback(async () => {
    await orientationService.unlock();
    const current = await orientationService.current();
    setOrientationCurrent(`unlock() -> device reports: ${current}`);
  }, []);

  const handleRunRecognitionPoc = useCallback(async () => {
    // Exercises the same underlying `expo-speech-recognition` capability
    // the isolated POC (src/services/speech/poc/heIlRecognitionPoc.ts)
    // explores — called directly here rather than by importing that file,
    // so the POC stays genuinely unreferenced by application code
    // (phase-04-plan.md, "The POC must not be imported by any application
    // code"; verified by grep in phase-04-report.md).
    try {
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        setRecognitionResult('unavailable: no recognizer on this device/browser');
        return;
      }
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setRecognitionResult(`permission-denied: ${permission.status}`);
        return;
      }
      setRecognitionResult('listening… (he-IL, single word)');
      ExpoSpeechRecognitionModule.start({ lang: 'he-IL', interimResults: false, continuous: false });
    } catch (e) {
      setRecognitionResult(`error: ${(e as Error).message}`);
    }
  }, []);

  return (
    <ScrollView style={styles.root} testID={testIds.audioLab.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Audio Lab (dev only, unlinked from navigation)</Text>

      <Section title="Unlock / debug state">
        <LabButton testID={testIds.audioLab.unlockButton} label="unlock()" onPress={handleUnlock} />
        <Text style={styles.debug} testID={testIds.audioLab.debugState}>
          {formatDebugState(debugState)}
        </Text>
      </Section>

      <Section title="Music states (10 + rewardScreen)">
        <View style={styles.row}>
          {MUSIC_KEYS.map((k) => (
            <LabButton key={k} testID={testIds.audioLab.musicButton(k)} label={k} onPress={() => handleMusic(k)} />
          ))}
          <LabButton
            testID={testIds.audioLab.musicButton('rewardScreen')}
            label="rewardScreen"
            onPress={() => handleMusic('rewardScreen')}
          />
        </View>
        <View style={styles.row}>
          <LabButton testID={testIds.audioLab.stopMusicButton} label="stopMusic()" onPress={handleStopMusic} />
          <LabButton testID={testIds.audioLab.stopAllButton} label="stopAll()" onPress={handleStopAll} />
          <LabButton
            testID={testIds.audioLab.toggleMusicEnabled}
            label={`music enabled: ${debugState.enabled.music}`}
            onPress={handleToggleMusicEnabled}
          />
        </View>
      </Section>

      <Section title="SFX (22 events)">
        <View style={styles.row}>
          {SFX_EVENTS.map((event) => (
            <LabButton
              key={event}
              testID={testIds.audioLab.sfxButton(event)}
              label={event}
              onPress={() => handleSfx(event)}
            />
          ))}
        </View>
        <View style={styles.row}>
          <LabButton
            testID={testIds.audioLab.toggleSfxEnabled}
            label={`sfx enabled: ${debugState.enabled.sfx}`}
            onPress={handleToggleSfxEnabled}
          />
        </View>
      </Section>

      <Section title="Ducking (voicePrompt / listening / speaking)">
        <View style={styles.row}>
          <LabButton
            testID={testIds.audioLab.setVoicePromptToggle}
            label={`voicePrompt: ${debugState.duckFlags.voicePrompt}`}
            onPress={handleToggleVoicePrompt}
          />
          <LabButton
            testID={testIds.audioLab.setListeningToggle}
            label={`listening: ${debugState.duckFlags.listening}`}
            onPress={handleToggleListening}
          />
          <LabButton
            testID={testIds.audioLab.setSpeakingToggle}
            label={`speaking: ${debugState.duckFlags.speaking}`}
            onPress={handleToggleSpeaking}
          />
        </View>
      </Section>

      <Section title={`Word voice resolution (demo word: ${DEMO_CAT}:${DEMO_WORD})`}>
        <LabButton
          testID={testIds.audioLab.voiceButton('resolve-and-speak')}
          label="resolve() + say({core:true})"
          onPress={handleResolveAndSpeak}
        />
        <Text style={styles.debug} testID={testIds.audioLab.voiceResultLabel}>
          {voiceResult}
        </Text>
      </Section>

      <Section title="Recording (4000ms cap, Phase 3 store)">
        <View style={styles.row}>
          <LabButton testID={testIds.audioLab.recordStartButton} label="start()" onPress={handleRecordStart} />
          <LabButton testID={testIds.audioLab.recordStopButton} label="stop()" onPress={handleRecordStop} />
          <LabButton testID={testIds.audioLab.recordPlaybackButton} label="play back" onPress={handlePlayback} />
        </View>
        <Text style={styles.debug} testID={testIds.audioLab.recordStatusLabel}>
          {recordStatus}
        </Text>
      </Section>

      <Section title="Orientation (app-wide landscape contract, Phase 17)">
        <View style={styles.row}>
          <LabButton
            testID={testIds.audioLab.orientationLockButton}
            label="lockLandscape()"
            onPress={handleOrientationLock}
          />
          <LabButton testID={testIds.audioLab.orientationUnlockButton} label="unlock()" onPress={handleOrientationUnlock} />
        </View>
        <Text style={styles.debug} testID={testIds.audioLab.orientationCurrentLabel}>
          {orientationCurrent}
        </Text>
      </Section>

      <Section title="Speech recognition (he-IL, single word) — same capability as the isolated POC">
        <LabButton
          testID={testIds.audioLab.recognitionRunButton}
          label="run recognition"
          onPress={handleRunRecognitionPoc}
        />
        <Text style={styles.debug} testID={testIds.audioLab.recognitionResultLabel}>
          {recognitionResult}
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LabButton({ testID, label, onPress }: { testID: string; label: string; onPress: () => void }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    padding: 12,
    gap: 12,
  },
  heading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
  },
  sectionTitle: {
    color: '#9cf',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 12,
  },
  debug: {
    color: '#8f8',
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
