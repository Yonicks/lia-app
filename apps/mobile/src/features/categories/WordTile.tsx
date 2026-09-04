import { Image, Pressable, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiPill, TalkiText } from '@/design-system/components';
import { landscapeTokens, LANDSCAPE_MIN_TOUCH } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { display } from '@/domain/vocabulary/niqqud';
import { wordImage } from '@/domain/vocabulary/wordImage';
import type { TalkiWord } from '@/domain/types';
import { testIds } from '@/testing/testIds';

export interface WordTileProps {
  word: TalkiWord;
  index: number;
  niqqudEnabled: boolean;
  learned: boolean;
  onPress: () => void;
}

/**
 * Landscape word tile (Phase 23). Speaks via caller `onPress` (PLAIN form);
 * niqqud only affects display. Art uses contain (never stretch). Touch floor
 * ≥48 via layout cell + min sizes from landscape tokens.
 */
export function WordTile({ word, index, niqqudEnabled, learned, onPress }: WordTileProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const label = display(word.word, niqqudEnabled);
  const art = tokens.wordArtSize;

  return (
    <Pressable
      testID={testIds.category.word(index)}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        shadowCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.speaker}>
        <Image source={uiIcons.speaker} style={styles.speakerIcon} resizeMode="contain" />
      </View>
      {word.photo ? (
        <Image source={{ uri: word.photo }} style={{ width: art, height: art }} resizeMode="contain" />
      ) : wordImage(word) ? (
        <Image source={wordImage(word)} style={{ width: art, height: art }} resizeMode="contain" />
      ) : (
        <TalkiText style={[styles.emoji, { fontSize: Math.round(art * 0.85) }]}>{word.emoji}</TalkiText>
      )}
      <TalkiText
        weight="extrabold"
        align="center"
        numberOfLines={2}
        style={[styles.label, { fontSize: tokens.wordLabelSize }]}
      >
        {label}
      </TalkiText>
      {learned ? (
        <View style={styles.badge}>
          <TalkiPill label="★" color={v3.gold500} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: LANDSCAPE_MIN_TOUCH,
    minHeight: LANDSCAPE_MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 6,
    borderRadius: radii.card,
    borderWidth: 3,
    borderColor: v2.line,
    backgroundColor: v2.paper,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  emoji: {
    textAlign: 'center',
  },
  label: {
    paddingInline: 2,
  },
  badge: {
    position: 'absolute',
    insetInlineEnd: 4,
    top: 4,
  },
  speaker: {
    position: 'absolute',
    insetInlineStart: 4,
    top: 4,
    width: 18,
    height: 18,
    opacity: 0.55,
  },
  speakerIcon: {
    width: '100%',
    height: '100%',
  },
});
