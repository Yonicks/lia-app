import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';
import type { TalkiCategory } from '@/domain/types';
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
import { BubbleView } from './BubbleView';
import type { BubbleStageBounds } from './bubbleSpawn';
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
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { markLearned } = useProgressStore();
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const completeFired = useRef(false);
  const rnd = useRef(makeRnd(seed));
  const initialW = layout.usableWidth;
  const initialH = Math.max(120, layout.usableHeight * 0.55);
  const stageRef = useRef<BubbleStageBounds>({
    width: initialW,
    height: initialH,
    sizeMin: tokens.bubbleSizeMin,
    sizeMax: tokens.bubbleSizeMax,
  });
  const [stageSize, setStageSize] = useState({ width: initialW, height: initialH });
  const [state, dispatch] = useReducer(bubblesReducer, undefined, initBubbles);

  const spawn = useCallback(() => {
    if (typeof window !== 'undefined' && (window as unknown as { __talkiBubblesFreeze?: boolean }).__talkiBubblesFreeze) {
      return;
    }
    if (!category.items.length) return;
    const word = category.items[Math.floor(rnd.current() * category.items.length)]!;
    dispatch({
      type: 'SPAWN',
      word,
      rnd: rnd.current,
      stage: {
        ...stageRef.current,
        sizeMin: tokens.bubbleSizeMin,
        sizeMax: tokens.bubbleSizeMax,
      },
    });
  }, [category.items, tokens.bubbleSizeMin, tokens.bubbleSizeMax]);

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
      <View testID={testIds.bubbles.root} style={[styles.board, { gap: Math.max(4, tokens.gap - 4), paddingInline: tokens.padInline }]}>
        <TalkiText align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
          לוחצים על הבועות כדי לפוצץ ולשמוע את המילה
        </TalkiText>
        <View
          testID={testIds.bubbles.stage}
          style={styles.stage}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            stageRef.current = {
              width,
              height,
              sizeMin: tokens.bubbleSizeMin,
              sizeMax: tokens.bubbleSizeMax,
            };
            setStageSize({ width, height });
          }}
        >
          {state.live.map((b) => (
            <BubbleView
              key={b.id}
              bubble={b}
              stageHeight={stageSize.height}
              niqqud={niqqud}
              onPop={() => pop(b.id)}
              onExpire={() => dispatch({ type: 'EXPIRE', id: b.id })}
            />
          ))}
        </View>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, minHeight: 0, paddingBlock: 4 },
  stage: { flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' },
});
