import { useEffect, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';
import { display } from '@/domain/vocabulary/niqqud';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { makeRnd } from '../../games/shell/e2eSeed';
import type { GameSession } from '../../games/shell/useGameSession';
import { PracticeGate } from '../PracticeGate';
import { CLOZE_WAIT_MS } from '../practiceTimings';
import { PracticeShell } from '../shell/PracticeShell';
import { clozeChips, clozeModelSpeech, clozeReducer, clozeResult, initCloze } from './clozeReducer';

function waitMs(): number {
  if (typeof window === 'undefined') return CLOZE_WAIT_MS;
  const o = (window as unknown as { __talkiClozeWaitMs?: number }).__talkiClozeWaitMs;
  return typeof o === 'number' ? o : CLOZE_WAIT_MS;
}

export function ClozeScreen({ catId, seed }: { catId: string | null; seed?: number }) {
  return (
    <PracticeGate modeId="cloze" catId={catId} title="⏸️ משלימים ביחד">
      {(session) => <ClozePlay session={session} seed={seed} />}
    </PracticeGate>
  );
}

function ClozePlay({ session, seed }: { session: GameSession; seed?: number }) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const catId = session.category!.id;
  const [state, dispatch] = useReducer(clozeReducer, undefined, () => initCloze(makeRnd(seed)));
  const spoken = useRef<number | null>(null);

  useEffect(() => {
    if (state.done || state.phase !== 'say') return;
    if (spoken.current === state.i) return;
    spoken.current = state.i;
    const it = state.pool[state.i];
    if (!it) return;
    const hold =
      typeof window !== 'undefined'
        ? (window as unknown as { __talkiClozeSayHoldMs?: number }).__talkiClozeSayHoldMs
        : undefined;
    const skipSay =
      typeof window !== 'undefined' &&
      (window as unknown as { __talkiClozeSkipSay?: boolean }).__talkiClozeSkipSay === true;
    const goWait = () => dispatch({ type: 'PHASE', phase: 'wait' });
    if (typeof hold === 'number' && hold > 0) {
      void wordVoiceService.say(catId, it.phrase, { core: true });
      session.schedule(hold, goWait);
      return;
    }
    if (skipSay) {
      void wordVoiceService.say(catId, it.phrase, { core: true });
      goWait();
      return;
    }
    void wordVoiceService.say(catId, it.phrase, { core: true }).then(goWait);
  }, [state.done, state.phase, state.i, state.pool, catId, session]);

  useEffect(() => {
    if (state.phase !== 'wait' || state.done) return;
    const id = session.schedule(waitMs(), () => {
      dispatch({ type: 'PHASE', phase: 'model' });
      const it = state.pool[state.i]!;
      void wordVoiceService.say(catId, clozeModelSpeech(it), { core: true });
    });
    return () => {
      session.cancel(id);
      wordVoiceService.cancel();
    };
  }, [state.phase, state.done, state.i, state.pool, session, catId]);

  useEffect(() => {
    if (state.done) session.audio.complete();
  }, [state.done, session.audio]);

  useEffect(() => () => wordVoiceService.cancel(), []);

  const it = state.pool[state.i];
  const phaseId =
    state.phase === 'wait' ? testIds.cloze.phaseWait : state.phase === 'model' ? testIds.cloze.phaseModel : testIds.cloze.phaseSay;
  const boardGap = Math.max(6, tokens.gap - 2);

  return (
    <PracticeShell
      title="⏸️ משלימים ביחד"
      chips={clozeChips(state)}
      done={state.done}
      result={clozeResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
    >
      <View
        testID={testIds.cloze.root}
        style={[
          styles.box,
          {
            gap: boardGap,
            paddingInline: tokens.padInline,
            paddingBlock: tokens.padBlock,
            maxWidth: tokens.cardsStageMaxWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
      >
        <TalkiText testID={testIds.cloze.phrase} align="center" style={{ fontSize: tokens.practicePhraseSize }}>
          {it ? display(it.phrase, niqqud) : ''}
        </TalkiText>
        <TalkiText testID={phaseId} align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
          {state.phase === 'wait' ? 'מחכים... תני לה חמש שניות שלמות' : state.phase === 'model' ? display(it?.answer ?? '', niqqud) : 'מקשיבים למשפט...'}
        </TalkiText>
        <View style={[styles.actions, { gap: boardGap }]}>
          <TalkiButton
            testID={testIds.cloze.said}
            label="✅ היא אמרה!"
            onPress={() => {
              wordVoiceService.cancel();
              session.audio.correct();
              dispatch({ type: 'NEXT', scored: true });
            }}
          />
          <TalkiButton
            testID={testIds.cloze.next}
            label="להמשיך"
            variant="secondary"
            onPress={() => {
              wordVoiceService.cancel();
              dispatch({ type: 'NEXT', scored: false });
            }}
          />
        </View>
        <TalkiText align="center" color={v3.textMuted} style={{ fontSize: tokens.subtitleSize }}>
          כל ניסיון נחשב — גם צליל, גם הברה אחת
        </TalkiText>
      </View>
    </PracticeShell>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
});
