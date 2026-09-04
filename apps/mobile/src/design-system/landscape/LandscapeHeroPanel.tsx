import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { uiIcons } from '@/design-system/assets';

import { LandscapeProgress } from './LandscapeProgress';
import { landscapeTokens } from './tokens';

export interface LandscapeHeroPanelProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  progress?: number;
  progressLabel?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  /** Defaults to `${testID}-cta` when testID is set. */
  ctaTestID?: string;
  mascot?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
}

/**
 * Welcome / continue-learning hero used by the Home composition. Mascot sits
 * beside a white progress panel; CTA is a large child-friendly pill (≥48).
 */
export function LandscapeHeroPanel({
  eyebrow,
  title,
  subtitle,
  progress,
  progressLabel,
  ctaLabel,
  onCtaPress,
  ctaTestID,
  mascot,
  style,
  testID,
  children,
}: LandscapeHeroPanelProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const resolvedCtaTestID = ctaTestID ?? (testID ? `${testID}-cta` : undefined);
  const isCompact = layout.deviceClass === 'compactPhone';
  const panelPad = isCompact ? 10 : 14;
  const mascotH = tokens.heroMaxWidth * (isCompact ? 0.42 : 0.55);

  return (
    <View testID={testID} style={[styles.row, { gap: tokens.gap, maxWidth: tokens.heroMaxWidth * 2 }, style]}>
      {mascot ? (
        <Image source={mascot} style={[styles.mascot, { height: mascotH }]} resizeMode="contain" />
      ) : (
        <View style={[styles.mascotPlaceholder, { width: tokens.heroMaxWidth * 0.4, height: mascotH }]} />
      )}

      <View style={[styles.panelCol, { maxWidth: tokens.heroMaxWidth, gap: isCompact ? 6 : tokens.gap }]}>
        <View style={[styles.panel, shadowCard, { padding: panelPad }]}>
          {eyebrow ? (
            <TalkiText weight="semibold" color={v3.textSecondary} style={styles.eyebrow}>
              {eyebrow}
            </TalkiText>
          ) : null}
          <TalkiText weight="extrabold" color={v3.textHeading} style={{ fontSize: tokens.titleSize * 0.75 }}>
            {title}
          </TalkiText>
          {subtitle ? (
            <TalkiText weight="regular" color={v3.textMuted} style={styles.subtitle}>
              {subtitle}
            </TalkiText>
          ) : null}
          {progress !== undefined ? (
            <LandscapeProgress value={progress} label={progressLabel} style={{ marginTop: isCompact ? 4 : 8 }} />
          ) : null}
          {children}
        </View>

        {ctaLabel ? (
          <Pressable
            testID={resolvedCtaTestID}
            onPress={onCtaPress}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <View style={styles.ctaIconWrap}>
              <Image
                source={uiIcons.chevron}
                style={[styles.ctaIcon, { transform: [{ rotate: '180deg' }] }]}
                resizeMode="contain"
              />
            </View>
            <TalkiText weight="extrabold" color="#fff" style={styles.ctaLabel}>
              {ctaLabel}
            </TalkiText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 0,
  },
  mascot: {
    width: '36%',
    maxWidth: 220,
  },
  mascotPlaceholder: {
    borderRadius: radii.hero,
    backgroundColor: 'rgba(255,215,90,0.55)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  panelCol: {
    flex: 1,
    minWidth: 0,
  },
  panel: {
    backgroundColor: v3.surface,
    borderRadius: radii.hero,
    borderWidth: 2,
    borderColor: '#fff',
  },
  eyebrow: { fontSize: 12, marginBottom: 2 },
  subtitle: { fontSize: 12, marginTop: 4 },
  cta: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: v3.purple600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingInline: 16,
    borderWidth: 2,
    borderColor: v2.grapeDark,
  },
  ctaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: { width: 14, height: 14 },
  ctaLabel: { fontSize: 16 },
  pressed: { transform: [{ translateY: 2 }] },
});
