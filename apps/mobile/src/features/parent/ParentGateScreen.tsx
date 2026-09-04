import { useMemo, useReducer, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TalkiHeading, TalkiText } from '@/design-system/components';
import { ToastHost } from '@/components/shell';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { gateReducer, initGate } from '@/domain/parent/gate';
import { makeRnd } from '@/features/games/shell/e2eSeed';
import { testIds } from '@/testing/testIds';

import { ParentShell } from './ParentShell';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'] as const;

/**
 * Parent gate — landscape (Phase 27). Challenge semantics unchanged
 * (gateReducer / initGate). Layout is a short-height row: prompt | keypad.
 */
export function ParentGateScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const router = useRouter();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
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
  const keySize = tokens.parentGateKeySize;

  return (
    <ParentShell testID={testIds.parent.root}>
      <View style={[styles.row, { gap: tokens.gap }]}>
        <View style={[styles.prompt, { gap: Math.max(4, tokens.gap - 4) }]}>
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
        <View style={[styles.grid, { gap: Math.max(6, tokens.gap - 2), maxWidth: keySize * 3 + 24 }]}>
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
                style={[
                  styles.key,
                  {
                    width: keySize,
                    minHeight: keySize,
                    borderRadius: radii.btn,
                  },
                ]}
              >
                <TalkiText weight="extrabold" align="center">
                  {label}
                </TalkiText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ToastHost message={toast} onHide={() => setToast(null)} testID={testIds.parent.toast} />
    </ParentShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: 8,
    minHeight: 0,
  },
  prompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingInline: 8,
  },
  lockIcon: { fontSize: 36 },
  q: { fontSize: 26, marginBlock: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 0,
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: v3.surface,
    borderWidth: 1,
    borderColor: v3.borderSoft,
  },
  back: {
    minHeight: 48,
    minWidth: 48,
    paddingInline: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBlockStart: 4,
  },
});
