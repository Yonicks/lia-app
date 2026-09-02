import { StyleSheet, View } from 'react-native';

import { TalkiHeading, TalkiIconButton, TalkiScreen, TalkiText } from '@/design-system/components';
import { uiIcons } from '@/design-system/assets';
import { v3 } from '@/design-system/theme/colors';
import { useGoBack } from '@/hooks/useGoBack';

export interface StubScreenProps {
  title: string;
  testID: string;
}

/**
 * "Cards route to a stub" (phase-07 prompt, work item 4 and standing
 * rules) — every game and practice-mode card lands here until its own
 * phase builds the real screen. Hardware/UI back always returns to the
 * screen that opened it, never exits the app (phase-07-plan.md "Hardware
 * back must navigate, never exit from a child screen").
 */
export function StubScreen({ title, testID }: StubScreenProps) {
  const goBack = useGoBack();

  return (
    <TalkiScreen testID={testID}>
      <View style={styles.header}>
        <TalkiIconButton icon={uiIcons.back} accessibilityLabel="חזרה" onPress={goBack} />
      </View>
      <View style={styles.center}>
        <TalkiHeading level={2} align="center">
          {title}
        </TalkiHeading>
        <TalkiText align="center" color={v3.textSecondary}>
          המסך הזה מגיע בשלב הבא
        </TalkiText>
      </View>
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
});
