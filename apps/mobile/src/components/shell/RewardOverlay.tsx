import { Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uiIcons } from '@/design-system/assets';
import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { modalAnimationType, useTalkiReducedMotion } from '@/design-system/motion';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { landscapeTokens } from '@/design-system/landscape/tokens';
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
  const reduceMotion = useTalkiReducedMotion();
  const insets = useSafeAreaInsets();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const cardMax = Math.min(380, layout.width - tokens.padInline * 2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={modalAnimationType(reduceMotion, 'fade')}
      testID={testID}
    >
      <View
        style={[
          styles.backdrop,
          {
            paddingTop: Math.max(20, insets.top + 8),
            paddingBottom: Math.max(20, insets.bottom + 8),
            paddingInline: tokens.padInline,
          },
        ]}
      >
        <View style={[styles.card, shadowFloating, { maxWidth: cardMax }]}>
          <Image
            source={uiIcons.star}
            style={styles.star}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <TalkiHeading level={1} align="center" color={v3.textHeading}>
            {title}
          </TalkiHeading>
          {message ? (
            <TalkiText align="center" color={v3.textSecondary}>
              {message}
            </TalkiText>
          ) : null}
          <Image
            source={uiIcons.gift}
            style={styles.gift}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
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
  },
  card: {
    width: '100%',
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
