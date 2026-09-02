import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';

export interface GameArtCardProps {
  title: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  testID?: string;
}

/**
 * index.html `.home-game-card` (1112-1118) — the illustrated game-menu PNG
 * fills the card; the title sits in a dark gradient along the bottom. This
 * is NOT `TalkiImageCard` (a category chip + title), because stuffing a
 * full illustrated card into a 72px gradient chip is the exact "emoji
 * stands in for card art" failure mode applied to real art.
 */
export function GameArtCard({ title, image, onPress, testID }: GameArtCardProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, shadowCard, pressed && styles.pressed]}
    >
      <Image source={image} style={styles.image} resizeMode="cover" />
      <View style={styles.titleScrim}>
        <TalkiText weight="extrabold" color="#fff" style={styles.title}>
          {title}
        </TalkiText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 120,
    minHeight: 96,
    aspectRatio: 1.55,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  image: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    width: '100%',
    height: '100%',
  },
  titleScrim: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    minHeight: '52%',
    justifyContent: 'flex-end',
    paddingInline: 9,
    paddingBlock: 7,
    backgroundColor: 'rgba(25,18,35,0.35)',
  },
  title: {
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
