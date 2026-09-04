import { useEffect, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { radii } from '@/design-system/theme/radii';
import { v3 } from '@/design-system/theme/colors';
import { CARRIERS } from '@/domain/practice/content';
import type { TalkiCategory, TalkiSettings } from '@/domain/types';
import { display } from '@/domain/vocabulary/niqqud';
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
import { PracticeShell } from '../shell/PracticeShell';
import { focusChips, focusPhrase, focusReducer, initFocus } from './focusReducer';

export function FocusScreen({ catId, seed }: { catId: string | null; seed?: number }) {
  return (
    <PracticeGate modeId="focus" catId={catId} title="🎯 מילה במיקוד">
      {(session) => <FocusPlay category={session.category} session={session} seed={seed} />}
    </PracticeGate>
  );
}

function FocusPlay({
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
  const spoken = useRef<number | null>(null);
  const [state, dispatch] = useReducer(focusReducer, undefined, () =>
    initFocus({ category, stats, settings: settings as TalkiSettings, rnd: makeRnd(seed) }),
  );

  useEffect(() => {
    if (state.done || spoken.current === state.step) return;
    spoken.current = state.step;
    void wordVoiceService.say(category.id, focusPhrase(state, state.it.word), { core: true });
  }, [state, category.id]);

  useEffect(() => {
    if (state.done) session.audio.complete();
  }, [state.done, session.audio]);

  const boardGap = Math.max(6, tokens.gap - 2);

  return (
    <PracticeShell
      title="🎯 מילה במיקוד"
      chips={focusChips(state)}
      done={false}
      result={{ score: 0, total: state.total }}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
      scoring={false}
    >
      {state.done ? (
        <View
          testID={testIds.focus.done}
          style={[
            styles.done,
            {
              gap: boardGap,
              padding: tokens.padInline,
              margin: Math.max(8, tokens.gap),
            },
          ]}
        >
          <TalkiHeading level={1} align="center">
            {`סיימנו את ${display(state.it.word, settings.niqqud)}`}
          </TalkiHeading>
          <TalkiText align="center" color={v3.textSecondary}>
            {`המילה נשמעה ${state.total} פעמים במשפטים שונים`}
          </TalkiText>
          <TalkiButton testID={testIds.focus.nextWord} label="מילה הבאה" onPress={session.restart} />
          <TalkiButton label="🏠 הביתה" variant="secondary" onPress={() => push(homeHref)} />
        </View>
      ) : (
        <View testID={testIds.focus.root} style={styles.card}>
          <Pressable
            testID={testIds.focus.card}
            accessibilityRole="button"
            onPress={() => {
              void markLearned(category.id, state.it.word);
              if (state.step + 1 >= state.total) void recordSeen(category.id, state.it.word, false);
              dispatch({ type: 'ADVANCE' });
            }}
            style={[
              styles.press,
              {
                gap: boardGap,
                paddingInline: tokens.padInline,
                paddingBlock: tokens.padBlock,
              },
            ]}
          >
            <WordArt word={state.it} size={tokens.practiceArtSize} />
            <TalkiText testID={testIds.focus.word} style={{ fontSize: tokens.practiceWordSize }}>
              {display(state.it.word, settings.niqqud)}
            </TalkiText>
            <TalkiText
              testID={testIds.focus.phrase}
              align="center"
              style={{ fontSize: tokens.practicePhraseSize }}
            >
              {focusPhrase(state, display(state.it.word, settings.niqqud))}
            </TalkiText>
            <View testID={testIds.focus.dots} style={[styles.dots, { gap: Math.max(4, tokens.gap - 4) }]}>
              {CARRIERS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      width: tokens.pageDotSize,
                      height: tokens.pageDotSize,
                      borderRadius: tokens.pageDotSize / 2,
                    },
                    i <= state.step && styles.dotOn,
                  ]}
                />
              ))}
            </View>
            <TalkiText align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
              לוחצים על התמונה כדי לשמוע שוב ולהתקדם
            </TalkiText>
          </Pressable>
        </View>
      )}
    </PracticeShell>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 0 },
  press: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  done: {
    borderRadius: radii.hero,
    backgroundColor: v3.surface,
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 520,
    width: '100%',
  },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBlock: 4 },
  dot: { backgroundColor: v3.borderSoft },
  dotOn: { backgroundColor: v3.purple600 },
});
