import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { plain } from '@/domain/vocabulary/niqqud';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../../games/shell/WordArt';
import { GameShell } from '../../games/shell/GameShell';
import { makeRnd } from '../../games/shell/e2eSeed';
import type { GameSession } from '../../games/shell/useGameSession';
import { PracticeGate } from '../PracticeGate';
import {
  initReceptive,
  receptiveChips,
  receptiveColumns,
  receptiveReducer,
  receptiveResult,
} from './receptiveReducer';

export function ReceptiveScreen({ catId, seed }: { catId: string | null; seed?: number }) {
  return (
    <PracticeGate modeId="receptive" catId={catId} title="👈 תראי לי">
      {(session) => <ReceptivePlay session={session} seed={seed} />}
    </PracticeGate>
  );
}

function ReceptivePlay({ session, seed }: { session: GameSession; seed?: number }) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const { stats, markLearned, recordSeen } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const spoken = useRef<string | null>(null);
  const rnd = useMemo(() => makeRnd(seed), [seed]);
  const [state, dispatch] = useReducer(receptiveReducer, undefined, () =>
    initReceptive({ category: session.category!, stats, settings, rnd }),
  );

  useEffect(() => {
    if (state.done) return;
    const key = `${state.i}:${state.target.word}`;
    if (spoken.current === key) return;
    spoken.current = key;
    void wordVoiceService.say(session.category!.id, `תַּרְאִי לִי ${state.target.word}`, { core: true });
  }, [state.done, state.i, state.target.word, session.category]);

  useEffect(() => {
    if (state.done) session.audio.complete();
  }, [state.done, session.audio]);

  const cols = receptiveColumns(state.options.length);
  const prompt = () => {
    void wordVoiceService.say(session.category!.id, `תַּרְאִי לִי ${plain(state.target.word)}`, { core: true });
  };

  return (
    <GameShell
      title="👈 תראי לי"
      chips={receptiveChips(state)}
      chipTestIDs={[undefined, undefined, testIds.receptive.level]}
      done={state.done}
      result={receptiveResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
    >
      <View testID={testIds.receptive.root} style={styles.box}>
        <TalkiText align="center">מקשיבים ולוחצים על התמונה הנכונה</TalkiText>
        <TalkiButton testID={testIds.receptive.replay} label="🔊 לשמוע שוב" onPress={prompt} />
        <View style={styles.grid}>
          {state.options.map((o, index) => (
            <Pressable
              key={`${o.word}-${index}`}
              testID={testIds.receptive.option(index)}
              accessibilityRole="button"
              accessibilityLabel={plain(o.word)}
              onPress={() => {
                if (state.locked || state.done) return;
                const ok = o.word === state.target.word;
                dispatch({ type: 'ANSWER', word: o.word, items: session.category!.items, rnd });
                if (ok) {
                  session.audio.correct();
                  void markLearned(session.category!.id, state.target.word);
                  void wordVoiceService.say(session.category!.id, state.target.word);
                  session.schedule(1100, () => dispatch({ type: 'UNLOCK' }));
                } else {
                  session.audio.wrong();
                  void recordSeen(session.category!.id, state.target.word, true);
                  session.schedule(420, () => dispatch({ type: 'UNLOCK' }));
                }
              }}
              style={[styles.opt, { flexBasis: cols === 3 ? '30%' : '45%' }]}
            >
              <WordArt word={o} size="72%" />
            </Pressable>
          ))}
        </View>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%' },
  opt: {
    minWidth: 96,
    minHeight: 96,
    aspectRatio: 1,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSm,
  },
});
