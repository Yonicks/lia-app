import { useEffect, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { speechMatch } from '@/domain/speech/levenshtein';
import { display } from '@/domain/vocabulary/niqqud';
import { gamesMenuHref, homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { audioEngine } from '@/services/audio';
import { speechRecognitionService } from '@/services/speech/expoSpeechRecognition';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { PracticeGate } from '../../practice/PracticeGate';
import { initSpeech, speechChips, speechReducer, speechResult } from '../../practice/speech/speechReducer';
import { WordArt } from '../shell/WordArt';
import { GameShell } from '../shell/GameShell';
import { makeRnd } from '../shell/e2eSeed';
import type { GameSession } from '../shell/useGameSession';
import { isSpeechGameEnabled } from './speechFlag';

export function SpeechScreen({ catId, seed }: { catId: string | null; seed?: number }) {
  return (
    <PracticeGate modeId="speech" catId={catId} title="🎤 תגידי את זה">
      {(session) => <SpeechPlay session={session} seed={seed} />}
    </PracticeGate>
  );
}

function SpeechPlay({ session, seed }: { session: GameSession; seed?: number }) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { stats, markLearned, recordSeen } = useProgressStore();
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const spoken = useRef<number | null>(null);
  const [supported, setSupported] = useState<boolean | null>(() => (isSpeechGameEnabled() ? null : false));
  const [state, dispatch] = useReducer(speechReducer, undefined, () => {
    const next = initSpeech({
      category: session.category!,
      stats,
      settings: useSettingsStore.getState().settings,
      rnd: makeRnd(seed),
    });
    return isSpeechGameEnabled() ? next : { ...next, unsupported: true };
  });

  useEffect(() => {
    if (!isSpeechGameEnabled()) return undefined;
    let live = true;
    void speechRecognitionService.isSupported().then((ok) => {
      if (!live) return;
      setSupported(ok);
      if (!ok) dispatch({ type: 'UNSUPPORTED' });
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (state.done || state.unsupported || supported !== true) return;
    if (spoken.current === state.i) return;
    spoken.current = state.i;
    const it = state.pool[state.i];
    if (it) void wordVoiceService.say(session.category!.id, it.word, { core: true });
  }, [state.done, state.unsupported, state.i, state.pool, supported, session.category]);

  useEffect(() => {
    if (state.done) session.audio.complete();
  }, [state.done, session.audio]);

  const it = state.pool[state.i];

  const listen = async () => {
    if (state.listening || state.done) return;
    dispatch({ type: 'LISTEN', on: true });
    audioEngine.setListening(true);
    const result = await speechRecognitionService.recognizeOnce({ lang: 'he-IL', timeoutMs: 8000 });
    audioEngine.setListening(false);
    const heard = result.transcript ?? '';
    dispatch({ type: 'RESULT', heard });
    if (!it) return;
    const ok = speechMatch(heard, it.word);
    void recordSeen(session.category!.id, it.word, !ok);
    if (ok) {
      session.audio.correct();
      void markLearned(session.category!.id, it.word);
      session.schedule(1200, () => dispatch({ type: 'CLEAR_FEEDBACK' }));
    } else {
      session.audio.wrong();
    }
  };

  const padBottom = Math.max(tokens.padBlock, layout.safeInsets.bottom);

  return (
    <GameShell
      title="🎤 תגידי את זה"
      chips={speechChips(state)}
      done={state.done}
      result={speechResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
    >
      {state.unsupported || supported === false ? (
        <View testID={testIds.speech.unsupported} style={[styles.box, { gap: tokens.gap, padding: tokens.padInline, paddingBottom: padBottom }]}>
          <TalkiText align="center">
            הדפדפן הזה לא תומך בזיהוי דיבור. כדאי לנסות בכרום באנדרואיד או במחשב.
          </TalkiText>
          <TalkiButton label="חזרה למשחקים" onPress={() => push(gamesMenuHref)} />
        </View>
      ) : (
        <View
          testID={testIds.speech.root}
          style={[
            styles.box,
            {
              gap: Math.max(8, tokens.gap - 2),
              paddingInline: tokens.padInline,
              paddingBottom: padBottom,
              flexDirection: layout.deviceClass === 'tablet' || layout.deviceClass === 'largeTablet' ? 'row' : 'column',
              flexWrap: 'wrap',
            },
          ]}
        >
          <View style={[styles.prompt, { gap: Math.max(6, tokens.gap - 2) }]}>
            {it ? <WordArt word={it} size={tokens.speechArtSize} /> : null}
            {it ? <TalkiText style={{ fontSize: tokens.gameTitleSize + 4 }}>{display(it.word, niqqud)}</TalkiText> : null}
            <TalkiText testID={testIds.speech.feedback} align="center" style={{ fontSize: tokens.subtitleSize }}>
              {state.feedback || 'לוחצים על המיקרופון ואומרים את המילה'}
            </TalkiText>
          </View>
          <View style={[styles.row, { gap: Math.max(8, tokens.gap - 2) }]}>
            <TalkiButton
              testID={testIds.speech.say}
              label="🔊 לשמוע"
              onPress={() => it && void wordVoiceService.say(session.category!.id, it.word)}
            />
            <TalkiButton
              testID={testIds.speech.mic}
              label={state.listening ? 'מקשיבים...' : 'להגיד'}
              onPress={() => void listen()}
            />
            <TalkiButton testID={testIds.speech.skip} label="דלג" variant="secondary" onPress={() => dispatch({ type: 'SKIP' })} />
          </View>
        </View>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  prompt: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
});
