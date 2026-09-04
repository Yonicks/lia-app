import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { STAR_STEP } from '@/domain/progress/stars';
import type { TalkiCategory, TalkiSettings, WordStats } from '@/domain/types';
import { homeHref } from '@/domain/navigation/routes';
import { plain } from '@/domain/vocabulary/niqqud';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { makeRnd, readE2ESeed } from '../shell/e2eSeed';
import { GameShell } from '../shell/GameShell';
import { WordArt } from '../shell/WordArt';
import { useGameSession, type GameSession } from '../shell/useGameSession';
import { initSounds, soundsChips, soundsReducer, soundsResult } from './soundsReducer';

export interface SoundsScreenProps {
  catId: string | null;
  seed?: number;
}

function e2ePlaceCorrectAt(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = (window as unknown as { __talkiPlaceCorrectAt?: number }).__talkiPlaceCorrectAt;
  return typeof raw === 'number' ? raw : undefined;
}

function initialSounds(category: TalkiCategory, stats: Record<string, WordStats>, settings: TalkiSettings, seed?: number) {
  return initSounds({ category, stats, settings, rnd: makeRnd(seed) }, e2ePlaceCorrectAt());
}

export function SoundsScreen({ catId, seed }: SoundsScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'sounds', requestedCatId: catId, fixedCatId: 'animals' });

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
        title="🐮 מי אמר את זה?"
        chips={[]}
        done={false}
        result={{ score: 0, total: 6 }}
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
    <SoundsPlay key={`${session.category.id}:${session.epoch}`} category={session.category} session={session} seed={seed} />
  );
}

function SoundsPlay({
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
  const { stats, recordSeen, markLearned } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ word: string; ok: boolean } | null>(null);
  const spoken = useRef<number | null>(null);
  const completeFired = useRef(false);
  const [state, dispatch] = useReducer(soundsReducer, undefined, () => initialSounds(category, stats, settings, seed));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __talkiSoundsTarget?: string }).__talkiSoundsTarget = state.target.word;
    }
  }, [state.target.word]);

  useEffect(() => {
    if (state.done || !state.target.sound) return;
    if (spoken.current === state.i) return;
    spoken.current = state.i;
    void wordVoiceService.say('animals', state.target.sound, { core: true });
  }, [state.done, state.target.sound, state.i]);

  useEffect(() => {
    if (state.done && !completeFired.current) {
      completeFired.current = true;
      session.audio.complete();
    }
  }, [state.done, session.audio]);

  const replay = useCallback(() => {
    if (!state.target.sound) return;
    void wordVoiceService.say('animals', state.target.sound, { core: true });
  }, [state.target.sound]);

  const answer = useCallback(
    (word: string) => {
      if (!session.tryLock()) return;
      const ok = word === state.target.word;
      dispatch({ type: 'ANSWER', word });
      void recordSeen('animals', state.target.word, !ok);
      setFeedback({ word, ok });
      if (ok) {
        session.audio.correct();
        void wordVoiceService.say('animals', state.target.word);
        void markLearned('animals', word).then((r) => {
          if (r.added && r.size % STAR_STEP === 0) setCelebrate(`${r.size} מילים!`);
        });
        session.schedule(1100, () => {
          dispatch({ type: 'ADVANCE', rnd: makeRnd(seed ?? readE2ESeed()), placeCorrectAt: e2ePlaceCorrectAt() });
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
    [session, state.target.word, markLearned, recordSeen, seed],
  );

  const split = tokens.soundsSplitLayout;
  const optMin = tokens.soundsOptionMin;

  return (
    <GameShell
      title="🐮 מי אמר את זה?"
      chips={state.pool.length ? soundsChips(state) : []}
      done={state.done && state.pool.length > 0}
      result={soundsResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={celebrate}
      onDismissCelebrate={() => setCelebrate(null)}
    >
      <View
        testID={testIds.sounds.root}
        style={[
          styles.board,
          {
            gap: Math.max(6, tokens.gap - 2),
            paddingInline: tokens.padInline,
            flexDirection: split ? 'row' : 'column',
            alignItems: split ? 'center' : 'stretch',
          },
        ]}
      >
        <View style={[styles.prompt, { gap: Math.max(6, tokens.gap - 2) }]}>
          <TalkiText align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
            איזו חיה עושה את הקול הזה?
          </TalkiText>
          <TalkiButton testID={testIds.sounds.play} label="🔊 לשמוע שוב" variant="secondary" onPress={replay} />
        </View>
        <View
          style={[
            styles.grid,
            {
              gap: Math.max(6, tokens.gap - 2),
              flexWrap: split ? 'nowrap' : 'wrap',
            },
          ]}
        >
          {state.options.map((opt, index) => (
            <Pressable
              key={`${state.i}:${opt.word}`}
              testID={testIds.sounds.option(index)}
              accessibilityRole="button"
              accessibilityLabel={plain(opt.word)}
              onPress={() => answer(opt.word)}
              style={[
                styles.opt,
                shadowSm,
                {
                  minWidth: optMin,
                  minHeight: optMin,
                  maxWidth: split ? optMin + 24 : undefined,
                  flexGrow: split ? 0 : 1,
                  flexBasis: split ? optMin : 100,
                },
                feedback?.word === opt.word && feedback.ok && styles.ok,
                feedback?.word === opt.word && !feedback.ok && styles.bad,
              ]}
            >
              <WordArt word={opt} />
            </Pressable>
          ))}
        </View>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, minHeight: 0, paddingBlock: 4 },
  prompt: { alignItems: 'center', zIndex: 2, flexShrink: 0 },
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    flex: 1,
    minHeight: 0,
  },
  opt: {
    aspectRatio: 1,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  ok: { borderColor: v3.green500 },
  bad: { borderColor: v3.pink500 },
});
