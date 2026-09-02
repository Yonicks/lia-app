import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { STAR_STEP } from '@/domain/progress/stars';
import type { TalkiSettings } from '@/domain/types';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { makeRnd } from '../shell/e2eSeed';
import { GameShell } from '../shell/GameShell';
import { WordArt } from '../shell/WordArt';
import { useGameSession, type GameSession } from '../shell/useGameSession';
import { initSort, setupSortRound, sortChips, sortReducer, sortResult, SORT_ROUNDS } from './sortReducer';

export interface SortScreenProps {
  catId: string | null;
  seed?: number;
}

function initialSort(_settings: TalkiSettings, seed?: number) {
  return initSort(makeRnd(seed));
}

export function SortScreen({ catId, seed }: SortScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'sort', requestedCatId: catId });

  useEffect(() => {
    if (session.failed) {
      const t = setTimeout(() => push(homeHref), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [session.failed, push]);

  if (!session.ready || !session.category) {
    return (
      <GameShell
        title="📦 לאיזו קופסה?"
        chips={[]}
        done={false}
        result={{ score: 0, total: SORT_ROUNDS }}
        onBack={goBack}
        onReplay={session.restart}
        onHome={() => push(homeHref)}
        toast={session.toast}
        onDismissToast={session.dismissToast}
        celebrateMessage={null}
        onDismissCelebrate={() => undefined}
      >
        {null}
      </GameShell>
    );
  }

  return <SortPlay key={`${session.category.id}:${session.epoch}`} session={session} seed={seed} />;
}

function SortPlay({ session, seed }: { session: GameSession; seed?: number }) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const { recordSeen, markLearned } = useProgressStore();
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const spoken = useRef<number | null>(null);
  const completeFired = useRef(false);
  const [state, dispatch] = useReducer(sortReducer, undefined, () => initialSort({} as TalkiSettings, seed));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __talkiSortCorrect?: string }).__talkiSortCorrect = state.correctCatId;
    }
  }, [state.correctCatId]);

  useEffect(() => {
    if (state.done) return;
    if (spoken.current === state.round) return;
    spoken.current = state.round;
    void wordVoiceService.say(state.correctCatId, state.it.word);
  }, [state.done, state.round, state.correctCatId, state.it.word]);

  useEffect(() => {
    if (state.done && !completeFired.current) {
      completeFired.current = true;
      session.audio.complete();
    }
  }, [state.done, session.audio]);

  const answer = useCallback(
    (boxId: string) => {
      if (!session.tryLock()) return;
      const ok = boxId === state.correctCatId;
      dispatch({ type: 'ANSWER', boxId });
      void recordSeen(state.correctCatId, state.it.word, !ok);
      setFeedback(boxId);
      if (ok) {
        session.audio.correctMatch();
        void wordVoiceService.say(state.correctCatId, state.it.word);
        void markLearned(state.correctCatId, state.it.word).then((r) => {
          if (r.added && r.size % STAR_STEP === 0) setCelebrate(`${r.size} מילים!`);
        });
        session.schedule(1100, () => {
          const next = setupSortRound(makeRnd(seed), state.round + 1, state.score + 1);
          dispatch({ type: 'ADVANCE', next });
          setFeedback(null);
          session.unlock();
        });
      } else {
        session.audio.wrong();
        session.schedule(420, () => {
          dispatch({ type: 'UNLOCK' });
          setFeedback(null);
          session.unlock();
        });
      }
    },
    [session, state.correctCatId, state.it.word, state.round, state.score, seed, recordSeen, markLearned],
  );

  return (
    <GameShell
      title="📦 לאיזו קופסה?"
      chips={sortChips(state)}
      done={state.done}
      result={sortResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={celebrate}
      onDismissCelebrate={() => setCelebrate(null)}
    >
      <View testID={testIds.sort.root} style={styles.board}>
        <View style={styles.prompt}>
          <WordArt word={state.it} size="88%" />
          <TalkiText style={styles.word}>{display(state.it.word, niqqud)}</TalkiText>
          <TalkiText align="center" color={v3.textSecondary}>
            לאיזו קופסה זה שייך?
          </TalkiText>
        </View>
        <View style={styles.boxes}>
          {state.boxes.map((box) => (
            <Pressable
              key={box.id}
              testID={testIds.sort.box(box.id)}
              accessibilityRole="button"
              accessibilityLabel={plain(box.title)}
              onPress={() => answer(box.id)}
              style={[
                styles.box,
                shadowSm,
                feedback === box.id && (box.id === state.correctCatId ? styles.ok : styles.bad),
              ]}
            >
              <TalkiText style={styles.icon}>{box.icon}</TalkiText>
              <TalkiText align="center">{display(box.title, niqqud)}</TalkiText>
            </Pressable>
          ))}
        </View>
        <View testID={testIds.sort.item} accessibilityLabel={plain(state.it.word)} />
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, paddingInline: 14, paddingBlock: 8, gap: 12 },
  prompt: { alignItems: 'center', gap: 6, flexGrow: 1, justifyContent: 'center' },
  word: { fontSize: 28 },
  boxes: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  box: {
    flex: 1,
    minHeight: 96,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  icon: { fontSize: 36 },
  ok: { borderColor: v3.green500 },
  bad: { borderColor: v3.pink500 },
  sr: { position: 'absolute', width: 1, height: 1, overflow: 'hidden' },
});
