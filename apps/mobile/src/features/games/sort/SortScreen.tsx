import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
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
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { recordSeen, markLearned } = useProgressStore();
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const spoken = useRef<number | null>(null);
  const completeFired = useRef(false);
  /** Play-area-local box rects (relative to board), for geometry tests / future drag. */
  const boxLayouts = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const boardOrigin = useRef({ x: 0, y: 0 });
  const [state, dispatch] = useReducer(sortReducer, undefined, () => initialSort({} as TalkiSettings, seed));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __talkiSortCorrect?: string }).__talkiSortCorrect = state.correctCatId;
      (window as unknown as { __talkiSortBoxes?: typeof boxLayouts.current }).__talkiSortBoxes = boxLayouts.current;
    }
  }, [state.correctCatId, state.round]);

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

  const split = tokens.sortSplitLayout;
  const boxMin = tokens.sortBoxMinHeight;

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
      <View
        testID={testIds.sort.root}
        style={[
          styles.board,
          {
            gap: Math.max(8, tokens.gap - 2),
            paddingInline: tokens.padInline,
            flexDirection: split ? 'row' : 'column',
          },
        ]}
        onLayout={(e) => {
          const t = e.target as unknown as { measureInWindow?: (cb: (x: number, y: number) => void) => void };
          t.measureInWindow?.((x, y) => {
            boardOrigin.current = { x, y };
          });
        }}
      >
        <View style={[styles.prompt, { gap: Math.max(4, tokens.gap - 4), flex: split ? 1 : undefined }]}>
          <WordArt word={state.it} size={split ? '70%' : '88%'} />
          <TalkiText style={{ fontSize: tokens.gameTitleSize + 6 }}>{display(state.it.word, niqqud)}</TalkiText>
          <TalkiText align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
            לאיזו קופסה זה שייך?
          </TalkiText>
        </View>
        <View
          style={[
            styles.boxes,
            {
              gap: Math.max(8, tokens.gap - 2),
              flex: split ? 1.2 : undefined,
              flexDirection: split ? 'column' : 'row',
            },
          ]}
        >
          {state.boxes.map((box) => (
            <Pressable
              key={box.id}
              testID={testIds.sort.box(box.id)}
              accessibilityRole="button"
              accessibilityLabel={plain(box.title)}
              onPress={() => answer(box.id)}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                // Layout event x/y are relative to the boxes row — record board-local via window.
                const node = e.target as unknown as {
                  measureInWindow?: (cb: (wx: number, wy: number, w: number, h: number) => void) => void;
                };
                node.measureInWindow?.((wx, wy, w, h) => {
                  boxLayouts.current[box.id] = {
                    x: wx - boardOrigin.current.x,
                    y: wy - boardOrigin.current.y,
                    width: w || width,
                    height: h || height,
                  };
                  if (typeof window !== 'undefined') {
                    (window as unknown as { __talkiSortBoxes?: typeof boxLayouts.current }).__talkiSortBoxes =
                      boxLayouts.current;
                  }
                });
              }}
              style={[
                styles.box,
                shadowSm,
                { minHeight: boxMin, flex: split ? undefined : 1 },
                feedback === box.id && (box.id === state.correctCatId ? styles.ok : styles.bad),
              ]}
            >
              <TalkiText style={{ fontSize: Math.max(28, tokens.gameTitleSize + 12) }}>{box.icon}</TalkiText>
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
  board: { flex: 1, minHeight: 0, paddingBlock: 4, alignItems: 'stretch' },
  prompt: { alignItems: 'center', justifyContent: 'center', flexGrow: 1, minHeight: 0 },
  boxes: { justifyContent: 'center', flexShrink: 0 },
  box: {
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  ok: { borderColor: v3.green500 },
  bad: { borderColor: v3.pink500 },
});
