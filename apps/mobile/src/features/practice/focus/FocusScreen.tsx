import { useEffect, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
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
import { GameShell } from '../../games/shell/GameShell';
import { makeRnd } from '../../games/shell/e2eSeed';
import type { GameSession } from '../../games/shell/useGameSession';
import { PracticeGate } from '../PracticeGate';
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

  return (
    <GameShell
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
        <View testID={testIds.focus.done} style={styles.done}>
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
          style={styles.press}
        >
          <WordArt word={state.it} size="56%" />
          <TalkiText testID={testIds.focus.word} style={styles.word}>
            {display(state.it.word, settings.niqqud)}
          </TalkiText>
          <TalkiText testID={testIds.focus.phrase} align="center">
            {focusPhrase(state, display(state.it.word, settings.niqqud))}
          </TalkiText>
          <View testID={testIds.focus.dots} style={styles.dots}>
            {CARRIERS.map((_, i) => (
              <View key={i} style={[styles.dot, i <= state.step && styles.dotOn]} />
            ))}
          </View>
          <TalkiText align="center" color={v3.textSecondary}>
            לוחצים על התמונה כדי לשמוע שוב ולהתקדם
          </TalkiText>
        </Pressable>
        </View>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  press: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  word: { fontSize: 32 },
  done: { margin: 20, padding: 24, borderRadius: radii.hero, backgroundColor: v3.surface, alignItems: 'center', gap: 12 },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBlock: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: v3.borderSoft },
  dotOn: { backgroundColor: v3.purple600 },
});
