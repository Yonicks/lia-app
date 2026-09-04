import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { useTalkiReducedMotion, motionDurationMs } from '@/design-system/motion';
import { radii } from '@/design-system/theme/radii';
import { shadowFloating } from '@/design-system/theme/shadows';
import { v2 } from '@/design-system/theme/colors';
import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';

export interface ToastHostProps {
  /** null/empty hides the toast — mirrors legacy `toast(msg)` setting
   *  `#toast`'s text and a `.show` class together (index.html 2060-2062). */
  message: string | null;
  /** index.html 2062 — legacy auto-hides after 1900ms. */
  durationMs?: number;
  onHide?: () => void;
  testID?: string;
}

/** index.html `.toast` — a floating, bottom-centered, auto-dismissing
 *  message. Static text, not interactive: no accessibilityRole, exempt from
 *  the touch-target audit like TalkiPill/TalkiProgress. */
export function ToastHost({ message, durationMs = 1900, onHide, testID }: ToastHostProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const reduceMotion = useTalkiReducedMotion();
  const adReserved = useReservedAdHeight();
  const fadeMs = motionDurationMs(150, reduceMotion);

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: fadeMs, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: fadeMs, useNativeDriver: true }).start(() => onHide?.());
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onHide, opacity, fadeMs]);

  if (!message) return null;

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        shadowFloating,
        { opacity, insetBlockEnd: 22 + Math.max(0, adReserved) },
      ]}
    >
      <TalkiText testID="toast-message" color={v2.paper} weight="semibold">
        {message}
      </TalkiText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    paddingInline: 18,
    paddingBlock: 12,
    borderRadius: radii.btn,
    backgroundColor: 'rgba(36,23,53,0.92)',
    zIndex: 40,
  },
});
