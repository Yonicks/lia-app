import { StyleSheet, View } from 'react-native';

import type { TalkiWord } from '@/domain/types';

import { WordTile } from './WordTile';

export interface WordGridProps {
  words: TalkiWord[];
  niqqudEnabled: boolean;
  isLearned: (word: string) => boolean;
  onWordPress: (word: TalkiWord) => void;
}

/** index.html `renderCards()` (2329-2351) — every word in the category, in
 *  its original order. */
export function WordGrid({ words, niqqudEnabled, isLearned, onWordPress }: WordGridProps) {
  return (
    <View style={styles.grid}>
      {words.map((word, index) => (
        <WordTile
          key={`${word.word}-${index}`}
          word={word}
          index={index}
          niqqudEnabled={niqqudEnabled}
          learned={isLearned(word.word)}
          onPress={() => onWordPress(word)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
