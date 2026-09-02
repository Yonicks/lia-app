import { Image, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiCard, TalkiPill, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
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
 * index.html `renderCategory()`'s per-tile template (2317-2323) — a single
 * word tile. The speaker icon renders unconditionally on every tile, not
 * only learned ones (`<span class="speaker">` has no `isL` guard, unlike
 * the star which does) — it is a permanent affordance advertising "tap to
 * hear", not a learned-state indicator. Tapping speaks the word (the
 * caller's job — `onPress` is wired to `WordVoiceService.say()` with the
 * PLAIN form, never what is on screen) and marks it learned.
 * `niqqudEnabled` only ever changes what this component renders, never
 * what is spoken (phase-07 prompt, "Niqqud setting changes DISPLAY ONLY").
 */
export function WordTile({ word, index, niqqudEnabled, learned, onPress }: WordTileProps) {
  return (
    <TalkiCard testID={testIds.category.word(index)} onPress={onPress} style={styles.card}>
      <View style={styles.speaker}>
        <Image source={uiIcons.speaker} style={styles.speakerIcon} resizeMode="contain" />
      </View>
      {word.photo ? (
        <Image source={{ uri: word.photo }} style={styles.art} resizeMode="contain" />
      ) : wordImage(word) ? (
        <Image source={wordImage(word)} style={styles.art} resizeMode="contain" />
      ) : (
        <TalkiText style={styles.emoji}>{word.emoji}</TalkiText>
      )}
      <TalkiText weight="extrabold" align="center" style={styles.label}>
        {display(word.word, niqqudEnabled)}
      </TalkiText>
      {learned ? (
        <View style={styles.badge}>
          <TalkiPill label="★" color={v3.gold500} />
        </View>
      ) : null}
    </TalkiCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 130,
    flexGrow: 1,
    flexBasis: 130,
    alignItems: 'center',
    gap: 8,
  },
  art: {
    width: 64,
    height: 64,
  },
  emoji: {
    fontSize: 48,
  },
  label: {
    fontSize: 17,
  },
  badge: {
    position: 'absolute',
    insetInlineEnd: 8,
    top: 8,
  },
  speaker: {
    position: 'absolute',
    insetInlineStart: 8,
    top: 8,
    width: 22,
    height: 22,
    opacity: 0.55,
  },
  speakerIcon: {
    width: '100%',
    height: '100%',
  },
});
