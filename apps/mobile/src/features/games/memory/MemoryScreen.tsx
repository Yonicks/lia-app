import { useCallback, useEffect, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { STAR_STEP } from '@/domain/progress/stars';
import type { TalkiCategory, TalkiSettings, WordStats } from '@/domain/types';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { makeRnd } from '../shell/e2eSeed';
import { GameShell } from '../shell/GameShell';
import { useGameSession, type GameSession } from '../shell/useGameSession';
import { MemoryCard } from './MemoryCard';
import { initMemory, memoryChips, memoryReducer, memoryResult, type MemoryState } from './memoryReducer';

export interface MemoryScreenProps {
  catId: string | null;
  seed?: number;
}

function initialMemory(category: TalkiCategory, stats: Record<string, WordStats>, settings: TalkiSettings, seed?: number): MemoryState {
  return initMemory({ category, stats, settings, rnd: makeRnd(seed) });
}

export function MemoryScreen({ catId, seed }: MemoryScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'memory', requestedCatId: catId });

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
        title="🃏 משחק זיכרון"
        chips={[]}
        done={false}
        result={{ score: 0, total: 0 }}
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

  return (
    <MemoryPlay key={`${session.category.id}:${session.epoch}`} category={session.category} session={session} seed={seed} />
  );
}

function MemoryPlay({
  category,
  session,
  seed,
}: {
  category: TalkiCategory;
  session: GameSession;
  seed?: number;
}) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const { stats, markLearned } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const completeFired = useRef(false);
  const [state, dispatch] = useReducer(memoryReducer, undefined, () => initialMemory(category, stats, settings, seed));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as unknown as { __talkiMemoryLayout?: { idx: number; pair: number; word: string }[] }).__talkiMemoryLayout =
      state.cards.map((c) => ({ idx: c.idx, pair: c.pair, word: c.it.word }));
  }, [state.cards]);

  useEffect(() => {
    if (state.done && !completeFired.current) {
      completeFired.current = true;
      session.audio.complete();
    }
  }, [state.done, session.audio]);

  const flip = useCallback(
    (idx: number) => {
      const card = state.cards[idx];
      if (!card || card.open || card.matched || state.locked) return;
      const willBeSecond = state.first !== null;
      dispatch({ type: 'FLIP', idx });
      void wordVoiceService.say(category.id, card.it.word);
      if (!willBeSecond) return;
      const first = state.cards[state.first!];
      if (first && first.pair === card.pair && first.idx !== card.idx) {
        session.audio.correct();
        void markLearned(category.id, card.it.word).then((r) => {
          if (r.added && r.size % STAR_STEP === 0) {
            /* celebrate is owned by GameShell via quiz; memory has no overlay hook here */
          }
        });
      } else {
        session.audio.wrong();
        session.schedule(900, () => dispatch({ type: 'CLOSE' }));
      }
    },
    [state, category.id, session, markLearned],
  );

  const cols = tokens.memoryColumns;

  return (
    <GameShell
      title="🃏 משחק זיכרון"
      chips={memoryChips(state)}
      done={state.done}
      result={memoryResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
      chipTestIDs={[testIds.memory.chipPairs]}
    >
      <View testID={testIds.memory.root} style={styles.grid}>
        {state.cards.map((card) => (
          <View key={card.idx} style={[styles.cell, { width: `${100 / cols}%`, padding: Math.max(2, tokens.gap / 3) }]}>
            <MemoryCard card={card} niqqud={settings.niqqud} onPress={() => flip(card.idx)} minSize={tokens.memoryCardMin} />
          </View>
        ))}
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 0,
  },
  cell: {
    aspectRatio: 1,
    maxHeight: '33%',
  },
});
