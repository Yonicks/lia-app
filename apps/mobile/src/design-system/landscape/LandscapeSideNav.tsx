import { Image, Pressable, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiText } from '@/design-system/components';
import { forwardChevronRotation } from '@/design-system/rtl/logical';
import { shadowSm } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens } from './tokens';

export type LandscapeSideNavDirection = 'start' | 'end' | 'backward' | 'forward';

export interface LandscapeSideNavProps {
  label: string;
  onPress?: () => void;
  /** Visual arrow direction. `forward`/`backward` flip with RTL via chevron helper. */
  direction?: LandscapeSideNavDirection;
  testID?: string;
}

/**
 * Side navigation pill used by hub compositions (Home ↔ Games ↔ Practice).
 * Always ≥48×48 effective target. Label sits under the arrow for child clarity.
 */
export function LandscapeSideNav({
  label,
  onPress,
  direction = 'forward',
  testID,
}: LandscapeSideNavProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const size = tokens.sideNavSize;

  const rotation =
    direction === 'forward'
      ? forwardChevronRotation()
      : direction === 'backward'
        ? (forwardChevronRotation() === '0deg' ? '180deg' : '0deg')
        : direction === 'start'
          ? (forwardChevronRotation() === '0deg' ? '180deg' : '0deg')
          : forwardChevronRotation();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.wrap,
        { minWidth: size, minHeight: size + 20 },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.pill, shadowSm, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={uiIcons.chevron}
          style={[styles.icon, { transform: [{ rotate: rotation }] }]}
          resizeMode="contain"
        />
      </View>
      <TalkiText weight="bold" color={v3.purple700} style={styles.label} numberOfLines={2}>
        {label}
      </TalkiText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBlock: 4,
  },
  pill: {
    backgroundColor: v3.surface,
    borderWidth: 2,
    borderColor: v2.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 22, height: 22 },
  label: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 72,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
});
