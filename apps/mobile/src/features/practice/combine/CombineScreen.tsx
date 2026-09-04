import { useEffect, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { MODIFIERS } from '@/domain/practice/content';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../../games/shell/WordArt';
import { makeRnd } from '../../games/shell/e2eSeed';
import type { GameSession } from '../../games/shell/useGameSession';
import { PracticeGate } from '../PracticeGate';
import { COMBINE_ROUNDS } from '../practiceTimings';
import { PracticeShell } from '../shell/PracticeShell';
import { combineChips, combineReducer, combineResult, initCombine } from './combineReducer';

function finishMs(): number {
  if (typeof window === 'undefined') return 2600;
  const o = (window as unknown as { __talkiCombineFinishMs?: number }).__talkiCombineFinishMs;
  return typeof o === 'number' ? o : 2600;
}

export function CombineScreen({ catId, seed }: { catId: string | null; seed?: number }) {
  return (
    <PracticeGate modeId="combine" catId={catId} title="➕ שתי מילים">
      {(session) => <CombinePlay session={session} seed={seed} />}
    </PracticeGate>
  );
}

function CombinePlay({ session, seed }: { session: GameSession; seed?: number }) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { stats, markLearned } = useProgressStore();
  const niqqud = useSettingsStore((s) => s.settings.niqqud);
  const spoken = useRef(false);
  const [state, dispatch] = useReducer(combineReducer, undefined, () =>
    initCombine({ category: session.category!, stats, settings: useSettingsStore.getState().settings, rnd: makeRnd(seed) }),
  );

  useEffect(() => {
    if (spoken.current || state.done) return;
    spoken.current = true;
    void wordVoiceService.say(session.category!.id, 'בוחרים מילה קטנה, ואז תמונה', { core: true });
  }, [state.done, session.category]);

  useEffect(() => {
    if (state.done) session.audio.complete();
  }, [state.done, session.audio]);

  const split = tokens.practiceCombineSplitLayout;
  const optMin = tokens.practiceOptionMin;
  const modMin = tokens.practiceModMin;
  const boardGap = Math.max(6, tokens.gap - 2);

  return (
    <PracticeShell
      title="➕ שתי מילים"
      chips={combineChips(state)}
      done={state.done}
      result={combineResult(state)}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
    >
      <View
        testID={testIds.combine.root}
        style={[
          styles.box,
          {
            gap: boardGap,
            paddingInline: tokens.padInline,
            paddingBlock: tokens.padBlock,
            flexDirection: split ? 'row' : 'column',
            alignItems: split ? 'stretch' : 'center',
          },
        ]}
      >
        <View style={[styles.promptCol, { gap: boardGap, flex: split ? 0 : undefined }]}>
          <TalkiText align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
            בוחרים מילה קטנה, ואז תמונה — ומקבלים משפט
          </TalkiText>
          <View style={[styles.mods, { gap: Math.max(4, tokens.gap - 4) }]}>
            {MODIFIERS.map((m, index) => (
              <Pressable
                key={m.w}
                testID={testIds.combine.modifier(index)}
                accessibilityRole="button"
                onPress={() => {
                  dispatch({ type: 'SELECT_MOD', w: m.w });
                  void wordVoiceService.say(session.category!.id, plain(m.w), { core: true });
                }}
                style={[
                  styles.mod,
                  {
                    minHeight: modMin,
                    minWidth: modMin,
                    paddingInline: Math.max(8, tokens.gap),
                    paddingBlock: Math.max(6, tokens.gap - 2),
                    gap: Math.max(2, tokens.gap - 6),
                  },
                  state.mod === m.w && styles.modSel,
                ]}
              >
                <WordArt word={{ word: m.w, emoji: m.emoji, img: m.img }} size={tokens.practiceModArtSize} />
                <TalkiText style={{ fontSize: tokens.wordLabelSize }}>{display(m.w, niqqud)}</TalkiText>
              </Pressable>
            ))}
          </View>
          <TalkiText
            testID={testIds.combine.phrase}
            align="center"
            style={{ minHeight: tokens.practicePhraseSize + 8, fontSize: tokens.practicePhraseSize }}
          >
            {state.phrase}
          </TalkiText>
        </View>
        <View style={[styles.grid, { gap: boardGap, flex: 1 }]}>
          {state.pics.map((p, index) => (
            <Pressable
              key={p.word}
              testID={testIds.combine.picture(index)}
              accessibilityRole="button"
              onPress={() => {
                const mod = MODIFIERS.find((m) => m.w === (state.mod || MODIFIERS[0]!.w)) ?? MODIFIERS[0]!;
                const phrase = `${display(mod.w, niqqud)} ${display(p.word, niqqud)}`;
                dispatch({ type: 'PICK', word: p.word, phrase });
                session.audio.correct();
                void markLearned(session.category!.id, p.word);
                void wordVoiceService.say(session.category!.id, `${plain(mod.w)} ${plain(p.word)}`, { core: true }).then(() => {
                  session.schedule(250, () => {
                    void wordVoiceService.say(session.category!.id, plain(mod.expand.replace('{w}', plain(p.word))), {
                      core: true,
                    });
                  });
                });
                if (state.round + 1 >= COMBINE_ROUNDS) {
                  session.schedule(finishMs(), () => dispatch({ type: 'FINISH' }));
                }
              }}
              style={[
                styles.opt,
                shadowSm,
                {
                  minWidth: optMin,
                  minHeight: optMin,
                  flexBasis: split ? optMin : '30%',
                  maxWidth: optMin + 36,
                  padding: Math.max(4, tokens.gap - 4),
                  gap: Math.max(2, tokens.gap - 6),
                },
              ]}
            >
              <WordArt word={p} size="64%" />
              <TalkiText style={{ fontSize: tokens.wordLabelSize }}>{display(p.word, niqqud)}</TalkiText>
            </Pressable>
          ))}
        </View>
      </View>
    </PracticeShell>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', minHeight: 0 },
  promptCol: { alignItems: 'center', flexShrink: 0, justifyContent: 'center' },
  mods: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  mod: {
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modSel: { borderColor: v3.purple600 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    width: '100%',
    minHeight: 0,
  },
  opt: {
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
