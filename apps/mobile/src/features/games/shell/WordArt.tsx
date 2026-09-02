import { Image, StyleSheet } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { wordImage } from '@/domain/vocabulary/wordImage';
import type { TalkiWord } from '@/domain/types';

export function WordArt({ word, size = '72%' }: { word: TalkiWord; size?: number | `${number}%` }) {
  const art = word.photo ? { uri: word.photo } : wordImage(word);
  if (art) {
    return <Image source={art} style={[styles.art, { width: size, height: size }]} resizeMode="contain" />;
  }
  return <TalkiText style={styles.emoji}>{word.emoji}</TalkiText>;
}

const styles = StyleSheet.create({
  art: {},
  emoji: {
    fontSize: 48,
  },
});
