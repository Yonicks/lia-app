import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { NUM_WORDS } from '@/domain/games/numWords';
import { STAR_STEP } from '@/domain/progress/stars';
import type { TalkiCategory, TalkiSettings, WordStats } from '@/domain/types';
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
import { COUNT_ROUNDS, countChips, countReducer, countResult, initCount, setupCountRound } from './countReducer';

export interface CountScreenProps {
  catId: string | null;
  seed?: number;
}

function initialCount(category: TalkiCategory, stats: Record<string, WordStats>, settings: TalkiSettings, seed?: number) {
  return initCount({ category, stats, settings, rnd: makeRnd(seed) });
}

export function CountScreen({ catId, seed }: CountScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'count', requestedCatId: catId });

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
        title="🔢 כמה יש?"
        chips={[]}
        done={false}
        result={{ score: 0, total: COUNT_ROUNDS }}
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

  return <CountPlay key={`${session.category.id}:${session.epoch}`} category={session.category} session={session} seed={seed} />;
}

function CountPlay({
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
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<number | null>(null);
  const spoken = useRef<number | null>(null);
  const completeFired = useRef(false);
  const [state, dispatch] = useReducer(countReducer, undefined, () => initialCount(category, stats, settings, seed));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __talkiCountN?: number }).__talkiCountN = state.n;
    }
  }, [state.n]);

  useEffect(() => {
    if (state.done) return;
    if (spoken.current === state.round) return;
    spoken.current = state.round;
    void wordVoiceService.say(category.id, `כַּמָּה ${state.it.word} יֵשׁ?`, { core: true });
  }, [state.done, state.round, state.it.word, category.id]);

  useEffect(() => {
    if (state.done && !completeFired.current) {
      completeFired.current = true;
      session.audio.complete();
    }
  }, [state.done, session.audio]);

  const answer = useCallback(
    (n: number) => {
      if (!session.tryLock()) return;
      const ok = n === state.n;
      dispatch({ type: 'ANSWER', n });
      setFeedback(n);
      if (ok) {
        session.audio.correct();
        void wordVoiceService.say(category.id, `${plain(NUM_WORDS[state.n] ?? '')} ${plain(state.it.word)}`, {
          core: true,
        });
        void markLearned(category.id, state.it.word).then((r) => {
          if (r.added && r.size % STAR_STEP === 0) setCelebrate(`${r.size} מילים!`);
        });
        session.schedule(1300, () => {
          const next = setupCountRound(
            { category, stats, settings, rnd: makeRnd(seed) },
            state.round + 1,
            state.score + 1,
          );
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
    [session, state.n, state.it.word, state.round, state.score, category, stats, settings, seed, markLearned],
  );

  return (
    <GameShell
      title="🔢 כמה יש?"
      chips={countChips(state)}
      done={state.done}
      result={countResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={celebrate}
      onDismissCelebrate={() => setCelebrate(null)}
    >
      <View testID={testIds.count.root} style={styles.board}>
        <TalkiText align="center" color={v3.textSecondary}>
          {`כמה ${display(state.it.word, settings.niqqud)} יש כאן?`}
        </TalkiText>
        <View testID={testIds.count.stage} style={styles.stage}>
          {Array.from({ length: state.n }, (_, i) => (
            <View key={i} style={styles.pic}>
              <WordArt word={state.it} size="80%" />
            </View>
          ))}
        </View>
        <View style={styles.grid}>
          {state.options.map((n, index) => (
            <Pressable
              key={`${state.round}:${n}`}
              testID={testIds.count.option(index)}
              accessibilityRole="button"
              accessibilityLabel={String(n)}
              onPress={() => answer(n)}
              style={[styles.opt, shadowSm, feedback === n && (n === state.n ? styles.ok : styles.bad)]}
            >
              <TalkiText style={styles.num}>{n}</TalkiText>
            </Pressable>
          ))}
        </View>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, paddingInline: 14, paddingBlock: 8, gap: 10 },
  stage: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flexGrow: 1,
    minHeight: 80,
  },
  pic: { flex: 1, maxWidth: 96, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  opt: {
    flex: 1,
    minHeight: 72,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  num: { fontSize: 32 },
  ok: { borderColor: v3.green500 },
  bad: { borderColor: v3.pink500 },
});
