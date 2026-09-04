import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens } from './tokens';

export interface LandscapeCategoryCardProps {
  title: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
  testID?: string;
}

/**
 * Category strip card — icon-dominant with a white Hebrew label footer.
 * Sized from landscape tokens; always ≥48×48.
 */
export function LandscapeCategoryCard({ title, image, onPress, testID }: LandscapeCategoryCardProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const w = tokens.categoryCardWidth;
  const h = tokens.categoryCardHeight;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        shadowCard,
        { width: w, height: Math.max(48, h), minWidth: 48, minHeight: 48 },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.art}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <View style={styles.label}>
        <TalkiText weight="bold" color={v3.textHeading} style={styles.title} numberOfLines={1}>
          {title}
        </TalkiText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: v3.surface,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pressed: { transform: [{ translateY: 2 }] },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: v3.purple050,
    padding: 4,
  },
  image: { width: '78%', height: '78%' },
  placeholder: {
    width: '60%',
    height: '60%',
    borderRadius: 12,
    backgroundColor: v3.purple200,
  },
  label: {
    minHeight: 22,
    backgroundColor: v3.surface,
    borderTopWidth: 1,
    borderTopColor: v2.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 4,
  },
  title: { fontSize: 11 },
});
