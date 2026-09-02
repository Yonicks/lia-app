import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { STAR_STEP } from '@/domain/progress/stars';
import type { TalkiCategory, TalkiSettings, WordStats } from '@/domain/types';
import { homeHref } from '@/domain/navigation/routes';
import { display } from '@/domain/vocabulary/niqqud';
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
import { initMatch, matchChips, matchReducer, matchResult, type MatchState } from './matchReducer';

export interface MatchScreenProps {
  catId: string | null;
  seed?: number;
}

function initialMatch(category: TalkiCategory, stats: Record<string, WordStats>, settings: TalkiSettings, seed?: number): MatchState {
  return initMatch({ category, stats, settings, rnd: makeRnd(seed) });
}

export function MatchScreen({ catId, seed }: MatchScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'match', requestedCatId: catId });

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
        title="🔗 חיבורים"
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

  return <MatchPlay key={`${session.category.id}:${session.epoch}`} category={session.category} session={session} seed={seed} />;
}

function MatchPlay({
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
  const { stats, recordSeen, markLearned } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [wrongWord, setWrongWord] = useState<string | null>(null);
  const completeFired = useRef(false);
  const [state, dispatch] = useReducer(matchReducer, undefined, () => initialMatch(category, stats, settings, seed));

  useEffect(() => {
    if (state.done && !completeFired.current) {
      completeFired.current = true;
      session.audio.complete();
    }
  }, [state.done, session.audio]);

  const pickLeft = useCallback(
    (word: string) => {
      if (state.matched.includes(word)) return;
      dispatch({ type: 'SELECT_WORD', word });
      void wordVoiceService.say(category.id, word);
    },
    [state.matched, category.id],
  );

  const pickRight = useCallback(
    (word: string) => {
      if (!state.sel) {
        session.showToast('קודם בוחרים מילה');
        return;
      }
      if (state.matched.includes(word)) return;
      const ok = word === state.sel;
      void recordSeen(category.id, state.sel, !ok);
      if (ok) {
        const willComplete = state.matched.length + 1 === state.words.length;
        dispatch({ type: 'SELECT_PICTURE', word });
        void markLearned(category.id, word).then((r) => {
          if (r.added && r.size % STAR_STEP === 0) setCelebrate(`${r.size} מילים!`);
        });
        if (willComplete) {
          completeFired.current = true;
          session.audio.complete();
        } else {
          session.audio.correctMatch();
        }
      } else {
        session.audio.invalidMove();
        setWrongWord(word);
        session.schedule(420, () => setWrongWord(null));
      }
    },
    [state, session, category.id, recordSeen, markLearned],
  );

  return (
    <GameShell
      title="🔗 חיבורים"
      chips={matchChips(state)}
      done={state.done}
      result={matchResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={celebrate}
      onDismissCelebrate={() => setCelebrate(null)}
    >
      <View testID={testIds.match.root} style={styles.board}>
        <TalkiText align="center" color={v3.textSecondary}>
          לוחצים על מילה, ואז על התמונה שמתאימה לה
        </TalkiText>
        <View style={styles.cols}>
          <View style={styles.col}>
            {state.words.map((it, index) => {
              const done = state.matched.includes(it.word);
              const sel = state.sel === it.word;
              return (
                <Pressable
                  key={`L-${it.word}`}
                  testID={testIds.match.word(index)}
                  accessibilityRole="button"
                  accessibilityLabel={display(it.word, settings.niqqud)}
                  accessibilityState={{ selected: sel, disabled: done }}
                  onPress={() => pickLeft(it.word)}
                  style={[styles.item, shadowSm, done && styles.done, sel && styles.sel]}
                >
                  {sel ? <TalkiText testID={testIds.match.wordSelected} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }} /> : null}
                  <TalkiText weight="extrabold" align="center">
                    {display(it.word, settings.niqqud)}
                  </TalkiText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.col}>
            {state.pictures.map((it, index) => {
              const done = state.matched.includes(it.word);
              return (
                <Pressable
                  key={`R-${it.word}`}
                  testID={testIds.match.picture(index)}
                  accessibilityRole="button"
                  accessibilityLabel={display(it.word, settings.niqqud)}
                  accessibilityState={{ disabled: done }}
                  onPress={() => pickRight(it.word)}
                  style={[styles.item, shadowSm, done && styles.done, wrongWord === it.word && styles.wrong]}
                >
                  <WordArt word={it} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    paddingInline: 14,
    paddingBlock: 8,
    gap: 12,
  },
  cols: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  col: {
    flex: 1,
    gap: 10,
  },
  item: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  sel: {
    borderColor: v3.purple600,
  },
  done: {
    opacity: 0.45,
  },
  wrong: {
    borderColor: v3.pink500,
  },
});
