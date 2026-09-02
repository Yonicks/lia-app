import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import type { TalkiCategory } from '@/domain/types';
import { display } from '@/domain/vocabulary/niqqud';
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
import { BUBBLE_TOTAL, bubblesChips, bubblesReducer, bubblesResult, initBubbles } from './bubblesReducer';
import { useBubbleSpawner } from './useBubbleSpawner';

export interface BubblesScreenProps {
  catId: string | null;
  seed?: number;
}

export function BubblesScreen({ catId, seed }: BubblesScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'bubbles', requestedCatId: catId });

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
        title="🫧 בועות מילים"
        chips={[]}
        done={false}
        result={{ score: 0, total: BUBBLE_TOTAL }}
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
    <BubblesPlay key={`${session.category.id}:${session.epoch}`} category={session.category} session={session} seed={seed} />
  );
}

function BubblesPlay({
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
  const { markLearned } = useProgressStore();
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const completeFired = useRef(false);
  const rnd = useRef(makeRnd(seed));
  const [state, dispatch] = useReducer(bubblesReducer, undefined, initBubbles);

  const spawn = useCallback(() => {
    if (!category.items.length) return;
    const word = category.items[Math.floor(rnd.current() * category.items.length)]!;
    dispatch({ type: 'SPAWN', word, rnd: rnd.current });
  }, [category.items]);

  useBubbleSpawner(!state.done, spawn);

  useEffect(() => {
    if (state.done && !completeFired.current) {
      completeFired.current = true;
      session.audio.complete();
    }
  }, [state.done, session.audio]);

  const pop = useCallback(
    (id: number) => {
      const bubble = state.live.find((b) => b.id === id);
      if (!bubble) return;
      dispatch({ type: 'POP', id });
      void wordVoiceService.say(category.id, bubble.word.word);
      void markLearned(category.id, bubble.word.word);
      if (state.popped + 1 < state.total) session.audio.correct();
      session.schedule(bubble.duration * 1000 + 300, () => dispatch({ type: 'EXPIRE', id }));
    },
    [state.live, state.popped, state.total, category.id, markLearned, session],
  );

  return (
    <GameShell
      title="🫧 בועות מילים"
      chips={bubblesChips(state)}
      done={state.done}
      result={bubblesResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
    >
      <View testID={testIds.bubbles.root} style={styles.board}>
        <TalkiText align="center" color={v3.textSecondary}>
          לוחצים על הבועות כדי לפוצץ ולשמוע את המילה
        </TalkiText>
        <View testID={testIds.bubbles.stage} style={styles.stage}>
          {state.live.map((b) => (
            <Pressable
              key={b.id}
              testID={testIds.bubbles.bubble(b.id)}
              accessibilityRole="button"
              accessibilityLabel={display(b.word.word, niqqud)}
              onPress={() => pop(b.id)}
              style={[
                styles.bubble,
                {
                  width: b.size,
                  height: b.size,
                  insetInlineStart: `${b.start}%`,
                  animationDuration: `${b.duration}s`,
                } as never,
              ]}
            >
              <WordArt word={b.word} size="56%" />
              <TalkiText align="center">{display(b.word.word, niqqud)}</TalkiText>
            </Pressable>
          ))}
        </View>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, paddingInline: 10, paddingBlock: 8, gap: 8 },
  stage: { flex: 1, position: 'relative', overflow: 'hidden' },
  bubble: {
    position: 'absolute',
    bottom: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
});
