import { StyleSheet, View } from 'react-native';

import { TalkiHeading, TalkiScreen, TalkiText } from '@/design-system/components';
import { TopBar } from '@/components/shell';
import { v3 } from '@/design-system/theme/colors';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';

/**
 * A shell only — Phase 12 owns the real stickers screen (phase-07 prompt,
 * "Do not build the stickers screen beyond a shell"). Reachable from the
 * bottom nav so navigation itself is fully wired this phase.
 */
export function RewardsScreen() {
  const { learned } = useProgressStore();
  const { settings, toggleMusic } = useSettingsStore();

  return (
    <TalkiScreen testID="rewards-root">
      <TopBar points={learned.size} musicOn={settings.music} onToggleMusic={() => void toggleMusic()} />
      <View style={styles.center}>
        <TalkiHeading level={2} align="center">
          פרסים
        </TalkiHeading>
        <TalkiText align="center" color={v3.textSecondary}>
          המסך הזה מגיע בשלב הבא
        </TalkiText>
      </View>
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
});
