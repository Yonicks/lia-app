import { Image, Modal, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowFloating } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';

export interface RewardOverlayProps {
  visible: boolean;
  title: string;
  message?: string;
  onDismiss: () => void;
  testID?: string;
}

/**
 * index.html `renderReward()`/`.reward-star`/`confetti()` — the full-screen
 * celebration shown on category/game completion. Confetti and the
 * star-unlock SFX are runtime behaviour wired to real progress data, so they
 * stay out of this shell (they land with whichever phase builds the screen
 * that actually completes a category).
 */
export function RewardOverlay({ visible, title, message, onDismiss, testID }: RewardOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" testID={testID}>
      <View style={styles.backdrop}>
        <View style={[styles.card, shadowFloating]}>
          <Image source={uiIcons.star} style={styles.star} resizeMode="contain" />
          <TalkiHeading level={1} align="center" color={v3.textHeading}>
            {title}
          </TalkiHeading>
          {message ? (
            <TalkiText align="center" color={v3.textSecondary}>
              {message}
            </TalkiText>
          ) : null}
          <Image source={uiIcons.gift} style={styles.gift} resizeMode="contain" />
          <TalkiButton testID="reward-overlay-dismiss" label="יאללה!" onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(58,42,82,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: v2.paper,
    borderRadius: radii.hero,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  star: {
    width: 56,
    height: 56,
  },
  gift: {
    width: 88,
    height: 88,
  },
});
