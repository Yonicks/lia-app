import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowFloating } from '@/design-system/theme/shadows';
import { v2 } from '@/design-system/theme/colors';

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

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => onHide?.());
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onHide, opacity]);

  if (!message) return null;

  return (
    <Animated.View testID={testID} pointerEvents="none" style={[styles.toast, shadowFloating, { opacity }]}>
      <TalkiText testID="toast-message" color={v2.paper} weight="semibold">
        {message}
      </TalkiText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    insetBlockEnd: 22,
    alignSelf: 'center',
    maxWidth: '90%',
    paddingInline: 18,
    paddingBlock: 12,
    borderRadius: radii.btn,
    backgroundColor: 'rgba(36,23,53,0.92)',
  },
});
