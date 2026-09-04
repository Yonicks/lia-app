import { Modal, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiButton, TalkiHeading, TalkiIconButton, TalkiText } from '@/design-system/components';
import { modalAnimationType, useTalkiReducedMotion } from '@/design-system/motion';
import { radii } from '@/design-system/theme/radii';
import { shadowFloating } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';

export interface ParentGateProps {
  visible: boolean;
  /** The rendered challenge, e.g. "7 × 4 = ?" — Phase 5 renders whatever
   *  string it is given; generating and verifying the arithmetic challenge
   *  (index.html 3230-3236, `renderLock()`) is Phase 12's logic, not this
   *  component's (phase-05-plan.md, "ParentGate is SHELL ONLY"). */
  question: string;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

/**
 * index.html `renderLock()` — a modal challenge gating the parent screen,
 * reached by long-pressing the topbar brand mark. SHELL ONLY: no answer
 * input, no verification, no wrong-answer state. Those are Phase 12.
 * Production parent gate is `ParentGateScreen` (Phase 27); this remains
 * gallery/dev chrome.
 */
export function ParentGate({ visible, question, onConfirm, onCancel, testID }: ParentGateProps) {
  const reduceMotion = useTalkiReducedMotion();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={modalAnimationType(reduceMotion, 'fade')}
      testID={testID}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, shadowFloating]}>
          <TalkiIconButton
            testID="parent-gate-close"
            icon={uiIcons.close}
            onPress={onCancel}
            accessibilityLabel="סגירה"
          />
          <TalkiHeading level={2} align="center" style={styles.title}>
            מסך הורים
          </TalkiHeading>
          <TalkiText align="center" color={v3.textSecondary}>
            כדי להיכנס, פתרו את התרגיל
          </TalkiText>
          <TalkiText testID="parent-gate-question" align="center" weight="extrabold" style={styles.question}>
            {question}
          </TalkiText>
          <TalkiButton testID="parent-gate-confirm" label="אישור" onPress={onConfirm} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(58,42,82,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: v2.paper,
    borderRadius: radii.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    marginTop: 4,
  },
  question: {
    fontSize: 26,
  },
});
