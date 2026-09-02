import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../../games/shell/WordArt';
import { GameShell } from '../../games/shell/GameShell';
import { makeRnd } from '../../games/shell/e2eSeed';
import type { GameSession } from '../../games/shell/useGameSession';
import { PracticeGate } from '../PracticeGate';
import { initPairs, pairsChips, pairsReducer, pairsResult } from './pairsReducer';

export function PairsScreen({ catId, seed }: { catId: string | null; seed?: number }) {
  return (
    <PracticeGate modeId="pairs" catId={catId} title="👂 דומה אבל לא">
      {(session) => <PairsPlay session={session} seed={seed} />}
    </PracticeGate>
  );
}

function PairsPlay({ session, seed }: { session: GameSession; seed?: number }) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const spoken = useRef<number | null>(null);
  const rnd = useMemo(() => makeRnd(seed), [seed]);
  const [state, dispatch] = useReducer(pairsReducer, undefined, () => initPairs(rnd));

  useEffect(() => {
    if (state.done) return;
    if (spoken.current === state.i) return;
    spoken.current = state.i;
    void wordVoiceService.say(session.category!.id, state.target.word, { core: true });
  }, [state.done, state.i, state.target.word, session.category]);

  useEffect(() => {
    if (state.done) session.audio.complete();
  }, [state.done, session.audio]);

  return (
    <GameShell
      title="👂 דומה אבל לא"
      chips={pairsChips(state)}
      done={state.done}
      result={pairsResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
    >
      <View testID={testIds.pairs.root} style={styles.box}>
        <TalkiText align="center">שתי מילים כמעט זהות — איזו נשמעה?</TalkiText>
        <TalkiButton
          testID={testIds.pairs.replay}
          label="🔊 לשמוע שוב"
          onPress={() => void wordVoiceService.say(session.category!.id, plain(state.target.word), { core: true })}
        />
        <View style={styles.grid}>
          {state.shown.map((o, index) => (
            <Pressable
              key={`${o.word}-${index}`}
              testID={testIds.pairs.option(index)}
              accessibilityRole="button"
              accessibilityLabel={plain(o.word)}
              onPress={() => {
                if (state.locked || state.done) return;
                const ok = o.word === state.target.word;
                dispatch({ type: 'ANSWER', word: o.word });
                if (ok) {
                  session.audio.correct();
                  void wordVoiceService.say(session.category!.id, `כֵּן, ${plain(state.target.word)}`, { core: true });
                  session.schedule(1200, () => dispatch({ type: 'ADVANCE', rnd }));
                } else {
                  session.audio.wrong();
                  const other = state.shown.find((p) => p.word !== state.target.word);
                  void wordVoiceService.say(
                    session.category!.id,
                    `זֶה ${plain(other?.word ?? '')}. אֲנִי אָמַרְתִּי ${plain(state.target.word)}`,
                    { core: true },
                  );
                }
              }}
              style={styles.opt}
            >
              <WordArt word={o} size="64%" />
              <TalkiText>{display(o.word, niqqud)}</TalkiText>
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
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 96,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    ...shadowSm,
  },
});
