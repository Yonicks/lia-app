import { Image, Pressable, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens } from './tokens';

export interface LandscapeActivityCardProps {
  title: string;
  /** When omitted, a neutral labeled block is shown (fixture / missing art). */
  image?: ImageSourcePropType;
  onPress?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  /** Footer treatment: white pill (games) or purple banner (practice). */
  footerVariant?: 'pill' | 'banner';
}

/**
 * Art-driven activity card for Games/Practice hubs — white rounded frame,
 * image-dominant surface (cover, never stretch), Hebrew title footer.
 * Minimum touch target enforced via layout size from landscape tokens.
 */
export function LandscapeActivityCard({
  title,
  image,
  onPress,
  testID,
  style,
  footerVariant = 'pill',
}: LandscapeActivityCardProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        shadowCard,
        { maxHeight: tokens.activityCardMaxHeight, minHeight: 48 },
        pressed && styles.pressed,
        style,
      ]}
    >
      {image ? (
        <Image source={image} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder} accessibilityElementsHidden>
          <TalkiText weight="bold" color={v3.textMuted} style={styles.placeholderLabel}>
            {title}
          </TalkiText>
        </View>
      )}
      <View style={[styles.footer, footerVariant === 'banner' ? styles.footerBanner : styles.footerPill]}>
        <TalkiText
          weight="extrabold"
          color={footerVariant === 'banner' ? '#fff' : v3.textHeading}
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </TalkiText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 48,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: v3.surface,
    borderWidth: 3,
    borderColor: '#fff',
  },
  pressed: { transform: [{ translateY: 2 }] },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: v3.purple100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  placeholderLabel: { fontSize: 12, textAlign: 'center' },
  footer: {
    position: 'absolute',
    insetInline: 8,
    bottom: 8,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 8,
  },
  footerPill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: v2.line,
  },
  footerBanner: {
    backgroundColor: v3.purple600,
    borderRadius: radii.btn,
  },
  title: { fontSize: 13 },
});
