import { useMemo, useReducer, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TalkiHeading, TalkiScreen, TalkiText } from '@/design-system/components';
import { ToastHost } from '@/components/shell';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { gateReducer, initGate } from '@/domain/parent/gate';
import { makeRnd } from '@/features/games/shell/e2eSeed';
import { testIds } from '@/testing/testIds';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'] as const;

export function ParentGateScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ seed?: string }>();
  const seedParam = params.seed != null ? Number(params.seed) : undefined;
  const rnd = useMemo(() => makeRnd(Number.isFinite(seedParam) ? seedParam : undefined), [seedParam]);
  const [state, dispatch] = useReducer(gateReducer, undefined, () => initGate(rnd));
  const [toast, setToast] = useState<string | null>(null);

  const onKey = (k: (typeof KEYS)[number]) => {
    if (k === 'clear') {
      dispatch({ type: 'CLEAR' });
      return;
    }
    if (k === 'ok') {
      const nextSum = state.question.sum;
      if (Number(state.input) === nextSum) {
        dispatch({ type: 'OK' });
        onUnlocked();
      } else {
        dispatch({ type: 'OK' });
        setToast('לא נכון, נסו שוב');
      }
      return;
    }
    dispatch({ type: 'DIGIT', n: k });
  };

  const { a, b } = state.question;
  const display = `${a} × ${b} = ${state.input || '?'}`;

  return (
    <TalkiScreen testID={testIds.parent.root}>
      <View style={styles.wrap}>
        <TalkiText style={styles.lockIcon} align="center">
          🔒
        </TalkiText>
        <TalkiHeading level={2} align="center">
          מסך הורים
        </TalkiHeading>
        <TalkiText align="center" color={v3.textSecondary} weight="semibold">
          כדי להיכנס, פתרו את התרגיל
        </TalkiText>
        <TalkiText testID={testIds.parent.gateQuestion} align="center" weight="extrabold" style={styles.q}>
          {display}
        </TalkiText>
        <View style={styles.grid}>
          {KEYS.map((k) => {
            const label = k === 'clear' ? '⌫' : k === 'ok' ? '✓' : k;
            const id =
              k === 'clear' ? testIds.parent.gateClear : k === 'ok' ? testIds.parent.gateOk : testIds.parent.gateKey(k);
            return (
              <Pressable
                key={k}
                testID={id}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => onKey(k)}
                style={styles.key}
              >
                <TalkiText weight="extrabold" align="center">
                  {label}
                </TalkiText>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          testID={testIds.parent.gateBack}
          accessibilityRole="button"
          accessibilityLabel="חזרה לאפליקציה"
          onPress={() => router.back()}
          style={styles.back}
        >
          <TalkiText weight="semibold">חזרה לאפליקציה</TalkiText>
        </Pressable>
      </View>
      <ToastHost message={toast} onHide={() => setToast(null)} testID={testIds.parent.toast} />
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  lockIcon: { fontSize: 48 },
  q: { fontSize: 28, marginBlock: 8 },
  grid: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  key: {
    width: 80,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.btn,
    backgroundColor: v3.surface,
    borderWidth: 1,
    borderColor: v3.borderSoft,
  },
  back: {
    minHeight: 48,
    paddingInline: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBlockStart: 8,
  },
});
