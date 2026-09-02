import { useEffect, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { display } from '@/domain/vocabulary/niqqud';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { audioEngine } from '@/services/audio';
import { speechRecognitionService } from '@/services/speech/expoSpeechRecognition';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../../games/shell/WordArt';
import { GameShell } from '../../games/shell/GameShell';
import { makeRnd } from '../../games/shell/e2eSeed';
import type { GameSession } from '../../games/shell/useGameSession';
import { PracticeGate } from '../PracticeGate';
import { TEMPTATION_LISTEN_MS } from '../practiceTimings';
import {
  initTemptation,
  temptationChips,
  temptationOpensOnRecognition,
  temptationReducer,
  temptationResult,
} from './temptationReducer';

function listenMs(): number {
  if (typeof window === 'undefined') return TEMPTATION_LISTEN_MS;
  const o = (window as unknown as { __talkiTemptListenMs?: number }).__talkiTemptListenMs;
  return typeof o === 'number' ? o : TEMPTATION_LISTEN_MS;
}

export function TemptationScreen({ catId, seed }: { catId: string | null; seed?: number }) {
  return (
    <PracticeGate modeId="temptation" catId={catId} title="🫙 הצנצנת">
      {(session) => <TemptationPlay session={session} seed={seed} />}
    </PracticeGate>
  );
}

function TemptationPlay({ session, seed }: { session: GameSession; seed?: number }) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const { stats, markLearned } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const spoken = useRef<number | null>(null);
  const [state, dispatch] = useReducer(temptationReducer, undefined, () =>
    initTemptation({ category: session.category!, stats, settings, rnd: makeRnd(seed) }),
  );
  const it = state.pool[state.i];

  useEffect(() => {
    if (state.done || state.opened) return;
    if (spoken.current === state.i) return;
    spoken.current = state.i;
    void wordVoiceService.say(session.category!.id, 'מָה יֵשׁ בַּצִּנְצֶנֶת?', { core: true });
  }, [state.done, state.opened, state.i, session.category]);

  useEffect(() => {
    if (state.done) session.audio.complete();
  }, [state.done, session.audio]);

  const open = () => {
    dispatch({ type: 'OPEN' });
    session.audio.correct();
    if (it) {
      void markLearned(session.category!.id, it.word);
      void wordVoiceService.say(session.category!.id, it.word);
    }
  };

  const listen = async () => {
    dispatch({ type: 'LISTEN', on: true });
    audioEngine.setListening(true);
    const supported = await speechRecognitionService.isSupported();
    if (!supported) {
      session.showToast('אין זיהוי דיבור בדפדפן הזה — אפשר ללחוץ "לפתוח"');
      dispatch({ type: 'LISTEN', on: false });
      audioEngine.setListening(false);
      return;
    }
    let timedOut = false;
    const id = session.schedule(listenMs(), () => {
      timedOut = true;
      speechRecognitionService.abort();
      dispatch({ type: 'LISTEN', on: false });
      audioEngine.setListening(false);
    });
    const result = await speechRecognitionService.recognizeOnce({ lang: 'he-IL', timeoutMs: listenMs() });
    session.cancel(id);
    audioEngine.setListening(false);
    if (!timedOut && temptationOpensOnRecognition(result)) open();
    else dispatch({ type: 'LISTEN', on: false });
  };

  return (
    <GameShell
      title="🫙 הצנצנת"
      chips={temptationChips(state)}
      done={state.done}
      result={temptationResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
    >
      <View testID={testIds.temptation.root} style={styles.box}>
        <TalkiText align="center">{state.opened ? 'נפתח!' : 'רואים מה יש בפנים? צריך להגיד כדי לפתוח'}</TalkiText>
        <View testID={testIds.temptation.jar} style={styles.jar}>
          <TalkiText style={styles.emoji}>{state.opened ? '' : '🫙'}</TalkiText>
        </View>
        {state.opened && it ? <WordArt word={it} /> : null}
        {state.opened && it ? <TalkiText>{display(it.word, settings.niqqud)}</TalkiText> : null}
        {state.opened ? (
          <TalkiButton testID={testIds.temptation.next} label="הצנצנת הבאה" onPress={() => dispatch({ type: 'NEXT' })} />
        ) : (
          <View style={styles.row}>
            <TalkiButton testID={testIds.temptation.mic} label={state.listening ? 'מקשיבים...' : 'להקשיב'} onPress={() => void listen()} />
            <TalkiButton testID={testIds.temptation.open} label="👐 לפתוח" variant="secondary" onPress={open} />
          </View>
        )}
        <TalkiText align="center" color={v3.textMuted}>
          כל ניסיון פותח: מילה, הברה, קול או הצבעה
        </TalkiText>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  jar: { minHeight: 80, alignItems: 'center' },
  emoji: { fontSize: 64 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
});
