import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radii } from '../theme/radii';
import { shadowCard } from '../theme/shadows';
import { v2, v3 } from '../theme/colors';
import { TalkiText } from './TalkiText';

export type TalkiButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface TalkiButtonProps {
  label: string;
  onPress?: () => void;
  variant?: TalkiButtonVariant;
  disabled?: boolean;
  testID?: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_BG: Record<TalkiButtonVariant, string> = {
  primary: v3.purple600,
  secondary: v2.paper,
  ghost: 'transparent',
};

const VARIANT_TEXT_COLOR: Record<TalkiButtonVariant, string> = {
  primary: v3.surface,
  secondary: v3.textPrimary,
  ghost: v3.purple600,
};

/**
 * Every child-facing control must measure at least 48x48
 * (phase-05-plan.md "Behaviour to preserve exactly") — `minHeight: 48` plus
 * generous horizontal padding satisfies this for any label short enough to
 * appear on a button. `accessibilityRole="button"` is required by
 * `auditTouchTargets`/`auditReachability`'s selector convention (see
 * tests/e2e/_helpers.ts, "every tappable control gets both a testID and an
 * explicit accessibilityRole").
 */
export function TalkiButton({ label, onPress, variant = 'primary', disabled = false, testID, icon, style }: TalkiButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: VARIANT_BG[variant] },
        variant !== 'ghost' && shadowCard,
        variant === 'secondary' && styles.secondaryBorder,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon}
      <TalkiText weight="bold" color={VARIANT_TEXT_COLOR[variant]} style={icon ? styles.labelWithIcon : undefined}>
        {label}
      </TalkiText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48,
    paddingInline: 20,
    borderRadius: radii.btn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: v2.line,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  labelWithIcon: {
    marginInlineStart: 4,
  },
});
